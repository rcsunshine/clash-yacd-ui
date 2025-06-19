import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../utils/cn';

export interface HelpTooltipProps {
  /**
   * 提示内容
   */
  content: React.ReactNode;
  
  /**
   * 提示标题
   */
  title?: React.ReactNode;
  
  /**
   * 提示位置
   * @default 'bottom'
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * 触发方式
   * @default 'hover'
   */
  trigger?: 'hover' | 'click';
  
  /**
   * 子元素
   */
  children: React.ReactNode;
  
  /**
   * 额外的类名
   */
  className?: string;
  
  /**
   * 提示框额外的类名
   */
  tooltipClassName?: string;
  
  /**
   * 是否显示图标
   * @default true
   */
  showIcon?: boolean;
  
  /**
   * 图标
   */
  icon?: React.ReactNode;
  
  /**
   * 图标额外的类名
   */
  iconClassName?: string;
  
  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;
  
  /**
   * 提示框宽度
   */
  width?: number;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  position = 'bottom',
  trigger = 'hover',
  children,
  className,
  tooltipClassName,
  showIcon = true,
  icon,
  iconClassName,
  disabled = false,
  width,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleClick = () => {
    if (disabled) return;
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };
  
  const handleMouseEnter = () => {
    if (disabled) return;
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (disabled) return;
    if (trigger === 'hover') {
      setIsOpen(false);
    }
  };
  
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (disabled) return;
    if (trigger === 'click' && isOpen) {
      const target = event.target as Node;
      if (tooltipRef.current && !tooltipRef.current.contains(target)) {
        setIsOpen(false);
      }
    }
  };
  
  React.useEffect(() => {
    if (trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, isOpen]);
  
  // 提示位置样式
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-2',
  };
  
  // 箭头位置样式
  const arrowClasses = {
    top: 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-t-gray-800 dark:border-t-gray-700 border-r-transparent border-b-transparent border-l-transparent',
    right: 'left-[-5px] top-1/2 transform -translate-y-1/2 border-t-transparent border-r-gray-800 dark:border-r-gray-700 border-b-transparent border-l-transparent',
    bottom: 'top-[-5px] left-1/2 transform -translate-x-1/2 border-t-transparent border-r-transparent border-b-gray-800 dark:border-b-gray-700 border-l-transparent',
    left: 'right-[-5px] top-1/2 transform -translate-y-1/2 border-t-transparent border-r-transparent border-b-transparent border-l-gray-800 dark:border-l-gray-700',
  };
  
  const defaultIcon = (
    <svg className={cn("w-4 h-4", iconClassName)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  return (
    <div
      className={cn(
        "relative inline-flex items-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={tooltipRef}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {children ? (
        <>{children}</>
      ) : showIcon && (
        <span className="text-gray-500 dark:text-gray-400 cursor-help">
          {icon || defaultIcon}
        </span>
      )}
      
      {isOpen && (
        <div
          className={cn(
            "absolute z-[100] p-3 text-sm text-white bg-gray-800 dark:bg-gray-700 rounded shadow-lg",
            positionClasses[position],
            tooltipClassName
          )}
          style={{ width: width ? `${width}px` : '16rem' }}
        >
          {title && (
            <div className="font-medium mb-1 pb-1 border-b border-gray-700 dark:border-gray-600">
              {title}
            </div>
          )}
          <div className="text-xs text-white dark:text-gray-100">{content}</div>
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
};

/**
 * 规则搜索帮助提示组件
 */
export const RulesSearchHelpTooltip: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <HelpTooltip
      title={t('Rule Search Syntax')}
      content={
        <div className="space-y-2">
          <div>
            <div className="font-medium mb-1">{t('Basic Search')}:</div>
            <div className="pl-2">{t('Enter keywords directly to search rule content and proxy')}</div>
          </div>
          
          <div>
            <div className="font-medium mb-1">{t('Advanced Syntax')}:</div>
            <div className="pl-2 space-y-1">
              <div><code>type:DOMAIN</code> - {t('Search specific type')}</div>
              <div><code>proxy:DIRECT</code> - {t('Search specific proxy')}</div>
              <div><code>payload:&quot;google.com&quot;</code> - {t('Exact match content')}</div>
            </div>
          </div>
          
          <div>
            <div className="font-medium mb-1">{t('Combined Search')}:</div>
            <div className="pl-2">
              <code>type:DOMAIN proxy:DIRECT google</code>
            </div>
          </div>
        </div>
      }
      position="bottom"
      width={280}
      showIcon={false}
      tooltipClassName="bg-gray-800 dark:bg-gray-700 z-50"
    >
      <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </HelpTooltip>
  );
};

/**
 * 键盘快捷键帮助提示组件
 */
export const KeyboardShortcutsTooltip: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <HelpTooltip
      title={t('Keyboard Shortcuts')}
      content={
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="font-medium">F</div>
          <div>{t('Focus search box')}</div>
          
          <div className="font-medium">R</div>
          <div>{t('Refresh data')}</div>
          
          <div className="font-medium">ESC</div>
          <div>{t('Clear filters')}</div>
          
          <div className="font-medium">1</div>
          <div>{t('Switch to rules list')}</div>
          
          <div className="font-medium">2</div>
          <div>{t('Switch to rule providers')}</div>
        </div>
      }
      position="bottom"
      width={220}
    >
      <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      </button>
    </HelpTooltip>
  );
};

export default HelpTooltip; 