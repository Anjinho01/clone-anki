import type { UnknownAction, ThunkAction, ThunkDispatch, Reducer } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from 'app/store';

/** Thunk/Dispatch padrões (mantém) */
export type AppThunkType<ReturnType = void, Extra = unknown> = ThunkAction<
  ReturnType,
  RootState,
  Extra,
  UnknownAction
>;

export type AppDispatchType = AppDispatch;

export type AppThunkDispatchType<Extra = unknown> = ThunkDispatch<RootState, Extra, UnknownAction>;

export type AsyncReducersType = { [key: string]: Reducer };

/** Compat — aliases antigos */
export type BaseRootStateType = () => RootState;
export type RootStateType = RootState;

/** Alias que você quer usar em todo lugar */
export type AppRootStateType = RootState;
