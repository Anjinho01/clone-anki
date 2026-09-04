import { useEffect } from 'react';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import {
  PiCalendarDotsDuotone,
  PiChartLineUpDuotone,
  PiClockCountdownDuotone,
  PiPulseDuotone,
  PiTargetDuotone,
} from 'react-icons/pi';
import { useAppDispatch, useAppSelector } from 'app/store';
import {
  getStatistics,
  selectStatisticsData,
  selectStatisticsDays,
  selectStatisticsError,
  selectStatisticsStatus,
  setStatisticsDays,
} from './store/statisticsSlice';

const PERIOD_OPTIONS: Array<7 | 30 | 90> = [7, 30, 90];

function formatDuration(durationMs: number): string {
  if (!durationMs) {
    return '0s';
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function StatisticsApp() {
  const dispatch = useAppDispatch();
  const days = useAppSelector(selectStatisticsDays);
  const status = useAppSelector(selectStatisticsStatus);
  const error = useAppSelector(selectStatisticsError);
  const data = useAppSelector(selectStatisticsData);

  useEffect(() => {
    const promise = dispatch(getStatistics({ days }));
    return () => promise.abort();
  }, [days, dispatch]);

  const chartData = data?.reviewsByDay ?? [];
  const chartOption = {
    animationDuration: 500,
    color: ['#0ea5e9'],
    grid: {
      left: 16,
      right: 16,
      top: 24,
      bottom: 16,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderWidth: 0,
      textStyle: {
        color: '#f8fafc',
      },
      valueFormatter: (value: number) => `${value} revisoes`,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      data: chartData.map((item) => dayjs(item.date).format('DD/MM')),
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.18)',
        },
      },
    },
    series: [
      {
        name: 'Revisoes',
        type: 'line',
        smooth: true,
        symbolSize: 8,
        areaStyle: {
          color: 'rgba(14, 165, 233, 0.12)',
        },
        lineStyle: {
          width: 4,
        },
        data: chartData.map((item) => item.count),
      },
    ],
  };

  const totalReviews = data?.totalReviews ?? 0;
  const activeDays = chartData.length;
  const averageReviewsPerDay = activeDays > 0 ? (totalReviews / activeDays).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a,_#111827)]">
        <div className="absolute -top-8 right-0 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-600 uppercase dark:text-sky-300">
              Estatisticas pessoais
            </p>
            <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white">
              Entenda seu ritmo de revisao e a consistencia do estudo.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              O painel resume apenas seus dados de estudo e usa o historico real de revisoes do FSRS
              no periodo selecionado.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => {
              const active = option === days;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => dispatch(setStatisticsDays(option))}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-slate-950 text-white dark:bg-sky-500'
                      : 'border border-slate-200 bg-white/80 text-slate-600 hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:text-sky-200'
                  }`}
                >
                  {option} dias
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {status === 'loading' && !data ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-[28px] bg-slate-200/70 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : null}

      {status === 'failed' ? (
        <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <PiChartLineUpDuotone className="text-4xl" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Nao foi possivel carregar suas estatisticas
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
            {error ?? 'Tente novamente para atualizar o painel de revisoes e retencao.'}
          </p>
          <button
            type="button"
            onClick={() => dispatch(getStatistics({ days }))}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
          >
            <PiPulseDuotone />
            Tentar novamente
          </button>
        </section>
      ) : null}

      {status !== 'failed' ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                <PiPulseDuotone className="text-2xl" />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                Total de revisoes
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                {totalReviews}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No periodo selecionado.
              </p>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <PiTargetDuotone className="text-2xl" />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                Taxa de retencao
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                {formatPercent(data?.retentionRate ?? 0)}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Base atual: reviews com nota 3 ou 4.
              </p>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <PiClockCountdownDuotone className="text-2xl" />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                Duracao media
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                {formatDuration(data?.averageDurationMs ?? 0)}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Tempo medio por revisao.
              </p>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <PiCalendarDotsDuotone className="text-2xl" />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                Dias com atividade
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                {activeDays}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Media de {averageReviewsPerDay} revisoes por dia ativo.
              </p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <article className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.24em] text-sky-600 uppercase dark:text-sky-300">
                    Serie diaria
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                    Revisoes por dia
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    Volume diario de revisoes concluido nos ultimos {days} dias.
                  </p>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="mt-6 rounded-[28px] bg-slate-50 p-2 dark:bg-slate-950/40">
                  <ReactECharts option={chartOption} style={{ height: 320, width: '100%' }} />
                </div>
              ) : (
                <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-950/20">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <PiChartLineUpDuotone className="text-3xl" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                    Sem revisoes registradas no periodo
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                    Assim que voce revisar cards, a distribuicao diaria aparecera aqui para ajudar a
                    acompanhar consistencia e volume.
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-600 uppercase dark:text-sky-300">
                Leitura rapida
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                O que observar agora
              </h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950/30">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Consistencia
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {activeDays > 0
                      ? `Voce estudou em ${activeDays} dias dentro da janela atual.`
                      : 'Ainda nao houve atividade registrada nesta janela de analise.'}
                  </p>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950/30">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Retencao</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {data?.retentionRate
                      ? `Sua retencao atual esta em ${formatPercent(data.retentionRate)} nesta leitura inicial.`
                      : 'A taxa de retencao aparecera quando houver reviews suficientes no periodo.'}
                  </p>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950/30">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Cadencia</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    Sua media esta em {averageReviewsPerDay} revisoes por dia com atividade nesta
                    janela.
                  </p>
                </div>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
