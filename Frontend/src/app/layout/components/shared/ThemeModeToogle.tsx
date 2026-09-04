import classNames from '@fuse/ui/utils/classNames';
import withHeaderItem from '@fuse/core/withHeaderItem';
import { PiSunDuotone, PiMoonDuotone } from 'react-icons/pi';
/* Store */
import { useDispatch, useSelector } from 'react-redux';
import { selectFuseModeTheme, setMode } from 'app/store/fuse/themeSlice';

export function ThemeModeToogleBase({ className }: { className?: string }) {
  const dispatch = useDispatch();
  const mode = useSelector(selectFuseModeTheme);

  const handleMode = () => {
    const changedMode = mode === 'light' ? 'dark' : 'light';
    window.localStorage.setItem('mode', changedMode);
    dispatch(setMode(changedMode));
  };

  return (
    <button
      type="button"
      aria-label={mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
      className={classNames(className, 'text-2xl')}
      onClick={handleMode}
    >
      {mode === 'light' ? <PiSunDuotone /> : <PiMoonDuotone />}
    </button>
  );
}

const ThemeModeToogle = withHeaderItem(ThemeModeToogleBase);

export default ThemeModeToogle;
