import { combineReducers } from '@reduxjs/toolkit';
import roles from './rolesSlice';
import users from './usersSlice';
import user from './userSlice';

/**
 * The Academy App reducer.
 */
const reducer = combineReducers({
  roles,
  users,
  user,
});

export default reducer;
