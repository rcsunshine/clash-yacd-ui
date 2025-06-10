import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ErrorAlertProps {
  title?: string;
  message: string;
  details?: string;
  type?: 'error' | 'warning' | 'network' | 'api';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  details,
  type = 'error',
  onRetry,
  onDismiss,
  className,
  showDetails = false,
}) => {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          border: 'border-yellow-200 dark:border-yellow-800',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-200',
          message: 'text-yellow-700 dark:text-yellow-300',
        };
      case 'network':
        return {
          border: 'border-orange-200 dark:border-orange-800',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          icon: 'text-orange-600 dark:text-orange-400',
          title: 'text-orange-800 dark:text-orange-200',
          message: 'text-orange-700 dark:text-orange-300',
        };
      case 'api':
        return {
          border: 'border-blue-200 dark:border-blue-800',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-200',
          message: 'text-blue-700 dark:text-blue-300',
        };
      default: // error
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-200',
          message: 'text-red-700 dark:text-red-300',
        };
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'warning':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'network':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'api':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default: // error
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={cn(
      'rounded-lg border p-4',
      styles.border,
      styles.bg,
      className
    )}>
      <div className="flex items-start space-x-3">
        {/* 图标 */}
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          {getIcon()}
        </div>

        {/* 内容 */}
        <div className="flex-1">
          {/* 标题 */}
          {title && (
            <h3 className={cn('font-medium text-sm mb-1', styles.title)}>
              {title}
            </h3>
          )}

          {/* 消息 */}
          <p className={cn('text-sm', styles.message)}>
            {message}
          </p>

          {/* 详细信息 */}
          {details && showDetails && (
            <div className="mt-3">
              <button
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className={cn(
                  'text-xs underline hover:no-underline focus:outline-none',
                  styles.message
                )}
              >
                {detailsExpanded ? '隐藏详情' : '查看详情'}
              </button>
              
              {detailsExpanded && (
                <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-32">
                  {details}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs"
                >
                  重试
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-xs"
                >
                  忽略
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 关闭按钮 */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
              styles.icon
            )}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// 预定义的错误类型组件
export const NetworkErrorAlert: React.FC<Omit<ErrorAlertProps, 'type'>> = (props) => (
  <ErrorAlert
    {...props}
    type="network"
    title={props.title || '网络连接失败'}
  />
);

export const APIErrorAlert: React.FC<Omit<ErrorAlertProps, 'type'>> = (props) => (
  <ErrorAlert
    {...props}
    type="api"
    title={props.title || 'API 请求失败'}
  />
);

export const ValidationErrorAlert: React.FC<Omit<ErrorAlertProps, 'type'>> = (props) => (
  <ErrorAlert
    {...props}
    type="warning"
    title={props.title || '输入验证失败'}
  />
); 