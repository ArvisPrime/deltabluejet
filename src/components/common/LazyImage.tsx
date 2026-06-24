/**
 * LazyImage — Deferred background-image loader
 *
 * Uses IntersectionObserver to only load the image when the element
 * scrolls into (or near) the viewport. Preserves the existing
 * bg-cover / bg-center / hover-zoom design patterns used site-wide.
 *
 * Usage:
 *   <LazyImage
 *     src="https://images.unsplash.com/photo-xxx?auto=format&fit=crop&q=75"
 *     unsplashWidth={800}
 *     className="w-full h-full bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110"
 *     role="img"
 *     aria-label="Destination photo"
 *   />
 */

import React, { useRef, useState, useEffect } from 'react';

interface LazyImageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The image URL to load as a CSS background-image. */
  src: string;
  /**
   * If provided and the src is an Unsplash URL, appends `&w=<value>`
   * for server-side resizing (significantly reduces download size).
   */
  unsplashWidth?: number;
  /**
   * If true, skips lazy loading and loads the image immediately.
   * Use for above-fold hero images where LCP matters.
   */
  eager?: boolean;
  /** Intersection rootMargin — how far before the viewport to start loading. Default: 200px */
  rootMargin?: string;
}

/**
 * Appends a width parameter to an Unsplash URL if one isn't already present.
 * Non-Unsplash URLs are returned unchanged.
 */
function withUnsplashWidth(src: string, width?: number): string {
  if (!width) return src;
  if (!src.includes('images.unsplash.com')) return src;
  // Don't add if `w=` is already in the URL
  if (/[?&]w=/.test(src)) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}w=${width}`;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  unsplashWidth,
  eager = false,
  rootMargin = '200px',
  style,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(eager);

  useEffect(() => {
    if (eager || isVisible) return;

    const el = ref.current;
    if (!el) return;

    // Fallback for browsers without IntersectionObserver (very rare)
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, isVisible, rootMargin]);

  const resolvedSrc = withUnsplashWidth(src, unsplashWidth);

  return (
    <div
      ref={ref}
      {...rest}
      style={{
        ...style,
        backgroundImage: isVisible ? `url('${resolvedSrc}')` : undefined,
      }}
    />
  );
};

export default LazyImage;
