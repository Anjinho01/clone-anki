// src/app/store/listeners/deckNavListener.ts
//
// Registra os efeitos reativos para sincronização dos decks na sidebar.
//
// Padrão: RTK listenerMiddleware (substitui redux-saga/observable sem boilerplate).
//
// Efeitos registrados:
//   setUser.fulfilled  → sincroniza decks no menu (login ou auto-login)
//   userLoggedOut      → limpa decks do menu (logout)
//
// Ao importar este arquivo como side-effect em store/index.ts, os listeners
// ficam ativos para todo o ciclo de vida da aplicação.
//
// IMPORTANTE: este arquivo NÃO importa de 'app/store' — evita dependência
// circular. O dispatch do listenerApi aceita thunks em runtime.
//
import { listenerMiddleware } from '../listenerMiddleware';
import { setUser, userLoggedOut } from '../user/userSlice';
import { syncDecksNavigation, clearDecksFromNav } from '../fuse/addDecksToNav';
import { createPackage, deletePackage, updatePackage } from 'app/main/decks/store/packageSlice';
import type { AppThunkType } from '../types';

type ThunkDispatch = (thunk: AppThunkType) => void;

listenerMiddleware.startListening({
  actionCreator: setUser.fulfilled,
  effect: async (_action, listenerApi) => {
    await (listenerApi.dispatch as unknown as ThunkDispatch)(syncDecksNavigation());
  },
});

listenerMiddleware.startListening({
  actionCreator: userLoggedOut,
  effect: async (_action, listenerApi) => {
    await (listenerApi.dispatch as unknown as ThunkDispatch)(clearDecksFromNav());
  },
});

listenerMiddleware.startListening({
  actionCreator: createPackage.fulfilled,
  effect: async (_action, listenerApi) => {
    await (listenerApi.dispatch as unknown as ThunkDispatch)(syncDecksNavigation());
  },
});

listenerMiddleware.startListening({
  actionCreator: updatePackage.fulfilled,
  effect: async (_action, listenerApi) => {
    await (listenerApi.dispatch as unknown as ThunkDispatch)(syncDecksNavigation());
  },
});

listenerMiddleware.startListening({
  actionCreator: deletePackage.fulfilled,
  effect: async (_action, listenerApi) => {
    await (listenerApi.dispatch as unknown as ThunkDispatch)(syncDecksNavigation());
  },
});
