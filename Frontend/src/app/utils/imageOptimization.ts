// TODO: move to process.env.REACT_APP_USER_IMAGES_BASE_URL
const USER_IMAGES_BASE_URL = 'https://ra.ade90.xyz/uploads/alunos';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface OptimizedImage {
  url: string;
  placeholder: string;
  srcSet: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Builds the base image URL for a user/student. */
function buildImageUrl(id: string | number): string {
  return `${USER_IMAGES_BASE_URL}/${id}.jpeg?cache=0`;
}

/** Lightens a hex colour by `percent` (0–100). */
function lighten(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, ((num >> 16) & 0xff) + amt);
  const G = Math.min(255, ((num >> 8) & 0xff) + amt);
  const B = Math.min(255, (num & 0xff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns optimised image URLs for a user.
 * `options` is reserved for future CDN/resize integration.
 */
export function getOptimizedUserImage(
  userId: string | number,
  _options?: ImageOptimizationOptions
): OptimizedImage {
  const url = buildImageUrl(userId);
  // placeholder and srcSet will be populated once the CDN supports resizing
  return { url, placeholder: url, srcSet: url };
}

/**
 * Returns a srcSet string for a user image.
 * `options` is reserved for future CDN/resize integration.
 */
export function generateSrcSet(
  userId: string | number,
  _options?: ImageOptimizationOptions
): string {
  // Will build a proper "url 1x, url 2x" string once the CDN supports resizing
  return buildImageUrl(userId);
}

/** Returns the direct image URL for a user/student. */
export function getStudentImageUrl(studentId: string | number): string {
  return buildImageUrl(studentId);
}

/**
 * Generates an inline SVG blur placeholder as a Base64 data URL.
 * @param width  - Image width in px (default 400)
 * @param height - Image height in px (default 300)
 * @param color  - Background hex colour (default #e5e7eb)
 */
export function getBlurPlaceholder(width = 400, height = 300, color = '#e5e7eb'): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${lighten(color, 20)};stop-opacity:0.6" />
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" filter="url(#blur)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
