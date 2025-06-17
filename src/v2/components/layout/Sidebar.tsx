import React from 'react';

import { createAPIClient } from '../../api/client';
import { useConnections } from '../../hooks/useAPI';
import { useApiConfig } from '../../hooks/useApiConfig';
import { cn } from '../../utils/cn';
import { StatusIndicator } from '../ui/StatusIndicator';
import { ThemeDropdown } from '../ui/ThemeDropdown';

export interface SidebarProps {
  className?: string;
  currentPage?: string;
  onPageChange?: (page: string) => void;
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
      window.location.hash = href;
      // 如果有回调函数，调用它
      if (onClick) {
        onClick();
      }
    } else if (onClick) {
      onClick();
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        // 移动端触摸优化
        'min-h-[44px] active:scale-95',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm'
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
        <span className={cn(
          'ml-2 px-2 py-0.5 text-xs rounded-full font-medium',
          active
            ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        )}>
          {badge}
        </span>
      )}
    </button>
  );
};

// V2独立的连接状态Hook
function useConnectionStatus() {
  const apiConfig = useApiConfig();
  const [connectionState, setConnectionState] = React.useState<{
    status: 'checking' | 'connected' | 'disconnected' | 'error';
    message: string;
    version?: string;
  }>({ status: 'checking', message: '检查连接中...' });
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const lastApiConfigRef = React.useRef<typeof apiConfig>();

  React.useEffect(() => {
    let mounted = true;
    
    // 检查API配置是否变化
    const configChanged = lastApiConfigRef.current && 
      (lastApiConfigRef.current.baseURL !== apiConfig?.baseURL || 
       lastApiConfigRef.current.secret !== apiConfig?.secret);
    
    if (configChanged || !lastApiConfigRef.current) {
      console.log('🔄 Sidebar ConnectionStatus: API config changed, restarting...');
      // 清理旧的定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setConnectionState({ status: 'checking', message: '检查连接中...' });
    }
    
    lastApiConfigRef.current = apiConfig;
    
    const checkConnection = async () => {
      if (!mounted || !apiConfig?.baseURL) return;
      
      try {
        const client = createAPIClient(apiConfig);
        const response = await client.get('/version');
        
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
    
    // 确保没有重复的定时器
    if (!intervalRef.current) {
      intervalRef.current = setInterval(checkConnection, 10000);
    }
    
    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [apiConfig]);

  return connectionState;
}

export function Sidebar(props: SidebarProps = {}) {
  const { className, currentPage, onPageChange } = props;
  const connectionState = useConnectionStatus();
  const { data: connectionsData } = useConnections();
  const totalConnections = connectionsData?.connections?.length || 0;
  const [currentPageState, setCurrentPageState] = React.useState(currentPage || 'dashboard');
  
  // 响应外部页面变化
  React.useEffect(() => {
    if (currentPage && currentPage !== currentPageState) {
      setCurrentPageState(currentPage);
    }
  }, [currentPage, currentPageState]);
  
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setCurrentPageState(hash);
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 定义页面变化处理函数 - 移动到 menuItems 定义之前
  const handlePageChange = (page: string) => {
    setCurrentPageState(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const menuItems: SidebarItemProps[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
      label: '概览',
      href: '#dashboard',
      active: currentPageState === 'dashboard',
      onClick: () => handlePageChange('dashboard'),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: '代理',
      href: '#proxies',
      active: currentPageState === 'proxies',
      onClick: () => handlePageChange('proxies'),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
      label: '连接',
      href: '#connections',
      active: currentPageState === 'connections',
      badge: totalConnections.toString(),
      onClick: () => handlePageChange('connections'),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: '规则',
      href: '#rules',
      active: currentPageState === 'rules',
      onClick: () => handlePageChange('rules'),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      label: '日志',
      href: '#logs',
      active: currentPageState === 'logs',
      onClick: () => handlePageChange('logs'),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: '配置',
      href: '#config',
      active: currentPageState === 'config',
      onClick: () => handlePageChange('config'),
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'API',
      href: '#api-config', 
      active: currentPageState === 'api-config',
      onClick: () => handlePageChange('api-config'),
      badge: connectionState.status === 'error' ? '!' : undefined,
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
      'hidden lg:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
      'flex-col h-screen flex-shrink-0',
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              V2 运行中
            </span>
          </div>
          <ThemeDropdown />
        </div>

        {/* Connection Status */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <StatusIndicator 
            status={getStatusType()} 
            label={getDisplayMessage()}
          />
        </div>
      </div>
    </aside>
  );
} 