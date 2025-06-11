import React from 'react';

import { cn } from '../../utils/cn';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  iconClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className,
  iconClassName,
  placeholder = "搜索...",
  ...props
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          className={cn("w-5 h-5 text-gray-400 dark:text-gray-500", iconClassName)} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-3 border transition-all duration-200',
          // 深色主题优化的边框和背景
          'border-gray-300 dark:border-gray-600/50',
          'bg-white dark:bg-gray-800/90 backdrop-blur-sm',
          'text-sm font-medium',
          // 优化的文字对比度 - 确保在深色背景下清晰可读
          'text-gray-900 dark:text-gray-100',
          'placeholder:text-gray-500 dark:placeholder:text-gray-400',
          // 圆角和阴影
          'rounded-xl shadow-sm',
          'dark:shadow-gray-900/20',
          // 聚焦效果 - 更柔和，不刺眼
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30',
          'focus:border-blue-500 dark:focus:border-blue-400/80',
          'focus:bg-white dark:focus:bg-gray-800',
          'focus:shadow-lg dark:focus:shadow-gray-900/30',
          // 悬浮效果
          'hover:border-gray-400 dark:hover:border-gray-500/70',
          'hover:bg-gray-50 dark:hover:bg-gray-800/95',
          'hover:shadow-md dark:hover:shadow-gray-900/25',
          // 禁用状态
          'disabled:cursor-not-allowed disabled:opacity-50',
          'disabled:bg-gray-100 dark:disabled:bg-gray-800/30',
          className
        )}
        {...props}
      />
    </div>
  );
}; 