# PropDirect Frontend - API Quick Reference

**Instant API Usage Guide for Developers**

---

## Authentication Quick Start

### Login
```typescript
import { authAPI } from '@/utils/api_client';

const response = await authAPI.login({
  username: 'user@example.com',
  password: 'password123'
});

localStorage.setItem('token', response.data.access_token);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### Register
```typescript
await authAPI.register({
  email: 'new@example.com',
  phone: '9876543210',
  full_name: 'John Doe',
  password: 'securepass'
});
```

### Send & Verify OTP
```typescript
// Send OTP
await authAPI.sendOTP({ email: 'user@example.com' });

// Verify OTP
await authAPI.verifyOTP({
  email: 'user@example.com',
  otp: '123456'
});
```

---

## Properties Quick Start

### Search with Filters
```typescript
import { propertyAPI } from '@/utils/api_client';

const response = await propertyAPI.search({
  city: 'Mumbai',
  type: 'apartment',
  listing_type: 'rent',
  min_price: 100000,
  max_price: 500000,
  bedrooms: 2,
  furnished: true,
  sort_by: 'price',
  page: 1,
  limit: 20
});
```

### Get Property Detail
```typescript
const property = await propertyAPI.getById(123);
// Returns: Property with full details + incremented views
```

### Create Property
```typescript
await propertyAPI.create({
  description: 'Beautiful 2BHK apartment',
  type: 'apartment',
  listing_type: 'rent',
  price: 250000,
  bedrooms: 2,
  furnished: true,
  city: 'Mumbai',
  lat: 19.0760,
  lng: 72.8777,
  amenities: ['WiFi', 'Parking']
  // title auto-generated if missing
});
```

### Update Property
```typescript
await propertyAPI.update(propertyId, {
  price: 300000,
  description: 'Updated description'
});
```

### Delete Property
```typescript
await propertyAPI.delete(propertyId);
```

### Bulk Delete
```typescript
await propertyAPI.bulkDelete([1, 2, 3, 4]);
```

### Upload Images
```typescript
const formData = new FormData();
formData.append('files', imageFile1);
formData.append('files', imageFile2);
await propertyAPI.uploadImages(propertyId, formData);
```

### Delete Image
```typescript
await propertyAPI.deleteImage(propertyId, imageId);
```

---

## Geospatial Search

### Radius Search (Haversine)
```typescript
const results = await propertyAPI.radiusSearch(
  19.0760,  // latitude
  72.8777,  // longitude
  15,       // radius in km
  { min_price: 100000, max_price: 500000 }  // optional filters
);
```

### Geofence Search (Polygon)
```typescript
const results = await propertyAPI.geofenceSearch(
  [[19.07, 72.87], [19.08, 72.88], [19.09, 72.89]],  // polygon
  { listing_type: 'rent', bedrooms: 2 }  // optional filters
);
```

---

## Inquiries Quick Start

### Create Inquiry
```typescript
import { inquiryAPI } from '@/utils/api_client';

await inquiryAPI.create({
  property_id: 123,
  message: 'I am interested in this property'
});
```

### Get My Inquiries (Sent)
```typescript
const inquiries = await inquiryAPI.getMyInquiries();
```

### Get Property Inquiries (Received)
```typescript
const inquiries = await inquiryAPI.getPropertyInquiries();
```

### Update Inquiry Status
```typescript
await inquiryAPI.update(inquiryId, {
  status: 'accepted',
  response_message: 'We will contact you soon'
});
```

### Delete Inquiry
```typescript
await inquiryAPI.delete(inquiryId);
```

### Bulk Delete
```typescript
await inquiryAPI.bulkDelete([1, 2, 3]);
```

---

## Wishlist Quick Start

### Get Wishlist
```typescript
import { wishlistAPI } from '@/utils/api_client';

const wishlist = await wishlistAPI.getWishlist();
```

### Add to Wishlist
```typescript
await wishlistAPI.addToWishlist(propertyId);
```

### Remove from Wishlist
```typescript
await wishlistAPI.removeFromWishlist(propertyId);
```

### Check if Favorited
```typescript
const response = await wishlistAPI.checkWishlistStatus(propertyId);
console.log(response.data.is_favorited);  // true or false
```

---

## Notifications Quick Start

### Get Notifications
```typescript
import { notificationAPI } from '@/utils/api_client';

const response = await notificationAPI.getNotifications();
const { notifications, unread_count } = response.data;
```

### Mark as Read
```typescript
await notificationAPI.markAsRead(notificationId);
```

### Mark All as Read
```typescript
await notificationAPI.markAllAsRead();
```

---

## User Profile Quick Start

### Get Profile
```typescript
import { userAPI } from '@/utils/api_client';

const user = await userAPI.getProfile();
```

### Update Profile
```typescript
await userAPI.updateProfile({
  full_name: 'John Updated',
  phone: '9876543210',
  bio: 'Property enthusiast'
});
```

### Get My Properties
```typescript
const properties = await userAPI.getMyProperties();
```

### Delete Account
```typescript
await userAPI.deleteAccount();
localStorage.removeItem('token');
localStorage.removeItem('user');
// Redirect to home
```

---

## Social Features Quick Start

### Get Contacts
```typescript
import { contactsAPI } from '@/utils/api_client';

const response = await contactsAPI.getMyContacts();
const { contacts } = response.data;
```

### Get Activity Timeline
```typescript
import { timelineAPI } from '@/utils/api_client';

const response = await timelineAPI.getActivities();
const { activities } = response.data;
```

### Get Visits
```typescript
import { visitsAPI } from '@/utils/api_client';

const visits = await visitsAPI.getMyVisits();
```

### Get Agreements
```typescript
import { agreementsAPI } from '@/utils/api_client';

const agreements = await agreementsAPI.getMyAgreements();
```

---

## Gamification Quick Start

### Get Referral Code
```typescript
import { referralsAPI } from '@/utils/api_client';

const response = await referralsAPI.getReferralCode();
console.log(response.data.referral_code);  // PROP000123
```

### Get Referral Stats
```typescript
const response = await referralsAPI.getReferralStats();
const { total_referrals, total_earnings, referrals } = response.data;
```

### Get User Points
```typescript
import { rewardsAPI } from '@/utils/api_client';

const response = await rewardsAPI.getUserPoints();
console.log(response.data.points);
```

### Get Available Rewards
```typescript
const response = await rewardsAPI.getAvailableRewards();
const { rewards } = response.data;
```

---

## Chatbot Quick Start

### Send Message
```typescript
import { chatbotAPI } from '@/utils/api_client';

const response = await chatbotAPI.sendMessage(
  'How do I list a property?'
);
const { response: answer, suggestions } = response.data;
```

---

## Error Handling Pattern

```typescript
try {
  const property = await propertyAPI.getById(propertyId);
  console.log(property.data);
} catch (error: any) {
  const status = error.response?.status;
  const message = error.response?.data?.detail || error.message;

  switch (status) {
    case 401:
      // Token expired - automatically redirected to /login
      break;
    case 403:
      toast.error('Access denied');
      break;
    case 404:
      toast.error('Not found');
      break;
    case 422:
      console.log('Validation error:', error.response.data.detail);
      break;
    case 500:
      toast.error('Server error');
      break;
    default:
      toast.error('Network error');
  }
}
```

---

## Common Component Patterns

### Property Card Component
```typescript
'use client';
import { Property } from '@/types';
import { wishlistAPI } from '@/utils/api_client';

export function PropertyCard({ property }: { property: Property }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = async () => {
    try {
      await wishlistAPI.addToWishlist(property.id);
      setIsFavorited(true);
    } catch (error) {
      console.error('Failed to add to wishlist', error);
    }
  };

  return (
    <div>
      <img src={property.images[0]?.image_url} alt={property.title} />
      <h3>{property.title}</h3>
      <p>₹{property.price}</p>
      <button onClick={handleFavorite}>
        {isFavorited ? '❤️' : '🤍'} Favorite
      </button>
    </div>
  );
}
```

### Search Form Component
```typescript
'use client';
import { useState } from 'react';
import { propertyAPI } from '@/utils/api_client';
import { SearchFilters } from '@/types';

export function SearchForm() {
  const [filters, setFilters] = useState<SearchFilters>({
    city: '',
    listing_type: 'rent'
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await propertyAPI.search(filters);
      console.log('Results:', response.data);
    } catch (error) {
      console.error('Search failed', error);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        placeholder="City"
        value={filters.city}
        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
      />
      <select
        value={filters.listing_type}
        onChange={(e) => setFilters({ ...filters, listing_type: e.target.value as any })}
      >
        <option value="rent">Rent</option>
        <option value="buy">Buy</option>
      </select>
      <button type="submit">Search</button>
    </form>
  );
}
```

### Protected Route Component
```typescript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  return isAuthenticated ? <>{children}</> : null;
}
```

---

## Type Imports

```typescript
import {
  User,
  Property,
  PropertyCreate,
  PropertyUpdate,
  SearchFilters,
  Inquiry,
  InquiryCreate,
  Notification,
  Wishlist,
  Contact,
  TimelineActivity,
  PropertyVisit,
  RentalAgreement,
  Reward,
  ReferralCode,
  ReferralStats,
  ChatMessage,
  ChatResponse,
} from '@/types';
```

---

## Environment Setup

Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

For production:
```bash
NEXT_PUBLIC_API_URL=https://api.propdirect.com/api/v1
```

---

## Important Notes

1. **Token Storage:** Automatically managed in localStorage
2. **Authorization Header:** Automatically added to all requests
3. **401 Handling:** Automatically redirects to /login
4. **Form Data:** Use FormData for image uploads
5. **Pagination:** Use `page` (1-indexed) and `limit` parameters
6. **Owner Checks:** Backend validates ownership for modify operations
7. **Duplicate Prevention:** Backend prevents duplicate inquiries
8. **Bulk Operations:** Support arrays of IDs for delete operations

---

## Debugging

### Check Token
```typescript
console.log(localStorage.getItem('token'));
console.log(localStorage.getItem('user'));
```

### Test API Endpoint
```typescript
import api from '@/utils/api_client';
api.get('/properties/debug/sample').then(r => console.log(r.data));
```

### View API Configuration
```typescript
console.log(process.env.NEXT_PUBLIC_API_URL);
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired, login again |
| CORS Error | Check NEXT_PUBLIC_API_URL |
| Image upload fails | Use FormData, check file size |
| Type mismatch | Import types from `@/types` |
| Missing data | Check backend response structure |
| Duplicate inquiries | Backend prevents, user already inquired |

---

**Quick Links:**
- 📖 [Full Integration Guide](./BACKEND_INTEGRATION_GUIDE.md)
- ✅ [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)
- 📋 [Integration Summary](./INTEGRATION_SUMMARY.md)
- 🔍 [API Client Source](./src/utils/api_client.ts)
- 📝 [Type Definitions](./src/types/index.ts)

---

Last Updated: February 15, 2026

