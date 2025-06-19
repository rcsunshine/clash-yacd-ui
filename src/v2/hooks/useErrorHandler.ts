import { useCallback, useState } from 'react';

export interface ErrorInfo {
  type: 'network' | 'api' | 'validation' | 'unknown';
  message: string;
  details?: string;
  code?: string | number;
  retryable?: boolean;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  onError?: (error: ErrorInfo) => void;
}

// 简单的toast实现
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
  
  // 根据类型设置样式
  switch (type) {
    case 'success':
      toast.className += ' bg-green-500 text-white';
      break;
    case 'warning':
      toast.className += ' bg-yellow-500 text-white';
      break;
    default: // error
      toast.className += ' bg-red-500 text-white';
  }
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 动画显示
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);
  
  // 自动隐藏
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 4000);
};

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToast: enableToast = true,
    logError = true,
    retryable = true,
    onError,
  } = options;

  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  // 分析错误类型
  const analyzeError = useCallback((error: unknown): ErrorInfo => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: '网络连接失败，请检查网络连接',
        details: error.message,
        retryable: true,
      };
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return {
          type: 'api',
          message: 'API 认证失败，请检查密钥配置',
          details: error.message,
          code: 401,
          retryable: false,
        };
      }

      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return {
          type: 'api',
          message: 'API 接口不存在',
          details: error.message,
          code: 404,
          retryable: false,
        };
      }

      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        return {
          type: 'network',
          message: '请求超时，请重试',
          details: error.message,
          retryable: true,
        };
      }

      return {
        type: 'unknown',
        message: error.message || '未知错误',
        details: error.stack,
        retryable: retryable,
      };
    }

    if (typeof error === 'string') {
      return {
        type: 'unknown',
        message: error,
        retryable: retryable,
      };
    }

    return {
      type: 'unknown',
      message: '发生未知错误',
      retryable: retryable,
    };
  }, [retryable]);

  // 处理错误
  const handleError = useCallback((error: unknown, context?: string) => {
    const errorInfo = analyzeError(error);

    // 添加上下文信息
    if (context) {
      errorInfo.details = context + (errorInfo.details ? `\n${errorInfo.details}` : '');
    }

    // 记录错误
    if (logError) {
      console.group(`🚨 Error Handler - ${errorInfo.type}`);
      console.error('Error:', error);
      console.error('Context:', context);
      console.error('Analyzed:', errorInfo);
      console.groupEnd();
    }

    // 显示toast提示
    if (enableToast) {
      const toastMessage = errorInfo.type === 'network' 
        ? `🌐 ${errorInfo.message}`
        : errorInfo.type === 'api'
        ? `⚠️ ${errorInfo.message}`
        : errorInfo.type === 'validation'
        ? `📝 ${errorInfo.message}`
        : `❌ ${errorInfo.message}`;
      
      showToast(toastMessage, 'error');
    }

    // 更新错误列表
    setErrors(prev => [...prev, { ...errorInfo, timestamp: Date.now() } as any]);

    // 调用外部错误处理
    if (onError) {
      onError(errorInfo);
    }

    return errorInfo;
  }, [analyzeError, logError, enableToast, onError]);

  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 清除特定错误
  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 重试函数包装器
  const withRetry = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    maxRetries: number = 3,
    delay: number = 1000
  ) => {
    return async (...args: T): Promise<R> => {
      let lastError: unknown;
      
      for (let i = 0; i <= maxRetries; i++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error;
          
          const errorInfo = analyzeError(error);
          
          // 如果错误不可重试，立即抛出
          if (!errorInfo.retryable) {
            throw error;
          }
          
          // 如果是最后一次尝试，抛出错误
          if (i === maxRetries) {
            break;
          }
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
      
      throw lastError;
    };
  }, [analyzeError]);

  return {
    handleError,
    clearErrors,
    clearError,
    withRetry,
    errors,
    hasErrors: errors.length > 0,
  };
}

// 预定义的错误处理器
export function useAPIErrorHandler() {
  return useErrorHandler({
    showToast: true,
    logError: true,
    retryable: true,
  });
}

export function useNetworkErrorHandler() {
  return useErrorHandler({
    showToast: true,
    logError: true,
    retryable: true,
    onError: (error) => {
      if (error.type === 'network') {
        // 可以在这里添加网络状态检测逻辑
        console.warn('Network error detected:', error);
      }
    },
  });
}

export function useValidationErrorHandler() {
  return useErrorHandler({
    showToast: false, // 表单错误通常不需要toast
    logError: false,
    retryable: false,
  });
}

// 全局错误处理工具
export const globalErrorHandler = {
  handle: (error: unknown, context?: string) => {
    console.error('Global Error:', error, context);
    
    // 可以在这里集成错误上报服务
    if (process.env.NODE_ENV === 'production') {
      // 例如：Sentry.captureException(error);
    }
  },
  
  handlePromiseRejection: (event: PromiseRejectionEvent) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    globalErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
  },
  
  handleGlobalError: (event: ErrorEvent) => {
    console.error('Global Error Event:', event.error);
    globalErrorHandler.handle(event.error, `${event.filename}:${event.lineno}:${event.colno}`);
  },
};

// 初始化全局错误监听
export function initGlobalErrorHandling() {
  window.addEventListener('unhandledrejection', globalErrorHandler.handlePromiseRejection);
  window.addEventListener('error', globalErrorHandler.handleGlobalError);
  
  return () => {
    window.removeEventListener('unhandledrejection', globalErrorHandler.handlePromiseRejection);
    window.removeEventListener('error', globalErrorHandler.handleGlobalError);
  };
} 