import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiCardsDuotone,
  PiCheckCircleDuotone,
  PiEyeDuotone,
  PiLightningDuotone,
  PiPlayCircleDuotone,
  PiStackDuotone,
} from 'react-icons/pi';
import Tooltip from '@fuse/ui/Tooltip';
import { useAppDispatch, useAppSelector } from 'app/store';
import {
  clearDeckDetail,
  getDeck,
  selectCurrentDeck,
  selectDeckStatus,
} from './store/deckDetailSlice';
import {
  clearStudySession,
  getStudySession,
  selectStudyCards,
  selectStudyError,
  selectStudyReviewedCount,
  selectStudyStatus,
  selectStudySubmitStatus,
  submitStudyReview,
} from './store/studySlice';

const RATING_BUTTONS: Array<{
  rating: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  className: string;
}> = [
  {
    rating: 1,
    title: 'De novo',
    subtitle: 'Rever agora',
    className:
      'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300',
  },
  {
    rating: 2,
    title: 'Difícil',
    subtitle: 'Mais difícil',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
  },
  {
    rating: 3,
    title: 'Bom',
    subtitle: 'Seguir fluxo',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
  },
  {
    rating: 4,
    title: 'Fácil',
    subtitle: 'Alongar intervalo',
    className:
      'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300',
  },
];

function getCardTypeLabel(cardType?: string) {
  switch (cardType) {
    case 'mcq':
      return 'Múltipla escolha';
    case 'cloze':
      return 'Lacuna';
    case 'reversed':
      return 'Reverso';
    default:
      return 'Básico';
  }
}

function getCardStateLabel(state?: number) {
  switch (state) {
    case 0:
      return 'novo';
    case 1:
      return 'aprendendo';
    case 2:
      return 'revisão';
    default:
      return 'reaprendendo';
  }
}

export default function DeckStudyApp() {
  const { deckKey } = useParams<{ deckKey: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const deck = useAppSelector(selectCurrentDeck);
  const deckStatus = useAppSelector(selectDeckStatus);
  const studyCards = useAppSelector(selectStudyCards);
  const studyStatus = useAppSelector(selectStudyStatus);
  const submitStatus = useAppSelector(selectStudySubmitStatus);
  const reviewedCount = useAppSelector(selectStudyReviewedCount);
  const studyError = useAppSelector(selectStudyError);

  const [answerVisible, setAnswerVisible] = useState(false);
  const [cardStartedAt, setCardStartedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!deckKey) {
      return;
    }

    const deckPromise = dispatch(getDeck({ key: deckKey }));

    return () => {
      deckPromise.abort();
      dispatch(clearDeckDetail());
      dispatch(clearStudySession());
    };
  }, [deckKey, dispatch]);

  useEffect(() => {
    if (!deck?.id) {
      return;
    }

    const sessionPromise = dispatch(getStudySession({ deckId: deck.id }));

    return () => {
      sessionPromise.abort();
    };
  }, [deck?.id, dispatch]);

  const currentCard = studyCards[0] ?? null;

  useEffect(() => {
    setAnswerVisible(false);
    setCardStartedAt(Date.now());
  }, [currentCard?.id]);

  const totalLoaded = useMemo(
    () => reviewedCount + studyCards.length,
    [reviewedCount, studyCards.length]
  );
  const remainingCards = studyCards.length;
  const queueCards = studyCards.filter((card) => card.state > 0).length;
  const newCards = studyCards.filter((card) => card.state === 0).length;
  const currentCardNumber = reviewedCount + 1;
  const currentCardTypeLabel = currentCard ? getCardTypeLabel(currentCard.cardType) : null;
  const currentCardStateLabel = currentCard ? getCardStateLabel(currentCard.state) : null;

  const isLoading = deckStatus === 'loading' || (deck?.id != null && studyStatus === 'loading');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 px-4 py-5 md:px-8 md:py-8 xl:px-10">
        <div className="h-20 animate-pulse rounded-[24px] bg-slate-200/80 md:rounded-[28px] dark:bg-slate-800" />
        <div className="h-[28rem] animate-pulse rounded-[24px] bg-slate-200/70 md:rounded-[32px] dark:bg-slate-800" />
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
            Deck indisponível para estudo
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
            Não foi possível carregar este deck. Volte para a lista e tente abrir a sessão
            novamente.
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

  async function handleReview(rating: 1 | 2 | 3 | 4) {
    if (!currentCard || !deck.id || submitStatus === 'loading') {
      return;
    }

    const cardReference = currentCard.progressId ?? currentCard.id;
    if (!cardReference) {
      return;
    }

    await dispatch(
      submitStudyReview({
        cardId: cardReference,
        deckId: deck.id,
        rating,
        durationMs: Math.max(0, Date.now() - cardStartedAt),
      })
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-8 md:py-8 xl:px-10">
      {studyStatus === 'failed' && (
        <section className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-10 text-center shadow-sm md:rounded-[32px] md:px-6 md:py-14 dark:border-red-900/30 dark:bg-red-950/20">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[24px] bg-white text-red-500 dark:bg-slate-900 dark:text-red-300">
            <PiLightningDuotone className="text-3xl" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-slate-900 md:text-2xl dark:text-white">
            Não foi possível abrir a sessão
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {studyError ?? 'A sessão de estudo falhou ao carregar. Tente novamente em instantes.'}
          </p>
          <button
            type="button"
            onClick={() => deck.id && dispatch(getStudySession({ deckId: deck.id }))}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            <PiPlayCircleDuotone />
            Tentar novamente
          </button>
        </section>
      )}

      {studyStatus === 'succeeded' && !currentCard && (
        <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm md:rounded-[32px] md:px-6 md:py-16 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <PiCheckCircleDuotone className="text-4xl" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Sessão concluída
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Não há cards pendentes neste deck agora. Você pode voltar ao detalhe do deck ou
            recarregar a sessão para confirmar se apareceu algo novo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/decks/${deck.uuid}`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <PiArrowLeftBold />
              Voltar ao deck
            </button>
            <button
              type="button"
              onClick={() => dispatch(getStudySession({ deckId: deck.id }))}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <PiPlayCircleDuotone />
              Recarregar sessão
            </button>
          </div>
        </section>
      )}

      {currentCard && (
        <section className="flex flex-col gap-5">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate(`/decks/${deck.uuid}`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <PiArrowLeftBold />
              Voltar ao deck
            </button>
          </div>

          <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex flex-wrap items-start gap-3 md:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                    {deck.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {remainingCards > 0 ? `${remainingCards} cards restantes` : 'Sessão concluída'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tooltip
                    title="Cards que ja passaram da fase inicial e entraram na fila de repeticao desta sessao."
                    wrapperClass="inline-flex"
                  >
                    <span className="inline-flex cursor-help items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-sky-500">
                      <PiPlayCircleDuotone />
                      {queueCards} em revisão
                    </span>
                  </Tooltip>

                  <Tooltip
                    title="Cards ainda nao respondidos por voce nesta sessao de estudo."
                    wrapperClass="inline-flex"
                  >
                    <span className="inline-flex cursor-help items-center rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {newCards} novos
                    </span>
                  </Tooltip>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    <PiCardsDuotone className="text-xl" />
                  </div>
                  <div>
                    <Tooltip
                      title="Posicao do card atual dentro da sessao carregada."
                      wrapperClass="inline-flex"
                    >
                      <p className="cursor-help text-sm font-semibold text-slate-900 dark:text-white">
                        Card {currentCardNumber}
                      </p>
                    </Tooltip>
                    <Tooltip
                      title="Tipo do card exibido agora. Basico mostra frente e resposta; outros tipos mudam a forma de estudo."
                      wrapperClass="inline-flex"
                    >
                      <p className="cursor-help text-sm text-slate-500 dark:text-slate-400">
                        {currentCardTypeLabel}
                      </p>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:ml-auto">
                  <Tooltip
                    title="Total de cards incluidos nesta sessao: os que ainda faltam mais os que ja foram respondidos."
                    wrapperClass="inline-flex"
                  >
                    <span className="cursor-help rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {totalLoaded} na sessão
                    </span>
                  </Tooltip>
                  <Tooltip
                    title="Quantidade de cards que voce ja avaliou nesta sessao atual."
                    wrapperClass="inline-flex"
                  >
                    <span className="cursor-help rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {reviewedCount} respondidos
                    </span>
                  </Tooltip>
                  <Tooltip
                    title="Fase FSRS do card atual. Novo ainda nao foi estudado; aprendendo e revisao ja tem historico; reaprendendo voltou apos erro."
                    wrapperClass="inline-flex"
                  >
                    <span className="cursor-help rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      Fase atual: {currentCardStateLabel}
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5 md:mt-6 md:space-y-6">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 md:p-5 dark:border-slate-700 dark:bg-slate-950/20">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
                  Frente
                </p>
                <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-slate-900 dark:text-white">
                  {currentCard.front || 'Sem conteúdo na frente.'}
                </p>
              </div>

              <div
                className={`rounded-[24px] border p-4 transition-all md:p-5 ${
                  answerVisible
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/30 dark:bg-emerald-950/10'
                    : 'border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
                    Resposta
                  </p>
                  {!answerVisible && (
                    <button
                      type="button"
                      onClick={() => setAnswerVisible(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                    >
                      <PiEyeDuotone />
                      Mostrar resposta
                    </button>
                  )}
                </div>

                {answerVisible ? (
                  <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                    {currentCard.back || 'Sem resposta cadastrada.'}
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    Revele a resposta e só então avalie se lembrou com facilidade, dificuldade ou se
                    precisa rever imediatamente.
                  </p>
                )}
              </div>
            </div>
          </article>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:rounded-[32px] md:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                <PiLightningDuotone className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Avaliação do review
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Escolha a nota que melhor representa a lembrança deste card.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {RATING_BUTTONS.map((button) => (
                <button
                  key={button.rating}
                  type="button"
                  disabled={!answerVisible || submitStatus === 'loading'}
                  onClick={() => handleReview(button.rating)}
                  className={`flex min-h-[96px] w-full flex-col items-start justify-center rounded-[22px] border px-4 py-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${button.className}`}
                >
                  <div>
                    <div className="text-sm font-semibold">{button.title}</div>
                    <div className="mt-1 text-xs opacity-80">{button.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] bg-slate-50 p-4 text-sm leading-7 text-slate-500 dark:bg-slate-950/20 dark:text-slate-400">
              {answerVisible
                ? 'Depois de avaliar, o próximo card da sessão assume a tela automaticamente.'
                : 'As notas ficam habilitadas depois que a resposta é revelada, para evitar reviews acidentais.'}
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
