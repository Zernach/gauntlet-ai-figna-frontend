/**
 * Image Proxy Utilities
 * Handles proxying of external images (like DALL-E) through the backend to avoid CORS issues
 */

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DALLE_BLOB_URL_PREFIX = 'https://oaidalleapiprodscus.blob.core.windows.net/';

/**
 * Convert a DALL-E image URL to a proxied URL through the backend
 * This solves CORS issues when loading images into canvas
 * 
 * @param imageUrl - The original image URL (may be from DALL-E or other source)
 * @returns The proxied URL if it's a DALL-E image, otherwise the original URL
 */
export function getProxiedImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
        return '';
    }

    // Check if this is a DALL-E image that needs proxying
    if (imageUrl.startsWith(DALLE_BLOB_URL_PREFIX)) {
        // Encode the URL and return the proxy endpoint
        const encodedUrl = encodeURIComponent(imageUrl);
        return `${BACKEND_URL}/voice/proxy-image?url=${encodedUrl}`;
    }

    // For other images, return as-is
    return imageUrl;
}

/**
 * Check if an image URL is from DALL-E and needs proxying
 * 
 * @param imageUrl - The image URL to check
 * @returns true if the URL is from DALL-E
 */
export function isDalleImageUrl(imageUrl: string | undefined): boolean {
    if (!imageUrl) {
        return false;
    }
    return imageUrl.startsWith(DALLE_BLOB_URL_PREFIX);
}

