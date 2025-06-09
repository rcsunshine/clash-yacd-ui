import cx from 'clsx';
import { useAtom } from 'jotai';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { setTheme, themeAtom } from '$src/store/app';
import { ThemeType } from '$src/store/types';

import s from './ThemeSwitcher.module.scss';

const themeOptions = [
  { value: 'auto', label: 'Auto', icon: 'ti ti-device-desktop' },
  { value: 'dark', label: 'Dark', icon: 'ti ti-moon' },
  { value: 'light', label: 'Light', icon: 'ti ti-sun' },
] as const;

function getThemeIcon(theme: ThemeType) {
  const option = themeOptions.find(opt => opt.value === theme);
  return option?.icon || 'ti ti-moon';
}

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const [theme, setThemeAtom] = useAtom(themeAtom);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 处理主题选择
  const handleThemeSelect = React.useCallback((selectedTheme: ThemeType) => {
    setThemeAtom(selectedTheme);
    setTheme(selectedTheme);
    setIsOpen(false);
  }, [setThemeAtom]);

  // 切换下拉菜单
  const toggleDropdown = React.useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // 点击外部关闭
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  return (
    <div className={s.themeSwitcher} ref={containerRef}>
      {/* 主题切换按钮 */}
      <button
        className={s.themeButton}
        onClick={toggleDropdown}
        title={t('switch_theme')}
        aria-label={t('switch_theme')}
        aria-expanded={isOpen}
        type="button"
      >
        <i className={getThemeIcon(theme)} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={s.themeDropdown}>
                     <div className={s.dropdownHeader}>
             <i className="ti ti-palette" />
             <span>{t('Theme')}</span>
           </div>
          
          <div className={s.themeOptions}>
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={cx(s.themeOption, {
                  [s.active]: theme === option.value
                })}
                onClick={() => handleThemeSelect(option.value as ThemeType)}
                type="button"
              >
                <i className={option.icon} />
                <span>{t(option.label)}</span>
                                 {theme === option.value && (
                   <i className="ti ti-check" />
                 )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 