// Analytics tracking utility
export const analytics = {
  // Track page views
  pageView: (url: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url,
      });
    }
  },

  // Track events
  event: (action: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, params);
    }
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', action, params);
    }
  },

  // Property specific events
  propertyView: (propertyId: number, propertyTitle: string) => {
    analytics.event('property_view', {
      property_id: propertyId,
      property_title: propertyTitle,
    });
  },

  propertyInquiry: (propertyId: number, inquiryType: string) => {
    analytics.event('property_inquiry', {
      property_id: propertyId,
      inquiry_type: inquiryType,
    });
  },

  searchPerformed: (filters: Record<string, any>) => {
    analytics.event('search', {
      search_filters: JSON.stringify(filters),
    });
  },

  mapInteraction: (action: string, data?: any) => {
    analytics.event('map_interaction', {
      action,
      ...data,
    });
  },

  userRegistration: (method: string) => {
    analytics.event('sign_up', {
      method,
    });
  },

  userLogin: (method: string) => {
    analytics.event('login', {
      method,
    });
  },

  propertyListed: (propertyType: string, listingType: string) => {
    analytics.event('property_listed', {
      property_type: propertyType,
      listing_type: listingType,
    });
  },

  filterApplied: (filterName: string, filterValue: any) => {
    analytics.event('filter_applied', {
      filter_name: filterName,
      filter_value: filterValue,
    });
  },

  shareProperty: (propertyId: number, method: string) => {
    analytics.event('share', {
      content_type: 'property',
      content_id: propertyId,
      method,
    });
  },
};

// Performance monitoring
export const performance = {
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        analytics.event('performance_metric', {
          metric_name: name,
          duration: measure.duration,
        });
      } catch (e) {
        console.error('Performance measurement failed:', e);
      }
    }
  },
};
