import { combineReducers } from '@reduxjs/toolkit';
import navigation from './navigationSlice';
import settings from './settingsSlice';
import theme from './themeSlice';
import navbar from './navbarSlice';

/**
 * The Fuse reducer.
 */

const reducer = combineReducers({
  navigation,
  settings,
  theme,
  navbar,
});

export default reducer;
