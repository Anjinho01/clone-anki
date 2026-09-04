import {
  PiClockCountdownDuotone,
  PiGlobeDuotone,
  PiLockDuotone,
  PiPlayCircleDuotone,
} from 'react-icons/pi';
import type { DeckType } from '../types/DeckTypes';

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
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl ${
              deck.type === 'general'
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
            }`}
          >
            {deck.type === 'general' ? <PiGlobeDuotone /> : <PiLockDuotone />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
              {deck.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {deck.description || 'Deck pronto para concentrar conteudo, progresso e revisoes.'}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase dark:border-slate-700 dark:text-slate-500">
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

export default DeckCard;
