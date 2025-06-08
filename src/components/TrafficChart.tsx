import { useAtom } from 'jotai';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { fetchData } from '../api/traffic';
import useLineChart from '../hooks/useLineChart';
import { chartJSResource, getChartStyles, commonDataSetProps } from '../misc/chart';
import { selectedChartStyleIndexAtom, useApiConfig } from '../store/app';

const { useMemo, useRef, useEffect, useState } = React;

const chartWrapperStyle: React.CSSProperties = {
  // make chartjs chart responsive
  position: 'relative',
  width: '100%',
  height: '100%',
};

export default function TrafficChart() {
  const [selectedChartStyleIndex] = useAtom(selectedChartStyleIndexAtom);
  const apiConfig = useApiConfig();
  const ChartMod = chartJSResource.read();
  const traffic = fetchData(apiConfig);
  const { t } = useTranslation();
  const [themeChangeCounter, setThemeChangeCounter] = useState(0);
  
  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeChangeCounter(prev => prev + 1);
    };

    // 监听系统主题变化（用于auto模式）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    // 监听手动主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      observer.disconnect();
    };
  }, []);
  
  // 使用 useMemo 缓存样式配置，在主题变化时重新计算
  const chartStyle = useMemo(() => getChartStyles()[selectedChartStyleIndex], [selectedChartStyleIndex, themeChangeCounter]);
  
  // 使用 useMemo 缓存标签，避免每次重新创建
  const labels = useMemo(() => ({
    up: t('Up'),
    down: t('Down'),
  }), [t]);
  
  // 创建图表数据，但减少不必要的重新创建
  const data = useMemo(
    () => ({
      labels: traffic.labels,
      datasets: [
        {
          ...commonDataSetProps,
          ...chartStyle.up,
          label: labels.up,
          data: traffic.up,
        },
        {
          ...commonDataSetProps,
          ...chartStyle.down,
          label: labels.down,
          data: traffic.down,
        },
      ],
    }),
    [traffic.labels, traffic.up, traffic.down, chartStyle, labels],
  );

  useLineChart(ChartMod.Chart, 'trafficChart', data, traffic);

  return (
    <div style={chartWrapperStyle}>
      <canvas id="trafficChart" />
    </div>
  );
}
