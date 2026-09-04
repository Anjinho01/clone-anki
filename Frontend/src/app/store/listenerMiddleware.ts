// src/app/store/listenerMiddleware.ts
//
// Instância única do RTK listenerMiddleware.
// Importado tanto pelo store/index.ts (para passar à configureStore)
// quanto pelos arquivos de listeners (para registrar efeitos).
//
// NÃO importa de 'app/store' — evita dependência circular.
//
import { createListenerMiddleware } from '@reduxjs/toolkit';

export const listenerMiddleware = createListenerMiddleware();
