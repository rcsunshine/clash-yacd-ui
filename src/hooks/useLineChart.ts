import type { ChartConfiguration } from 'chart.js';
import React from 'react';
import { getCommonChartOptions } from 'src/misc/chart';

const { useEffect, useRef, useState } = React;

export default function useLineChart(
  chart: typeof import('chart.js').Chart,
  elementId: string,
  data: ChartConfiguration['data'],
  subscription: any,
  extraChartOptions = {},
) {
  const chartRef = useRef<any>(null);
  const unsubscribeRef = useRef<any>(null);
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

  useEffect(() => {
    const ctx = (document.getElementById(elementId) as HTMLCanvasElement).getContext('2d');
    const options = { ...getCommonChartOptions(), ...extraChartOptions };
    
    // 创建图表
    chartRef.current = new chart(ctx, { type: 'line', data, options });
    
    // 订阅数据更新
    if (subscription) {
      unsubscribeRef.current = subscription.subscribe(() => {
        if (chartRef.current) {
          chartRef.current.update('none');
        }
      });
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chart, elementId, themeChangeCounter]); // 添加 themeChangeCounter 依赖

  // 当数据或选项变化时，更新图表
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = data;
      chartRef.current.options = { ...getCommonChartOptions(), ...extraChartOptions };
      chartRef.current.update('none');
    }
  }, [data, extraChartOptions, themeChangeCounter]);
}
