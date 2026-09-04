import { combineReducers } from '@reduxjs/toolkit';
import profile from './profileSlice';

/**
 * The Profile App reducer.
 */
const reducer = combineReducers({
  profile,
});

export default reducer;
