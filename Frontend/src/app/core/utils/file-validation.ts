export interface FileValidationResult {
  valid: boolean;
  isValid?: boolean;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_PROFILE_PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_BOOK_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates a profile picture file (JPG, PNG, WEBP, max 5 MB).
 */
export function validateProfilePicture(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      isValid: false,
      error: 'Profile picture must not exceed 5 MB in size.',
    };
  }

  if (!ALLOWED_PROFILE_PICTURE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      isValid: false,
      error: 'Profile picture must be a JPG, PNG, or WEBP image.',
    };
  }

  return { valid: true, isValid: true };
}

/**
 * Validates a book cover image file (JPG, PNG, WEBP, max 5 MB).
 */
export function validateBookCover(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      isValid: false,
      error: 'Book cover image must not exceed 5 MB in size.',
    };
  }

  if (!ALLOWED_BOOK_COVER_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      isValid: false,
      error: 'Book cover image must be a JPG, PNG, or WEBP image.',
    };
  }

  return { valid: true, isValid: true };
}

export const validateProfilePictureFile = validateProfilePicture;
export const validateBookCoverFile = validateBookCover;

