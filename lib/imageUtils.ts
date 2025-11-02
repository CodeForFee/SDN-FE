/**
 * Get proper image URL for display
 * Handles relative paths from backend and absolute URLs
 */
export function getImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;

  // If already absolute URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If starts with /, use as-is for Next.js Image
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // Otherwise, construct URL from backend API base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  // Remove /api suffix if present
  const baseUrl = apiBaseUrl.replace(/\/api$/, '');
  return `${baseUrl}/uploads/${imagePath}`;
}

/**
 * Check if image URL is absolute (can use regular img tag)
 */
export function isAbsoluteImageUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

