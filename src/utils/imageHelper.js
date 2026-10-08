/**
 * Image URL Helper
 * Relative aur purane localhost wale image paths ko sahi full URL mein badalta hai
 */

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

/**
 * Image ka full URL banata hai
 * @param {string} imagePath - Image path (relative, absolute ya purana localhost URL)
 * @returns {string|null} - Full URL, ya image path na ho to null
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Purana localhost URL hata do -> "/uploads/xxx.jpg" bachega
  const cleaned = imagePath.replace(
    /^https?:\/\/(localhost|127\.0\.0\.1):\d+/,
    ''
  );

  // Koi aur full URL (cloudinary, s3 etc.) ho to waise hi return karo
  if (/^https?:\/\//.test(cleaned)) return cleaned;

  // Aage "/" ho ya na ho, hamesha ek hi "/" lagao
  return `${API_URL}/${cleaned.replace(/^\/+/, '')}`;
};

/**
 * Name se initials nikalta hai
 * @param {string} name - User ka poora naam
 * @param {string} fallback - Naam khaali ho to ye initials
 * @returns {string} - Do letter ke initials
 */
export const getUserInitials = (name, fallback = 'PT') => {
  if (!name) return fallback;

  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};