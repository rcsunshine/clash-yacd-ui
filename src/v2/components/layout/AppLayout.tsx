import React from 'react';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn('flex min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 内容区域 */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}; 