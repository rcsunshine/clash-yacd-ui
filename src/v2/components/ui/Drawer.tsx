import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface DrawerProps {
  /**
   * 抽屉是否打开
   */
  open: boolean;
  
  /**
   * 关闭抽屉的回调函数
   */
  onClose: () => void;
  
  /**
   * 抽屉标题
   */
  title?: React.ReactNode;
  
  /**
   * 抽屉内容
   */
  children: React.ReactNode;
  
  /**
   * 抽屉位置
   * @default 'right'
   */
  position?: 'right' | 'left' | 'top' | 'bottom';
  
  /**
   * 抽屉大小
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /**
   * 是否显示遮罩层
   * @default true
   */
  showOverlay?: boolean;
  
  /**
   * 点击遮罩层是否关闭抽屉
   * @default true
   */
  closeOnOverlayClick?: boolean;
  
  /**
   * 是否显示关闭按钮
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * 抽屉额外的类名
   */
  className?: string;
  
  /**
   * 遮罩层额外的类名
   */
  overlayClassName?: string;
  
  /**
   * 抽屉头部额外的类名
   */
  headerClassName?: string;
  
  /**
   * 抽屉内容额外的类名
   */
  contentClassName?: string;
  
  /**
   * 抽屉头部
   */
  header?: React.ReactNode;
  
  /**
   * 抽屉底部
   */
  footer?: React.ReactNode;
  
  /**
   * 抽屉底部额外的类名
   */
  footerClassName?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  showOverlay = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className,
  overlayClassName,
  headerClassName,
  contentClassName,
  header,
  footer,
  footerClassName,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // 处理点击外部关闭
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        open &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        closeOnOverlayClick
      ) {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open, onClose, closeOnOverlayClick]);
  
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [open, onClose]);
  
  // 禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  
  // 抽屉位置样式
  const positionClasses = {
    right: 'inset-y-0 right-0 h-full',
    left: 'inset-y-0 left-0 h-full',
    top: 'inset-x-0 top-0 w-full',
    bottom: 'inset-x-0 bottom-0 w-full',
  };
  
  // 抽屉大小样式
  const sizeClasses = {
    right: {
      sm: 'w-72',
      md: 'w-96',
      lg: 'w-1/3',
      xl: 'w-1/2',
      full: 'w-full',
    },
    left: {
      sm: 'w-72',
      md: 'w-96',
      lg: 'w-1/3',
      xl: 'w-1/2',
      full: 'w-full',
    },
    top: {
      sm: 'h-1/4',
      md: 'h-1/3',
      lg: 'h-1/2',
      xl: 'h-2/3',
      full: 'h-full',
    },
    bottom: {
      sm: 'h-1/4',
      md: 'h-1/3',
      lg: 'h-1/2',
      xl: 'h-2/3',
      full: 'h-full',
    },
  };
  
  // 抽屉动画样式
  const animationClasses = {
    right: open ? 'translate-x-0' : 'translate-x-full',
    left: open ? 'translate-x-0' : '-translate-x-full',
    top: open ? 'translate-y-0' : '-translate-y-full',
    bottom: open ? 'translate-y-0' : 'translate-y-full',
  };
  
  if (!open) {
    return null;
  }
  
  return (
    <>
      {/* 遮罩层 */}
      {showOverlay && (
        <div
          className={cn(
            'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
            overlayClassName
          )}
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
      )}
      
      {/* 抽屉 */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed z-50 bg-white dark:bg-gray-800 shadow-lg flex flex-col',
          positionClasses[position],
          sizeClasses[position][size],
          'transition-transform duration-300 ease-in-out',
          animationClasses[position],
          className
        )}
      >
        {/* 抽屉头部 */}
        {(title || header || showCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700',
              headerClassName
            )}
          >
            {header || (
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* 抽屉内容 */}
        <div
          className={cn(
            'flex-1 overflow-y-auto p-4',
            contentClassName
          )}
        >
          {children}
        </div>
        
        {/* 抽屉底部 */}
        {footer && (
          <div
            className={cn(
              'border-t border-gray-200 dark:border-gray-700 px-4 py-3',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default Drawer; 