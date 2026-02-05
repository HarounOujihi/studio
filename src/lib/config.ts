/**
 * Application-wide configuration constants
 * These values are used throughout the frontend application
 */

// CDN / S3 Configuration
export const CDN_BASE_URL = "https://cdn.mahd.cloud/mahd/pub-sawi";

/**
 * Constructs a full CDN URL for a given image path
 * @param path - The image path/filename (can be nested like "folder/image.jpg")
 * @returns Full CDN URL
 */
export function getCdnUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // If already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${CDN_BASE_URL}/${cleanPath}`;
}

/**
 * Helper to get the CDN URL for use in img src attributes
 * Returns a placeholder string if no path is provided
 */
export function getImgSrc(path: string | null | undefined): string {
  return getCdnUrl(path) || "/placeholder-image.png";
}
