import { Provider as JotaiProvider } from 'jotai';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { useTranslation } from './i18n';
import { AppStateProvider } from './store';

// 错误边界内容组件（支持翻译）
const ErrorBoundaryContent: React.FC<{
  error?: Error;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{t('Application Error')}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{t('V2 version failed to load, please try again')}</p>
        {error && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4 text-left">
            <code className="text-sm text-red-600 dark:text-red-400">
              {error.message}
            </code>
          </div>
        )}
        <div className="space-x-2">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {t('Retry')}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            {t('Refresh Page')}
          </button>
        </div>
      </div>
    </div>
  );
};

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
        <ErrorBoundaryContent 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

// V2应用启动
const rootEl = document.getElementById('app');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <JotaiProvider>
          <AppStateProvider>
            <App />
          </AppStateProvider>
        </JotaiProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Cannot find #app element');
} 