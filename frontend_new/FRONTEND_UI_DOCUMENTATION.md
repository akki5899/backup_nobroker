# NoBroker Frontend UI Documentation

## Overview
The NoBroker frontend is a modern Next.js 14 application with TypeScript, providing a comprehensive real estate platform interface. It features responsive design, advanced search capabilities, user authentication, and seamless integration with the FastAPI backend.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context API
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT tokens with cookies
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Project Structure
```
frontend/src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication pages
│   ├── dashboard/       # User dashboard
│   ├── properties/      # Property pages
│   └── ...              # Other pages
├── components/          # Reusable UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # API client & utilities
└── types/              # TypeScript definitions
```

## 🎨 Design System

### Color Palette
- **Primary**: Red (#DC2626) - Brand color for CTAs and highlights
- **Secondary**: Blue (#2563EB) - For links and secondary actions
- **Success**: Green (#059669) - For success states
- **Warning**: Orange (#D97706) - For warnings
- **Error**: Red (#DC2626) - For error states
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Font weights 600-800, responsive sizing
- **Body**: Font weight 400-500, optimized line heights
- **Captions**: Smaller text for metadata and descriptions

### Spacing & Layout
- **Container**: Max-width 7xl (1280px) with responsive padding
- **Grid**: CSS Grid and Flexbox for layouts
- **Spacing**: Tailwind's spacing scale (4px increments)

## 📱 Pages & Components

### 🏠 Homepage (`/app/page.tsx`)

#### Features
- **Hero Section**: Gradient background with search form
- **User Welcome**: Personalized greeting for authenticated users
- **Property Search**: Tabbed interface (Rent/Buy/Commercial)
- **Featured Properties**: Grid of property cards
- **Statistics**: Platform metrics display
- **Services**: Additional service offerings
- **Connectivity Projects**: Location-based property categories

#### API Integrations
```typescript
// Featured properties
const response = await propertyAPI.search({ limit: 8 });

// Search functionality
const handleSearch = async (filters: SearchFilters) => {
  const response = await propertyAPI.search(filters);
};
```

#### Key Components Used
- `SearchForm` - Property search interface
- `PropertyCard` - Individual property display
- Authentication context for user state

### 🔍 Properties Page (`/app/properties/page.tsx`)

#### Features
- **Advanced Search**: Multiple filter options
- **Property Grid/List**: Toggle between view modes
- **Pagination**: Navigate through results
- **Sorting**: Multiple sort options
- **Connectivity Filters**: Location-based filtering
- **Responsive Design**: Mobile-optimized layout

#### Search Filters
```typescript
interface SearchFilters {
  city?: string;
  property_type?: string;
  listing_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  furnished?: boolean;
  page?: number;
  limit?: number;
}
```

#### API Integration
```typescript
// Property search with filters
const handleSearch = async (filters: SearchFilters, page: number = 1) => {
  const searchParams = { 
    ...filters, 
    page, 
    limit: 12,
    connectivity: connectivityFilters
  };
  const response = await propertyAPI.search(searchParams);
};
```

#### Components
- **Filter Sidebar**: Property type, price range, bedrooms
- **Sort Controls**: Newest, price, area, popularity
- **View Toggle**: Grid vs list view
- **Pagination**: Page navigation
- **ConnectivityFilters**: Location-based filters

### 🏡 Property Details (`/app/properties/[id]/page.tsx`)

#### Features
- **Image Gallery**: Property photos with carousel
- **Property Information**: Complete details display
- **Owner Contact**: Direct communication options
- **Inquiry Form**: Contact property owner
- **Wishlist Toggle**: Add/remove from favorites
- **Similar Properties**: Recommendations
- **Map Integration**: Location display

#### API Integrations
```typescript
// Get property details
const property = await propertyAPI.getById(id);

// Create inquiry
const inquiry = await inquiryAPI.create({
  property_id: id,
  message: "Interested in this property",
  name: user.full_name,
  email: user.email,
  phone: user.phone
});

// Wishlist operations
await wishlistAPI.addToWishlist(propertyId);
await wishlistAPI.removeFromWishlist(propertyId);
```

### 🔐 Authentication Pages

#### Login Page (`/app/login/page.tsx`)
- **Email/Password Form**: User authentication
- **Remember Me**: Persistent login option
- **Forgot Password**: Password recovery link
- **Social Login**: Optional third-party authentication
- **Registration Link**: Navigate to signup

#### Register Page (`/app/register/page.tsx`)
- **User Information Form**: Name, email, phone
- **User Type Selection**: Owner, tenant, buyer, agent, builder
- **Password Requirements**: Strength validation
- **Terms & Conditions**: Legal agreement
- **OTP Verification**: Email/phone verification

#### API Integration
```typescript
// Login
const response = await authAPI.login({
  username: email,
  password: password
});

// Registration
const user = await authAPI.register({
  email,
  phone,
  full_name,
  password,
  user_type
});

// OTP verification
await authAPI.sendOTP({ email });
await authAPI.verifyOTP({ email, otp });
```

### 📊 Dashboard (`/app/dashboard/page.tsx`)

#### Features
- **Overview Cards**: Quick statistics
- **My Properties**: User's property listings
- **Recent Inquiries**: Property inquiries received
- **Notifications**: System notifications
- **Quick Actions**: Common tasks
- **Activity Timeline**: Recent activities

#### Sub-pages
- **Timeline** (`/dashboard/timeline`): Activity history
- **Visits** (`/dashboard/visits`): Scheduled property visits
- **Agreements** (`/dashboard/agreements`): Rental agreements

#### API Integrations
```typescript
// User properties
const properties = await userAPI.getMyProperties();

// Inquiries
const inquiries = await inquiryAPI.getPropertyInquiries();

// Notifications
const notifications = await notificationAPI.getNotifications();
```

### 📝 Post Property (`/app/post-property/page.tsx`)

#### Features
- **Multi-step Form**: Property information collection
- **Image Upload**: Multiple property photos
- **Location Selection**: Address with map integration
- **Amenities Selection**: Property features
- **Pricing Information**: Rent/sale price, deposit
- **Preview Mode**: Review before publishing

#### Form Sections
1. **Basic Information**: Title, description, type
2. **Location Details**: Address, city, state, pincode
3. **Property Features**: Bedrooms, bathrooms, area
4. **Amenities**: Parking, gym, swimming pool, etc.
5. **Pricing**: Price, deposit, negotiable options
6. **Images**: Photo upload with preview
7. **Contact Information**: Owner details

#### API Integration
```typescript
// Create property
const property = await propertyAPI.create(propertyData);

// Upload images
const formData = new FormData();
files.forEach(file => formData.append('files', file));
await propertyAPI.uploadImages(propertyId, formData);
```

### ❤️ Favorites (`/app/favorites/page.tsx`)

#### Features
- **Wishlist Display**: Saved properties grid
- **Quick Actions**: Remove from wishlist, view details
- **Empty State**: Guidance when no favorites
- **Bulk Operations**: Select multiple properties

#### API Integration
```typescript
// Get wishlist
const wishlist = await wishlistAPI.getWishlist();

// Remove from wishlist
await wishlistAPI.removeFromWishlist(propertyId);
```

### 🗺️ Map View (`/app/map-view/page.tsx`)

#### Features
- **Interactive Map**: Google Maps integration
- **Property Markers**: Properties displayed on map
- **Search Overlay**: Filter properties on map
- **Property Panel**: Details popup on marker click
- **Geofence Search**: Draw area to search

#### Components
- **GoogleMap**: Map display component
- **PropertyPanel**: Property details sidebar
- **SearchOverlay**: Search controls overlay
- **Header**: Map-specific navigation

### 🔔 Notifications (`/app/notifications/page.tsx`)

#### Features
- **Notification List**: All user notifications
- **Read/Unread Status**: Visual indicators
- **Mark as Read**: Individual and bulk actions
- **Notification Types**: Inquiries, system updates, etc.
- **Real-time Updates**: Live notification updates

### 👤 Profile Pages

#### Profile Overview (`/app/profile/page.tsx`)
- **User Information**: Display and edit profile
- **Account Settings**: Privacy and security options
- **Verification Status**: Email/phone verification
- **Account Statistics**: Usage metrics

#### Sub-pages
- **Contacts** (`/profile/contacts`): Saved contacts
- **Interested** (`/profile/interested`): Properties of interest
- **Payments** (`/profile/payments`): Payment history

### 💰 Plans & Pricing

#### Residential Plans
- **Buyers** (`/plans/residential/buyers`): Plans for property buyers
- **Sellers** (`/plans/residential/sellers`): Plans for property sellers
- **Owners** (`/plans/residential/owners`): Plans for property owners
- **Tenants** (`/plans/residential/tenants`): Plans for tenants

#### Commercial Plans
- **Buyers** (`/plans/commercial/buyers`): Commercial property buyers
- **Sellers** (`/plans/commercial/sellers`): Commercial property sellers
- **Owners** (`/plans/commercial/owners`): Commercial property owners
- **Tenants** (`/plans/commercial/tenants`): Commercial tenants

## 🧩 Reusable Components

### PropertyCard (`/components/PropertyCard.tsx`)
**Purpose**: Display property information in card format

**Features**:
- Property image with fallback
- Price and basic details
- Wishlist toggle button
- Property type and listing type badges
- Owner contact information
- View details link

**Props**:
```typescript
interface PropertyCardProps {
  property: Property;
  showOwnerInfo?: boolean;
  onWishlistToggle?: (propertyId: number) => void;
}
```

### SearchForm (`/components/SearchForm.tsx`)
**Purpose**: Property search interface

**Features**:
- Location autocomplete
- Property type selection
- Price range inputs
- Bedroom selection
- Advanced filters toggle

**Props**:
```typescript
interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  activeTab?: string;
  initialFilters?: SearchFilters;
}
```

### Header (`/components/Header.tsx`)
**Purpose**: Main navigation header

**Features**:
- Logo and brand name
- Navigation menu
- User authentication status
- Notification bell with count
- Mobile responsive menu
- Search bar integration

### Footer (`/components/Footer.tsx`)
**Purpose**: Site footer with links and information

**Features**:
- Company information
- Quick links
- Social media links
- Contact information
- Legal links

### Loading (`/components/Loading.tsx`)
**Purpose**: Loading states and skeletons

**Variants**:
- Spinner loading
- Skeleton cards
- Page loading overlay
- Button loading states

### ErrorBoundary (`/components/ErrorBoundary.tsx`)
**Purpose**: Error handling and display

**Features**:
- Catch JavaScript errors
- Display user-friendly error messages
- Error reporting integration
- Fallback UI components

### OTPVerification (`/components/OTPVerification.tsx`)
**Purpose**: OTP input and verification

**Features**:
- 6-digit OTP input
- Auto-focus and navigation
- Resend OTP functionality
- Timer countdown
- Error handling

### Chatbot (`/components/Chatbot.tsx`)
**Purpose**: AI chatbot interface

**Features**:
- Chat message display
- Message input
- Typing indicators
- Quick reply buttons
- Minimize/maximize toggle

## 🔧 Utilities & Hooks

### useAuth Hook (`/hooks/useAuth.ts`)
**Purpose**: Authentication state management

**Features**:
```typescript
interface AuthHook {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  loading: boolean;
}
```

### API Client (`/lib/api.ts`)
**Purpose**: Centralized API communication

**Features**:
- Axios instance configuration
- Request/response interceptors
- Automatic token injection
- Error handling
- Input sanitization

**Security Features**:
```typescript
// Input sanitization
const sanitizeInput = (input: any) => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    }).trim();
  }
  return input;
};

// Request interceptor
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### AuthContext (`/contexts/AuthContext.tsx`)
**Purpose**: Global authentication state

**Features**:
- User state management
- Token persistence
- Automatic logout on token expiry
- Loading states
- Error handling

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

### Mobile Optimizations
- Touch-friendly buttons (min 44px)
- Swipe gestures for carousels
- Collapsible navigation menu
- Optimized form layouts
- Reduced content density

### Tablet Optimizations
- Grid layouts with appropriate columns
- Sidebar navigation
- Hover states for interactive elements
- Optimized spacing and typography

## 🎯 User Experience Features

### Performance Optimizations
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route-based splitting
- **Prefetching**: Link prefetching for faster navigation
- **Caching**: API response caching
- **Bundle Optimization**: Tree shaking and minification

### Accessibility Features
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels and roles
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Proper focus indicators
- **Alt Text**: Descriptive image alt text

### User Feedback
- **Loading States**: Skeleton screens and spinners
- **Error Messages**: Clear, actionable error messages
- **Success Notifications**: Toast notifications for actions
- **Form Validation**: Real-time validation feedback
- **Empty States**: Helpful guidance when no data

## 🔒 Security Features

### Input Validation
- Client-side validation with TypeScript
- Server-side validation integration
- XSS prevention with DOMPurify
- CSRF protection with tokens

### Authentication Security
- JWT token storage in httpOnly cookies
- Automatic token refresh
- Secure logout with token cleanup
- Session timeout handling

### Data Protection
- Sensitive data masking
- Secure API communication (HTTPS)
- Input sanitization
- Output encoding

## 🚀 Performance Metrics

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Strategies
- Image optimization and lazy loading
- Code splitting and tree shaking
- CSS optimization with Tailwind purging
- API response caching
- Service worker for offline functionality

## 🧪 Testing Strategy

### Component Testing
- Unit tests for individual components
- Integration tests for component interactions
- Accessibility testing with jest-axe
- Visual regression testing

### E2E Testing
- User journey testing
- Cross-browser compatibility
- Mobile device testing
- Performance testing

## 📊 Analytics & Monitoring

### User Analytics
- Page view tracking
- User interaction events
- Conversion funnel analysis
- Property search analytics

### Performance Monitoring
- Real User Monitoring (RUM)
- Error tracking and reporting
- API response time monitoring
- Bundle size monitoring

## 🚀 Deployment & Build

### Build Process
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Environment Configuration
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key

# Analytics (Optional)
NEXT_PUBLIC_GA_TRACKING_ID=your-tracking-id
```

### Production Optimizations
- Static site generation where possible
- Image optimization with Next.js Image
- Bundle analysis and optimization
- CDN integration for static assets
- Gzip compression
- Browser caching headers

This comprehensive UI documentation covers all aspects of the NoBroker frontend, from individual components to complete user journeys, ensuring developers can understand and maintain the codebase effectively.