import React from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../utils/cn';
import { StatusIndicator } from '../ui/StatusIndicator';

export interface MobileHeaderProps {
  title: string;
  onMenuToggle: () => void;
  className?: string;
  connectionStatus?: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  };
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuToggle,
  className,
  connectionStatus,
}) => {
  const { t } = useTranslation();
  return (
    <header className={cn(
      'lg:!hidden max-lg:flex hidden flex items-center justify-between',
      'px-4 py-3 bg-white dark:bg-gray-800',
      'border-b border-gray-200 dark:border-gray-700',
      'sticky top-0 z-50',
      className
    )}>
      {/* 左侧：汉堡菜单 */}
      <button
        onClick={onMenuToggle}
        className={cn(
          'p-2 -ml-2 rounded-md',
          'text-gray-600 dark:text-gray-400',
          'hover:text-gray-900 dark:hover:text-white',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'transition-colors duration-200'
        )}
        aria-label={t('Open menu')}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>

      {/* 中间：标题和Logo */}
      <div className="flex items-center flex-1 ml-4">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">Y</span>
        </div>
        <div className="ml-2">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>
      </div>

      {/* 右侧：连接状态 */}
      {connectionStatus && (
        <div className="flex items-center ml-4">
          <StatusIndicator
            status={connectionStatus.type}
            label=""
            className="w-3 h-3"
          />
        </div>
      )}
    </header>
  );
}; 