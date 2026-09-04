/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbCircleCheck, TbArrowNarrowRight } from 'react-icons/tb';
import { HiOutlineBell, HiOutlineUserAdd, HiOutlineUserGroup } from 'react-icons/hi';
/* Fuse */
import Container from '@fuse/shared/Container';
import Card from '@fuse/ui/Card';
import Button from '@fuse/ui/Button';
import Spinner from '@fuse/ui/Spinner';
/* Store */
import { useAppDispatch, useAppSelector } from 'app/store';
import {
  getFirstPage,
  getNextPage,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  resetList,
  setOnlyUnread,
  locallyMarkAsRead,
  selectNotificationsAll,
  selectNotificationsLoading,
  selectNotificationsLoadingMore,
  selectNotificationsHasMore,
} from './store/notificationsSlice';

/* ========= utils ======== */
function fmtTime(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDayHeader(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit' });
  const month = d.toLocaleDateString('pt-BR', { month: 'long' });
  return `${weekday.toUpperCase()}, ${day} ${month.toUpperCase()}`;
}
function sameDay(a: string, b: string) {
  const da = new Date(a),
    db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/* ========= tipo + ícone (mesmo padrão do dropdown) ======== */
type Kind = 'user' | 'team' | 'other';

const detectKind = (item: any): Kind => {
  const s = `${item.linkUrl ?? ''} ${item.linkLabel ?? ''} ${item.title ?? ''}`.toLowerCase();
  if (s.includes('/users') || s.includes('usuário')) return 'user';
  if (s.includes('equipe') || s.includes('team')) return 'team';
  return 'other';
};

function getIcon(kind: Kind) {
  switch (kind) {
    case 'user':
      return <HiOutlineUserAdd className="text-xl" />;
    case 'team':
      return <HiOutlineUserGroup className="text-xl" />;
    default:
      return <HiOutlineBell className="text-xl" />;
  }
}

type Group = {
  dayKey: string;
  header: string;
  items: Array<ReturnType<typeof selectNotificationsAll>[number]>;
};

export default function NotificationsApp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const items = useAppSelector(selectNotificationsAll);
  const loading = useAppSelector(selectNotificationsLoading);
  const loadingMore = useAppSelector(selectNotificationsLoadingMore);
  const hasMore = useAppSelector(selectNotificationsHasMore);
  const totalNotifications = items.length;

  useEffect(() => {
    dispatch(setOnlyUnread(false)); // página mostra TUDO
    dispatch(resetList());
    dispatch(getFirstPage());
    dispatch(getUnreadCount());
  }, [dispatch]);

  const onLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) dispatch(getNextPage());
  }, [dispatch, loadingMore, hasMore]);

  // Agrupa por dia
  const groups = useMemo(() => {
    const out: { dayKey: string; header: string; items: any[] }[] = [];
    for (const n of items) {
      const key = new Date(n.createdAt).toDateString();
      const last = out[out.length - 1];
      if (last && sameDay(last.items[0].createdAt, n.createdAt)) {
        last.items.push(n);
      } else {
        out.push({
          dayKey: key,
          header: fmtDayHeader(n.createdAt),
          items: [n],
        });
      }
    }
    return out as Group[];
  }, [items]);

  return (
    <Container className="px-4 py-5 md:px-8 md:py-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
        <Card className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:rounded-[32px] md:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                  <HiOutlineBell className="text-sm" />
                  Central de notificações
                </span>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  {totalNotifications} {totalNotifications === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
                  Notificações
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Acompanhe alertas do sistema, convites e atualizações recentes sem alterar a
                  estrutura original da central.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <Button
                type="button"
                variant="plain"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                onClick={() => dispatch(markAllAsRead())}
              >
                Marcar todas como lidas
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-[24px] border border-slate-200 bg-white p-0 shadow-sm md:rounded-[32px] dark:border-slate-800 dark:bg-slate-900">
          {loading && items.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <Spinner size={24} />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <HiOutlineBell className="text-3xl" />
              </div>
              <h4 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
                Nenhuma notificação
              </h4>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Quando houver novidades, avisos ou ações pendentes, elas aparecerão aqui com a mesma
                organização por data.
              </p>
            </div>
          ) : (
            <div className="p-4 md:p-6">
              {groups.map((g) => (
                <section key={g.dayKey} className="mb-8 last:mb-0">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {g.header}
                    </div>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>

                  <div className="relative">
                    <div className="absolute top-0 bottom-0 left-[18px] w-px bg-slate-200 dark:bg-slate-800" />

                    <ul className="space-y-4">
                      {g.items.map((n) => {
                        const kind = detectKind(n);
                        return (
                          <li key={n.id} className="relative pl-14">
                            {/* DOT COM BORDA (ajuste pedido) */}
                            <div className="absolute top-5 left-[10px] flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.92)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_0_0_4px_rgba(15,23,42,0.92)]">
                              {!n.isRead && (
                                <span className="bg-primary block h-1.5 w-1.5 rounded-full" />
                              )}
                            </div>

                            {/* CARD DO EVENTO SEM BORDA NEM SOMBRA (ajuste pedido) */}
                            <div
                              className={[
                                'rounded-[22px] border px-4 py-4 transition-colors md:px-5',
                                n.isRead
                                  ? 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80'
                                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/70',
                              ].join(' ')}
                            >
                              <div className="flex items-start gap-3.5">
                                {/* Ícone por tipo (mesmo padrão do dropdown) */}
                                <div
                                  className={[
                                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                                    n.isRead
                                      ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                      : 'bg-primary/10 text-primary',
                                  ].join(' ')}
                                >
                                  {getIcon(kind)}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="heading-text text-[15px] font-semibold text-slate-950 dark:text-white">
                                      {n.title}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                      {fmtTime(n.createdAt)}
                                    </span>
                                    {/* {n.expiresAt && (
                                        <span className="text-xs opacity-70">
                                          • expira {fmtTime(n.expiresAt)}
                                        </span>
                                      )} */}
                                    {n.isRead && (
                                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100">
                                        Lida
                                      </span>
                                    )}
                                  </div>

                                  {n.message && (
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                      {n.message}
                                    </p>
                                  )}

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {!n.isRead && (
                                      <Button
                                        size="sm"
                                        type="button"
                                        variant="solid"
                                        className="rounded-full px-3.5"
                                        icon={<TbCircleCheck />}
                                        onClick={() => {
                                          dispatch(locallyMarkAsRead(n.id));
                                          dispatch(markAsRead({ id: n.id }));
                                        }}
                                      >
                                        Marcar como lida
                                      </Button>
                                    )}

                                    {n.linkUrl && (
                                      <Button
                                        size="sm"
                                        type="button"
                                        variant="plain"
                                        className="rounded-full border border-slate-200 bg-slate-50 px-3.5 dark:border-slate-700 dark:bg-slate-800"
                                        icon={<TbArrowNarrowRight />}
                                        onClick={() =>
                                          navigate(n.linkUrl ?? '', {
                                            state: { params: n.linkParams },
                                          })
                                        }
                                      >
                                        Abrir
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              ))}

              <div className="mt-6 flex justify-center">
                {hasMore ? (
                  <Button loading={loadingMore} className="rounded-full px-5" onClick={onLoadMore}>
                    Carregar mais
                  </Button>
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Não há mais notificações
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
