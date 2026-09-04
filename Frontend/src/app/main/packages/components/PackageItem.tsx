import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import {
  PiBookOpenDuotone,
  PiDotsSixVerticalBold,
  PiPencilSimpleDuotone,
  PiTrashDuotone,
} from 'react-icons/pi';
import {
  PUBLIC_GROUP_BADGE_CLASS,
  PUBLIC_GROUP_LABEL,
  type DeckType,
  type PackageGroupType,
} from '../types/PackageTypes';

function PackageItem({
  pkg,
  decks,
  isVisibleInNavbar = false,
  onOpen,
  onEdit,
  onDelete,
  dragHandleProps,
  isDragging = false,
  dragDisabled = false,
  showDragHandle = false,
}: {
  pkg: PackageGroupType;
  decks: DeckType[];
  isVisibleInNavbar?: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging?: boolean;
  dragDisabled?: boolean;
  showDragHandle?: boolean;
}) {
  return (
    <article
      className={`rounded-[28px] border bg-white p-4 shadow-sm transition-all md:p-5 dark:bg-slate-900 ${
        isDragging
          ? 'border-sky-300 shadow-xl dark:border-sky-700'
          : isVisibleInNavbar
            ? 'border-sky-200 bg-sky-50/30 dark:border-sky-900/40 dark:bg-sky-950/10'
            : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-4">
          {showDragHandle && (
            <button
              type="button"
              {...(dragHandleProps ?? {})}
              disabled={dragDisabled}
              className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 ${
                dragDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-grab hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 active:cursor-grabbing dark:hover:border-sky-700 dark:hover:bg-sky-950/20 dark:hover:text-sky-300'
              }`}
              aria-label={dragDisabled ? 'Reordenação indisponível' : 'Arrastar para reorganizar'}
              title={dragDisabled ? 'Limpe a busca para reorganizar' : 'Arrastar para reorganizar'}
            >
              <PiDotsSixVerticalBold className="text-lg" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${PUBLIC_GROUP_BADGE_CLASS}`}
                >
                  {PUBLIC_GROUP_LABEL}
                </span>
                {isVisibleInNavbar && (
                  <span className="ml-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                    Visível na navbar
                  </span>
                )}

                <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                  {pkg.name}
                </p>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {pkg.description || 'Sem descricao cadastrada.'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpen}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/20 dark:hover:text-sky-300"
                  title="Abrir package"
                >
                  <PiBookOpenDuotone className="text-base" />
                </button>
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-300"
                    title="Editar package"
                  >
                    <PiPencilSimpleDuotone className="text-base" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                    title="Excluir package"
                  >
                    <PiTrashDuotone className="text-base" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
              <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/80">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
                  Decks vinculados
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {decks.length}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {decks.length === 1
                    ? 'package conectado a 1 deck'
                    : `package conectado a ${decks.length} decks`}
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 dark:border-slate-700">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
                  Resumo da lista
                </p>

                {decks.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Este package concentra{' '}
                      {decks.length === 1 ? '1 deck vinculado' : `${decks.length} decks vinculados`}
                      .
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Abrir package para ver a lista completa
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      Nenhum deck associado
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default PackageItem;
