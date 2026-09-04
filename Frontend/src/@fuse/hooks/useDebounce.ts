// ⚡ Otimização: Import direto do lodash reduz bundle em ~30 KB
import debounce from 'lodash/debounce';
import { useRef } from 'react';
import type { DebounceSettings } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait?: number,
  options?: DebounceSettings
): ReturnType<typeof debounce<T>> {
  return useRef(debounce(func, wait, options)).current;
}

export default useDebounce;
