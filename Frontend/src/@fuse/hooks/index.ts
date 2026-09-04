// ─── Hooks utilitários ───────────────────────────────────────────────────────
export { default as useDebounce } from './useDebounce';
export { default as useDebounceCallback } from './useDebounceCallback';
export { default as useDeepCompareEffect } from './useDeepCompareEffect';
export { useDeepCompareEffectNoCheck, useDeepCompareMemoize } from './useDeepCompareEffect';
export { default as useEventListener } from './useEventListener';
export { default as useForm } from './useForm';
export { useImageLoader } from './useImageLoader';
export { default as useNotification } from './useNotification';
export { default as usePrevious } from './usePrevious';
export { default as useMediaQuery } from './useThemeMediaQuery';
export { default as useTimeout } from './useTimeout';
export { default as useTimeOutMessage } from './useTimeOutMessage';
export { default as useUpdateEffect } from './useUpdateEffect';

// ─── Hooks de UI / responsividade ────────────────────────────────────────────
export { default as useDarkMode } from './useDarkMode';
export { default as useMenuActive } from './useMenuActive';
export { default as useRandomBgColor } from './useRandomBgColor';
export { default as useResponsive } from './useResponsive';

// ─── Utilitários de navegação / debounce (não são hooks, mas vivem aqui) ─────
export { default as convertNavigationToSearchQuery } from './convertNavigationToSearchQuery';
export { default as createDebouncedFunction } from './createDebouncedFunction';
