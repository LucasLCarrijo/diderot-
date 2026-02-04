import { ImgHTMLAttributes } from 'react';
import { optimizeImage } from '@/lib/imageOptimization';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    quality?: number;
}

/**
 * Optimized Image component with automatic WebP conversion and lazy loading
 * Use priority={true} for LCP images (hero, above-the-fold)
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    priority = false,
    quality,
    loading,
    className,
    ...props
}: OptimizedImageProps) {
    const optimizedSrc = optimizeImage(src, { width, height, quality });

    return (
        <img
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? undefined : (loading || 'lazy')}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : undefined}
            className={className}
            {...props}
        />
    );
}
