import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';

// 导入现有的 V1 状态管理
import { themeAtom, setTheme } from '../store/app';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { TestPage } from './pages/TestPage';
import { Proxies } from './pages/Proxies';
import { Connections } from './pages/Connections';
import { Rules } from './pages/Rules';
import { Logs } from './pages/Logs';
import { Config } from './pages/Config';
import { APIConfig } from './pages/APIConfig';
import { useAppState, actions } from './store';
import { useApiConfigEffect } from './hooks/useAPI';
import { AppConfigSideEffect } from '../components/fn/AppConfigSideEffect';
import './styles/globals.css';

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

const useThemeManager = () => {
  const [v1Theme, setV1Theme] = useAtom(themeAtom);
  
  React.useEffect(() => {
    // 使用现有的 V1 主题设置函数
    setTheme(v1Theme);
  }, [v1Theme]);
  
  React.useEffect(() => {
    if (v1Theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.classList.toggle('dark', v1Theme === 'dark');
    }
  }, [v1Theme]);
};

const useRouter = () => {
  const { state, dispatch } = useAppState();
  
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      dispatch(actions.setCurrentPage(hash));
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [dispatch]);
  
  return state.currentPage;
};

const PageRenderer: React.FC<{ currentPage: string }> = ({ currentPage }) => {
  switch (currentPage) {
    case 'test':
      return <TestPage />;
    case 'proxies':
      return <Proxies />;
    case 'connections':
      return <Connections />;
    case 'rules':
      return <Rules />;
    case 'logs':
      return <Logs />;
    case 'configs':
      return <Config />;
    case 'api-config':
      return <APIConfig />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
};

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dispatch } = useAppState();
  
  // 添加全局 API 配置监听
  useApiConfigEffect();
  
  React.useEffect(() => {
    // V2 特有的初始化逻辑
    const savedPreferences = localStorage.getItem('v2-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch(actions.updatePreferences(preferences));
      } catch (error) {
        console.warn('Failed to parse saved V2 preferences:', error);
      }
    }
  }, [dispatch]);
  
  return <>{children}</>;
};

export const AppV2: React.FC = () => {
  const currentPage = useRouter();
  useThemeManager();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        <AppConfigSideEffect />
        <AppLayout>
          <PageRenderer currentPage={currentPage} />
        </AppLayout>
      </AppInitializer>
    </QueryClientProvider>
  );
}; 