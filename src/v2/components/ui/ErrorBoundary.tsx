import React, { Component, ReactNode } from 'react';

import { Button } from './Button';
import { Card, CardContent } from './Card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo?: React.ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // 调用外部错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 记录错误到控制台
    console.group('🚨 V2 Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // 默认错误UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              {/* 错误图标 */}
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>

              {/* 错误标题 */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                组件加载失败
              </h3>

              {/* 错误描述 */}
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                页面组件出现异常，请尝试重新加载
              </p>

              {/* 错误详情 */}
              {this.props.showDetails && this.state.error && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-4 text-left">
                  <div className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
                    {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        查看详细错误信息
                      </summary>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="space-x-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={this.handleRetry}
                >
                  重试
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReload}
                >
                  刷新页面
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简化的错误边界组件，用于小组件包裹
export const SimpleErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <div className="flex items-center justify-center p-4 text-center">
          <div className="text-red-600 dark:text-red-400">
            <div className="text-sm font-medium">组件错误</div>
            <div className="text-xs text-gray-500 mt-1">{error.message}</div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// 页面级错误边界，显示更详细的信息
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // 在生产环境中可以上报错误到监控服务
        console.error('Page Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}; 