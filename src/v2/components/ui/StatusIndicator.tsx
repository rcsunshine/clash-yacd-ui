import React from 'react';

import { cn } from '../../utils/cn';

export interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
  className?: string;
}

const statusConfig = {
  success: {
    color: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  warning: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  error: {
    color: 'bg-red-500',
    textColor: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  info: {
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className,
}) => {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className={cn('text-sm font-medium', config.textColor)}>
        {label}
      </span>
    </div>
  );
}; 