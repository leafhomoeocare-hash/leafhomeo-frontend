/**
 * Image URL Helper
 * Handles converting relative image paths to full URLs based on environment
 */

/**
 * Get full image URL with base URL
 * @param {string} imagePath - The image path (can be relative or absolute)
 * @returns {string|null} - Full URL or null if no image path
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get base URL from environment or use localhost for development
  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5174';
  
  // Ensure proper path formatting
  const formattedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${formattedPath}`;
};

/**
 * Get user initials from name
 * @param {string} name - User's full name
 * @param {string} fallback - Fallback initials if name is empty
 * @returns {string} - Two-letter initials
 */
export const getUserInitials = (name, fallback = 'PT') => {
  if (!name) return fallback;
  
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
};