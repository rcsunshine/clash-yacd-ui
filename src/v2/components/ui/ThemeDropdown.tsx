import { useAtom } from 'jotai';
import React from 'react';

import { v2ThemeAtom } from '../../store/atoms';
import { cn } from '../../utils/cn';

const themeOptions = [
  { 
    value: 'light', 
    label: '浅色主题', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  { 
    value: 'dark', 
    label: '深色主题', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )
  },
  { 
    value: 'auto', 
    label: '自动主题', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
] as const;

export type ThemeType = 'light' | 'dark' | 'auto';

export interface ThemeDropdownProps {
  className?: string;
}

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({ className }) => {
  const [theme, setTheme] = useAtom(v2ThemeAtom);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  // 主题切换处理函数
  const handleThemeSelect = React.useCallback((selectedTheme: ThemeType) => {
    setTheme(selectedTheme);
    setIsOpen(false);
    
    // 同步保存到 localStorage
    localStorage.setItem('v2-theme', selectedTheme);
    localStorage.setItem('theme', selectedTheme); // 同时保存到V1的key
    
    // 应用主题到 DOM - 这个逻辑在App.tsx的useThemeManager中处理
  }, [setTheme]);

  // 获取当前主题图标
  const getCurrentThemeIcon = () => {
    const currentOption = themeOptions.find(option => option.value === theme);
    return currentOption?.icon || themeOptions[2].icon; // 默认auto图标
  };

  // 切换下拉菜单
  const toggleDropdown = React.useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* 主题切换按钮 */}
      <button
        className={cn(
          'flex items-center justify-center',
          'w-9 h-9 rounded-lg transition-all duration-200',
          'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'active:scale-95',
          isOpen && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        )}
        onClick={toggleDropdown}
        aria-label="切换主题"
        aria-expanded={isOpen}
        type="button"
      >
        {getCurrentThemeIcon()}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={cn(
          'absolute bottom-full left-0 mb-2',
          'min-w-[160px] bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'rounded-lg shadow-lg',
          'z-50',
          'animate-in slide-in-from-bottom-2 duration-200'
        )}>
          {/* 菜单头部 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              主题设置
            </span>
          </div>

          {/* 主题选项 */}
          <div className="py-1">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2',
                  'text-sm text-left transition-colors duration-150',
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  theme === option.value && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                )}
                onClick={() => handleThemeSelect(option.value as ThemeType)}
                type="button"
              >
                <span className={cn(
                  'flex-shrink-0',
                  theme === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                )}>
                  {option.icon}
                </span>
                <span className="flex-1">
                  {option.label}
                </span>
                {theme === option.value && (
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 