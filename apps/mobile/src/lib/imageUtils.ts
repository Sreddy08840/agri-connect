// Utility functions for handling image URLs in mobile app
import { api } from './api';

// Extract the base URL from the API URL (remove /api)
const getServerBaseUrl = (): string => {
  const apiUrl = (api.defaults.baseURL || 'http://192.168.30.223:8080/api');
  return apiUrl.replace('/api', ''); // Remove /api to get server base URL
};

const SERVER_BASE_URL = getServerBaseUrl();
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x400/E5E7EB/6B7280?text=No+Image';

/**
 * Converts a relative image path to a full URL
 * @param imagePath - Relative path like "/uploads/products/image.jpg" or full URL
 * @returns Full URL to the image
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    return PLACEHOLDER_IMAGE;
  }

  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // If it's a relative path starting with /, construct full URL
  if (imagePath.startsWith('/')) {
    return `${SERVER_BASE_URL}${imagePath}`;
  }

  // If it's just a filename, assume it's in uploads/products
  return `${SERVER_BASE_URL}/uploads/products/${imagePath}`;
}

/**
 * Gets the first image URL from an array of image paths
 * @param images - Array of image paths or undefined
 * @returns Full URL to the first image or placeholder
 */
export function getFirstImageUrl(images: string[] | undefined | null): string {
  if (!images || images.length === 0) {
    return PLACEHOLDER_IMAGE;
  }

  return getImageUrl(images[0]);
}

/**
 * Returns the primary image URL for a product that may include either
 * a single imageUrl (string) or an images array.
 */
export function getProductMainImage(product: { imageUrl?: string | null; images?: string[] | null } | undefined | null): string {
  if (!product) return PLACEHOLDER_IMAGE;
  if (product.imageUrl) return getImageUrl(product.imageUrl);
  return getFirstImageUrl(product.images || []);
}

/**
 * Converts an array of relative image paths to full URLs
 * @param images - Array of relative image paths
 * @returns Array of full URLs
 */
export function getImageUrls(images: string[] | undefined | null): string[] {
  if (!images || images.length === 0) {
    return [PLACEHOLDER_IMAGE];
  }

  return images.map(getImageUrl);
}
