import { useState, useEffect } from 'react';

interface ImageLoaderState {
  currentSrc: string;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Manages progressive image loading with a placeholder fallback.
 * @param src         - Final image URL to load
 * @param placeholder - URL (or data URL) shown while the image loads
 */
export function useImageLoader(src: string, placeholder: string): ImageLoaderState {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(placeholder);

    const img = new Image();

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholder]);

  return { currentSrc, isLoading, hasError };
}
