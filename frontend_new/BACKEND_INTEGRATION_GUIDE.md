# PropDirect Frontend - Backend Integration Guide

## Overview

This document provides a comprehensive guide to using the PropDirect Backend API within the frontend_new application. All backend features are integrated via the `src/utils/api_client.ts` module, which exports typed service APIs for each backend domain.

---

## Quick Start: API Usage

### 1. Import and Use API Services

```typescript
import { authAPI, propertyAPI, userAPI, inquiryAPI, wishlistAPI, notificationAPI } from '@/utils/api_client';

// Example: Search properties
const response = await propertyAPI.search({
  city: 'Mumbai',
  min_price: 100000,
  max_price: 500000,
  page: 1,
  limit: 20,
});
console.log(response.data);

// Example: Get user profile
const userResponse = await userAPI.getProfile();
console.log(userResponse.data);

// Example: Create inquiry
const inquiryResponse = await inquiryAPI.create({
  property_id: 123,
  message: 'Interested in this property',
});
```

### 2. Error Handling & Interceptors

All requests automatically include the JWT bearer token from localStorage. On 401 (unauthorized), the token is cleared and user is redirected to `/login`.

```typescript
try {
  const response = await propertyAPI.getById(propertyId);
  console.log(response.data);
} catch (error) {
  if (error.response?.status === 401) {
    // Already handled by interceptor
    console.log('Logged out due to token expiry');
  } else if (error.response?.status === 403) {
    console.log('Access denied');
  } else {
    console.log('Network or server error:', error.message);
  }
}
```

---

## API Service Modules

### **authAPI** - Authentication

```typescript
// Login with email/username and password
await authAPI.login({ username: 'user@example.com', password: 'password123' });
// Returns: { access_token: "jwt_token", token_type: "bearer", user?: User }

// Register new user
await authAPI.register({
  email: 'new@example.com',
  phone: '9876543210',
  full_name: 'John Doe',
  password: 'securepass',
});

// Check if email exists
await authAPI.checkUser('test@example.com');
// Returns: { exists: boolean, email: string, id?: number }

// Send OTP to email or phone
await authAPI.sendOTP({ email: 'user@example.com' });
// OR
await authAPI.sendOTP({ phone: '+919876543210' });

// Verify OTP
await authAPI.verifyOTP({
  email: 'user@example.com',
  otp: '123456',
});

// Logout (clears localStorage)
await authAPI.logout();

// Get current user
await authAPI.getCurrentUser();
// Returns: User object
```

---

### **propertyAPI** - Properties & Listings

```typescript
// Search properties with filters
await propertyAPI.search({
  city: 'Mumbai',
  type: 'apartment', // apartment, house, villa, commercial, plot
  listing_type: 'rent', // rent or buy
  min_price: 100000,
  max_price: 500000,
  bedrooms: 2,
  furnished: true,
  sort_by: 'price', // price, created_at, views
  page: 1,
  limit: 20,
});

// Get property by ID (increments views)
await propertyAPI.getById(123);
// Returns: Property with full details

// Create property (requires auth, auto-generates title if missing)
await propertyAPI.create({
  title: 'Beautiful 2BHK in Mumbai',
  description: 'Well-furnished apartment',
  city: 'Mumbai',
  lat: 19.0760,
  lng: 72.8777,
  price: 250000,
  type: 'apartment',
  listing_type: 'rent',
  bedrooms: 2,
  furnished: true,
  amenities: ['WiFi', 'Parking', 'Gym'],
});

// Update property (owner only)
await propertyAPI.update(propertyId, {
  price: 300000,
  description: 'Updated description',
});

// Delete property (owner only, removes images)
await propertyAPI.delete(propertyId);

// Bulk delete properties (owner only)
await propertyAPI.bulkDelete([1, 2, 3, 4]);

// Upload property images (multipart/form-data)
const formData = new FormData();
formData.append('files', imageFile1);
formData.append('files', imageFile2);
await propertyAPI.uploadImages(propertyId, formData);

// Delete specific property image
await propertyAPI.deleteImage(propertyId, imageId);

// Radius search (Haversine formula)
await propertyAPI.radiusSearch(
  19.0760, // latitude
  72.8777, // longitude
  15, // radius in km
  { min_price: 100000, max_price: 500000 } // optional filters
);

// Geofence search (polygon-based)
await propertyAPI.geofenceSearch(
  [[19.07, 72.87], [19.08, 72.88], [19.09, 72.89]], // polygon coordinates
  { listing_type: 'rent', bedrooms: 2 } // optional filters
);

// Debug: Get sample properties
await propertyAPI.getDebugSample();
// Returns: 5 sample properties

// Debug: Get statistics
await propertyAPI.getDebugCount();
// Returns: { total_properties, sample_cities: [...] }
```

---

### **userAPI** - User Management

```typescript
// Get current user profile
await userAPI.getProfile();
// Returns: User { id, email, phone, full_name, verified, created_at, ... }

// Update user profile
await userAPI.updateProfile({
  full_name: 'John Updated',
  phone: '9876543210',
  // other fields: bio, avatar, etc.
});

// Get properties owned by current user
await userAPI.getMyProperties();
// Returns: Property[]

// Delete current user account (also deletes associated images)
await userAPI.deleteAccount();
```

---

### **inquiryAPI** - Inquiries & Messages

```typescript
// Create inquiry for a property
await inquiryAPI.create({
  property_id: 123,
  message: 'I am interested in this property',
});
// Prevents: owner from creating inquiry on own property, duplicate inquiries

// Get inquiries made by current user
await inquiryAPI.getMyInquiries();
// Returns: Inquiry[]

// Get inquiries received on current user's properties
await inquiryAPI.getPropertyInquiries();
// Returns: Inquiry[] (from property owners' perspective)

// Get specific inquiry
await inquiryAPI.getById(inquiryId);

// Update inquiry (only property owner can update)
await inquiryAPI.update(inquiryId, {
  status: 'accepted', // accepted, rejected, pending
  response_message: 'We will contact you soon',
});

// Delete specific inquiry
await inquiryAPI.delete(inquiryId);

// Bulk delete inquiries
await inquiryAPI.bulkDelete([1, 2, 3]);
```

---

### **wishlistAPI** - Favorites & Saved Properties

```typescript
// Get all wishlist items with property details
await wishlistAPI.getWishlist();
// Returns: Array of { id, property_id, property: Property, ... }

// Add property to wishlist
await wishlistAPI.addToWishlist(propertyId);

// Remove property from wishlist
await wishlistAPI.removeFromWishlist(propertyId);

// Check if property is in wishlist
await wishlistAPI.checkWishlistStatus(propertyId);
// Returns: { is_favorited: boolean }
```

---

### **notificationAPI** - Notifications

```typescript
// Get latest 20 notifications with unread count
await notificationAPI.getNotifications();
// Returns: { notifications: Notification[], unread_count: number }

// Mark single notification as read
await notificationAPI.markAsRead(notificationId);

// Mark all unread notifications as read
await notificationAPI.markAllAsRead();
```

---

### **contactsAPI** - Contacts

```typescript
// Get unique list of property owners contacted by current user
await contactsAPI.getMyContacts();
// Returns: { contacts: Array<{ owner_id, owner_name, email, phone, ... }> }
```

---

### **timelineAPI** - Activity Timeline

```typescript
// Get user's activity timeline (inquiries + listings)
await timelineAPI.getActivities();
// Returns: Array of activities with timestamps and descriptions
```

---

### **visitsAPI** - Property Visits

```typescript
// Get property visits for current user
await visitsAPI.getMyVisits();
// Returns: PropertyVisit[] { id, property_id, property, visit_date, ... }
```

---

### **agreementsAPI** - Rental Agreements

```typescript
// Get rental agreements for current user (tenant-facing)
await agreementsAPI.getMyAgreements();
// Returns: RentalAgreement[] { id, property_id, terms, rent, duration, ... }
```

---

### **rewardsAPI** - Rewards & Gamification

```typescript
// Get current user's points (calculated from properties & inquiries)
await rewardsAPI.getUserPoints();
// Returns: { points: number }

// Get list of available rewards (static)
await rewardsAPI.getAvailableRewards();
// Returns: Array of { id, name, points_required, description, ... }
```

---

### **referralsAPI** - Referral Program

```typescript
// Generate referral code for current user
await referralsAPI.getReferralCode();
// Returns: { referral_code: "PROP000123" } (PROP{user_id:06d})

// Get referral statistics (mock/stubbed)
await referralsAPI.getReferralStats();
// Returns: { total_referrals: 5, total_earnings: 500, referrals: [...] }
```

---

### **chatbotAPI** - AI Assistant

```typescript
// Send message to rule-based chatbot
await chatbotAPI.sendMessage('How do I list a property?');
// Returns: { response: "To list a property, go to...", suggestions: [...] }
```

---

## Authentication Flow

### Login Process

```typescript
// 1. User submits login form
const response = await authAPI.login({
  username: 'user@example.com',
  password: 'password123',
});

// 2. Store token and user in localStorage
localStorage.setItem('token', response.data.access_token);
localStorage.setItem('user', JSON.stringify(response.data.user));

// 3. Token is automatically added to all subsequent requests via interceptor
// 4. If token expires (401), interceptor clears storage and redirects to /login
```

### OTP Verification

```typescript
// 1. Send OTP to email or phone
await authAPI.sendOTP({ email: 'user@example.com' });

// 2. User receives OTP code
// 3. Verify OTP
await authAPI.verifyOTP({
  email: 'user@example.com',
  otp: '123456',
});
// User's email_verified flag is set to true on backend
```

---

## Pagination & Filtering

### Properties Search with Pagination

```typescript
const response = await propertyAPI.search({
  city: 'Mumbai',
  page: 1, // 1-indexed
  limit: 20, // items per page
  sort_by: 'price', // 'price', 'created_at', 'views'
});
// Returns paginated results

// Next page
const nextPage = await propertyAPI.search({
  city: 'Mumbai',
  page: 2,
  limit: 20,
});
```

### Available Filter Parameters

```typescript
interface SearchFilters {
  city?: string;
  type?: 'apartment' | 'house' | 'villa' | 'commercial' | 'plot';
  listing_type?: 'rent' | 'buy';
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  furnished?: boolean;
  sort_by?: 'price' | 'created_at' | 'views';
  page?: number;
  limit?: number;
}
```

---

## Image Upload & Management

### Upload Multiple Images

```typescript
const formData = new FormData();
const fileInput = document.getElementById('property-images') as HTMLInputElement;

if (fileInput.files) {
  Array.from(fileInput.files).forEach((file) => {
    formData.append('files', file); // backend expects 'files' (plural)
  });
}

try {
  const response = await propertyAPI.uploadImages(propertyId, formData);
  console.log('Images uploaded:', response.data);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### Delete Image

```typescript
await propertyAPI.deleteImage(propertyId, imageId);
```

---

## Error Handling Best Practices

### Common Error Codes

```typescript
try {
  await propertyAPI.getById(propertyId);
} catch (error: any) {
  const status = error.response?.status;
  const message = error.response?.data?.detail || error.message;

  if (status === 401) {
    // Token expired or invalid - user redirected to /login by interceptor
  } else if (status === 403) {
    // Forbidden: user doesn't have permission
    toast.error('You do not have permission for this action');
  } else if (status === 404) {
    // Not found
    toast.error('Property not found');
  } else if (status === 422) {
    // Validation error
    console.log('Validation errors:', error.response.data.detail);
  } else if (status === 500) {
    // Server error
    toast.error('Server error. Please try again later.');
  } else {
    // Network error
    toast.error('Network error. Please check your connection.');
  }
}
```

---

## Component Integration Examples

### Property List Page

```typescript
// pages/properties/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { propertyAPI } from '@/utils/api_client';
import PropertyCard from '@/components/PropertyCard';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', page: 1, limit: 20 });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyAPI.search(filters);
        setProperties(response.data);
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  return (
    <div>
      {loading ? <div>Loading...</div> : null}
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

### Property Detail Page

```typescript
// pages/properties/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { propertyAPI, inquiryAPI, wishlistAPI } from '@/utils/api_client';

export default function PropertyDetail({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      const response = await propertyAPI.getById(params.id);
      setProperty(response.data);

      // Check if favorited
      const favoriteStatus = await wishlistAPI.checkWishlistStatus(params.id);
      setIsFavorited(favoriteStatus.data.is_favorited);
    };

    fetchProperty();
  }, [params.id]);

  const handleAddToWishlist = async () => {
    await wishlistAPI.addToWishlist(params.id);
    setIsFavorited(true);
  };

  const handleCreateInquiry = async (message: string) => {
    await inquiryAPI.create({
      property_id: parseInt(params.id),
      message,
    });
    toast.success('Inquiry sent successfully!');
  };

  return (
    <div>
      {property ? (
        <>
          <h1>{property.title}</h1>
          <button onClick={handleAddToWishlist}>
            {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          <button onClick={() => handleCreateInquiry('I am interested')}>
            Send Inquiry
          </button>
        </>
      ) : null}
    </div>
  );
}
```

### Login Page

```typescript
// pages/login/page.tsx
'use client';
import { authAPI } from '@/utils/api_client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.login({ username: email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Environment Configuration

### .env.local

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# For production:
# NEXT_PUBLIC_API_URL=https://api.propdirect.com/api/v1
```

---

## Security Considerations

1. **Token Storage**: JWT tokens stored in localStorage. Consider httpOnly cookies for enhanced security in production.
2. **CORS**: Backend configured with CORS headers. Verify allowed origins in production.
3. **Input Sanitization**: DOMPurify integrated; fallback to basic trimming if not installed.
4. **Rate Limiting**: Backend includes rate limiting middleware.
5. **HTTPS**: Always use HTTPS in production to protect tokens in transit.

---

## Testing

### API Integration Tests

```typescript
// Example test using Jest/React Testing Library
import { propertyAPI } from '@/utils/api_client';

describe('propertyAPI', () => {
  it('should fetch properties with filters', async () => {
    const response = await propertyAPI.search({ city: 'Mumbai', limit: 10 });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  it('should get property by ID', async () => {
    const response = await propertyAPI.getById(1);
    expect(response.data.id).toBe(1);
  });
});
```

---

## Troubleshooting

### 401 Unauthorized Errors

- Check if token exists in localStorage
- Token may have expired; user will be redirected to /login automatically
- Try logging in again

### CORS Errors

- Verify `NEXT_PUBLIC_API_URL` is correct and accessible
- Check backend CORS configuration
- Ensure API is running on expected port

### Image Upload Failures

- Verify `Content-Type: multipart/form-data` is set (api_client handles this)
- Check file size limits on backend
- Ensure `upload_dir` exists and has write permissions

---

## Next Steps

1. ✅ Review the service API modules above
2. ✅ Integrate APIs into your page components
3. ✅ Add error handling and loading states
4. ✅ Implement form validation
5. ✅ Add Toast notifications for user feedback
6. ✅ Write tests for critical user flows
7. ✅ Test with backend running locally
8. ✅ Deploy to staging environment

---

For more details, see `frontend_new_features.json` and backend's `BACKEND_API_DOCUMENTATION.md`.

