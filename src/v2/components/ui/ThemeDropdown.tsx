import { useAtom } from 'jotai';
import React, { useEffect,useRef, useState } from 'react';

import { useTranslation } from '../../i18n';
import { v2ThemeAtom } from '../../store/atoms';
import { cn } from '../../utils/cn';
import { getCurrentAppliedTheme, setTheme, type Theme } from '../../utils/theme';

interface ThemeOption {
  value: Theme;
  labelKey: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    labelKey: 'Light Theme',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    value: 'dark',
    labelKey: 'Dark Theme',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    value: 'auto',
    labelKey: 'Auto Theme',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export const ThemeDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [currentTheme, setCurrentTheme] = useAtom(v2ThemeAtom);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取当前选中的主题选项
  const currentOption = themeOptions.find(option => option.value === currentTheme) || themeOptions[2];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // ESC键关闭
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleThemeChange = (theme: Theme) => {
    console.log('🎨 ThemeDropdown: 开始切换主题:', theme);
    
    // 首先更新Jotai状态
    setCurrentTheme(theme);
    
    // 然后应用主题到DOM和localStorage
    setTheme(theme);
    
    // 关闭下拉菜单
    setIsOpen(false);
    
    console.log('🎨 ThemeDropdown: 主题切换完成');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* 触发按钮 */}
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
        aria-label={t('Switch theme')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {currentOption.icon}
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Theme Settings')}</span>
          </div>

          {/* 主题选项 */}
          <div className="py-1">
            {themeOptions.map((option) => {
              const isSelected = option.value === currentTheme;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-sm transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
                    isSelected
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <span className="mr-3 flex-shrink-0">
                    {option.icon}
                  </span>
                  <span className="flex-1 text-left">{t(option.labelKey)}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 ml-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* 当前状态指示 */}
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span>
                {t('Current')}: {getCurrentAppliedTheme() === 'dark' ? t('Dark Mode') : t('Light Mode')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 