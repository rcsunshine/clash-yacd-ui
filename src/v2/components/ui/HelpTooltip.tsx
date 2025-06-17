import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface HelpTooltipProps {
  /**
   * 提示内容
   */
  content: React.ReactNode;
  
  /**
   * 提示标题
   */
  title?: string;
  
  /**
   * 触发元素
   */
  children: React.ReactNode;
  
  /**
   * 位置
   * @default 'bottom'
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * 宽度
   * @default 'auto'
   */
  width?: string | number;
  
  /**
   * 触发方式
   * @default 'hover'
   */
  trigger?: 'hover' | 'click';
  
  /**
   * 额外的类名
   */
  className?: string;
  
  /**
   * 提示内容的类名
   */
  contentClassName?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  children,
  position = 'bottom',
  width = 'auto',
  trigger = 'hover',
  className,
  contentClassName,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const showTooltip = () => {
    if (trigger === 'hover') return;
    setIsVisible(true);
  };
  
  const hideTooltip = () => {
    if (trigger === 'hover') return;
    setIsVisible(false);
  };
  
  const toggleTooltip = () => {
    if (trigger === 'hover') return;
    setIsVisible(!isVisible);
  };
  
  // 位置样式
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-2',
  };
  
  // 箭头位置
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent',
  };
  
  return (
    <div 
      className={cn('relative inline-block', className)}
      onMouseEnter={trigger === 'hover' ? () => setIsVisible(true) : undefined}
      onMouseLeave={trigger === 'hover' ? () => setIsVisible(false) : undefined}
      onClick={trigger === 'click' ? toggleTooltip : undefined}
    >
      {/* 触发元素 */}
      {children}
      
      {/* 提示内容 */}
      {isVisible && (
        <div 
          className={cn(
            'absolute z-50 p-3 text-sm text-white bg-gray-800 dark:bg-gray-700 rounded-md shadow-lg',
            positionClasses[position],
            contentClassName
          )}
          style={{ width }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 箭头 */}
          <div 
            className={cn(
              'absolute w-0 h-0 border-solid border-4',
              arrowClasses[position]
            )}
          />
          
          {/* 内容 */}
          {title && (
            <div className="font-medium mb-1 pb-1 border-b border-gray-700 dark:border-gray-600">
              {title}
            </div>
          )}
          <div className="text-xs">{content}</div>
        </div>
      )}
    </div>
  );
};

/**
 * 规则搜索帮助提示组件
 */
export const RulesSearchHelpTooltip: React.FC = () => {
  return (
    <HelpTooltip
      title="规则搜索语法"
      content={
        <div className="space-y-2">
          <div>
            <div className="font-medium mb-1">基本搜索:</div>
            <div className="pl-2">直接输入关键词搜索规则内容和代理</div>
          </div>
          
          <div>
            <div className="font-medium mb-1">高级语法:</div>
            <div className="pl-2 space-y-1">
              <div><code>type:DOMAIN</code> - 搜索特定类型</div>
              <div><code>proxy:DIRECT</code> - 搜索特定代理</div>
              <div><code>payload:"google.com"</code> - 精确匹配内容</div>
            </div>
          </div>
          
          <div>
            <div className="font-medium mb-1">组合搜索:</div>
            <div className="pl-2">
              <code>type:DOMAIN proxy:DIRECT google</code>
            </div>
          </div>
        </div>
      }
      position="bottom"
      width={280}
    >
      <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
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
  return (
    <HelpTooltip
      title="键盘快捷键"
      content={
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="font-medium">F</div>
          <div>聚焦搜索框</div>
          
          <div className="font-medium">R</div>
          <div>刷新数据</div>
          
          <div className="font-medium">ESC</div>
          <div>清除过滤器</div>
          
          <div className="font-medium">1</div>
          <div>切换到规则列表</div>
          
          <div className="font-medium">2</div>
          <div>切换到规则提供者</div>
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