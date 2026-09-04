import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
/* Components */
import Card from '@spark/ui/Card';
/* Store */
import { useAppSelector } from 'app/store';
import { selectSurgeriesStatusData } from '../store/surgeriesStatusSlice';

function OperatingRoom() {
  const themeMode = useAppSelector(selectFuseModeTheme); // 'light' | 'dark'
  const isDark = themeMode === 'dark';
  const { total, overviewStatus } = useAppSelector(selectSurgeriesStatusData);
  const [value, setValue] = useState(0);

  // Atualiza o valor do gauge quando os dados mudam
  useEffect(() => {
    const roomData = overviewStatus.find((item: { status: string }) => item.status === 'em sala');
    setValue(roomData?.total ?? 0);
  }, [overviewStatus]);

  // Limite dinâmico com base no total de cirurgias ou default 10
  const maxValue = useMemo(() => {
    return total > 0 ? total : 10;
  }, [total]);

  // Paleta por tema
  const COLORS = useMemo(
    () =>
      isDark
        ? {
            text: '#e5e7eb', // gray-200
            subText: '#9ca3af', // gray-400
            axis: '#6b7280', // gray-500
            track: 'rgba(255,255,255,0.10)',
            progress: '#34d399', // emerald-400
            pointer: '#e5e7eb',
          }
        : {
            text: '#1f2937', // gray-800
            subText: '#6b7280', // gray-500
            axis: '#9ca3af', // gray-400
            track: '#E6EBF8',
            progress: '#10b981', // emerald-500
            pointer: '#111827', // gray-900
          },
    [isDark]
  );

  const chartOption = useMemo(
    () => ({
      // ajuda o ECharts a ajustar alguns defaults
      darkMode: isDark,
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: maxValue,
          pointer: {
            show: true,
            length: '60%',
            width: 6,
            itemStyle: { color: COLORS.pointer },
          },
          progress: {
            show: true,
            roundCap: true,
            width: 10,
            itemStyle: { color: COLORS.progress },
          },
          axisLine: {
            lineStyle: { width: 10, color: [[1, COLORS.track]] },
          },
          axisTick: {
            distance: -15,
            length: 8,
            lineStyle: { color: COLORS.axis, width: 1 },
          },
          splitLine: {
            distance: -20,
            length: 20,
            lineStyle: { color: COLORS.axis, width: 2 },
          },
          axisLabel: {
            distance: 25,
            color: COLORS.subText,
            fontSize: 12,
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}',
            color: COLORS.text,
            fontSize: 20,
            offsetCenter: [0, '50%'],
          },
          data: [{ value }],
        },
      ],
    }),
    [value, maxValue, COLORS, isDark]
  );

  return (
    <Card bordered className="dark:border dark:border-solid dark:border-gray-600">
      <div className="flex items-center justify-between">
        <h4>Em Sala</h4>
      </div>
      <div className="mt-6">
        <ReactECharts
          key={isDark ? 'gauge-dark' : 'gauge-light'}
          option={chartOption}
          style={{ height: 300 }}
          notMerge
          lazyUpdate
        />
      </div>
    </Card>
  );
}

export default OperatingRoom;
