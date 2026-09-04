import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PiCardsDuotone,
  PiGlobeDuotone,
  PiMagnifyingGlassDuotone,
  PiPlusBold,
  PiSparkleDuotone,
  PiStackDuotone,
  PiXBold,
} from 'react-icons/pi';
import Input from '@fuse/ui/Input';
import { canCreatePrivateStudyContent } from 'app/auth';
import { useAppDispatch, useAppSelector } from 'app/store';
import {
  getDecks,
  selectDecksStatus,
  selectGeneralDecks,
  selectPrivateDecks,
} from './store/decksSlice';
import { openNewDeckDialog } from './store/deckSlice';
import DeckCard from './components/DeckCard';
import SectionHeader from './components/SectionHeader';
import SummaryTile from './components/SummaryTile';
import NewDeckDialog from './dialogs/NewDeckDialog';
import { buildDeckOverviewModel } from './models/DeckOverviewModel';

export default function DecksApp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const generalDecks = useAppSelector(selectGeneralDecks);
  const privateDecks = useAppSelector(selectPrivateDecks);
  const status = useAppSelector(selectDecksStatus);
  const canCreatePrivateDeck = useAppSelector((state) =>
    canCreatePrivateStudyContent(state.user.role)
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const promise = dispatch(getDecks());
    return () => promise.abort();
  }, [dispatch]);

  useEffect(() => {
    if (canCreatePrivateDeck && searchParams.get('new') === '1' && status === 'succeeded') {
      dispatch(openNewDeckDialog());
    }
  }, [canCreatePrivateDeck, dispatch, searchParams, status]);

  const { allDecks, totalCards, readyDecks } = buildDeckOverviewModel(generalDecks, privateDecks);
  const filteredDecks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return allDecks;
    }

    return allDecks.filter((deck) => {
      const deckTypeLabel = deck.type === 'general' ? 'publico' : 'privado';

      return (
        deck.name.toLowerCase().includes(normalizedQuery) ||
        (deck.description ?? '').toLowerCase().includes(normalizedQuery) ||
        deckTypeLabel.includes(normalizedQuery)
      );
    });
  }, [allDecks, query]);
  const publicDecksCount = generalDecks.length;
  const privateDecksCount = privateDecks.length;

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-8 px-6 py-8 md:px-8 xl:px-10">
        <div className="h-72 animate-pulse rounded-[32px] bg-slate-200/80 dark:bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-[28px] bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="px-6 py-8 md:px-8 xl:px-10">
        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiStackDuotone className="text-4xl" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Nao foi possivel carregar os decks
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
            Atualize os dados para recuperar a visao geral dos estudos e voltar a navegar pelos seus
            decks.
          </p>
          <button
            type="button"
            onClick={() => dispatch(getDecks())}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
          >
            <PiStackDuotone />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_36%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(135deg,_#0f172a,_#111827)]">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="relative flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-300">
              Painel de estudos
            </p>
            <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
              Seus decks, prioridades e acesso rapido ao estudo.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Veja o que existe, o que esta pronto para hoje e entre no fluxo de estudo sem rodeio.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {canCreatePrivateDeck && (
                <button
                  type="button"
                  onClick={() => dispatch(openNewDeckDialog())}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  <PiPlusBold />
                  Novo deck
                </button>
              )}
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                <PiCardsDuotone />
                {allDecks.length} decks ativos
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SummaryTile
              icon={<PiStackDuotone className="text-xl" />}
              label="Decks ativos"
              value={allDecks.length}
              accent
            />
            <SummaryTile
              icon={<PiGlobeDuotone className="text-xl" />}
              label="Decks publicos"
              value={publicDecksCount}
            />
            <SummaryTile
              icon={<PiSparkleDuotone className="text-xl" />}
              label="Decks privados"
              value={privateDecksCount}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <SectionHeader
              icon={<PiStackDuotone className="text-xl" />}
              title="Meus decks"
              description="Veja em uma unica visao seus decks privados e os decks publicos disponiveis para estudo."
              count={filteredDecks.length}
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (searchOpen && query.trim()) {
                    setQuery('');
                    setSearchOpen(false);
                    return;
                  }

                  setSearchOpen((currentValue) => !currentValue);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {searchOpen ? <PiXBold /> : <PiMagnifyingGlassDuotone />}
                {searchOpen ? 'Fechar busca' : 'Pesquisar decks'}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="relative max-w-xl">
              <PiMagnifyingGlassDuotone className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-slate-400" />
              <Input
                className="rounded-2xl pl-11"
                placeholder="Buscar por nome, descricao ou tipo do deck"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            Publicos: {publicDecksCount}
          </span>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            Privados: {privateDecksCount}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Com estudo: {readyDecks}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Cards: {totalCards}
          </span>
        </div>

        {allDecks.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-950/20">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[24px] bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <PiStackDuotone className="text-3xl" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">
              Nenhum deck disponivel ainda
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Crie seu primeiro deck privado ou aguarde a publicacao de decks compartilhados para
              iniciar o estudo por aqui.
            </p>
            {canCreatePrivateDeck && (
              <button
                type="button"
                onClick={() => dispatch(openNewDeckDialog())}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
              >
                <PiPlusBold />
                Criar primeiro deck
              </button>
            )}
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-950/20">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[24px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <PiMagnifyingGlassDuotone className="text-3xl" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">
              Nenhum deck corresponde a busca
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Ajuste os termos pesquisados ou feche a busca para voltar a ver todos os decks.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredDecks.map((deck) => (
              <DeckCard
                key={deck.uuid}
                deck={deck}
                onOpen={() => navigate(`/decks/${deck.uuid}`)}
                onStudy={() => navigate(`/decks/${deck.uuid}/study`)}
              />
            ))}
          </div>
        )}
      </section>

      {canCreatePrivateDeck && <NewDeckDialog />}
    </div>
  );
}
