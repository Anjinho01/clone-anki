import type { ReducersMapObject } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import fuse from './fuse';
import user from './user';
import notifications from './notifications';

/**
 * Creates a reducer function that combines the provided reducers with the async reducers.
 */
const createReducer = (asyncReducers: ReducersMapObject) =>
  combineReducers({
    fuse,
    user,
    notifications,
    ...asyncReducers,
  } as ReducersMapObject);

export default createReducer;
