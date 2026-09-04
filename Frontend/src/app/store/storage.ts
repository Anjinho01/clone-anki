import type { RootState } from './index';

export const loadState = (): Partial<RootState> | undefined => {
  try {
    const serializedState = localStorage.getItem('idb_fichamedica_teacher');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState).app;
  } catch {
    return undefined;
  }
};

export const saveState = (state: Partial<RootState>): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('idb_fichamedica_teacher', serializedState);
  } catch {
    // ignore
  }
};
