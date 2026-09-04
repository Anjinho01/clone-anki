import type { Reducer, Middleware, ReducersMapObject } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { createLogger } from 'redux-logger';
import createReducer from './rootReducer';
import { listenerMiddleware } from './listenerMiddleware';
// Side-effect import: registra os listeners reativos (deck nav, etc.)
import './listeners/deckNavListener';

const middlewares: Middleware[] = [];
if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({
    collapsed: (_getState, _action, logEntry) => (logEntry ? !logEntry.error : true),
  });
  middlewares.push(logger);
}

const store = configureStore({
  reducer: createReducer({}), // <- passa os asyncReducers (vazio no boot)
  middleware: (getDefault) =>
    getDefault({ immutableCheck: false, serializableCheck: false })
      .prepend(listenerMiddleware.middleware)
      .concat(middlewares),
  devTools: process.env.NODE_ENV === 'development',
});

// Tipos oficiais do store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Mapa de reducers dinâmicos + utilitários
type AsyncReducersMap = Record<string, Reducer>;
const asyncReducers: AsyncReducersMap = {};

export const injectReducer = (key: string, reducer: Reducer) => {
  if (asyncReducers[key]) return store; // já injetado
  asyncReducers[key] = reducer;
  store.replaceReducer(createReducer(asyncReducers));
  return store;
};

export const injectReducers = (reducers: ReducersMapObject) => {
  Object.assign(asyncReducers, reducers);
  store.replaceReducer(createReducer(asyncReducers));
  return store;
};

export default store;

// Hooks tipados com o RootState real
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
