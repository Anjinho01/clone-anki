import { useEffect, useRef } from 'react';

export default function useDidUpdate(
  callback: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencies?: any[]
) {
  const mounted = useRef(false);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  useEffect(() => {
    if (mounted.current) {
      return callback();
    }

    mounted.current = true;
    return undefined;
    // deps are intentionally dynamic — passed from the caller
  }, dependencies);
}
