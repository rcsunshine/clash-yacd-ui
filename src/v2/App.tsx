import './styles/globals.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import React, { Suspense, useEffect } from 'react';

import { Sidebar } from './components/layout/Sidebar';
import { LoadingState } from './components/ui/LoadingState';
import { useApiConfigEffect } from './hooks/useAPI';
import { v2CurrentPageAtom,v2ThemeAtom } from './store/atoms';
import { applyTheme, initializeTheme, watchSystemTheme } from './utils/theme';

// 页面级代码分割 - 懒加载页面组件
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Proxies = React.lazy(() => import('./pages/Proxies').then(m => ({ default: m.Proxies })));
const Connections = React.lazy(() => import('./pages/Connections').then(m => ({ default: m.Connections })));
const Rules = React.lazy(() => import('./pages/Rules').then(m => ({ default: m.Rules })));
const Logs = React.lazy(() => import('./pages/Logs').then(m => ({ default: m.Logs })));
const Config = React.lazy(() => import('./pages/Config').then(m => ({ default: m.Config })));
const APIConfig = React.lazy(() => import('./pages/APIConfig').then(m => ({ default: m.APIConfig })));
const About = React.lazy(() => import('./pages/About').then(m => ({ default: m.About })));

// 创建全局 Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// 页面加载占位符
const PageLoadingFallback: React.FC<{ pageName: string }> = ({ pageName }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingState text={`正在加载${pageName}...`} />
  </div>
);

// 页面渲染组件
const PageRenderer: React.FC<{ currentPage: string }> = ({ currentPage }) => {
  const getPageComponent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Suspense fallback={<PageLoadingFallback pageName="概览" />}><Dashboard /></Suspense>;
      case 'proxies':
        return <Suspense fallback={<PageLoadingFallback pageName="代理" />}><Proxies /></Suspense>;
      case 'connections':
        return <Suspense fallback={<PageLoadingFallback pageName="连接" />}><Connections /></Suspense>;
      case 'rules':
        return <Suspense fallback={<PageLoadingFallback pageName="规则" />}><Rules /></Suspense>;
      case 'logs':
        return <Suspense fallback={<PageLoadingFallback pageName="日志" />}><Logs /></Suspense>;
      case 'config':
        return <Suspense fallback={<PageLoadingFallback pageName="配置" />}><Config /></Suspense>;
      case 'api-config':
        return <Suspense fallback={<PageLoadingFallback pageName="API配置" />}><APIConfig /></Suspense>;
      case 'about':
        return <Suspense fallback={<PageLoadingFallback pageName="关于" />}><About /></Suspense>;
      default:
        return <Suspense fallback={<PageLoadingFallback pageName="概览" />}><Dashboard /></Suspense>;
    }
  };

  return getPageComponent();
};

// 内部应用组件 - 在QueryClientProvider内部
const InnerApp: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useAtom(v2ThemeAtom);
  const [currentPage, setCurrentPage] = useAtom(v2CurrentPageAtom);

  // 启用API配置变更监听（需要在QueryClientProvider内部）
  useApiConfigEffect();

  // 初始化主题 - 只在组件挂载时执行一次
  useEffect(() => {
    const initialTheme = initializeTheme();
    if (initialTheme !== currentTheme) {
      setCurrentTheme(initialTheme);
    }
  }, [currentTheme, setCurrentTheme]);

  // 监听系统主题变化
  useEffect(() => {
    const cleanup = watchSystemTheme(() => {
      if (currentTheme === 'auto') {
        // 系统主题变化时，重新应用auto主题
        applyTheme('auto');
      }
    });

    return cleanup;
  }, [currentTheme]);

  // 主题变化时应用到DOM
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // 页面变化时保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('v2-current-page', currentPage);
    } catch (error) {
      console.warn('Failed to save current page to localStorage:', error);
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="flex h-screen">
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
        />
        
        <main className="flex-1 overflow-hidden">
          <PageRenderer currentPage={currentPage} />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
    </QueryClientProvider>
  );
}; 