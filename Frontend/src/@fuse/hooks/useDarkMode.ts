import { useLayoutEffect } from 'react';
import type { Mode } from '@fuse/@types/theme';
import { useDispatch, useSelector } from 'react-redux';
import { selectFuseModeTheme, setMode } from 'app/store/fuse/themeSlice';

const MODE_LIGHT = 'light';
const MODE_DARK = 'dark';

function useDarkMode(): [boolean, (mode: Mode) => void] {
  const dispatch = useDispatch();
  const mode = useSelector(selectFuseModeTheme);
  const isDark = mode === MODE_DARK;

  // Aplica a classe no <html> ANTES do paint
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove(MODE_LIGHT, MODE_DARK);
    root.classList.add(isDark ? MODE_DARK : MODE_LIGHT);
  }, [isDark]);

  const onModeChange = (newMode: Mode) => {
    const root = document.documentElement;
    root.classList.remove(MODE_LIGHT, MODE_DARK);
    root.classList.add(newMode);
    dispatch(setMode(newMode));
  };

  return [isDark, onModeChange];
}

export default useDarkMode;
