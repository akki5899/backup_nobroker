// ============= USER MODELS =============
export interface User {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  user_type?: 'owner' | 'tenant' | 'buyer' | 'agent' | 'builder';
  is_active: boolean;
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  avatar?: string;
  bio?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

// Backend PropertyType enum values (see backend/app/models/property.py)
export type PropertyTypeValue =
  | 'apartment'
  | 'house'
  | 'villa'
  | 'builder_floor'
  | 'studio'
  | 'farmhouse'
  | 'serviced_apartment'
  | 'pg'
  | 'hostel'
  | 'office'
  | 'retail'
  | 'warehouse'
  | 'land'
  | 'plot'
  | 'commercial_land'
  | 'other';

// ============= PROPERTY MODELS =============
export interface Property {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  // `type` is the normalized alias the frontend reads everywhere; the API sends
  // `property_type`. api_client.normalizeProperty populates both. See utils/api_client.ts.
  type: PropertyTypeValue;
  property_type?: PropertyTypeValue;
  listing_type: 'rent' | 'sale';
  price: number;
  deposit?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  total_floors?: number;
  age?: number;
  furnished: boolean;
  parking?: boolean;
  balcony?: boolean;
  gym?: boolean;
  swimming_pool?: boolean;
  // Common amenities
  lift?: boolean;
  security?: boolean;
  power_backup?: boolean;
  club_house?: boolean;
  garden?: boolean;
  children_play_area?: boolean;
  intercom?: boolean;
  visitor_parking?: boolean;
  // Extended amenities (F23)
  mini_theatre?: boolean;
  library_reading_room?: boolean;
  community_hall?: boolean;
  pet_park?: boolean;
  ev_charging?: boolean;
  rainwater_harvesting?: boolean;
  solar_panels?: boolean;
  maintenance_staff?: boolean;
  cctv_surveillance?: boolean;
  fire_safety?: boolean;
  badminton_squash_court?: boolean;
  sauna_steam_room?: boolean;
  indoor_games_room?: boolean;
  yoga_meditation_room?: boolean;
  jogging_track?: boolean;
  outdoor_fitness_area?: boolean;
  // Connectivity — nearby infrastructure (homepage "Connectivity Matters" tiles)
  near_metro?: boolean;
  near_bus?: boolean;
  near_highway?: boolean;
  near_schools?: boolean;
  near_hospitals?: boolean;
  near_airport?: boolean;
  near_it_hubs?: boolean;
  near_malls?: boolean;
  // Curated collection flags (listing "Quick Filters")
  is_luxury?: boolean;
  gated_community?: boolean;
  address?: string;
  city: string;
  state?: string;
  pincode?: string;
  // API sends `latitude`/`longitude`; normalizeProperty mirrors them to `lat`/`lng`.
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  is_featured?: boolean;
  views: number;
  amenities?: string[];
  created_at: string;
  updated_at?: string;
  images: PropertyImage[];
  videos?: PropertyVideo[];
}

export interface PropertyVideo {
  id: number;
  property_id: number;
  video_url: string;
  created_at?: string;
}

export interface PropertyCreate {
  title?: string;
  description: string;
  type: 'apartment' | 'house' | 'villa' | 'commercial' | 'plot';
  listing_type: 'rent' | 'buy';
  price: number;
  deposit?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished: boolean;
  city: string;
  lat: number;
  lng: number;
  amenities?: string[];
  [key: string]: any;
}

export interface PropertyUpdate {
  title?: string;
  description?: string;
  price?: number;
  bedrooms?: number;
  furnished?: boolean;
  [key: string]: any;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_primary?: boolean;
  created_at?: string;
}

// ============= SEARCH & FILTER MODELS =============
export interface SearchFilters {
  city?: string;
  type?: 'apartment' | 'house' | 'villa' | 'commercial' | 'plot';
  listing_type?: 'rent' | 'buy' | 'sale';
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  furnished?: boolean;
  age?: number;
  total_floors?: number;
  connectivity?: string;
  is_luxury?: boolean;
  gated_community?: boolean;
  newly_built?: boolean;
  sort_by?: 'price' | 'created_at' | 'views';
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface GeofenceSearchRequest {
  coordinates: Array<[number, number]>;
  city?: string;
  listing_type?: 'rent' | 'buy';
  min_price?: number;
  max_price?: number;
  [key: string]: any;
}

export interface RadiusSearchRequest {
  lat: number;
  lng: number;
  radius_km: number;
  city?: string;
  listing_type?: 'rent' | 'buy';
  [key: string]: any;
}

// ============= INQUIRY MODELS =============
export interface Inquiry {
  id: number;
  user_id: number;
  property_id: number;
  message: string;
  status: 'pending' | 'contacted' | 'closed' | 'accepted' | 'rejected';
  response_message?: string;
  created_at: string;
  updated_at?: string;
  property?: Property;
  user?: User;
}

export interface InquiryCreate {
  property_id: number;
  message: string;
}

export interface InquiryUpdate {
  status?: 'pending' | 'contacted' | 'closed' | 'accepted' | 'rejected';
  response_message?: string;
}

// ============= WISHLIST MODELS =============
export interface Wishlist {
  id: number;
  user_id: number;
  property_id: number;
  created_at: string;
  property?: Property;
}

export interface WishlistResponse {
  is_favorited: boolean;
}

// ============= NOTIFICATION MODELS =============
export interface Notification {
  id: number;
  user_id: number;
  title?: string;
  message: string;
  is_read: boolean;
  type?: 'inquiry' | 'property' | 'system' | 'offer';
  related_id?: number;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unread_count: number;
}

// ============= CONTACT MODELS =============
export interface Contact {
  owner_id: number;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  inquiry_count: number;
}

export interface ContactsResponse {
  contacts: Contact[];
}

// ============= TIMELINE MODELS =============
export interface TimelineActivity {
  id: number;
  type: 'property_listed' | 'inquiry_sent' | 'property_sold' | 'inquiry_received';
  description: string;
  timestamp: string;
  related_property?: Property;
  related_inquiry?: Inquiry;
}

export interface TimelineResponse {
  activities: TimelineActivity[];
}

// ============= VISIT MODELS =============
export interface PropertyVisit {
  id: number;
  user_id: number;
  property_id: number;
  visit_date: string;
  notes?: string;
  created_at: string;
  property?: Property;
}

// ============= AGREEMENT MODELS =============
export interface RentalAgreement {
  id: number;
  tenant_id: number;
  property_id: number;
  rent: number;
  deposit: number;
  duration_months: number;
  start_date: string;
  end_date: string;
  terms?: string;
  created_at: string;
  property?: Property;
  tenant?: User;
}

// ============= REWARD MODELS =============
export interface Reward {
  id: number;
  name: string;
  points_required: number;
  description: string;
  icon?: string;
}

export interface UserPoints {
  points: number;
  tier?: string;
  next_tier_points?: number;
}

// ============= REFERRAL MODELS =============
export interface ReferralCode {
  referral_code: string;
  created_at?: string;
}

export interface ReferralStat {
  user_id: number;
  referred_user_id: number;
  referral_code: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  total_earnings: number;
  referrals: ReferralStat[];
}

// ============= OTP MODELS =============
export interface SendOTPRequest {
  email?: string;
  phone?: string;
}

export interface VerifyOTPRequest {
  email?: string;
  phone?: string;
  otp: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string;
}

// ============= AUTH MODELS =============
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phone: string;
  full_name: string;
  password: string;
  user_type?: 'owner' | 'tenant' | 'buyer';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ============= CHAT MODELS =============
export interface ChatMessage {
  message: string;
  type?: 'question' | 'message';
}

export interface ChatResponse {
  response: string;
  suggestions?: string[];
}

export interface Chat {
  id: number;
  user_id: number;
  message: string;
  response: string;
  created_at: string;
}

// ============= ERROR MODELS =============
export interface ApiError {
  status: number;
  detail: string | { [key: string]: string[] };
  message?: string;
}

// ============= RESPONSE WRAPPER MODELS =============
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SuccessMessage {
  message: string;
}

// ============= BULK OPERATION MODELS =============
export interface BulkDeleteRequest {
  ids: number[];
}

export interface BulkDeleteResponse {
  message: string;
  deleted_count: number;
}