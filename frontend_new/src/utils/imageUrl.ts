/**
 * Image URL utility functions
 * Converts relative image paths from backend to absolute URLs
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Convert relative image path to absolute backend URL
 * @param imagePath - Relative path like 'uploads/properties/filename.jpg'
 * @returns Full URL to backend image
 */
export const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80';
  }

  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Convert relative path to backend URL
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${BACKEND_URL}/${cleanPath}`;
};

/**
 * Get image URL from property object
 * @param property - Property object with images array
 * @param imageIndex - Index of image to get (default 0)
 * @returns URL of the image
 */
export const getPropertyImageUrl = (property: any, imageIndex: number = 0): string => {
  if (!property?.images || property.images.length === 0) {
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80';
  }

  return getImageUrl(property.images[imageIndex]?.image_url);
};

