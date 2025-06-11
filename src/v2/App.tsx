import './styles/globals.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';

import { Sidebar } from './components/layout/Sidebar';
import { Config } from './pages/Config';
import { Connections } from './pages/Connections';
import { Dashboard } from './pages/Dashboard';
import { Logs } from './pages/Logs';
import { Proxies } from './pages/Proxies';
import { Rules } from './pages/Rules';
import { TestPage } from './pages/TestPage';
import { v2ThemeAtom } from './store/atoms';
import { applyTheme, initializeTheme, setTheme,watchSystemTheme } from './utils/theme';

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// 页面渲染组件
const PageRenderer: React.FC<{ currentPage: string }> = ({ currentPage }) => {
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'proxies':
      return <Proxies />;
    case 'connections':
      return <Connections />;
    case 'rules':
      return <Rules />;
    case 'logs':
      return <Logs />;
    case 'config':
      return <Config />;
    case 'test':
      return <TestPage />;
    default:
      return <Dashboard />;
  }
};

export const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useAtom(v2ThemeAtom);
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  // 初始化主题 - 只在组件挂载时执行一次
  useEffect(() => {
    const initialTheme = initializeTheme();
    if (initialTheme !== currentTheme) {
      setCurrentTheme(initialTheme);
    }
  }, [currentTheme, setCurrentTheme]); // 添加依赖项避免警告

  // 监听系统主题变化
  useEffect(() => {
    const cleanup = watchSystemTheme(() => {
      if (currentTheme === 'auto') {
        // 系统主题变化时，重新应用auto主题
        applyTheme('auto');
      }
    });

    return cleanup;
  }, [currentTheme]); // 当主题变化时重新设置监听器

  // 主题变化时应用到DOM
  useEffect(() => {
    console.log('🎨 应用主题:', currentTheme);
    applyTheme(currentTheme);
    setTheme(currentTheme);
  }, [currentTheme]);

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}; 