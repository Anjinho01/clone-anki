import { PiPencilSimpleDuotone, PiTrashDuotone } from 'react-icons/pi';
import {
  CARD_TYPE_COLORS,
  CARD_TYPE_OPTIONS,
  VISIBILITY_COLORS,
  VISIBILITY_OPTIONS,
  type FlashcardType,
} from '../types/LibraryCardTypes';

function LibraryCardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: FlashcardType;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const cardBadgeClass = CARD_TYPE_COLORS[card.cardType];
  const visibilityBadgeClass = VISIBILITY_COLORS[card.type ?? 'general'];
  const cardBadgeLabel =
    CARD_TYPE_OPTIONS.find((option) => option.value === card.cardType)?.label ?? card.cardType;
  const visibilityBadgeLabel =
    VISIBILITY_OPTIONS.find((option) => option.value === (card.type ?? 'general'))?.label ??
    card.type;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cardBadgeClass}`}
          >
            {cardBadgeLabel}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${visibilityBadgeClass}`}
          >
            {visibilityBadgeLabel}
          </span>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-300"
                title="Editar card"
              >
                <PiPencilSimpleDuotone className="text-base" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                title="Excluir card"
              >
                <PiTrashDuotone className="text-base" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
            Frente
          </p>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-900 dark:text-white">
            {card.front}
          </p>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-4 dark:border-slate-700">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
            Verso
          </p>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {card.back}
          </p>
        </div>
      </div>
    </article>
  );
}

export default LibraryCardItem;
