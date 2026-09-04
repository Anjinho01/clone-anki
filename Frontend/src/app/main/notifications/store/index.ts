import { combineReducers } from '@reduxjs/toolkit';
import notifications from './notificationsSlice';

/**
 * The notifications App reducer.
 */
const reducer = combineReducers({
  notifications,
});

export default reducer;
