import axios from 'axios';
import { Property, SearchFilters, User, LoginData, RegisterData, Notification, Inquiry, Chat } from '@/types';

// Simple sanitizer wrapper - no external dependencies needed
export const sanitizeInput = (input: any) => {
  if (typeof input === 'string') {
    // Basic sanitization: trim whitespace and remove potential script tags
    return input.trim().replace(/<script[^>]*>.*?<\/script>/gi, '');
  }
  return input;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor to add token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Normalize a raw backend property into the frontend Property shape.
// The API (FastAPI + Pydantic) serializes columns as `property_type`,
// `latitude` and `longitude`, while the frontend reads `type`, `lat` and
// `lng` in filters, cards, maps and SEO. Populate BOTH names so the type
// filter (and everything else) actually matches the data. See types/index.ts.
const normalizeProperty = (p: any): Property => {
  if (!p || typeof p !== 'object') return p;
  return {
    ...p,
    type: p.type ?? p.property_type,
    property_type: p.property_type ?? p.type,
    lat: p.lat ?? p.latitude,
    lng: p.lng ?? p.longitude,
    latitude: p.latitude ?? p.lat,
    longitude: p.longitude ?? p.lng,
  };
};

// Handles both bare arrays and paginated `{ items: [...] }` payloads.
const normalizePropertyData = (data: any) => {
  if (Array.isArray(data)) return data.map(normalizeProperty);
  if (data && Array.isArray(data.items)) {
    return { ...data, items: data.items.map(normalizeProperty) };
  }
  return normalizeProperty(data);
};

// ============= PROPERTY APIs =============
export const propertyAPI = {
  search: async (filters: SearchFilters) => {
    const { amenities, ...rest } = filters;
    const params = {
      ...rest,
      amenities: amenities?.join(','),
    };
    const res = await api.get<Property[]>('/properties', { params });
    res.data = normalizePropertyData(res.data) as any;
    return res;
  },
  getById: async (id: number | string) => {
    const res = await api.get<Property>(`/properties/${id}`);
    res.data = normalizeProperty(res.data);
    return res;
  },
  create: async (data: any) => {
    return api.post<Property>('/properties', data);
  },
  update: async (id: number | string, data: any) => {
    return api.put<Property>(`/properties/${id}`, data);
  },
  delete: async (id: number | string) => {
    return api.delete(`/properties/${id}`);
  },
  // New: bulk delete helper to match old frontend
  bulkDelete: async (ids: number[] | string[]) => {
    // backend accepts an array of ids in the request body
    return api.delete('/properties/bulk', { data: ids });
  },
  uploadImages: async (id: number | string, formData: FormData) => {
    return api.post(`/properties/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // F22: upload property videos (MP4/MOV) with optional progress callback
  uploadVideos: async (
    id: number | string,
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    return api.post(`/properties/${id}/videos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  // New: delete a property image (owner-facing helper)
  deleteImage: async (propertyId: number | string, imageId: number | string) => {
    return api.delete(`/properties/${propertyId}/images/${imageId}`);
  },
  geofenceSearch: async (coordinates: Array<[number, number]>, filters?: any) => {
    const res = await api.post<Property[]>('/properties/geofence-search', {
      coordinates,
      ...filters,
    });
    res.data = normalizePropertyData(res.data) as any;
    return res;
  },
  // New: radius search helper to match backend /properties/radius-search
  radiusSearch: async (lat: number, lng: number, radius_km = 15, filters?: any) => {
    const res = await api.post<Property[]>('/properties/radius-search', {
      lat,
      lng,
      radius_km,
      ...filters,
    });
    res.data = normalizePropertyData(res.data) as any;
    return res;
  },
  getDebugSample: async () => {
    return api.get('/properties/debug/sample');
  },
  getDebugCount: async () => {
    return api.get('/properties/debug/count');
  },
};

// ============= AUTH APIs =============
export const authAPI = {
  login: async (credentials: LoginData) => {
    // Backend expects form-encoded data for OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    return api.post<{ access_token: string; token_type: string; user?: User }>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  register: async (data: RegisterData) => {
    return api.post<{ user: User }>('/auth/register', data);
  },
  checkUser: async (email: string) => {
    return api.get('/auth/check-user', { params: { email } });
  },
  sendOTP: async (data: { email?: string; phone?: string }) => {
    return api.post('/auth/send-otp', data);
  },
  verifyOTP: async (data: { email?: string; phone?: string; otp: string }) => {
    return api.post('/auth/verify-otp', data);
  },
  // B6 — Forgot / reset password via registered email OR phone
  forgotPassword: async (identifier: string) => {
    return api.post('/auth/forgot-password', { identifier });
  },
  resetPassword: async (data: { identifier: string; otp: string; new_password: string }) => {
    return api.post('/auth/reset-password', data);
  },
  // B7 — Email verification
  sendEmailVerification: async (email: string) => {
    return api.post('/auth/send-email-verification', { email });
  },
  verifyEmail: async (data: { email: string; otp: string }) => {
    return api.post('/auth/verify-email', data);
  },
  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return api.post('/auth/logout').catch(() => null);
  },
  getCurrentUser: async () => {
    return api.get<User>('/users/me');
  },
};

// ============= USER APIs =============
export const userAPI = {
  getProfile: async () => {
    return api.get<User>('/users/me');
  },
  updateProfile: async (data: any) => {
    return api.put<User>('/users/me', data);
  },
  deleteAccount: async () => {
    return api.delete('/users/me');
  },
  getMyProperties: async () => {
    return api.get<Property[]>('/users/my-properties');
  },
  deleteProperty: async (propertyId: number | string) => {
    return api.delete(`/properties/${propertyId}`);
  },
};

// ============= INQUIRY APIs =============
export const inquiryAPI = {
  create: async (data: any) => {
    return api.post<Inquiry>('/inquiries', data);
  },
  getMyInquiries: async () => {
    return api.get<Inquiry[]>('/inquiries/my-inquiries');
  },
  getPropertyInquiries: async () => {
    return api.get<Inquiry[]>('/inquiries/property-inquiries');
  },
  getById: async (id: number | string) => {
    return api.get<Inquiry>(`/inquiries/${id}`);
  },
  update: async (id: number | string, data: any) => {
    return api.put<Inquiry>(`/inquiries/${id}`, data);
  },
  delete: async (id: number | string) => {
    return api.delete(`/inquiries/${id}`);
  },
  bulkDelete: async (inquiryIds: number[]) => {
    return api.delete('/inquiries/bulk', { data: { inquiry_ids: inquiryIds } });
  },
};

// ============= WISHLIST APIs =============
export const wishlistAPI = {
  getWishlist: async () => {
    return api.get('/wishlist');
  },
  addToWishlist: async (propertyId: number | string) => {
    return api.post(`/wishlist/${propertyId}`);
  },
  removeFromWishlist: async (propertyId: number | string) => {
    return api.delete(`/wishlist/${propertyId}`);
  },
  checkWishlistStatus: async (propertyId: number | string) => {
    return api.get(`/wishlist/check/${propertyId}`);
  },
};

// ============= NOTIFICATION APIs =============
export const notificationAPI = {
  getNotifications: async () => {
    return api.get<{ notifications: Notification[]; unread_count: number }>('/notifications');
  },
  markAsRead: async (id: number | string) => {
    return api.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    return api.put('/notifications/mark-all-read');
  },
  delete: async (id: number | string) => {
    return api.delete(`/notifications/${id}`);
  },
  clearAll: async () => {
    return api.delete('/notifications/clear-all');
  },
};

// ============= CHAT / MESSAGING APIs =============
export const chatAPI = {
  // All my conversations (last message, unread count, counterparty).
  getConversations: async () => {
    return api.get('/chats/');
  },
  // Total unread messages across conversations (for the header badge).
  getUnreadCount: async () => {
    return api.get<{ unread: number }>('/chats/unread-count');
  },
  // Get-or-create the conversation for a property; optional opening message.
  start: async (propertyId: number | string, message?: string) => {
    return api.post('/chats/start', { property_id: Number(propertyId), message });
  },
  // Full thread for a conversation (also marks incoming messages read).
  getMessages: async (chatId: number | string) => {
    return api.get(`/chats/${chatId}/messages`);
  },
  // Send a message in an existing conversation.
  sendMessage: async (chatId: number | string, message: string) => {
    return api.post(`/chats/${chatId}/messages`, { message });
  },
};

// ============= CHATBOT APIs =============
export const chatbotAPI = {
  sendMessage: async (message: string) => {
    return api.post<{ response: string; suggestions: string[] }>('/chatbot/chat', { message });
  },
};

// ============= CONTACTS APIs =============
export const contactsAPI = {
  getMyContacts: async () => {
    return api.get('/contacts/my-contacts');
  },
};

// ============= TIMELINE APIs =============
export const timelineAPI = {
  getActivities: async () => {
    return api.get('/timeline/activities');
  },
};

// ============= VISITS APIs =============
export const visitsAPI = {
  getMyVisits: async () => {
    return api.get('/visits/my-visits');
  },
};

// ============= AGREEMENTS APIs =============
export const agreementsAPI = {
  getMyAgreements: async () => {
    return api.get('/agreements/my-agreements');
  },
};

// ============= REWARDS APIs =============
export const rewardsAPI = {
  getUserPoints: async () => {
    return api.get<{ points: number }>('/rewards/points');
  },
  getAvailableRewards: async () => {
    return api.get('/rewards/available');
  },
};

// ============= REFERRALS APIs =============
export const referralsAPI = {
  getReferralCode: async () => {
    return api.get<{ referral_code: string }>('/referrals/code');
  },
  getReferralStats: async () => {
    return api.get('/referrals/stats');
  },
};

export default api;