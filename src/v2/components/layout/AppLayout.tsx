import React from 'react';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileMenu } from './MobileMenu';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [currentPageTitle, setCurrentPageTitle] = React.useState('仪表板');

  // 根据当前页面更新标题
  React.useEffect(() => {
    const updateTitle = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      const titleMap: Record<string, string> = {
        dashboard: '仪表板',
        proxies: '代理',
        connections: '连接',
        rules: '规则',
        logs: '日志',
        configs: '配置',
        'api-config': 'API配置',
      };
      setCurrentPageTitle(titleMap[hash] || '仪表板');
    };

    updateTitle();
    window.addEventListener('hashchange', updateTitle);
    return () => window.removeEventListener('hashchange', updateTitle);
  }, []);

  // 获取连接状态（简化版）
  const connectionStatus = React.useMemo(() => ({
    type: 'success' as const,
    message: '已连接'
  }), []);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={cn('flex min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* 桌面端侧边栏 */}
      <Sidebar />
      
      {/* 移动端Header */}
      <MobileHeader
        title={currentPageTitle}
        onMenuToggle={handleMobileMenuToggle}
        connectionStatus={connectionStatus}
      />

      {/* 移动端菜单 */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose}>
        <div className="p-4">
          <nav className="space-y-1">
            {/* 这里复用Sidebar的菜单项，移动端优化版本 */}
            <Sidebar className="!flex !relative !w-full !h-auto !border-none !bg-transparent" />
          </nav>
        </div>
      </MobileMenu>
      
      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 内容区域 */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}; 