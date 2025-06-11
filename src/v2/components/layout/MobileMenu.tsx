import React from 'react';

import { cn } from '../../utils/cn';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  // 防止背景滚动
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC键关闭菜单
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={cn(
          'lg:!hidden max-lg:fixed hidden fixed inset-0 z-40 transition-opacity duration-300',
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
      </div>

      {/* 侧边菜单 */}
      <div
        className={cn(
          'lg:!hidden max-lg:fixed hidden fixed inset-y-0 left-0 z-50',
          'w-80 max-w-[85vw] bg-white dark:bg-gray-800',
          'transform transition-transform duration-300 ease-in-out',
          'shadow-xl border-r border-gray-200 dark:border-gray-700',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* 菜单头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
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
          
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-md',
              'text-gray-600 dark:text-gray-400',
              'hover:text-gray-900 dark:hover:text-white',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'transition-colors duration-200'
            )}
            aria-label="关闭菜单"
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
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* 菜单内容 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}; 