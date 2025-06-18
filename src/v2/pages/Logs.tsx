import React, {useMemo,useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { SearchInput } from '../components/ui/SearchInput';
import { FixedVirtualList } from '../components/ui/VirtualList';
import { useLogs } from '../hooks/useAPI';
import { LogLevel } from '../types/api';

interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
  source?: string;
}

interface LogStats {
  totalLogs: number;
  levelCounts: Record<LogLevel, number>;
  timeDistribution: { hour: number; count: number }[];
  topKeywords: { keyword: string; count: number }[];
  recentActivity: { time: string; count: number }[];
}

export const Logs: React.FC = () => {
  const { logs: rawLogs, isConnected, clearLogs: clearApiLogs, refreshLogs } = useLogs();
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // 转换API日志格式为组件需要的格式
  const logs: LogEntry[] = rawLogs.map((log, index) => ({
    id: `${log.time || Date.now()}-${index}`,
    time: log.time || new Date().toLocaleTimeString(),
    level: log.type,
    message: log.payload,
    source: undefined // API日志没有source字段
  }));

  // 计算日志统计信息
  const logStats: LogStats = useMemo(() => {
    const levelCounts: Record<LogLevel, number> = {
      info: 0,
      warning: 0,
      error: 0,
      debug: 0,
      silent: 0
    };

    const timeDistribution: Record<number, number> = {};
    const keywordCounts: Record<string, number> = {};
    const recentActivity: Record<string, number> = {};

    logs.forEach(log => {
      // 统计级别
      levelCounts[log.level]++;

      // 统计时间分布（按小时）
      const hour = new Date(log.time).getHours();
      timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;

      // 统计关键词（提取日志消息中的关键词）
      const words = log.message
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      words.forEach(word => {
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      });

      // 统计最近活动（按分钟）
      const timeKey = log.time.slice(0, 16); // YYYY-MM-DD HH:MM
      recentActivity[timeKey] = (recentActivity[timeKey] || 0) + 1;
    });

    return {
      totalLogs: logs.length,
      levelCounts,
      timeDistribution: Object.entries(timeDistribution)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour),
      topKeywords: Object.entries(keywordCounts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentActivity: Object.entries(recentActivity)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => b.time.localeCompare(a.time))
        .slice(0, 20)
    };
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filter === 'all' || log.level === filter;
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.source && log.source.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'debug':
        return 'text-theme-secondary bg-theme-secondary';
      default:
        return 'text-theme-secondary bg-theme-secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'debug':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const clearLogs = () => {
    clearApiLogs();
  };

  // 处理刷新按钮点击
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshLogs();
    
    // 1秒后重置刷新状态，给用户一个明显的反馈
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // 导出日志为JSON格式
  const exportLogsAsJSON = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clash-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导出日志为文本格式
  const exportLogsAsText = () => {
    const textContent = filteredLogs.map(log => 
      `[${log.time}] [${log.level.toUpperCase()}] ${log.source ? `[${log.source}] ` : ''}${log.message}`
    ).join('\n');
    const dataBlob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clash-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导出统计报告
  const exportStatsReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalLogs: logStats.totalLogs,
        errorRate: ((logStats.levelCounts.error / logStats.totalLogs) * 100).toFixed(2) + '%',
        warningRate: ((logStats.levelCounts.warning / logStats.totalLogs) * 100).toFixed(2) + '%'
      },
      levelDistribution: logStats.levelCounts,
      timeDistribution: logStats.timeDistribution,
      topKeywords: logStats.topKeywords,
      recentActivity: logStats.recentActivity
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clash-logs-stats-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-6">
      {/* 统一的页面头部样式 */}
      <div className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-theme hidden lg:block">日志</h1>
            <p className="text-sm text-theme-secondary">
              系统运行日志 • 共 {logs.length} 条记录 • {isConnected ? '✅ 已连接' : '❌ 未连接'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={() => setShowStats(!showStats)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {showStats ? '隐藏统计' : '显示统计'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={exportStatsReport}
            disabled={logs.length === 0}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            导出统计
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={exportLogsAsJSON}
            disabled={filteredLogs.length === 0}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出 JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={exportLogsAsText}
            disabled={filteredLogs.length === 0}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出 TXT
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={clearLogs}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <svg className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
        </div>
      </div>

      {/* 高级统计分析面板 */}
      {showStats && (
        <div className="space-y-4">
          {/* 统计概览 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-theme mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                日志统计分析
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 级别分布饼图 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-theme-secondary">级别分布</h4>
                  <div className="space-y-2">
                    {Object.entries(logStats.levelCounts).map(([level, count]) => {
                      const percentage = logStats.totalLogs > 0 ? (count / logStats.totalLogs * 100).toFixed(1) : '0';
                      return (
                        <div key={level} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              level === 'error' ? 'bg-red-500' :
                              level === 'warning' ? 'bg-yellow-500' :
                              level === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-sm text-theme-secondary capitalize">{level}</span>
                          </div>
                          <div className="text-sm font-medium text-theme">
                            {count} ({percentage}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 时间分布 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-theme-secondary">时间分布 (24小时)</h4>
                  <div className="space-y-1">
                    {logStats.timeDistribution.slice(0, 8).map(({ hour, count }) => (
                      <div key={hour} className="flex items-center space-x-2">
                        <span className="text-xs text-theme-secondary w-8">{hour}:00</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-slate-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.max(5, (count / Math.max(...logStats.timeDistribution.map(d => d.count))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-theme-secondary w-8">{count}</span>
                      </div>
                    ))}
                    {logStats.timeDistribution.length > 8 && (
                      <div className="text-xs text-theme-tertiary text-center pt-1">
                        +{logStats.timeDistribution.length - 8} 更多时段
                      </div>
                    )}
                  </div>
                </div>

                {/* 关键词统计 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-theme-secondary">热门关键词</h4>
                  <div className="space-y-1">
                    {logStats.topKeywords.slice(0, 8).map(({ keyword, count }) => (
                      <div key={keyword} className="flex items-center justify-between">
                        <span className="text-sm text-theme truncate flex-1 mr-2">{keyword}</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full text-theme-secondary">
                          {count}
                        </span>
                      </div>
                    ))}
                    {logStats.topKeywords.length > 8 && (
                      <div className="text-xs text-theme-tertiary text-center pt-1">
                        +{logStats.topKeywords.length - 8} 更多关键词
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 健康度指标 */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-theme-secondary mb-3">系统健康度</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {logStats.totalLogs > 0 ? (100 - (logStats.levelCounts.error / logStats.totalLogs * 100)).toFixed(1) : '100'}%
                    </div>
                    <div className="text-xs text-theme-secondary">系统稳定性</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {logStats.levelCounts.error}
                    </div>
                    <div className="text-xs text-theme-secondary">错误总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {logStats.levelCounts.warning}
                    </div>
                    <div className="text-xs text-theme-secondary">警告总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-theme">
                      {logStats.recentActivity.length}
                    </div>
                    <div className="text-xs text-theme-secondary">活跃时段</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 统计和控制 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {logs.filter(log => log.level === 'info').length}
                </div>
                <div className="text-xs text-theme-secondary font-medium">信息</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {logs.filter(log => log.level === 'warning').length}
                </div>
                <div className="text-xs text-theme-secondary font-medium">警告</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {logs.filter(log => log.level === 'error').length}
                </div>
                <div className="text-xs text-theme-secondary font-medium">错误</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-theme-secondary">
                  {logs.filter(log => log.level === 'debug').length}
                </div>
                <div className="text-xs text-theme-secondary font-medium">调试</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card className="overflow-hidden border-0 shadow-lg card-hover">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <SearchInput
                  placeholder="搜索日志内容或来源..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm text-theme-secondary">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="w-4 h-4 text-slate-600 bg-gray-100 border-gray-300 rounded focus:ring-slate-500 dark:focus:ring-slate-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span>自动滚动</span>
                </label>
              </div>
            </div>
            
            {/* 级别过滤 */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-theme-secondary">过滤级别:</span>
              <div className="flex space-x-2">
                {(['all', 'info', 'warning', 'error', 'debug'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFilter(level as LogLevel)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === level
                        ? 'bg-slate-600 text-white'
                        : 'bg-theme-tertiary text-theme-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {level === 'all' ? '全部' : level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="space-y-0 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-theme mb-3">
                  暂无日志记录
                </h3>
                <p className="text-theme-secondary max-w-md mx-auto">
                  当前没有符合过滤条件的日志记录
                </p>
              </div>
            ) : (
              <FixedVirtualList<LogEntry>
                items={filteredLogs}
                height={384}
                itemHeight={80}
                renderItem={(log: LogEntry, index: number) => (
                  <div 
                    key={log.id}
                    className={`p-4 border-b border-gray-200 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800/50 transition-colors ${
                      index === filteredLogs.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${getLevelColor(log.level)}`}>
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            {log.source && (
                              <span className="text-xs px-2 py-1 bg-theme-tertiary text-theme-secondary rounded-full">
                                {log.source}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-theme-tertiary">
                            {log.time}
                          </span>
                        </div>
                        <p className="text-sm text-theme break-words">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                className="space-y-0"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};