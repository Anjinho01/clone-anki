import type { DeckType } from '../types/DeckTypes';

export type DeckOverviewModel = {
  allDecks: DeckType[];
  totalCards: number;
  readyDecks: number;
};

export function buildDeckOverviewModel(
  generalDecks: DeckType[],
  privateDecks: DeckType[]
): DeckOverviewModel {
  const allDecks = [...generalDecks, ...privateDecks];
  const totalCards = allDecks.reduce((total, deck) => total + (deck.cardCount?.total ?? 0), 0);
  const readyDecks = allDecks.filter(
    (deck) => (deck.cardCount?.due ?? 0) + (deck.cardCount?.new ?? 0) > 0
  ).length;

  return {
    allDecks,
    totalCards,
    readyDecks,
  };
}
