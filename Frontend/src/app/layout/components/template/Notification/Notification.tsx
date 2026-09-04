import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import isLastChild from '@fuse/utils/isLastChild';
import useResponsive from '@fuse/hooks/useResponsive';
import withHeaderItem from '@fuse/core/withHeaderItem';
import Dropdown, { type DropdownRef } from '@fuse/ui/Dropdown';
import ScrollBar from '@fuse/ui/ScrollBar';
import Spinner from '@fuse/ui/Spinner';
import Badge from '@fuse/ui/Badge';
import Button from '@fuse/ui/Button';
import Tooltip from '@fuse/ui/Tooltip';
import {
  HiOutlineMailOpen,
  HiOutlineBell,
  HiOutlineUserAdd,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import NotificationToggle from './NotificationToggle';
/* Store */
import { useAppDispatch } from 'app/store';
import { useSelector } from 'react-redux';
import {
  getUnreadCount,
  getFirstPage,
  getNextPage,
  doMarkAsRead,
  setOpenedOnce,
  locallyMarkAsRead,
  locallyMarkManyAsRead, // <- NOVO
  selectNotificationsAll,
  selectNotificationsHasMore,
  selectNotificationsLoading,
  selectNotificationsUnreadDot,
} from 'app/store/notifications/notificationsSlice';

const notificationHeight = 'h-[280px]';

/* helpers */
const truncate = (txt?: string, max = 80) => {
  if (!txt) return '';
  return txt.length > max ? `${txt.slice(0, max - 1)}…` : txt;
};

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

type Kind = 'user' | 'team' | 'other';

type NotificationItem = {
  id: number;
  title?: string;
  message?: string;
  linkUrl?: string | null;
  linkLabel?: string;
  isRead: boolean;
  createdAt?: string;
};

// Deriva tipo pelo conteúdo (fallback robusto)
const detectKind = (item: NotificationItem): Kind => {
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

const _Notification = ({ className }: { className?: string }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const list = useSelector(selectNotificationsAll);
  const hasMore = useSelector(selectNotificationsHasMore);
  const loading = useSelector(selectNotificationsLoading);
  const showDot = useSelector(selectNotificationsUnreadDot);

  const { larger } = useResponsive();
  const dropdownRef = useRef<DropdownRef>(null);

  useEffect(() => {
    dispatch(getUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    const id = setInterval(() => {
      dispatch(getUnreadCount());
    }, 60_000);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    if (list.length === 0 || showDot) {
      dispatch(getFirstPage());
    }
  }, [dispatch, showDot]);

  const onNotificationOpen = useCallback(() => {
    dispatch(setOpenedOnce(true));
    if (list.length === 0) dispatch(getFirstPage());
  }, [dispatch, list.length]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (loading || !hasMore) return;
      const target = e.currentTarget;
      const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 32;
      if (nearBottom) dispatch(getNextPage());
    },
    [dispatch, loading, hasMore]
  );

  // Marca SOMENTE as notificações carregadas e ainda não lidas
  const handleMarkAll = useCallback(() => {
    const idsToMark = list.filter((n) => !n.isRead).map((n) => n.id);
    if (idsToMark.length === 0) return;

    // Otimista local
    dispatch(locallyMarkManyAsRead(idsToMark));
    // Efetiva no backend (um POST por id)
    idsToMark.forEach((id) => dispatch(doMarkAsRead(id)));
  }, [dispatch, list]);

  const goToItem = useCallback(
    (id: number, link?: string | null) => {
      dispatch(locallyMarkAsRead(id)); // feedback instantâneo
      dispatch(doMarkAsRead(id));
      if (link) {
        navigate(link);
        dropdownRef.current?.handleDropdownClose();
      }
    },
    [dispatch, navigate]
  );

  const handleViewAllActivity = useCallback(() => {
    navigate('/notifications');
    dropdownRef.current?.handleDropdownClose();
  }, [navigate]);

  return (
    <Dropdown
      ref={dropdownRef}
      renderTitle={<NotificationToggle dot={showDot} className={className} />}
      menuClass="min-w-[280px] md:min-w-[360px]"
      placement={larger.md ? 'bottom-end' : 'bottom'}
      onOpen={onNotificationOpen}
    >
      <Dropdown.Item variant="header">
        <div className="mb-1 flex items-center justify-between px-2 dark:border-gray-700">
          <h6>Notificações</h6>
          <Tooltip title="Marcar visíveis como lidas">
            <Button
              variant="plain"
              shape="circle"
              size="sm"
              icon={<HiOutlineMailOpen className="text-xl" />}
              onClick={handleMarkAll}
            />
          </Tooltip>
        </div>
      </Dropdown.Item>

      <ScrollBar className={classNames('overflow-y-auto', notificationHeight)} onScroll={onScroll}>
        {list.length > 0 &&
          list.map((item, index) => {
            const kind = detectKind(item);
            return (
              <div key={item.id}>
                <div
                  className="relative flex cursor-pointer rounded-xl px-4 py-3 hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => goToItem(item.id, item.linkUrl)}
                >
                  {/* Ícone */}
                  <div className="flex-shrink-0">
                    <div
                      className={classNames(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        item.isRead
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      {getIcon(kind)}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="mx-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="heading-text truncate font-semibold">
                        {truncate(item.title, 40)}
                      </span>
                    </div>

                    {item.message && (
                      <div className="truncate text-sm text-gray-600 dark:text-gray-300">
                        {truncate(item.message, 90)}
                      </div>
                    )}

                    <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                  </div>

                  {/* “dot” de leitura */}
                  <Badge
                    className="absolute top-4 mt-1.5 ltr:right-4 rtl:left-4"
                    innerClass={item.isRead ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary'}
                  />
                </div>

                {!isLastChild(list, index) ? (
                  <div className="my-2 border-b border-gray-200 dark:border-gray-700" />
                ) : null}
              </div>
            );
          })}

        {loading && (
          <div className={classNames('flex items-center justify-center', notificationHeight)}>
            <Spinner size={40} />
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className={classNames('flex items-center justify-center', notificationHeight)}>
            <div className="text-center">
              <h6 className="font-semibold">Sem notificações!</h6>
            </div>
          </div>
        )}
      </ScrollBar>

      <Dropdown.Item variant="header">
        <div className="pt-4">
          <Button block variant="solid" onClick={handleViewAllActivity}>
            Ver todas
          </Button>
        </div>
      </Dropdown.Item>
    </Dropdown>
  );
};

const Notification = withHeaderItem(_Notification);
export default Notification;
