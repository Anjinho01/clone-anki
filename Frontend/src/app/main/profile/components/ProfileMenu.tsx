import { TbUserSquare, TbLock /* TbBell */ } from 'react-icons/tb';
import { useLocation, useNavigate } from 'react-router-dom';
/* Type */
import type { ViewType } from '../types/ViewType';
import type { ReactNode } from 'react';

const menuList: { label: string; value: ViewType; icon: ReactNode }[] = [
  { label: 'Perfil', value: 'profile', icon: <TbUserSquare /> },
  { label: 'Segurança', value: 'security', icon: <TbLock /> },
  // { label: 'Acessos', value: 'access', icon: <TbBell /> },
];

const ProfileMenu = ({ onChange }: { onChange?: () => void }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastPath = pathname.split('/').filter(Boolean).pop();

  const handleSelect = (value: ViewType) => {
    navigate(`/me/${value}`);
    onChange?.();
  };

  return (
    <nav className="flex flex-col gap-2">
      {menuList.map((menu) => {
        const isActive = lastPath === menu.value;

        return (
          <button
            key={menu.value}
            type="button"
            onClick={() => handleSelect(menu.value)}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
              isActive
                ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300'
                : 'border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white dark:bg-slate-950/20 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-slate-900'
            }`}
          >
            <span className="text-2xl">{menu.icon}</span>
            <span className="text-sm font-medium">{menu.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default ProfileMenu;
