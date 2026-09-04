import { combineReducers } from '@reduxjs/toolkit';
import decks from './decksSlice';
import detail from './deckDetailSlice';
import deck from './deckSlice';
import card from './cardSlice';
import study from './studySlice';
import packages from './packageSlice';
import libraryCards from './libraryCardSlice';

const reducer = combineReducers({
  decks,
  detail,
  deck,
  card,
  study,
  packages,
  libraryCards,
});

export default reducer;
