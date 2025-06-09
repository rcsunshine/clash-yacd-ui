import React from 'react';
import { cn } from '../../utils/cn';
import { useAppState, actions } from '../../store';
import { StatusIndicator } from '../ui/StatusIndicator';
import { apiGet } from '../../utils/api';

export interface SidebarProps {
  className?: string;
}

export interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  href,
  active = false,
  onClick,
  badge,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (href) {
      e.preventDefault();
      window.location.hash = href.replace('#', '');
    }
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300'
      )}
    >
      {icon && (
        <span className="mr-3 flex-shrink-0 w-5 h-5">
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
};

// Add connection status hook
function useConnectionStatus() {
  const { state } = useAppState();
  const [connectionState, setConnectionState] = React.useState<{
    status: 'checking' | 'connected' | 'disconnected' | 'error';
    message: string;
    version?: string;
  }>({ status: 'checking', message: '检查连接中...' });

  React.useEffect(() => {
    let mounted = true;
    
    const checkConnection = async () => {
      if (!mounted) return;
      
      try {
        const response = await apiGet(state.apiConfig, '/version');
        
        if (!mounted) return;
        
        if (response.status === 200 && response.data) {
          setConnectionState({
            status: 'connected',
            message: '已连接',
            version: response.data.version,
          });
        } else {
          setConnectionState({
            status: 'disconnected',
            message: response.error || '连接失败',
          });
        }
      } catch (error) {
        if (!mounted) return;
        
        setConnectionState({
          status: 'error',
          message: '网络错误',
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [state.apiConfig]);

  return connectionState;
}

export function Sidebar(props: SidebarProps = {}) {
  const { className } = props;
  const { state, dispatch } = useAppState();
  const connectionState = useConnectionStatus();
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setCurrentPage(hash);
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const menuItems: SidebarItemProps[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
      label: '仪表板',
      href: '#dashboard',
      active: currentPage === 'dashboard',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      label: '组件测试',
      href: '#test',
      active: currentPage === 'test',
      badge: 'V2',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: '代理',
      href: '#proxies',
      active: currentPage === 'proxies',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      label: '连接',
      href: '#connections',
      active: currentPage === 'connections',
      badge: '12',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: '规则',
      href: '#rules',
      active: currentPage === 'rules',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: '日志',
      href: '#logs',
      active: currentPage === 'logs',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: '配置',
      href: '#configs',
      active: currentPage === 'configs',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
      label: 'API 配置',
      href: '#api-config',
      active: currentPage === 'api-config',
      badge: connectionState.status === 'connected' ? undefined : '!',
    },
  ];

  const getStatusType = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'success';
      case 'disconnected':
      case 'error':
        return 'error';
      case 'checking':
      default:
        return 'info';
    }
  };

  const getDisplayMessage = () => {
    if (connectionState.status === 'connected' && connectionState.version) {
      return `已连接 (v${connectionState.version})`;
    }
    return connectionState.message;
  };

  return (
    <aside className={cn(
      'w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
      'flex flex-col h-screen',
      className
    )}>
      {/* Logo 区域 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">Y</span>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              YACD
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              V2.0
            </p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <SidebarItem key={index} {...item} />
        ))}
      </nav>

      {/* 底部区域 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              V2 运行中
            </span>
          </div>
          <button 
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => {
              const currentTheme = document.documentElement.getAttribute('data-theme') || 'auto';
              const themes = ['light', 'dark', 'auto'];
              const currentIndex = themes.indexOf(currentTheme);
              const nextTheme = themes[(currentIndex + 1) % themes.length];
              
              document.documentElement.setAttribute('data-theme', nextTheme);
              localStorage.setItem('theme', nextTheme);
              
              if (nextTheme === 'auto') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', isDark);
              } else {
                document.documentElement.classList.toggle('dark', nextTheme === 'dark');
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {!state.sidebarCollapsed && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <StatusIndicator 
            status={getStatusType()} 
            label={getDisplayMessage()}
          />
        </div>
      )}
    </aside>
  );
} 