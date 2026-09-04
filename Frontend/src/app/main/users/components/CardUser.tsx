import Card from '@fuse/ui/Card';
import Avatar from '@fuse/ui/Avatar';
import { PiCaretRightBold } from 'react-icons/pi';
import { HiOutlineUser } from 'react-icons/hi';
/* Store */
import { useAppDispatch } from 'app/store';
import { openEditUserDialog } from '../store/userSlice';

interface CardUserProps {
  userId: number;
  name: string;
  role: string;
}

function CardUser(props: CardUserProps) {
  const { userId, name, role } = props;

  const dispatch = useAppDispatch();

  return (
    <Card
      clickable
      className="group rounded-[24px] border border-slate-200 bg-white p-0 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900/50"
      onClick={() => dispatch(openEditUserDialog({ userId }))}
    >
      <div className="flex items-center gap-4 p-4 md:p-5">
        <Avatar
          size={52}
          className="shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
          icon={<HiOutlineUser />}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">
            Usuário
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-slate-950 dark:text-white">
            {name}
          </h3>
          <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {role}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-sky-600 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-sky-950/30 dark:group-hover:text-sky-300">
          <PiCaretRightBold className="text-sm" />
        </div>
      </div>
    </Card>
  );
}

export default CardUser;
