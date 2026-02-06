/**
 * Application-wide configuration constants
 * These values are used throughout the frontend application
 */
export const S3_HOST = "https://cdn.mahd.cloud/mahd/pub-sawi"

// CDN / S3 Configuration
// Images are served through our API proxy to avoid S3 AccessDenied issues
export const IMAGE_BASE_URL = "/api/images";

/**
 * Constructs a full image URL for a given image path
 * Uses the API proxy route which fetches from S3 with credentials
 * @param path - The image path/filename (can be nested like "folder/image.jpg")
 * @returns Full image URL
 */
export function getCdnUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // If already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${IMAGE_BASE_URL}/${cleanPath}`;
}

/**
 * Helper to get the CDN URL for use in img src attributes
 * Returns a placeholder string if no path is provided
 */
export function getImgSrc(path: string | null | undefined): string {
  return getCdnUrl(path) || "/placeholder-image.png";
}
