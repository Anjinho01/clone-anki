import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiArrowRightBold,
  PiCardsDuotone,
  PiClockCountdownDuotone,
  PiGlobeDuotone,
  PiLockDuotone,
  PiPencilSimpleDuotone,
  PiPlusBold,
  PiStackDuotone,
  PiTrashDuotone,
  PiWarningDuotone,
} from 'react-icons/pi';
import { canManageStudyContent } from 'app/auth';
import { useAppDispatch, useAppSelector } from 'app/store';
import {
  getDecks,
  selectDecksStatus,
  selectGeneralDecks,
  selectPrivateDecks,
} from './store/decksSlice';
import {
  closeDeleteDeck,
  deleteDeck,
  openDeleteDeck,
  openEditDeckDialog,
  openNewDeckDialog,
  selectDeckActionStatus,
  selectDeleteDeckId,
} from './store/deckSlice';
import type { DeckType } from './types/DeckTypes';
import NewDeckDialog from './dialogs/NewDeckDialog';
import EditDeckDialog from './dialogs/EditDeckDialog';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  count,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {count} {count === 1 ? 'deck' : 'decks'}
      </span>
    </div>
  );
}

function DeckRow({ deck, canEdit }: { deck: DeckType; canEdit: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dueToday = deck.cardCount?.due ?? 0;

  return (
    <tr className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50">
      <td className="py-4 pr-3 pl-5">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg ${
              deck.type === 'general'
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
            }`}
          >
            {deck.type === 'general' ? <PiGlobeDuotone /> : <PiLockDuotone />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {deck.name}
              </p>
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase dark:border-slate-700 dark:text-slate-500">
                {deck.type === 'general' ? 'Geral' : 'Privado'}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
              {deck.description || 'Deck pronto para edicao, estudo e acompanhamento continuo.'}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-4 text-center md:table-cell">
        <span className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <PiCardsDuotone />
          {deck.cardCount?.total ?? 0}
        </span>
      </td>
      <td className="hidden px-4 py-4 text-center lg:table-cell">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          {deck.newCardsPerDay} / {deck.reviewCardsPerDay}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">novos / revisoes</div>
      </td>
      <td className="hidden px-4 py-4 text-center xl:table-cell">
        <span
          className={`inline-flex items-center gap-1 rounded-2xl px-3 py-1.5 text-xs font-semibold ${
            dueToday > 0
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <PiClockCountdownDuotone />
          {dueToday > 0 ? `${dueToday} hoje` : 'sem fila'}
        </span>
      </td>
      <td className="py-4 pr-4 pl-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/decks/${deck.uuid}`)}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/20 dark:hover:text-sky-300"
            title="Abrir deck"
          >
            <PiArrowRightBold className="text-base" />
          </button>
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => dispatch(openEditDeckDialog(deck))}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-300"
                title="Editar deck"
              >
                <PiPencilSimpleDuotone className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => dispatch(openDeleteDeck(deck.id))}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                title="Excluir deck"
              >
                <PiTrashDuotone className="text-base" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function DeckTable({
  decks,
  canEdit,
}: {
  decks: DeckType[];
  canEdit: (deck: DeckType) => boolean;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className="py-4 pr-3 pl-5 text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
              Deck
            </th>
            <th className="hidden px-4 py-4 text-center text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase md:table-cell">
              Cards
            </th>
            <th className="hidden px-4 py-4 text-center text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase lg:table-cell">
              Ritmo diario
            </th>
            <th className="hidden px-4 py-4 text-center text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase xl:table-cell">
              Hoje
            </th>
            <th className="py-4 pr-4 pl-3" />
          </tr>
        </thead>
        <tbody>
          {decks.map((deck) => (
            <DeckRow key={deck.uuid} deck={deck} canEdit={canEdit(deck)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeleteDeckDialog() {
  const dispatch = useAppDispatch();
  const deleteDeckId = useAppSelector(selectDeleteDeckId);
  const status = useAppSelector(selectDeckActionStatus);
  const generalDecks = useAppSelector(selectGeneralDecks);
  const privateDecks = useAppSelector(selectPrivateDecks);
  const [deleting, setDeleting] = useState(false);

  const deck = [...generalDecks, ...privateDecks].find((item) => item.id === deleteDeckId);

  async function onConfirm() {
    if (!deleteDeckId) {
      return;
    }

    setDeleting(true);

    try {
      await dispatch(deleteDeck(deleteDeckId)).unwrap();
      dispatch(closeDeleteDeck());
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog isOpen={Boolean(deleteDeckId)} onClose={() => dispatch(closeDeleteDeck())} width={480}>
      <div className="rounded-[28px] bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-start gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm dark:bg-slate-900">
            <PiWarningDuotone className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Excluir deck</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              O deck <strong>{deck?.name}</strong> sera removido junto com toda a sua estrutura.
            </p>
            <p className="mt-2 text-xs font-medium tracking-[0.2em] text-red-500 uppercase">
              Esta acao nao pode ser desfeita
            </p>
          </div>
        </div>

        <DialogActions>
          <Button
            type="button"
            variant="plain"
            onClick={() => dispatch(closeDeleteDeck())}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="solid"
            className="bg-red-500 hover:bg-red-600"
            loading={deleting || status === 'loading'}
            onClick={onConfirm}
          >
            Excluir deck
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}

export default function DecksManageApp() {
  const dispatch = useAppDispatch();
  const generalDecks = useAppSelector(selectGeneralDecks);
  const privateDecks = useAppSelector(selectPrivateDecks);
  const status = useAppSelector(selectDecksStatus);
  const canManage = useAppSelector((state) => canManageStudyContent(state.user.role));
  const currentUserId = useAppSelector((state) => state.user.userId);

  useEffect(() => {
    const promise = dispatch(getDecks());
    return () => promise.abort();
  }, [dispatch]);

  const totalDecks = generalDecks.length + privateDecks.length;
  const totalCards = [...generalDecks, ...privateDecks].reduce(
    (total, deck) => total + (deck.cardCount?.total ?? 0),
    0
  );
  const dueToday = [...generalDecks, ...privateDecks].reduce(
    (total, deck) => total + (deck.cardCount?.due ?? 0),
    0
  );

  function canEditGeneralDeck(_deck: DeckType): boolean {
    return canManage;
  }

  function canEditPrivateDeck(deck: DeckType): boolean {
    return deck.ownerUserId === currentUserId;
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-8 md:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_26%),linear-gradient(135deg,_#0f172a,_#111827)]">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="relative flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-300">
              Gestao de decks
            </p>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
              Controle os decks com mais clareza.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Acompanhe volume, ritmo diario e revisoes em um fluxo administrativo direto.
            </p>
            <button
              type="button"
              onClick={() => dispatch(openNewDeckDialog())}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <PiPlusBold />
              Novo deck
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile
              icon={<PiStackDuotone className="text-xl" />}
              label="Decks no total"
              value={totalDecks}
            />
            <SummaryTile
              icon={<PiCardsDuotone className="text-xl" />}
              label="Cards distribuidos"
              value={totalCards}
            />
            <SummaryTile
              icon={<PiClockCountdownDuotone className="text-xl" />}
              label="Revisoes para hoje"
              value={dueToday}
            />
          </div>
        </div>
      </section>

      {status === 'loading' && (
        <section className="grid gap-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-[28px] bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </section>
      )}

      {status === 'succeeded' && totalDecks === 0 && (
        <section className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiStackDuotone className="text-4xl" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Nenhum deck criado
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Comece pela estrutura principal do projeto criando o primeiro deck e definindo o ritmo
            diario de novos cards e revisoes.
          </p>
          <button
            type="button"
            onClick={() => dispatch(openNewDeckDialog())}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
          >
            <PiPlusBold />
            Criar primeiro deck
          </button>
        </section>
      )}

      {status === 'succeeded' && generalDecks.length > 0 && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader
            icon={<PiGlobeDuotone className="text-xl" />}
            title="Decks gerais"
            description="Colecao compartilhada entre usuarios com edicao administrativa."
            count={generalDecks.length}
          />
          <DeckTable decks={generalDecks} canEdit={canEditGeneralDeck} />
        </section>
      )}

      {status === 'succeeded' && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader
            icon={<PiLockDuotone className="text-xl" />}
            title="Decks privados"
            description="Espaco pessoal para colecoes, materias e organizacao do proprio estudo."
            count={privateDecks.length}
          />
          {privateDecks.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-950/20">
              <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                Ainda nao ha decks privados. Use o botao de criacao para iniciar sua propria
                estrutura de estudo.
              </p>
            </div>
          ) : (
            <DeckTable decks={privateDecks} canEdit={canEditPrivateDeck} />
          )}
        </section>
      )}

      {canManage && <NewDeckDialog />}
      {canManage && <EditDeckDialog />}
      {canManage && <DeleteDeckDialog />}
    </div>
  );
}
