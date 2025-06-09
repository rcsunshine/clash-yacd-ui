import { createAsset } from 'use-asset';

import prettyBytes from './pretty-bytes';
export const chartJSResource = createAsset(() => {
  return import('$src/misc/chart-lib');
});

export const commonDataSetProps = { borderWidth: 1, pointRadius: 0, tension: 0.2, fill: true };

// 动态图表选项，根据主题调整
export function getCommonChartOptions(): import('chart.js').ChartOptions<'line'> {
  const isDark = getCurrentTheme() === 'dark';
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        labels: { 
          boxWidth: 20,
          color: isDark ? '#ddd' : '#222',
          font: {
            family: 'var(--tblr-font-sans-serif)',
            size: 12,
          }
        } 
      },
    },
    scales: {
      x: { display: false, type: 'category' },
      y: {
        type: 'linear',
        display: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          drawTicks: false,
        },
        border: {
          display: false,
          dash: [3, 6],
        },
        ticks: {
          color: isDark ? '#ddd' : '#222',
          font: {
            family: 'var(--tblr-font-sans-serif)',
            size: 11,
          },
          callback(value: number) {
            return prettyBytes(value) + '/s ';
          },
        },
      },
    },
  };
}

// 保持向后兼容性
export const commonChartOptions = getCommonChartOptions();

// 获取当前主题
function getCurrentTheme() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  
  // 如果是auto主题，需要检查系统偏好
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  return theme;
}

// 动态图表样式，根据主题调整
export function getChartStyles() {
  const isDark = getCurrentTheme() === 'dark';
  
  return [
    {
      down: {
        backgroundColor: isDark ? 'rgba(76, 175, 80, 0.6)' : 'rgba(176, 209, 132, 0.8)',
        borderColor: isDark ? 'rgb(76, 175, 80)' : 'rgb(176, 209, 132)',
      },
      up: {
        backgroundColor: isDark ? 'rgba(33, 150, 243, 0.6)' : 'rgba(181, 220, 231, 0.8)',
        borderColor: isDark ? 'rgb(33, 150, 243)' : 'rgb(181, 220, 231)',
      },
    },
    {
      up: {
        backgroundColor: isDark ? 'rgba(76, 175, 80, 0.7)' : 'rgb(98, 190, 100)',
        borderColor: isDark ? 'rgb(76, 175, 80)' : 'rgb(78,146,79)',
      },
      down: {
        backgroundColor: isDark ? 'rgba(139, 195, 74, 0.7)' : 'rgb(160, 230, 66)',
        borderColor: isDark ? 'rgb(139, 195, 74)' : 'rgb(110, 156, 44)',
      },
    },
    {
      up: {
        backgroundColor: isDark ? 'rgba(33, 150, 243, 0.5)' : 'rgba(94, 175, 223, 0.3)',
        borderColor: isDark ? 'rgb(33, 150, 243)' : 'rgb(94, 175, 223)',
      },
      down: {
        backgroundColor: isDark ? 'rgba(0, 188, 212, 0.5)' : 'rgba(139, 227, 195, 0.3)',
        borderColor: isDark ? 'rgb(0, 188, 212)' : 'rgb(139, 227, 195)',
      },
    },
    {
      up: {
        backgroundColor: isDark ? 'rgba(255, 152, 0, 0.5)' : 'rgba(242, 174, 62, 0.3)',
        borderColor: isDark ? 'rgb(255, 152, 0)' : 'rgb(242, 174, 62)',
      },
      down: {
        backgroundColor: isDark ? 'rgba(63, 81, 181, 0.5)' : 'rgba(69, 154, 248, 0.3)',
        borderColor: isDark ? 'rgb(63, 81, 181)' : 'rgb(69, 154, 248)',
      },
    },
  ];
}

// 保持向后兼容性
export const chartStyles = getChartStyles();
