import React from 'react';

import { cn } from '../../utils/cn';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  variant?: 'default' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  variant = 'default',
  size = 'md',
  error = false,
  placeholder,
  className,
  disabled = false,
  ...props
}) => {
  const baseClasses = cn(
    // 基础样式
    'relative w-full appearance-none rounded-lg transition-all duration-200',
    'bg-white dark:bg-gray-800',
    'border border-gray-300 dark:border-gray-600',
    'text-gray-900 dark:text-gray-100',
    'placeholder-gray-500 dark:placeholder-gray-400',
    
    // 聚焦样式
    'focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
    'focus:border-blue-500 dark:focus:border-blue-400',
    'focus:outline-none',
    
    // 悬停样式
    'hover:border-gray-400 dark:hover:border-gray-500',
    
    // 禁用样式
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'disabled:bg-gray-50 dark:disabled:bg-gray-900',
    
    // 错误样式
    error && 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20',
    
    // 尺寸变体
    {
      'px-3 py-2 pr-8 text-sm': size === 'sm',
      'px-4 py-3 pr-10 text-base': size === 'md',
      'px-5 py-4 pr-12 text-lg': size === 'lg',
    },
    
    // 变体样式
    {
      'shadow-sm': variant === 'default',
      'border-0 bg-gray-100 dark:bg-gray-700': variant === 'compact',
    }
  );

  const iconClasses = cn(
    'absolute inset-y-0 right-0 flex items-center pointer-events-none',
    'text-gray-400 dark:text-gray-500',
    {
      'pr-2': size === 'sm',
      'pr-3': size === 'md', 
      'pr-4': size === 'lg',
    }
  );

  return (
    <div className="relative">
      <select
        className={cn(baseClasses, className)}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {/* 自定义下拉箭头 */}
      <div className={iconClasses}>
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </div>
    </div>
  );
}; 