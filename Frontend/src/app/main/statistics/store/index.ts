import { combineReducers } from '@reduxjs/toolkit';
import statistics from './statisticsSlice';

const reducer = combineReducers({
  statistics,
});

export default reducer;
