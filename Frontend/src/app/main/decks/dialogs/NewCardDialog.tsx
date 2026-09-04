// src/app/main/apps/decks/dialogs/NewCardDialog.tsx
// Allows admins to add a reusable card from the library to a deck
import { useEffect, useState } from 'react';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import Button from '@fuse/ui/Button';
import Input from '@fuse/ui/Input';
import { PiMagnifyingGlassDuotone } from 'react-icons/pi';
import { useAppDispatch, useAppSelector } from 'app/store';
import { selectNewCardDialog, closeNewCardDialog } from '../store/cardSlice';
import {
  addLibraryCardToDeck,
  getLibraryCards,
  selectAllLibraryCards,
  selectLibraryCardActionStatus,
  selectLibraryCardsStatus,
} from '../store/libraryCardSlice';
import type { FlashcardType } from '../types/DeckTypes';
import { getDeckCards } from '../store/deckDetailSlice';

const CARD_TYPE_LABELS: Record<string, string> = {
  basic: 'Básico',
  reversed: 'Reverso',
  cloze: 'Lacuna',
  mcq: 'Múltipla Escolha',
};

export default function NewCardDialog() {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector(selectNewCardDialog);
  const flashcards = useAppSelector(selectAllLibraryCards);
  const flashcardsStatus = useAppSelector(selectLibraryCardsStatus);
  const actionStatus = useAppSelector(selectLibraryCardActionStatus);

  const isOpen = dialog?.props.isOpen ?? false;
  const deckId = dialog?.data.deckId;

  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen && flashcardsStatus === 'idle') {
      dispatch(getLibraryCards());
    }
  }, [isOpen, flashcardsStatus, dispatch]);

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  function onClose() {
    dispatch(closeNewCardDialog());
  }

  async function handleAdd(flashcard: FlashcardType) {
    if (!deckId) return;
    setAdding(true);
    try {
      await dispatch(addLibraryCardToDeck({ cardId: flashcard.id, deckId })).unwrap();
      if (deckId) dispatch(getDeckCards({ deckId }));
      onClose();
    } finally {
      setAdding(false);
    }
  }

  const filtered = flashcards.filter(
    (f) =>
      f.uuid.toLowerCase().includes(query.toLowerCase()) ||
      f.front.toLowerCase().includes(query.toLowerCase()) ||
      f.back.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} width={600} title="Adicionar card ao deck">
      <div className="flex flex-col gap-4 p-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Escolha um card reutilizavel da biblioteca para associar a este deck.
        </p>

        {/* Search */}
        <div className="relative">
          <PiMagnifyingGlassDuotone className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Buscar cards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* List */}
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {flashcardsStatus === 'loading' && (
            <div className="flex h-24 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
            </div>
          )}
          {flashcardsStatus === 'succeeded' && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">Nenhum card encontrado.</p>
          )}
          {filtered.map((f) => (
            <div
              key={f.uuid}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30">
                    {CARD_TYPE_LABELS[f.cardType] ?? f.cardType}
                  </span>
                </div>
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {f.front}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{f.back}</p>
              </div>
              <Button
                size="sm"
                variant="solid"
                loading={adding || actionStatus === 'loading'}
                onClick={() => handleAdd(f)}
              >
                Adicionar
              </Button>
            </div>
          ))}
        </div>

        <DialogActions>
          <Button type="button" variant="plain" onClick={onClose}>
            Fechar
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}
