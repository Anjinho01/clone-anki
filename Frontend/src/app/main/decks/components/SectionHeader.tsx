import type { ReactNode } from 'react';

function SectionHeader({
  icon,
  title,
  description,
  count,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
      </div>
      <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {count} {count === 1 ? 'deck' : 'decks'}
      </span>
    </div>
  );
}

export default SectionHeader;
