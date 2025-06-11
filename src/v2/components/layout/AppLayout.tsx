import React from 'react';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileMenu } from './MobileMenu';
import { useMenuItems } from '../../hooks/useMenuItems';
import { MenuItem } from '../ui/MenuItem';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { menuItems, getItemStatus } = useMenuItems();

  // 获取当前页面标题
  const getCurrentTitle = () => {
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
    return titleMap[hash] || '仪表板';
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={cn('flex min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* 桌面端侧边栏 */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      
      {/* 移动端Header */}
      <div className="lg:hidden sticky top-0 z-50">
        <MobileHeader 
          title={getCurrentTitle()}
          onMenuToggle={handleMobileMenuToggle}
        />
      </div>

      {/* 移动端菜单 */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose}>
        <div className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                {...item}
                active={getItemStatus(item.href)}
                variant="mobile"
                onClick={handleMobileMenuClose}
              />
            ))}
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