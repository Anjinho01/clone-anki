import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
/* Components */
import Card from '@spark/ui/Card';
/* Store */
import { useAppSelector } from 'app/store';
import { selectSurgeriesSuspensionData } from '../store/surgeriesSuspensionSlice';

function ReasonsForSuspension() {
  const themeMode = useAppSelector(selectFuseModeTheme); // 'light' | 'dark'
  const isDark = themeMode === 'dark';
  const { total, patient, structure, team } = useAppSelector(selectSurgeriesSuspensionData);

  // Se não houver dados, mostra fallback
  const noData = total === 0;

  // Paleta por tema
  const COLORS = useMemo(
    () =>
      isDark
        ? {
            text: '#e5e7eb', // gray-200
            subText: '#9ca3af', // gray-400
            legend: '#9ca3af',
            tooltipBg: 'rgba(17,24,39,0.95)', // gray-900
            slice: ['#60a5fa', '#f87171', '#34d399'], // blue-400, red-400, emerald-400
          }
        : {
            text: '#1f2937', // gray-800
            subText: '#6b7280', // gray-500
            legend: '#6b7280',
            tooltipBg: 'rgba(255,255,255,0.95)',
            slice: ['#2196f3', '#ef4444', '#10b981'], // azul, red-500, emerald-500
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
          name: 'Suspensão',
          type: 'pie',
          radius: '60%',
          center: ['50%', '60%'],
          label: {
            show: true,
            formatter: '{d}%',
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
              value: patient,
              name: 'Paciente',
              itemStyle: { color: COLORS.slice[0] },
            },
            {
              value: structure,
              name: 'Estrutura',
              itemStyle: { color: COLORS.slice[1] },
            },
            {
              value: team,
              name: 'Equipe',
              itemStyle: { color: COLORS.slice[2] },
            },
          ],
        },
      ],
    } as echarts.EChartsOption;
  }, [noData, patient, structure, team, COLORS, isDark]);

  return (
    <Card bordered className="dark:border dark:border-solid dark:border-gray-600">
      <div className="flex items-center justify-between">
        <h4>Motivo de Suspensão</h4>
      </div>
      <div className="mt-6">
        <ReactECharts
          key={isDark ? 'pie-reasons-dark' : 'pie-reasons-light'} // re-mount ao trocar tema
          option={chartOption}
          style={{ height: 450 }}
          notMerge
          lazyUpdate
        />
      </div>
    </Card>
  );
}

export default ReasonsForSuspension;
