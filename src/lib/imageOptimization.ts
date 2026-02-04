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
        quality = 80,
    } = options;

    // For Supabase Storage URLs, apply image transformations
    // https://supabase.com/docs/guides/storage/serving/image-transformations
    if (url.includes('supabase.co/storage')) {
        // If already has transformParams, skip
        if (url.includes('/render/image')) {
            return url;
        }

        // Convert public URL to transformation URL
        // Format: /storage/v1/object/public/[bucket]/[path]
        // To: /storage/v1/render/image/public/[bucket]/[path]?width=X&height=Y&quality=Q
        const transformUrl = url.replace(
            '/storage/v1/object/',
            '/storage/v1/render/image/'
        );

        const params = new URLSearchParams();
        if (width) params.set('width', String(width));
        if (height) params.set('height', String(height));
        params.set('quality', String(quality));
        params.set('format', 'origin'); // Maintain original format or use 'webp' if supported

        const separator = transformUrl.includes('?') ? '&' : '?';
        return `${transformUrl.split('?')[0]}${separator}${params.toString()}`;
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
