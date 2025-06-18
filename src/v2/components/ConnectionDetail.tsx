import React from 'react';

import { Connection } from '../hooks/useConnectionsSearch';
import { cn } from '../utils/cn';
import { Card, CardContent } from './ui/Card';

interface ConnectionDetailProps {
  connection: Connection | null;
  className?: string;
}

export const ConnectionDetail: React.FC<ConnectionDetailProps> = ({ connection, className }) => {
  if (!connection) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-gray-500 dark:text-gray-400">请选择一个连接查看详情</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (start: string) => {
    const startTime = new Date(start);
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟 ${seconds % 60}秒`;
    return `${Math.floor(seconds / 3600)}小时 ${Math.floor((seconds % 3600) / 60)}分钟`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* 连接基本信息 */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">连接ID</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{connection.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">网络类型</p>
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  connection.metadata.network === 'tcp' ? 'bg-blue-500' : 
                  connection.metadata.network === 'udp' ? 'bg-green-500' : 'bg-gray-500'
                }`}></span>
                <p className="text-sm text-gray-900 dark:text-gray-100">{connection.metadata.network.toUpperCase()}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">开始时间</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(connection.start)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">持续时间</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{formatDuration(connection.start)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 连接地址信息 */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">地址信息</h3>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">主机名</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{connection.metadata.host || '未知'}</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">源地址</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {connection.metadata.sourceIP}:{connection.metadata.sourcePort}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">目标地址</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {connection.metadata.destinationIP}:{connection.metadata.destinationPort}
                </p>
              </div>
            </div>
            {connection.metadata.processPath && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">进程路径</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 break-all">{connection.metadata.processPath}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 代理和规则信息 */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">代理和规则</h3>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">代理链</p>
              <div className="flex flex-wrap items-center gap-2">
                {connection.chains.map((chain, index) => (
                  <React.Fragment key={index}>
                    <span className="text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                      {chain}
                    </span>
                    {index < connection.chains.length - 1 && (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
                {connection.chains.length === 0 && (
                  <span className="text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md font-medium">直连</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">规则</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{connection.rule || '未知'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">规则负载</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 break-all font-medium">{connection.rulePayload || '无'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 流量信息 */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">流量信息</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">上传</p>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{formatBytes(connection.upload)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">下载</p>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{formatBytes(connection.download)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">总流量</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{formatBytes(connection.upload + connection.download)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionDetail; 