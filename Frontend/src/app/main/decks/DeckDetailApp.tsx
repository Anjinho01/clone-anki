import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PiArrowFatDownDuotone,
  PiArrowLeftBold,
  PiCalendarCheckDuotone,
  PiCardsDuotone,
  PiCheckCircleDuotone,
  PiClockCountdownDuotone,
  PiGlobeDuotone,
  PiLockDuotone,
  PiPauseDuotone,
  PiPlayCircleDuotone,
  PiPlusBold,
  PiSparkleDuotone,
  PiStackDuotone,
} from 'react-icons/pi';
import { canManageStudyContent } from 'app/auth';
import { useAppDispatch, useAppSelector } from 'app/store';
import { selectUserId } from 'app/store/user/userSlice';
import {
  clearDeckDetail,
  getDeck,
  getDeckCards,
  selectAllCards,
  selectCardsStatus,
  selectCurrentDeck,
  selectDeckStatus,
} from './store/deckDetailSlice';
import { buryCard, openNewCardDialog, suspendCard, unsuspendCard } from './store/cardSlice';
import type { CardType } from './types/DeckTypes';
import NewCardDialog from './dialogs/NewCardDialog';

const STATE_META: Record<number, { label: string; tone: string }> = {
  0: { label: 'Novo', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  1: {
    label: 'Aprendendo',
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  2: {
    label: 'Revisao',
    tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  3: {
    label: 'Reaprendendo',
    tone: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
};

const DEFAULT_STATE =
  STATE_META[0] ??
  ({
    label: 'Novo',
    tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  } as const);

const CARD_TYPE_LABELS: Record<CardType['cardType'], string> = {
  basic: 'Basico',
  reversed: 'Reverso',
  cloze: 'Lacuna',
  mcq: 'Multipla Escolha',
};

function SummaryTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border p-3.5 md:rounded-3xl md:p-4 ${
        accent
          ? 'border-sky-200 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/30'
          : 'border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70'
      }`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm md:h-11 md:w-11 dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </div>
      <div className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function CardRow({ card }: { card: CardType }) {
  const dispatch = useAppDispatch();
  const stateMeta = STATE_META[card.state] ?? DEFAULT_STATE;
  const progressId = card.progressId ?? null;
  const canMutateProgress = Boolean(progressId);

  return (
    <article
      className={`rounded-[24px] border p-4 shadow-sm transition-all md:rounded-[28px] md:p-5 ${
        card.isSuspended || card.isBuried
          ? 'border-slate-200 bg-slate-50/80 opacity-70 dark:border-slate-800 dark:bg-slate-900/60'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stateMeta.tone}`}>
            {stateMeta.label}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {CARD_TYPE_LABELS[card.cardType]}
          </span>
          {card.isSuspended && (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              Suspenso
            </span>
          )}
          {card.isBuried && (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              Enterrado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={card.isSuspended ? 'Remover suspensao' : 'Suspender card'}
            onClick={() => {
              if (!progressId) {
                return;
              }
              dispatch(card.isSuspended ? unsuspendCard(progressId) : suspendCard(progressId));
            }}
            disabled={!canMutateProgress}
            className={`rounded-xl p-2 transition-colors ${
              card.isSuspended
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
                : canMutateProgress
                  ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
            }`}
          >
            {card.isSuspended ? (
              <PiCheckCircleDuotone className="text-base" />
            ) : (
              <PiPauseDuotone className="text-base" />
            )}
          </button>
          {!card.isBuried && (
            <button
              type="button"
              title="Enterrar ate amanha"
              onClick={() => {
                if (!progressId) {
                  return;
                }
                dispatch(buryCard(progressId));
              }}
              disabled={!canMutateProgress}
              className={`rounded-xl p-2 transition-colors ${
                canMutateProgress
                  ? 'text-slate-400 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/20 dark:hover:text-violet-300'
                  : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
              }`}
            >
              <PiArrowFatDownDuotone className="text-base" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4 md:mt-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
            Frente
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-900 md:leading-7 dark:text-white">
            {card.front}
          </p>
        </div>
        <div className="border-t border-dashed border-slate-200 pt-4 dark:border-slate-700">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
            Verso
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500 md:leading-7 dark:text-slate-400">
            {card.back}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 md:mt-5 dark:text-slate-400">
        <PiClockCountdownDuotone className="text-base" />
        {card.due
          ? `Proxima revisao: ${new Date(card.due).toLocaleDateString('pt-BR')}`
          : 'Ainda nao iniciado'}
      </div>
    </article>
  );
}

export default function DeckDetailApp() {
  const { deckKey } = useParams<{ deckKey: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const canManage = useAppSelector((state) => canManageStudyContent(state.user.role));
  const currentUserId = useAppSelector(selectUserId);

  const deck = useAppSelector(selectCurrentDeck);
  const cards = useAppSelector(selectAllCards);
  const deckStatus = useAppSelector(selectDeckStatus);
  const cardsStatus = useAppSelector(selectCardsStatus);

  useEffect(() => {
    if (!deckKey) {
      return;
    }

    const deckPromise = dispatch(getDeck({ key: deckKey }));

    return () => {
      deckPromise.abort();
      dispatch(clearDeckDetail());
    };
  }, [deckKey, dispatch]);

  useEffect(() => {
    if (!deck?.id) {
      return;
    }

    const cardsPromise = dispatch(getDeckCards({ deckId: deck.id }));

    return () => {
      cardsPromise.abort();
    };
  }, [deck?.id, dispatch]);

  const isLoading = deckStatus === 'loading' || cardsStatus === 'loading';

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 px-4 py-5 md:gap-8 md:px-8 md:py-8 xl:px-10">
        <div className="h-72 animate-pulse rounded-[24px] bg-slate-200/80 md:h-80 md:rounded-[32px] dark:bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-[24px] bg-slate-200/70 md:h-72 md:rounded-[28px] dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!deck || deckStatus === 'failed') {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8 xl:px-10">
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm md:rounded-[32px] md:px-6 md:py-16 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiStackDuotone className="text-4xl" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Deck indisponivel
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
            Nao foi possivel carregar os detalhes deste deck. Volte para a lista e tente novamente.
          </p>
          <button
            type="button"
            onClick={() => navigate(canManage ? '/decks/manage' : '/decks')}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
          >
            <PiArrowLeftBold />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const dueToday = deck.cardCount?.due ?? 0;
  const newCards = deck.cardCount?.new ?? 0;
  const totalCards = deck.cardCount?.total ?? cards.length;
  const studyNow = dueToday + newCards;
  const canAddCardsToDeck =
    deck.type === 'general'
      ? canManage
      : deck.ownerUserId != null && deck.ownerUserId === currentUserId;

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:gap-8 md:px-8 md:py-8 xl:px-10">
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_34%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-4 shadow-sm md:rounded-[32px] md:p-8 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_30%),linear-gradient(135deg,_#0f172a,_#111827)]">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="relative grid gap-5 md:gap-8 xl:grid-cols-[minmax(0,1.4fr)_420px] xl:items-end">
          <div>
            <button
              type="button"
              onClick={() => navigate(canManage ? '/decks/manage' : '/decks')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <PiArrowLeftBold />
              Voltar
            </button>

            <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-6">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                {deck.type === 'general' ? 'Deck geral' : 'Deck privado'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                {deck.type === 'general' ? <PiGlobeDuotone /> : <PiLockDuotone />}
                {deck.type === 'general' ? 'Compartilhado' : 'Pessoal'}
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-[2rem] font-semibold tracking-tight text-slate-950 md:text-4xl dark:text-white">
              {deck.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:mt-4 md:text-base md:leading-7 dark:text-slate-300">
              {deck.description ||
                'Deck preparado para consolidar revisoes, novos cards e o acompanhamento detalhado do progresso.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-3 md:mt-6">
              <button
                type="button"
                onClick={() => navigate(`/decks/${deck.uuid}/study`)}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                  studyNow > 0
                    ? 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <PiPlayCircleDuotone />
                {studyNow > 0 ? 'Estudar agora' : 'Abrir sessao de estudo'}
              </button>
              {canAddCardsToDeck && deck?.id && (
                <button
                  type="button"
                  onClick={() => dispatch(openNewCardDialog({ deckId: deck.id }))}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <PiPlusBold />
                  Adicionar card
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 xl:gap-4">
            <SummaryTile
              icon={<PiStackDuotone className="text-xl" />}
              label="Cards no deck"
              value={totalCards}
            />
            <SummaryTile
              icon={<PiSparkleDuotone className="text-xl" />}
              label="Novos disponiveis"
              value={newCards}
              accent={newCards > 0}
            />
            <SummaryTile
              icon={<PiClockCountdownDuotone className="text-xl" />}
              label="Fila para hoje"
              value={dueToday}
              accent={dueToday > 0}
            />
            <SummaryTile
              icon={<PiCalendarCheckDuotone className="text-xl" />}
              label="Novos por dia"
              value={deck.newCardsPerDay}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 md:h-11 md:w-11 dark:bg-slate-800 dark:text-slate-200">
                <PiCardsDuotone className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 md:text-xl dark:text-white">
                  Biblioteca do deck
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Cards com acoes diretas e leitura mais clara de estado e conteudo.
                </p>
              </div>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {cardsStatus === 'succeeded' && cards.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center md:mt-6 md:rounded-[28px] md:px-6 md:py-14 dark:border-slate-700 dark:bg-slate-950/20">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[24px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <PiCardsDuotone className="text-3xl" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900 md:text-2xl dark:text-white">
              Nenhum card neste deck
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Adicione os primeiros cards para iniciar o fluxo de estudo e acompanhar a evolucao
              deste deck em uma unica tela.
            </p>
            {canAddCardsToDeck && deck?.id && (
              <button
                type="button"
                onClick={() => dispatch(openNewCardDialog({ deckId: deck.id }))}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
              >
                <PiPlusBold />
                Adicionar primeiro card
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:mt-6 md:grid-cols-2 2xl:grid-cols-3">
            {cards.map((card) => (
              <CardRow key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>

      {canAddCardsToDeck && <NewCardDialog />}
    </div>
  );
}
