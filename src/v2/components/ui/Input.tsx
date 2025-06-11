import React from 'react';

import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  className,
  type = 'text',
  ...props
}) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border transition-all duration-200',
        // 深色主题优化的边框和背景
        'border-gray-300 dark:border-gray-600/60',
        'bg-white dark:bg-gray-800/80 backdrop-blur-sm',
        'px-3 py-2 text-sm font-medium',
        // 优化的文字对比度和清晰度
        'text-gray-900 dark:text-gray-100',
        'placeholder:text-gray-500 dark:placeholder:text-gray-400',
        // 更柔和的聚焦效果
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50',
        'focus:border-blue-500 dark:focus:border-blue-400',
        'focus:bg-white dark:focus:bg-gray-800',
        // 悬浮效果
        'hover:border-gray-400 dark:hover:border-gray-500',
        'hover:bg-gray-50 dark:hover:bg-gray-800/90',
        // 禁用状态
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800/50',
        // 更好的阴影效果
        'shadow-sm hover:shadow-md focus:shadow-md',
        'dark:shadow-gray-900/20',
        className
      )}
      {...props}
    />
  );
}; 