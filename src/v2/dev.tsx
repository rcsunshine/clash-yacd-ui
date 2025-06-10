import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai';

// 导入 V1 的状态管理初始化
import { initialState } from '../store/app';
import { AppStateProvider } from './store';
import { AppV2 } from './App';
import { initGlobalErrorHandling } from './hooks/useErrorHandler';

// 初始化 V1 状态
initialState();

// 初始化全局错误处理
const cleanupErrorHandling = initGlobalErrorHandling();

// 页面卸载时清理
window.addEventListener('beforeunload', cleanupErrorHandling);

// 简单的错误边界
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('V2 Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">应用程序错误</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">V2 版本加载失败，请重试</p>
            {this.state.error && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4 text-left">
                <code className="text-sm text-red-600 dark:text-red-400">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <div className="space-x-2">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 开发模式下的 V2 预览
const rootEl = document.getElementById('app');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <JotaiProvider>
          <AppStateProvider>
            <AppV2 />
          </AppStateProvider>
        </JotaiProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('找不到 #app 元素');
} 