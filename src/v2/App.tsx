import './styles/globals.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';

import { Sidebar } from './components/layout/Sidebar';
import { useApiConfigEffect } from './hooks/useAPI';
// 导入V1V2同步和API配置监听
import { useV1V2Sync } from './hooks/useV1V2Sync';
import { APIConfig } from './pages/APIConfig';
import { Config } from './pages/Config';
import { Connections } from './pages/Connections';
import { Dashboard } from './pages/Dashboard';
import { Logs } from './pages/Logs';
import { Proxies } from './pages/Proxies';
import { Rules } from './pages/Rules';
import { TestPage } from './pages/TestPage';
import { v2ThemeAtom } from './store/atoms';
import { applyTheme, initializeTheme, watchSystemTheme } from './utils/theme';

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
    case 'api-config':
      return <APIConfig />;
    case 'test':
      return <TestPage />;
    default:
      return <Dashboard />;
  }
};

// 内部应用组件 - 在QueryClientProvider内部
const InnerApp: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useAtom(v2ThemeAtom);
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  // 启用V1V2状态同步
  useV1V2Sync();
  
  // 启用API配置变更监听（需要在QueryClientProvider内部）
  useApiConfigEffect();

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
    console.log('🎨 App: 应用主题到DOM:', currentTheme);
    applyTheme(currentTheme);
  }, [currentTheme]);

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