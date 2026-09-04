import { useState } from 'react';
import { PiWarningDuotone } from 'react-icons/pi';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import { useAppDispatch, useAppSelector } from 'app/store';
import { deleteLibraryCard, selectLibraryCardActionStatus } from '../store/libraryCardSlice';
import type { FlashcardType } from '../types/LibraryCardTypes';

function DeleteLibraryCardDialog({
  card,
  onClose,
}: {
  card: FlashcardType | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const actionStatus = useAppSelector(selectLibraryCardActionStatus);
  const [deleting, setDeleting] = useState(false);

  async function onConfirm() {
    if (!card) {
      return;
    }

    setDeleting(true);

    try {
      await dispatch(deleteLibraryCard(card.id)).unwrap();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog isOpen={card !== null} onClose={onClose} width={460} title="Excluir card">
      <div className="flex flex-col gap-5 p-2">
        <div className="flex items-start gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm dark:bg-slate-900">
            <PiWarningDuotone className="text-2xl" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              O modelo abaixo sera removido da biblioteca e nao podera ser recuperado.
            </p>
            {card && (
              <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                {card.front}
              </div>
            )}
          </div>
        </div>

        <DialogActions>
          <Button type="button" variant="plain" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="solid"
            className="bg-red-500 hover:bg-red-600"
            loading={deleting || actionStatus === 'loading'}
            onClick={onConfirm}
          >
            Excluir
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}

export default DeleteLibraryCardDialog;
