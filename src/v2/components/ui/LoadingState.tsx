import React from 'react';

import { cn } from '../../utils/cn';

interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'md',
  text,
  className,
  variant = 'spinner',
  fullScreen = false,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { spinner: 'w-4 h-4', text: 'text-xs', container: 'p-2' };
      case 'lg':
        return { spinner: 'w-8 h-8', text: 'text-base', container: 'p-6' };
      case 'xl':
        return { spinner: 'w-12 h-12', text: 'text-lg', container: 'p-8' };
      default: // md
        return { spinner: 'w-6 h-6', text: 'text-sm', container: 'p-4' };
    }
  };

  const sizeClasses = getSizeClasses();

  const SpinnerLoader = () => (
    <svg
      className={cn(
        'animate-spin text-blue-600 dark:text-blue-400',
        sizeClasses.spinner
      )}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse',
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  const PulseLoader = () => (
    <div
      className={cn(
        'bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse',
        sizeClasses.spinner
      )}
    />
  );

  const SkeletonLoader = () => (
    <div className="space-y-2 w-full max-w-sm">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
    </div>
  );

  const getLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      case 'skeleton':
        return <SkeletonLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  const containerClasses = cn(
    'flex flex-col items-center justify-center text-center',
    sizeClasses.container,
    fullScreen && 'min-h-screen fixed inset-0 bg-white dark:bg-gray-900 z-50',
    className
  );

  return (
    <div className={containerClasses}>
      {getLoader()}
      {text && (
        <p className={cn(
          'text-gray-600 dark:text-gray-400 mt-3 font-medium',
          sizeClasses.text
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

// 预定义的加载组件
export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => (
  <LoadingState size="sm" variant="dots" text={text} className="inline-flex" />
);

export const PageLoader: React.FC<{ text?: string }> = ({ text = '加载中...' }) => (
  <LoadingState size="lg" text={text} className="min-h-[400px]" />
);

export const FullScreenLoader: React.FC<{ text?: string }> = ({ text = '正在加载应用...' }) => (
  <LoadingState size="xl" text={text} fullScreen />
);

export const CardLoader: React.FC = () => (
  <div className="p-4 space-y-3">
    <LoadingState variant="skeleton" />
  </div>
);

// 数据表格加载状态
export const TableLoader: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: cols }, (_, j) => (
          <div
            key={j}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

// 按钮加载状态
export const ButtonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin w-4 h-4', className)}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
); 