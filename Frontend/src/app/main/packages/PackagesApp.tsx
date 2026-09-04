import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
  PiCardsDuotone,
  PiCirclesThreePlusDuotone,
  PiMagnifyingGlassDuotone,
  PiPlusBold,
  PiSparkleDuotone,
  PiStackDuotone,
} from 'react-icons/pi';
import StrictModeDroppable from '@fuse/shared/StrictModeDroppable';
import Input from '@fuse/ui/Input';
import { canManageStudyContent } from 'app/auth';
import { notifyError, notifySuccess } from 'app/services/notificationService';
import { useAppDispatch, useAppSelector } from 'app/store';
import extractApiErrorMessage from 'app/utils/extractApiErrorMessage';
import PackageItem from './components/PackageItem';
import SummaryTile from './components/SummaryTile';
import DeletePackageDialog from './dialogs/DeletePackageDialog';
import PackageFormDialog from './dialogs/PackageFormDialog';
import { selectAllDecks, getDecks } from './store/decksSlice';
import {
  getPackages,
  selectAllPackages,
  selectPackagesStatus,
  updatePackage,
} from './store/packageSlice';
import {
  PUBLIC_GROUP_BADGE_CLASS,
  PUBLIC_GROUP_LABEL,
  type PackageGroupType,
} from './types/PackageTypes';

function sortPackagesByPosition(items: PackageGroupType[]) {
  return [...items].sort(
    (left, right) => left.position - right.position || left.name.localeCompare(right.name)
  );
}

const MAX_PACKAGES_IN_NAVBAR = 10;

export default function PackagesApp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userRole = useAppSelector((state) => state.user.role);
  const currentUserId = useAppSelector((state) => state.user.userId);
  const canManage = useAppSelector((state) => canManageStudyContent(state.user.role));
  const canManageAnyPackage = userRole === 'develop' || userRole === 'admin';
  const canLinkDecks = canManageAnyPackage || userRole === 'monitor';
  const packages = useAppSelector((state) => selectAllPackages(state as never));
  const decks = useAppSelector((state) => selectAllDecks(state as never));
  const status = useAppSelector((state) => selectPackagesStatus(state as never));

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackageGroupType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageGroupType | null>(null);
  const [orderedPackages, setOrderedPackages] = useState<PackageGroupType[]>([]);
  const [isPersistingOrder, setIsPersistingOrder] = useState(false);

  useEffect(() => {
    const packagesPromise = dispatch(getPackages());
    const decksPromise = dispatch(getDecks());

    return () => {
      packagesPromise.abort();
      decksPromise.abort();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isPersistingOrder) {
      setOrderedPackages(sortPackagesByPosition(packages));
    }
  }, [packages, isPersistingOrder]);

  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return orderedPackages;
    }

    return orderedPackages.filter((pkg) => {
      return (
        pkg.uuid.toLowerCase().includes(normalizedQuery) ||
        pkg.name.toLowerCase().includes(normalizedQuery) ||
        (pkg.description ?? '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [orderedPackages, query]);

  const packagesVisibleInNavbar = useMemo(
    () => new Set(orderedPackages.slice(0, MAX_PACKAGES_IN_NAVBAR).map((pkg) => pkg.id)),
    [orderedPackages]
  );

  const decksByPackage = useMemo(() => {
    return packages.reduce<Record<number, typeof decks>>((accumulator, pkg) => {
      accumulator[pkg.id] = decks.filter((deck) => deck.packageId === pkg.id);
      return accumulator;
    }, {});
  }, [decks, packages]);

  const total = packages.length;
  const groupedDecksCount = decks.filter((deck) => deck.packageId != null).length;
  const emptyPackagesCount = packages.filter(
    (pkg) => (decksByPackage[pkg.id] ?? []).length === 0
  ).length;
  const deleteDeckCount = deleteTarget ? (decksByPackage[deleteTarget.id] ?? []).length : 0;
  const isFiltering = query.trim().length > 0;
  const canReorder =
    (canManageAnyPackage || userRole === 'monitor') && !isFiltering && !isPersistingOrder;

  function canManagePackageItem(pkg: PackageGroupType): boolean {
    return (
      canManageAnyPackage ||
      (userRole === 'monitor' && currentUserId != null && pkg.createdBy === currentUserId)
    );
  }

  function canDragPackage(pkg: PackageGroupType): boolean {
    return canReorder && canManagePackageItem(pkg);
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination } = result;

    if (!destination || destination.index === source.index || !canReorder) {
      return;
    }

    const nextPackages = [...orderedPackages];
    const [movedPackage] = nextPackages.splice(source.index, 1);
    nextPackages.splice(destination.index, 0, movedPackage);

    const previousPositions = new Map(orderedPackages.map((pkg) => [pkg.id, pkg.position]));
    const normalizedPackages = nextPackages.map((pkg, index) => ({
      ...pkg,
      position: index,
    }));
    const changedPackages = normalizedPackages.filter(
      (pkg) => previousPositions.get(pkg.id) !== pkg.position
    );

    if (changedPackages.length === 0) {
      return;
    }

    if (changedPackages.some((pkg) => !canManagePackageItem(pkg))) {
      notifyError(
        'Voce so pode reordenar packages criados por voce. Ajuste apenas a faixa de packages sob sua autoria.',
        'top-end'
      );
      return;
    }

    setOrderedPackages(normalizedPackages);
    setIsPersistingOrder(true);

    try {
      await Promise.all(
        changedPackages.map((pkg) =>
          dispatch(
            updatePackage({
              id: pkg.id,
              data: { position: pkg.position },
              silent: true,
            })
          ).unwrap()
        )
      );
      notifySuccess('Ordem dos packages atualizada com sucesso!', 'top-end');
    } catch (error: unknown) {
      notifyError(
        extractApiErrorMessage(error, 'Não foi possível salvar a nova ordem dos packages'),
        'top-end'
      );
      await dispatch(getPackages());
    } finally {
      setIsPersistingOrder(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-8 md:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_26%),linear-gradient(135deg,_#0f172a,_#111827)]">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="relative flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-300">
              Packages
            </p>
            <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
              Organize os packages com mais clareza.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Agrupe decks sem perder a reutilizacao dos cards nem o progresso FSRS.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(null);
                    setFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  <PiPlusBold />
                  Novo package
                </button>
              )}
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                <PiStackDuotone className="text-base" />
                {groupedDecksCount} decks posicionados em grupos
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile
              icon={<PiCardsDuotone className="text-xl" />}
              label="Packages cadastrados"
              value={total}
              tone="accent"
            />
            <SummaryTile
              icon={<PiCirclesThreePlusDuotone className="text-xl" />}
              label="Decks vinculados"
              value={groupedDecksCount}
              tone="neutral"
            />
            <SummaryTile
              icon={<PiSparkleDuotone className="text-xl" />}
              label="Packages sem deck"
              value={emptyPackagesCount}
              tone="neutral"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
              Estrutura
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Localize o package certo em segundos
            </h2>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${PUBLIC_GROUP_BADGE_CLASS}`}
            >
              {PUBLIC_GROUP_LABEL}: todos os grupos possuem acesso aberto
            </span>
          </div>

          <div className="relative w-full max-w-xl">
            <PiMagnifyingGlassDuotone className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-slate-400" />
            <Input
              className="rounded-2xl pl-11"
              placeholder="Buscar por nome, descricao ou tipo do package"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${PUBLIC_GROUP_BADGE_CLASS}`}
          >
            {PUBLIC_GROUP_LABEL}: {total}
          </span>
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            Navbar: somente os {MAX_PACKAGES_IN_NAVBAR} primeiros da ordem
          </span>
          {canManage ? (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Reordene a lista para escolher quais packages ficam visíveis no menu
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              A navegação acompanha a ordem definida pela equipe de gestão
            </span>
          )}
        </div>
      </section>

      {status === 'loading' && (
        <section className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-[28px] bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </section>
      )}

      {status === 'succeeded' && filteredPackages.length === 0 && (
        <section className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiCardsDuotone className="text-4xl" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            {query ? 'Nenhum package corresponde a busca' : 'Nenhum package foi criado ainda'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            {query
              ? 'Refine a busca ou limpe o filtro para revisar todos os packages disponiveis.'
              : 'Crie os primeiros packages para começar a distribuir decks publicos e privados com uma estrutura mais clara.'}
          </p>
          {!query && canManage && (
            <button
              type="button"
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
            >
              <PiPlusBold />
              Criar primeiro package
            </button>
          )}
        </section>
      )}

      {status === 'succeeded' && filteredPackages.length > 0 && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
                Lista
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {canManage
                  ? 'Reordene os packages com arrastar e soltar'
                  : 'Explore os packages disponiveis'}
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {canManage
                ? isFiltering
                  ? 'Limpe a busca para reorganizar a ordem da lista.'
                  : isPersistingOrder
                    ? 'Salvando nova ordem...'
                    : userRole === 'monitor'
                      ? 'Voce pode reorganizar apenas os packages criados por voce.'
                      : 'Arraste pela alca lateral para reorganizar rapidamente.'
                : 'Usuarios comuns podem navegar e consultar os packages, sem acoes de gestao.'}
            </p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <StrictModeDroppable droppableId="packages-list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="mt-5 space-y-4"
                >
                  {filteredPackages.map((pkg, index) => (
                    <Draggable
                      key={pkg.uuid}
                      draggableId={pkg.uuid}
                      index={index}
                      isDragDisabled={!canDragPackage(pkg)}
                    >
                      {(draggableProvided, snapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          style={draggableProvided.draggableProps.style}
                        >
                          <PackageItem
                            pkg={pkg}
                            decks={decksByPackage[pkg.id] ?? []}
                            isVisibleInNavbar={packagesVisibleInNavbar.has(pkg.id)}
                            onOpen={() => navigate(`/packages/${pkg.uuid}`)}
                            onEdit={
                              canManagePackageItem(pkg)
                                ? () => {
                                    setEditTarget(pkg);
                                    setFormOpen(true);
                                  }
                                : undefined
                            }
                            onDelete={
                              canManagePackageItem(pkg) ? () => setDeleteTarget(pkg) : undefined
                            }
                            dragHandleProps={
                              canDragPackage(pkg) ? draggableProvided.dragHandleProps : null
                            }
                            isDragging={snapshot.isDragging}
                            dragDisabled={!canDragPackage(pkg)}
                            showDragHandle={canDragPackage(pkg)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </section>
      )}

      {canManage && (
        <PackageFormDialog
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          initial={editTarget}
          decks={decks}
          canLinkDecks={canLinkDecks}
        />
      )}

      {canManage && (
        <DeletePackageDialog
          pkg={deleteTarget}
          deckCount={deleteDeckCount}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
