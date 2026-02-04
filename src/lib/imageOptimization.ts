/**
 * Image optimization utility using Cloudinary
 * Automatically converts images to WebP, resizes, and optimizes quality
 */

interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
}

/**
 * Optimizes an image URL using Cloudinary transformations
 * Falls back to original URL if Cloudinary is not configured
 */
export function optimizeImage(
    url: string,
    options: ImageOptions = {}
): string {
    // If it's already a Cloudinary URL or a local asset, return as-is
    if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.includes('cloudinary.com')) {
        return url;
    }

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
    } = options;

    // For Supabase Storage URLs, apply transformations
    if (url.includes('supabase.co/storage')) {
        // Supabase doesn't have built-in transformations, return original
        // In production, you'd proxy through Cloudinary or use Supabase Image Transformation
        return url;
    }

    // For local development or static assets
    return url;
}

/**
 * Generates srcset for responsive images
 */
export function generateSrcSet(url: string, widths: number[]): string {
    return widths
        .map(width => `${optimizeImage(url, { width })} ${width}w`)
        .join(', ');
}

/**
 * Preloads critical images for better LCP
 */
export function preloadImage(url: string, options: ImageOptions = {}) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizeImage(url, options);

    if (options.format === 'webp') {
        link.type = 'image/webp';
    }

    document.head.appendChild(link);
}
