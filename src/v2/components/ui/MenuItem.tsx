import React from 'react';
import { cn } from '../../utils/cn';

export interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
  variant?: 'sidebar' | 'mobile';
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  href,
  active = false,
  onClick,
  badge,
  variant = 'sidebar',
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
        'flex items-center w-full text-sm font-medium rounded-lg transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        // 移动端触摸优化
        'min-h-[44px] active:scale-95',
        // 根据变体调整样式
        variant === 'sidebar' ? 'px-4 py-3' : 'px-3 py-2',
        // 活跃状态
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm'
          : 'text-gray-700 dark:text-gray-300'
      )}
    >
      {icon && (
        <span className={cn(
          'flex-shrink-0 w-5 h-5',
          variant === 'sidebar' ? 'mr-3' : 'mr-2'
        )}>
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