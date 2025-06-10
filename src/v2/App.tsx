import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';

// 导入V2独立的状态管理
import { v2ThemeAtom, v2CurrentPageAtom } from './store/atoms';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { TestPage } from './pages/TestPage';
import { Proxies } from './pages/Proxies';
import { Connections } from './pages/Connections';
import { Rules } from './pages/Rules';
import { Logs } from './pages/Logs';
import { Config } from './pages/Config';
import { APIConfig } from './pages/APIConfig';
import { useV1V2Sync } from './hooks/useV1V2Sync';
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
  const [theme] = useAtom(v2ThemeAtom);
  
  React.useEffect(() => {
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
};

const useRouter = () => {
  const [currentPage, setCurrentPage] = useAtom(v2CurrentPageAtom);
  
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setCurrentPage(hash);
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setCurrentPage]);
  
  return currentPage;
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
  // V1和V2状态同步
  useV1V2Sync();
  
  React.useEffect(() => {
    // V2 特有的初始化逻辑
    const savedPreferences = localStorage.getItem('v2-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        console.log('V2 preferences loaded:', preferences);
      } catch (error) {
        console.warn('Failed to parse saved V2 preferences:', error);
      }
    }
  }, []);
  
  return <>{children}</>;
};

export const AppV2: React.FC = () => {
  const currentPage = useRouter();
  useThemeManager();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        <AppLayout>
          <PageRenderer currentPage={currentPage} />
        </AppLayout>
      </AppInitializer>
    </QueryClientProvider>
  );
}; 