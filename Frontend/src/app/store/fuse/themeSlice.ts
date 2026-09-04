import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
/* Types */
import type { Mode } from '@fuse/@types/theme';
import type { AppRootStateType } from 'app/store/types';

const MODE_LIGHT = 'light';
const MODE_DARK = 'dark';

// function getInitialMode(): Mode {
//   if (typeof window !== 'undefined') {
//     const saved = window.localStorage.getItem('mode');
//     if (saved === MODE_LIGHT || saved === MODE_DARK) {
//       return saved as Mode;
//     }
//     // Sem saved: usa a preferência do sistema
//     if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
//       return MODE_DARK;
//     }
//   }
//   // Fallback genérico (do seu themeConfig, por exemplo)
//   return MODE_LIGHT;
// }

function getInitialMode(): Mode {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('mode');
    if (saved === MODE_LIGHT || saved === MODE_DARK) {
      return saved as Mode;
    }
  }
  // Padrão SEMPRE light (sem olhar prefers-color-scheme)
  return MODE_LIGHT;
}

interface ThemeState {
  mode: Mode;
}

const initialState: ThemeState = {
  mode: getInitialMode(),
};

const themeSlice = createSlice({
  name: 'fuse/theme',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<Mode>) => {
      state.mode = action.payload;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('mode', action.payload);
      }
    },
  },
});

export const { setMode } = themeSlice.actions;
export type themeSliceType = typeof themeSlice;
export const selectFuseModeTheme = (state: AppRootStateType) =>
  state?.fuse?.theme?.mode ?? MODE_LIGHT;
export default themeSlice.reducer;
