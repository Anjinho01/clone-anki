import type { Reducer, ReducersMapObject } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import type { DeepPartial } from 'react-hook-form';
import type { SlicesType } from 'app/store/lazyWithSlices';

export const generateReducersFromSlices = (slices: SlicesType): ReducersMapObject => {
  const reducerGroups: DeepPartial<ReducersMapObject> = {};

  // Group reducers based on common key derived from slice name.
  slices?.forEach((slice) => {
    const [primary, secondary] = slice.name.split('/');
    if (secondary) {
      if (!reducerGroups[primary]) {
        reducerGroups[primary] = {};
      }
      (reducerGroups[primary] as ReducersMapObject)[secondary] = slice.reducer;
    } else {
      reducerGroups[primary] = slice.reducer;
    }
  });

  const combinedReducers: ReducersMapObject = {};

  // Combine the grouped reducers.
  Object.entries(reducerGroups).forEach(([key, reducerGroup]) => {
    if (typeof reducerGroup === 'function') {
      combinedReducers[key] = reducerGroup as Reducer;
    } else if (typeof reducerGroup === 'object') {
      combinedReducers[key] = combineReducers(reducerGroup as ReducersMapObject) as Reducer;
    }
  });

  return combinedReducers;
};

export default generateReducersFromSlices;
