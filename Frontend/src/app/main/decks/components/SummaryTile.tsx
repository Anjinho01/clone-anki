import type { ReactNode } from 'react';

function SummaryTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-4 ${
        accent
          ? 'border-sky-200 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/30'
          : 'border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70'
      }`}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default SummaryTile;
