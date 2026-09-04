import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiBookOpenDuotone,
  PiCardsDuotone,
  PiClockCountdownDuotone,
  PiPlayCircleDuotone,
  PiSparkleDuotone,
  PiStackDuotone,
} from 'react-icons/pi';
import { useAppDispatch, useAppSelector } from 'app/store';
import type { RootState } from 'app/store';
import { getDecks, selectAllDecks, selectDecksStatus } from '../decks/store/decksSlice';
import {
  getPackageById,
  selectAllPackages,
  selectPackagesStatus,
} from '../decks/store/packageSlice';
import type { DeckType, PackageGroupType } from '../decks/types/DeckTypes';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type PackagesRootState = RootState & {
  decksApp?: {
    packages?: {
      actionStatus?: Status;
    };
  };
};

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

function DeckCard({
  deck,
  onOpen,
  onStudy,
}: {
  deck: DeckType;
  onOpen: () => void;
  onStudy: () => void;
}) {
  const dueToday = deck.cardCount?.due ?? 0;
  const newCards = deck.cardCount?.new ?? 0;
  const totalCards = deck.cardCount?.total ?? 0;
  const isReady = dueToday + newCards > 0;

  return (
    <article
      className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
            {deck.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {deck.description || 'Deck pronto para concentrar conteudo, progresso e revisoes.'}
          </p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase dark:border-slate-700 dark:text-slate-500">
          {deck.type === 'general' ? 'Geral' : 'Privado'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/80">
          <div className="text-xl font-semibold text-slate-900 dark:text-white">{totalCards}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">cards</div>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3 py-3 dark:bg-amber-950/20">
          <div className="text-xl font-semibold text-amber-700 dark:text-amber-300">{dueToday}</div>
          <div className="mt-1 text-xs text-amber-600/80 dark:text-amber-300/80">para hoje</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-3 dark:bg-emerald-950/20">
          <div className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">
            {newCards}
          </div>
          <div className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-300/80">novos</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <PiClockCountdownDuotone className="text-base" />
          {isReady ? 'Ha estudo disponivel agora' : 'Sem pendencias no momento'}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onStudy();
          }}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            isReady
              ? 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <PiPlayCircleDuotone className="text-base" />
          Estudar
        </button>
      </div>
    </article>
  );
}

export default function PackageDetailApp() {
  const { packageKey } = useParams<{ packageKey: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const packages = useAppSelector(selectAllPackages);
  const decks = useAppSelector(selectAllDecks);
  const packagesStatus = useAppSelector(selectPackagesStatus);
  const decksStatus = useAppSelector(selectDecksStatus);
  const actionStatus = useAppSelector((state) => {
    return ((state as PackagesRootState).decksApp?.packages?.actionStatus ?? 'idle') as Status;
  });

  useEffect(() => {
    if (!packageKey) {
      return;
    }

    const packagePromise = dispatch(getPackageById(packageKey));
    const decksPromise = dispatch(getDecks());

    return () => {
      packagePromise.abort();
      decksPromise.abort();
    };
  }, [dispatch, packageKey]);

  const pkg = useMemo<PackageGroupType | null>(() => {
    if (!packageKey) {
      return null;
    }

    return (
      packages.find((item) => item.uuid === packageKey || String(item.id) === packageKey) ?? null
    );
  }, [packageKey, packages]);

  const packageDecks = useMemo(() => {
    if (!pkg) {
      return [] as DeckType[];
    }

    return decks.filter((deck) => deck.packageId === pkg.id);
  }, [decks, pkg]);

  const totalCards = packageDecks.reduce((sum, deck) => sum + (deck.cardCount?.total ?? 0), 0);
  const totalDue = packageDecks.reduce((sum, deck) => sum + (deck.cardCount?.due ?? 0), 0);
  const totalNew = packageDecks.reduce((sum, deck) => sum + (deck.cardCount?.new ?? 0), 0);
  const isLoading =
    packagesStatus === 'loading' || decksStatus === 'loading' || actionStatus === 'loading';

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 px-6 py-8 md:px-8 xl:px-10">
        <div className="h-72 animate-pulse rounded-[32px] bg-slate-200/80 dark:bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-[28px] bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="px-6 py-8 md:px-8 xl:px-10">
        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiBookOpenDuotone className="text-4xl" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Package indisponivel
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
            Nao foi possivel localizar esse package com a chave publica informada.
          </p>
          <button
            type="button"
            onClick={() => navigate('/decks')}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
          >
            <PiArrowLeftBold />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-8 md:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_26%),linear-gradient(135deg,_#0f172a,_#111827)]">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="relative flex flex-col gap-6">
          <div>
            <button
              type="button"
              onClick={() => navigate('/decks')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <PiArrowLeftBold />
              Voltar
            </button>
            <p className="mt-5 text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-300">
              Package
            </p>
            <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
              {pkg.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {pkg.description ||
                'Package pronto para organizar decks e iniciar o estudo a partir deles.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile
              icon={<PiStackDuotone className="text-xl" />}
              label="Decks no package"
              value={packageDecks.length}
            />
            <SummaryTile
              icon={<PiCardsDuotone className="text-xl" />}
              label="Cards totais"
              value={totalCards}
            />
            <SummaryTile
              icon={<PiSparkleDuotone className="text-xl" />}
              label="Para estudar agora"
              value={totalDue + totalNew}
            />
          </div>
        </div>
      </section>

      {packageDecks.length === 0 ? (
        <section className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiBookOpenDuotone className="text-4xl" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Nenhum deck neste package
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Assim que um deck for vinculado a este package, ele aparecera aqui para o aluno abrir e
            estudar.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {packageDecks.map((deck) => (
            <DeckCard
              key={deck.uuid}
              deck={deck}
              onOpen={() => navigate(`/decks/${deck.uuid}`)}
              onStudy={() => navigate(`/decks/${deck.uuid}/study`)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
