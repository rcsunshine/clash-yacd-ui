import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../utils/cn';

export interface LanguageDropdownProps {
  className?: string;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文' },
];

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ className }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = languageOptions.find(lang => lang.code === i18n.language) || languageOptions[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={toggleDropdown}
        className={cn(
          'flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'text-gray-700 dark:text-gray-300'
        )}
        aria-label={t('Language')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="mr-2 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
            />
          </svg>
        </span>
        <span className="flex-1 text-left text-xs font-medium">
          {currentLanguage.nativeName}
        </span>
        <span className="ml-2 flex-shrink-0">
          <svg 
            className={cn(
              'w-3 h-3 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <>
          {/* 点击遮罩关闭菜单 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* 下拉菜单 */}
          <div className={cn(
            'absolute bottom-full left-0 right-0 mb-2 z-20',
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5',
            'py-1 text-sm'
          )}>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
              {t('Language')}
            </div>
            {languageOptions.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  'flex items-center w-full px-3 py-2 text-left transition-colors duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
                  currentLanguage.code === language.code
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                )}
                role="menuitem"
              >
                <span className="flex-1">{language.nativeName}</span>
                {currentLanguage.code === language.code && (
                  <span className="ml-2 flex-shrink-0">
                    <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

LanguageDropdown.displayName = 'LanguageDropdown'; 