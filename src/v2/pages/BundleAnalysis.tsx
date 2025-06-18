import React, { useMemo,useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

interface BundleStats {
  totalSize: number;
  gzipSize: number;
  chunks: {
    name: string;
    size: number;
    gzipSize: number;
    type: 'main' | 'vendor' | 'page' | 'component';
  }[];
}

export const BundleAnalysis: React.FC = () => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  // 基于实际构建结果的统计数据
  const bundleStats: BundleStats = useMemo(() => ({
    totalSize: 595.45 * 1024, // 595.45 kB
    gzipSize: 153.87 * 1024,  // 153.87 kB
    chunks: [
      { name: 'index.v2.js', size: 314.94 * 1024, gzipSize: 97.95 * 1024, type: 'main' },
      { name: 'Connections.js', size: 35.00 * 1024, gzipSize: 8.62 * 1024, type: 'page' },
      { name: 'Rules.js', size: 29.13 * 1024, gzipSize: 8.02 * 1024, type: 'page' },
      { name: 'Proxies.js', size: 27.20 * 1024, gzipSize: 7.31 * 1024, type: 'page' },
      { name: 'Dashboard.js', size: 25.53 * 1024, gzipSize: 5.52 * 1024, type: 'page' },
      { name: 'Logs.js', size: 20.02 * 1024, gzipSize: 4.60 * 1024, type: 'page' },
      { name: 'Config.js', size: 14.93 * 1024, gzipSize: 3.69 * 1024, type: 'page' },
      { name: 'APIConfig.js', size: 9.12 * 1024, gzipSize: 3.17 * 1024, type: 'page' },
      { name: 'About.js', size: 7.73 * 1024, gzipSize: 2.56 * 1024, type: 'page' },
      { name: 'useKeyboardShortcut.js', size: 5.23 * 1024, gzipSize: 1.97 * 1024, type: 'component' },
      { name: 'CSS Bundle', size: 75.74 * 1024, gzipSize: 11.61 * 1024, type: 'vendor' }
    ]
  }), []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCompressionRatio = (original: number, compressed: number): number => {
    return ((1 - compressed / original) * 100);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'main': return 'bg-blue-500';
      case 'vendor': return 'bg-green-500';
      case 'page': return 'bg-purple-500';
      case 'component': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'main':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'vendor':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'page':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'component':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return null;
    }
  };

  const optimizationSuggestions = [
    {
      title: t('Code Splitting Optimization'),
      description: t('Main bundle (index.v2.js) is large, consider separating third-party libraries'),
      priority: t('High Priority'),
      impact: t('Reduce 50-100KB'),
      action: t('Separate React, React-DOM and other libraries to vendor chunk'),
      status: t('Recommended')
    },
    {
      title: t('Tree Shaking Optimization'),
      description: t('Check and remove unused code and dependencies'),
      priority: t('Medium Priority'),
      impact: t('Reduce 20-40KB'),
      action: t('Use webpack-bundle-analyzer to analyze unused code'),
      status: t('In Progress')
    },
    {
      title: t('CSS Optimization'),
      description: t('CSS bundle size is moderate, but can be further optimized'),
      priority: t('Medium Priority'),
      impact: t('Reduce 10-20KB'),
      action: t('Remove unused Tailwind CSS classes, enable PurgeCSS'),
      status: t('Planned')
    },
    {
      title: t('Dynamic Import Optimization'),
      description: t('Page components already implement good code splitting'),
      priority: t('Low Priority'),
      impact: t('Already optimized'),
      action: t('Continue maintaining current lazy loading strategy'),
      status: t('Completed')
    },
    {
      title: t('Compression Optimization'),
      description: t('Current compression rate 74.1%, can be further improved'),
      priority: t('Medium Priority'),
      impact: t('Reduce 10-30KB'),
      action: t('Enable Brotli compression, optimize Terser configuration'),
      status: t('Recommended')
    }
  ];

  const getPriorityColor = (priority: string) => {
    if (priority === t('High Priority')) {
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    } else if (priority === t('Medium Priority')) {
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
    } else if (priority === t('Low Priority')) {
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    }
    return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
  };

  const getStatusColor = (status: string) => {
    if (status === t('Completed')) {
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    } else if (status === t('In Progress')) {
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
    } else if (status === t('Planned')) {
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
    } else if (status === t('Recommended')) {
      return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20';
    }
    return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
  };

  const exportBundleReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSize: formatBytes(bundleStats.totalSize),
        gzipSize: formatBytes(bundleStats.gzipSize),
        compressionRatio: getCompressionRatio(bundleStats.totalSize, bundleStats.gzipSize).toFixed(1) + '%',
        chunkCount: bundleStats.chunks.length,
        performance: {
          grade: bundleStats.gzipSize < 200 * 1024 ? 'A' : bundleStats.gzipSize < 500 * 1024 ? 'B' : 'C',
          loadTime: (bundleStats.gzipSize / (1024 * 1024) * 8 / 10).toFixed(2) + 's', // 假设10Mbps
          recommendation: bundleStats.gzipSize < 200 * 1024 ? '优秀' : '良好，可进一步优化'
        }
      },
      chunks: bundleStats.chunks.map(chunk => ({
        name: chunk.name,
        size: formatBytes(chunk.size),
        gzipSize: formatBytes(chunk.gzipSize),
        type: chunk.type,
        compressionRatio: getCompressionRatio(chunk.size, chunk.gzipSize).toFixed(1) + '%',
        percentage: ((chunk.gzipSize / bundleStats.gzipSize) * 100).toFixed(1) + '%'
      })),
      optimizations: optimizationSuggestions,
      analysis: {
        largestChunks: bundleStats.chunks
          .sort((a, b) => b.gzipSize - a.gzipSize)
          .slice(0, 3)
          .map(chunk => ({
            name: chunk.name,
            size: formatBytes(chunk.gzipSize),
            percentage: ((chunk.gzipSize / bundleStats.gzipSize) * 100).toFixed(1) + '%'
          })),
        recommendations: [
          '主包占比过高，建议分离第三方库',
          '页面代码分割良好，继续保持',
          'CSS 包大小合理，可考虑进一步优化'
        ]
      }
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bundle-analysis-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-lg border border-indigo-300/50 dark:border-indigo-600/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-theme hidden lg:block">{t('Bundle Analysis')}</h1>
            <p className="text-sm text-theme-secondary">
              {t('Build artifact analysis')} • {t('Total size')} {formatBytes(bundleStats.totalSize)} • {t('Compressed size')} {formatBytes(bundleStats.gzipSize)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showDetails ? t('Hide Details') : t('Show Details')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={exportBundleReport}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('Export Report')}
          </Button>
        </div>
      </div>

      {/* 总览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatBytes(bundleStats.totalSize)}
                </div>
                <div className="text-xs text-theme-secondary font-medium">{t('Total size')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatBytes(bundleStats.gzipSize)}
                </div>
                <div className="text-xs text-theme-secondary font-medium">{t('Gzip Size')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {getCompressionRatio(bundleStats.totalSize, bundleStats.gzipSize).toFixed(1)}%
                </div>
                <div className="text-xs text-theme-secondary font-medium">{t('Compression Rate')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {bundleStats.chunks.length}
                </div>
                <div className="text-xs text-theme-secondary font-medium">{t('File Count')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 性能评分 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('Performance Score')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">B+</span>
              </div>
              <div className="font-semibold text-theme">{t('Overall Score')}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('Compressed < 200KB is excellent')}</div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">1.2s</span>
              </div>
              <div className="font-semibold text-theme">{t('Load Time')}</div>
              <div className="text-sm text-theme-secondary">{t('10Mbps network environment')}</div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">74%</span>
              </div>
              <div className="font-semibold text-theme">{t('Compression Efficiency')}</div>
              <div className="text-sm text-theme-secondary">{t('Gzip compression rate')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细分析 */}
      {showDetails && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-theme mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t('File Detail Analysis')}
            </h3>
            
            <div className="space-y-3">
              {bundleStats.chunks
                .sort((a, b) => b.size - a.size)
                .map((chunk, index) => {
                  const percentage = ((chunk.gzipSize / bundleStats.gzipSize) * 100).toFixed(1);
                  return (
                    <div key={chunk.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${getTypeColor(chunk.type)} rounded-lg flex items-center justify-center text-white`}>
                          {getTypeIcon(chunk.type)}
                        </div>
                        <div>
                          <div className="font-medium text-theme">{chunk.name}</div>
                          <div className="text-xs text-theme-secondary capitalize">{chunk.type} • {percentage}% of total</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-theme">{formatBytes(chunk.size)}</div>
                        <div className="text-xs text-theme-secondary">
                          gzip: {formatBytes(chunk.gzipSize)} ({getCompressionRatio(chunk.size, chunk.gzipSize).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 优化建议 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {t('Optimization Suggestions')}
          </h3>
          
          <div className="space-y-4">
            {optimizationSuggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-theme">{suggestion.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(suggestion.status)}`}>
                      {suggestion.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-theme-secondary mb-2">{suggestion.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {t('Expected Impact')}: {suggestion.impact}
                  </span>
                  <span className="text-theme-tertiary">
                    {t('Suggestion')}: {suggestion.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 