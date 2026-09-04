import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PiBookOpenDuotone,
  PiCardsDuotone,
  PiMagnifyingGlassDuotone,
  PiPlusBold,
  PiSparkleDuotone,
  PiStackDuotone,
} from 'react-icons/pi';
import { canCreatePrivateStudyContent, canManageStudyContent } from 'app/auth';
import Input from '@fuse/ui/Input';
import { useAppDispatch, useAppSelector } from 'app/store';
import LibraryCardItem from './components/LibraryCardItem';
import SummaryTile from './components/SummaryTile';
import DeleteLibraryCardDialog from './dialogs/DeleteLibraryCardDialog';
import LibraryCardFormDialog from './dialogs/LibraryCardFormDialog';
import {
  getLibraryCards,
  selectAllLibraryCards,
  selectLibraryCardsLimits,
  selectLibraryCardsPagination,
  selectLibraryCardsSearchText,
  selectLibraryCardsStatus,
  selectLoadingLibraryCards,
  setLibraryCardsSearchText,
  setLoadingLibraryCards,
} from './store/libraryCardSlice';
import type { FlashcardType } from './types/LibraryCardTypes';

export default function LibraryCardsApp() {
  const dispatch = useAppDispatch();
  const canManage = useAppSelector((state) => canManageStudyContent(state.user.role));
  const canCreatePrivateCard = useAppSelector((state) =>
    canCreatePrivateStudyContent(state.user.role)
  );
  const currentUserId = useAppSelector((state) => state.user.userId);
  const cards = useAppSelector((state) => selectAllLibraryCards(state as never));
  const status = useAppSelector((state) => selectLibraryCardsStatus(state as never));
  const loading = useAppSelector((state) => selectLoadingLibraryCards(state as never));
  const searchText = useAppSelector((state) => selectLibraryCardsSearchText(state as never));
  const limits = useAppSelector((state) => selectLibraryCardsLimits(state as never));
  const { page, limit, totalPages, totalRecords } = useAppSelector((state) =>
    selectLibraryCardsPagination(state as never)
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FlashcardType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlashcardType | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(
    (pageToFetch: number) => {
      loadingRef.current = true;
      dispatch(setLoadingLibraryCards(true));
      dispatch(getLibraryCards({ page: pageToFetch, limit, search: searchText })).finally(() => {
        dispatch(setLoadingLibraryCards(false));
        loadingRef.current = false;
      });
    },
    [dispatch, limit, searchText]
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    if (page >= totalPages) return;
    fetchPage(page + 1);
  }, [fetchPage, page, totalPages]);

  useEffect(() => {
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0 }
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [loadMore, sentinelEl]);

  const total = totalRecords;
  const privateCount = limits.privateOwnedCards.current;
  const basicCount = cards.filter((card) => card.cardType === 'basic').length;

  function canManageCard(card: FlashcardType): boolean {
    if (card.type === 'general') {
      return canManage;
    }

    return card.ownerUserId === currentUserId;
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-8 md:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_26%),linear-gradient(135deg,_#0f172a,_#111827)]">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="relative flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-300">
              Biblioteca de Cards
            </p>
            <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
              Gerencie os cards reutilizaveis com mais clareza.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Reaproveite cards em diferentes decks sem misturar o progresso de estudo.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Limite atual: {limits.privateOwnedCards.max} cards privados por usuario.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {canCreatePrivateCard && (
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(null);
                    setFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  <PiPlusBold />
                  Novo card
                </button>
              )}
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                <PiStackDuotone className="text-base" />
                {total} modelos disponiveis
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile
              icon={<PiBookOpenDuotone className="text-xl" />}
              label="Cards cadastrados"
              value={total}
              tone="accent"
            />
            <SummaryTile
              icon={<PiCardsDuotone className="text-xl" />}
              label="Cards basicos"
              value={basicCount}
              tone="neutral"
            />
            <SummaryTile
              icon={<PiSparkleDuotone className="text-xl" />}
              label="Cards privados"
              value={privateCount}
              tone="neutral"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
              Exploracao
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Localize o modelo certo em segundos
            </h2>
          </div>

          <div className="relative w-full max-w-xl">
            <PiMagnifyingGlassDuotone className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-slate-400" />
            <Input
              className="rounded-2xl pl-11"
              placeholder="Buscar por pergunta, resposta ou tipo do card"
              value={searchText}
              onChange={(event) => dispatch(setLibraryCardsSearchText(event.target.value))}
            />
          </div>
        </div>
      </section>

      {status === 'loading' && cards.length === 0 && (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-[28px] bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </section>
      )}

      {status === 'succeeded' && cards.length === 0 && (
        <section className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiBookOpenDuotone className="text-4xl" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            {searchText ? 'Nenhum card corresponde a busca' : 'A biblioteca ainda esta vazia'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            {searchText
              ? 'Refine os termos buscados ou limpe o filtro para revisar todos os modelos disponiveis.'
              : 'Crie os primeiros modelos da biblioteca para padronizar decks, acelerar novas criacoes e manter melhor consistencia entre os estudos.'}
          </p>
          {!searchText && canCreatePrivateCard && (
            <button
              type="button"
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
            >
              <PiPlusBold />
              Criar primeiro card
            </button>
          )}
        </section>
      )}

      {status === 'succeeded' && cards.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {cards.map((card) => (
            <LibraryCardItem
              key={card.uuid}
              card={card}
              onEdit={
                canManageCard(card)
                  ? () => {
                      setEditTarget(card);
                      setFormOpen(true);
                    }
                  : undefined
              }
              onDelete={canManageCard(card) ? () => setDeleteTarget(card) : undefined}
            />
          ))}
          <div ref={setSentinelEl} className="h-1 w-full md:col-span-2 2xl:col-span-3" />
          {loading && page < totalPages && (
            <div className="md:col-span-2 2xl:col-span-3">
              <div className="h-24 animate-pulse rounded-[28px] bg-slate-200/70 dark:bg-slate-800" />
            </div>
          )}
        </section>
      )}

      {canCreatePrivateCard && (
        <LibraryCardFormDialog
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          initial={editTarget}
        />
      )}

      {canManage && (
        <DeleteLibraryCardDialog card={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
