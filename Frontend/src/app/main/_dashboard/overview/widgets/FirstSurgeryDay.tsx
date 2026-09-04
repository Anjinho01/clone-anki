import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
/* Components */
import Card from '@spark/ui/Card';
/* Store */
import { useAppSelector } from 'app/store';
import { selectFirstSurgeryDayData } from '../store/firstSurgeryDaySlice';

function FirstSurgeryDay() {
  const themeMode = useAppSelector(selectFuseModeTheme); // 'light' | 'dark'
  const isDark = themeMode === 'dark';
  const data = useAppSelector(selectFirstSurgeryDayData);

  const { total, le0730, between0730_0800, gt0800 } = data;
  const noData = total === 0 || (!le0730 && !between0730_0800 && !gt0800);

  // Paleta por tema
  const COLORS = useMemo(
    () =>
      isDark
        ? {
            text: '#e5e7eb', // gray-200
            subText: '#9ca3af', // gray-400
            legend: '#9ca3af',
            tooltipBg: 'rgba(17,24,39,0.95)', // gray-900
            slice: ['#34d399', '#fFeb3b', '#f87171'], // emerald-400, amber-400, red-400
          }
        : {
            text: '#1f2937', // gray-800
            subText: '#6b7280', // gray-500
            legend: '#6b7280',
            tooltipBg: 'rgba(255,255,255,0.95)',
            slice: ['#4CAF50', '#fFeb3b', '#EF4444'], // verde, amarelo, vermelho
          },
    [isDark]
  );

  const chartOption = useMemo(() => {
    // if (noData) {
    //   return {
    //     darkMode: isDark,
    //     backgroundColor: 'transparent',
    //     tooltip: { show: false },
    //     legend: { show: false },
    //     graphic: {
    //       type: 'text',
    //       left: 'center',
    //       top: 'middle',
    //       style: {
    //         text: 'Sem dados disponíveis',
    //         fill: COLORS.subText,
    //         fontSize: 16,
    //       },
    //     },
    //   } as echarts.EChartsOption;
    // }

    return {
      darkMode: isDark,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: COLORS.tooltipBg,
        borderWidth: 0,
        textStyle: { color: COLORS.text },
        formatter: '{b}: {d}%',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: COLORS.legend },
      },
      series: [
        {
          name: 'Horário das Cirurgias',
          type: 'pie',
          radius: '60%',
          center: ['50%', '60%'],
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: COLORS.text,
            fontSize: 14,
          },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0,0,0,0.2)',
            },
          },
          data: [
            {
              value: le0730,
              name: '≤ 07:30',
              itemStyle: { color: COLORS.slice[0] },
            },
            {
              value: between0730_0800,
              name: '07:30 - 08:00',
              itemStyle: { color: COLORS.slice[1] },
            },
            {
              value: gt0800,
              name: '> 08:00',
              itemStyle: { color: COLORS.slice[2] },
            },
          ],
        },
      ],
    } as echarts.EChartsOption;
  }, [noData, le0730, between0730_0800, gt0800, COLORS, isDark]);

  return (
    <Card bordered className="dark:border dark:border-solid dark:border-gray-600">
      <div className="flex items-center justify-between">
        <h4>Início da 1ª Cirurgia do Dia</h4>
      </div>
      <div className="mt-6">
        <ReactECharts
          key={isDark ? 'pie-first-dark' : 'pie-first-light'}
          option={chartOption}
          style={{ height: 450 }}
          notMerge
          lazyUpdate
        />
      </div>
    </Card>
  );
}

export default FirstSurgeryDay;
