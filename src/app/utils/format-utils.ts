import {environment} from '@env/environment';

/**
 * Format price with a currency symbol
 */
export function formatPrice(price: number, locale: string = 'de-DE', currency: string = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Format date
 */
export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  if (!name) return '';

  const names = name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  } else if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return '';
}


export function getImageVariationUrl(filePath: string | undefined, variation: string): string {
  if (!filePath) {
    return 'https://via.assets.so/img.jpg?w=270&h=160'; // Default fallback
  }

  return `${environment.apiBaseUrl}/media/cache/resolve/${variation}${filePath}`;
}
