import { Link } from 'react-router-dom';
import Avatar from '@fuse/ui/Avatar';
import Button from '@fuse/ui/Button';
import Dialog from '@fuse/ui/Dialog';
import DialogActions from '@fuse/ui/DialogActions';
import Dropdown from '@fuse/ui/Dropdown';
import withHeaderItem from '@fuse/core/withHeaderItem';
import classNames from '@fuse/ui/utils/classNames';
import {
  PiUserDuotone,
  PiWarningDuotone,
  // PiPulseDuotone,
  PiSignOutDuotone,
} from 'react-icons/pi';
import { useState, type JSX } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from 'app/store/user/userSlice';
import apiService from '../../../auth/services/apiService';

type DropdownList = {
  label: string;
  path: string;
  icon: JSX.Element;
};

type UserProfileDropdownBaseProps = {
  className?: string;
  placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | 'bottom';
  showIdentity?: boolean;
  inverse?: boolean;
};

const dropdownItemList: DropdownList[] = [
  {
    label: 'Perfil',
    path: '/me/profile',
    icon: <PiUserDuotone />,
  },
  // {
  //   label: 'Logs de acesso',
  //   path: '/me/access',
  //   icon: <PiPulseDuotone />,
  // },
];

export function UserProfileDropdownBase({
  className,
  placement = 'bottom-end',
  showIdentity = false,
  inverse = false,
}: UserProfileDropdownBaseProps) {
  const user = useSelector(selectUser);
  const { data } = user;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    setConfirmOpen(true);
  };

  const handleCancelSignOut = () => {
    if (isSigningOut) {
      return;
    }

    setConfirmOpen(false);
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);

    try {
      await apiService.logout();
    } finally {
      setIsSigningOut(false);
      setConfirmOpen(false);
    }
  };

  const avatarProps = {
    ...(data.photoURL ? { src: data.photoURL } : { icon: <PiUserDuotone /> }),
  };

  return (
    <>
      <Dropdown
        className={classNames('flex', className)}
        toggleClassName={classNames('flex items-center', showIdentity && 'w-full')}
        renderTitle={
          <div
            className={classNames(
              'flex cursor-pointer items-center',
              showIdentity && 'w-full gap-3'
            )}
          >
            <Avatar size={32} {...avatarProps} />
            {showIdentity && (
              <div className="min-w-0 flex-1 text-left">
                <div
                  className={classNames(
                    'truncate text-sm font-semibold',
                    inverse ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                  )}
                >
                  {data.displayName}
                </div>
                <div
                  className={classNames(
                    'truncate text-xs',
                    inverse ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {data.displayRole}
                </div>
              </div>
            )}
          </div>
        }
        placement={placement}
      >
        <Dropdown.Item variant="header">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar {...avatarProps} />
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{data.displayName}</div>
              <div className="text-xs">{data.displayRole}</div>
            </div>
          </div>
        </Dropdown.Item>
        <Dropdown.Item variant="divider" />
        {dropdownItemList.map((item) => (
          <Dropdown.Item key={item.label} eventKey={item.label} className="px-0">
            <Link className="flex h-full w-full px-2" to={item.path}>
              <span className="flex w-full items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </Link>
          </Dropdown.Item>
        ))}
        <Dropdown.Item variant="divider" />
        <Dropdown.Item eventKey="Sign Out" className="gap-2" onClick={handleSignOut}>
          <span className="text-xl">
            <PiSignOutDuotone />
          </span>
          <span>Sair</span>
        </Dropdown.Item>
      </Dropdown>

      <Dialog isOpen={confirmOpen} onClose={handleCancelSignOut} width={440} title="Sair da conta">
        <div className="flex flex-col gap-5 p-2">
          <div className="flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm dark:bg-slate-900">
              <PiWarningDuotone className="text-2xl" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Você realmente quer sair agora? Sua sessão atual será encerrada neste navegador.
              </p>
            </div>
          </div>

          <DialogActions>
            <Button
              type="button"
              variant="plain"
              onClick={handleCancelSignOut}
              disabled={isSigningOut}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="solid"
              loading={isSigningOut}
              onClick={handleConfirmSignOut}
            >
              Sair
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
}

function _UserDropdown({ className }: { className?: string }) {
  return <UserProfileDropdownBase className={className} />;
}

const UserDropdown = withHeaderItem(_UserDropdown);

export default UserDropdown;
