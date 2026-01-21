/**
 * Utility functions and constants for balance code management
 */

/**
 * Standard length for transfer balance codes
 */
export const BALANCE_CODE_LENGTH = 26;

/**
 * Data size constants in bytes
 */
export const DATA_UNITS = {
  GIB: 1073741824,
  TIB: 1099511627776,
} as const;

/**
 * Masks a secret string by showing only first and last 3 characters
 * @param secret - The secret string to mask
 * @param minVisibleLength - Minimum length before masking is applied (default: 7)
 * @returns Masked string or original if too short
 */
export const maskSecret = (secret: string, minVisibleLength = 7): string => {
  if (!secret || secret.length < minVisibleLength) {
    return secret || '';
  }
  return `${secret.slice(0, 3)}...${secret.slice(-3)}`;
};

/**
 * Formats a date string into a localized string
 * @param dateString - ISO 8601 date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleString(undefined, options);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Formats byte count into human-readable data size
 * @param bytes - Number of bytes
 * @returns Formatted string with appropriate unit (GiB or TiB)
 */
export const formatDataBalance = (bytes: number): string => {
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    return '-';
  }

  if (bytes < 0) {
    return '0 GiB';
  }

  const { GIB, TIB } = DATA_UNITS;

  if (bytes < TIB) {
    const gib = bytes / GIB;
    return `${gib.toFixed(2)} GiB`;
  } else {
    const tib = bytes / TIB;
    return `${tib.toFixed(2)} TiB`;
  }
};

/**
 * Validates a balance code format
 * @param code - The balance code to validate
 * @returns true if code is valid format
 */
export const isValidBalanceCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const trimmedCode = code.trim();

  // Check length
  if (trimmedCode.length !== BALANCE_CODE_LENGTH) {
    return false;
  }

  // Check if alphanumeric (you can adjust this regex based on actual format)
  const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(trimmedCode);

  return isAlphanumeric;
};
