import { useEffect, useRef } from 'react';
import type { EffectCallback, DependencyList } from 'react';

const useUpdateEffect = (effect: EffectCallback, deps?: DependencyList): void => {
  const isInitialMount = useRef(true);
  // eslint-disable-next-line
	useEffect(
    isInitialMount.current
      ? () => {
          isInitialMount.current = false;
        }
      : effect,
    deps
  );
};

export default useUpdateEffect;
