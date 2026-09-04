import { useEffect, useRef, useState } from 'react';

interface ClockProps {
  timeZone?: string; // ex.: 'America/Sao_Paulo'
  showSeconds?: boolean; // true -> atualiza a cada 1s ; false -> a cada 1 min
  className?: string;
}

function Clock({ timeZone, showSeconds = true, className = '' }: ClockProps) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fmtTime = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: false,
      timeZone: tz,
    });

    const fmtDate = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: tz,
    });

    const tick = () => {
      const now = new Date();
      setTime(fmtTime.format(now));
      setDateStr(fmtDate.format(now));
    };

    // Limpa timers antigos
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const unit = showSeconds ? 1000 : 60_000;
    const delay = unit - (Date.now() % unit);

    startTimeoutRef.current = setTimeout(() => {
      tick();
      intervalRef.current = setInterval(tick, unit);
    }, delay);

    tick(); // primeira atualização imediata

    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeZone, showSeconds]);

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</span>
      <span className="font-mono text-lg">{time}</span>
    </div>
  );
}

export default Clock;
