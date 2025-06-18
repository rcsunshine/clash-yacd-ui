import React, { useRef, useState } from 'react';

import ConnectionDetail from '../components/ConnectionDetail';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import Drawer from '../components/ui/Drawer';
import HelpTooltip from '../components/ui/HelpTooltip';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { FixedVirtualList } from '../components/ui/VirtualList';
import { useCloseAllConnections, useCloseConnection, useConnections } from '../hooks/useAPI';
import { ConnectionSortKey,NetworkType, useConnectionsSearch } from '../hooks/useConnectionsSearch';
import useKeyboardShortcut from '../hooks/useKeyboardShortcut';
import { cn } from '../utils/cn';

interface Connection {
  id: string;
  metadata: {
    network: string;
    type: string;
    sourceIP: string;
    sourcePort: string;
    destinationIP: string;
    destinationPort: string;
    host?: string;
    processPath?: string;
  };
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload: string;
}

export const Connections: React.FC = () => {
  const { data: connectionsData, isLoading, error, refetch, isPaused, togglePause } = useConnections();
  const closeConnection = useCloseConnection();
  const closeAllConnections = useCloseAllConnections();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 连接详情抽屉
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // 使用连接搜索钩子
  const {
    filteredConnections,
    searchQuery,
    setSearchQuery,
    networkFilter,
    setNetworkFilter,
    statusFilter,
    setStatusFilter,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    resetFilters,
    searchHints,
    selectedConnections,
    toggleConnectionSelection,
    toggleAllConnections,
    hasSelectedConnections,
    closedConnectionsCount,
    activeConnectionsCount
  } = useConnectionsSearch(
    connectionsData?.connections || [],
    { enableAdvancedSyntax: true }
  );
  
  // 键盘快捷键
  useKeyboardShortcut([
    {
      key: 'f',
      callback: () => {
        searchInputRef.current?.focus();
      },
      description: '聚焦搜索框'
    },
    {
      key: 'r',
      callback: () => {
        refetch();
      },
      description: '刷新连接列表'
    },
    {
      key: 'p',
      callback: () => {
        togglePause();
      },
      description: '暂停/恢复刷新'
    },
    {
      key: 'Escape',
      callback: () => {
        if (searchQuery) {
          resetFilters();
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      },
      description: '清除过滤器或关闭详情'
    },
    {
      key: 'c',
      callback: () => {
        if (hasSelectedConnections) {
          handleCloseSelectedConnections();
        }
      },
      description: '关闭选中的连接'
    }
  ]);
  
  // 处理单个连接关闭
  const handleCloseConnection = async (connectionId: string) => {
    try {
      await closeConnection.mutateAsync(connectionId);
    } catch (error) {
      console.error('关闭连接失败:', error);
    }
  };
  
  // 处理批量连接关闭
  const handleCloseAllConnections = async () => {
    try {
      await closeAllConnections.mutateAsync();
    } catch (error) {
      console.error('关闭所有连接失败:', error);
    }
  };
  
  // 处理关闭选中的连接
  const handleCloseSelectedConnections = async () => {
    try {
      const promises = Array.from(selectedConnections).map(id => 
        closeConnection.mutateAsync(id)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('关闭选中连接失败:', error);
    }
  };
  
  // 处理查看连接详情
  const handleViewConnectionDetail = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setIsDrawerOpen(true);
  };
  
  // 格式化字节数
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 格式化持续时间
  const formatDuration = (start: string) => {
    try {
      const startTime = new Date(start);
      const now = new Date();
      
      // 确保时间差为正数
      let diff = now.getTime() - startTime.getTime();
      if (diff < 0) {
        // 如果时间差为负，可能是时区或时钟同步问题，使用绝对值
        diff = Math.abs(diff);
        console.info('检测到负时长，已自动修正:', start);
      }
      
      const seconds = Math.floor(diff / 1000);
      
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    } catch (error) {
      console.error('格式化持续时间出错:', error);
      return '0s'; // 出错时返回默认值
    }
  };
  
  // 获取选中的连接详情
  const selectedConnection = selectedConnectionId 
    ? connectionsData?.connections?.find(c => c.id === selectedConnectionId) || null
    : null;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-theme hidden lg:block">连接</h1>
        <Card>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-theme hidden lg:block">连接</h1>
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-theme mb-2">
                加载失败
              </h3>
              <p className="text-theme-secondary mb-4">{String(error)}</p>
              <Button onClick={() => refetch()}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const totalConnections = connectionsData?.connections?.length || 0;
  const tcpConnections = connectionsData?.connections?.filter(c => c.metadata.network === 'tcp')?.length || 0;
  const udpConnections = connectionsData?.connections?.filter(c => c.metadata.network === 'udp')?.length || 0;
  const totalTraffic = connectionsData?.connections?.reduce((acc, conn) => acc + conn.upload + conn.download, 0) || 0;
  
  return (
    <div className="space-y-4 p-6">
      {/* 统一的页面头部样式 */}
      <div className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 717.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-theme hidden lg:block">连接</h1>
            <p className="text-sm text-theme-secondary">
              {isPaused ? '已暂停刷新' : '实时网络连接监控'} • 共 {totalConnections} 个连接
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasSelectedConnections && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCloseSelectedConnections}
              disabled={closeConnection.isLoading}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              关闭选中 ({selectedConnections.size})
            </Button>
          )}
          
          <Button 
            variant={isPaused ? "outline" : "outline"} 
            size="sm" 
            onClick={togglePause}
            className={cn(
              "text-sm",
              isPaused 
                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800" 
                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
            )}
          >
            {isPaused ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                恢复
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                暂停
              </>
            )}
          </Button>
          
          {totalConnections > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCloseAllConnections}
              disabled={closeAllConnections.isLoading}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {closeAllConnections.isLoading ? '关闭中...' : '关闭所有'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </Button>
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {totalConnections}
                </div>
                <div className="text-xs text-theme-secondary font-medium">总连接数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                  {tcpConnections}
                </div>
                <div className="text-xs text-theme-secondary font-medium">TCP 连接</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-stone-600 to-stone-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-700 dark:text-stone-300">
                  {udpConnections}
                </div>
                <div className="text-xs text-theme-secondary font-medium">UDP 连接</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-neutral-700 dark:text-neutral-300">
                  {formatBytes(totalTraffic)}
                </div>
                <div className="text-xs text-theme-secondary font-medium">总流量</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 搜索和过滤 - 红框区域优化 */}
      <div className="bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-4 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative">
            <SearchInput
              ref={searchInputRef}
              placeholder="搜索主机名、IP地址或代理链..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <HelpTooltip
                title="搜索语法帮助"
                content={
                  <div className="space-y-2">
                    <p>支持高级搜索语法:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code>host:google.com</code> - 搜索主机名</li>
                      <li><code>ip:192.168.1.1</code> - 搜索IP地址</li>
                      <li><code>network:tcp</code> - 搜索网络类型</li>
                      <li><code>rule:DIRECT</code> - 搜索规则</li>
                      <li><code>proxy:PROXY</code> - 搜索代理链</li>
                    </ul>
                    <p className="text-xs mt-2 text-gray-300">快捷键: F(聚焦搜索), R(刷新), P(暂停/恢复), ESC(清除过滤器), C(关闭选中)</p>
                  </div>
                }
                position="bottom"
                width={280}
              >
                <button type="button" className="flex items-center justify-center w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </HelpTooltip>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value as NetworkType)}
              options={[
                { value: 'all', label: '所有协议' },
                { value: 'tcp', label: 'TCP' },
                { value: 'udp', label: 'UDP' },
              ]}
              size="sm"
              className="min-w-[120px]"
            />
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as ConnectionSortKey)}
              options={[
                { value: 'time', label: '时间' },
                { value: 'host', label: '主机' },
                { value: 'upload', label: '上传' },
                { value: 'download', label: '下载' },
                { value: 'total', label: '总流量' },
              ]}
              size="sm"
              className="min-w-[120px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="min-w-[40px]"
            >
              {sortOrder === 'asc' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              )}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              状态:
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "px-2 py-1 text-xs rounded-md",
                  statusFilter === 'all'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                全部 ({connectionsData?.connections?.length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={cn(
                  "px-2 py-1 text-xs rounded-md",
                  statusFilter === 'active'
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                活跃 ({activeConnectionsCount})
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={cn(
                  "px-2 py-1 text-xs rounded-md",
                  statusFilter === 'closed'
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                已关闭 ({closedConnectionsCount})
              </button>
            </div>
          </div>
          {searchQuery && (
            <div className="flex items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-2">
                找到 {filteredConnections.length} 个匹配的连接
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                清除过滤器
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* 连接列表 */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-4">
          {filteredConnections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-theme mb-3">
                {searchQuery || networkFilter !== 'all' || statusFilter !== 'all' 
                  ? '没有找到匹配的连接' 
                  : '暂无活跃连接'
                }
              </h3>
              <p className="text-theme-secondary max-w-md mx-auto">
                {searchQuery || networkFilter !== 'all' 
                  ? '尝试调整搜索条件或筛选器'
                  : statusFilter === 'closed' 
                    ? '当前没有已关闭的连接记录'
                    : statusFilter === 'active'
                      ? '当前没有活跃的网络连接'
                      : '当前没有任何连接记录'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-theme-secondary pb-2 border-b border-gray-200 dark:border-gray-600/50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedConnections.size === filteredConnections.length && filteredConnections.length > 0}
                    onChange={toggleAllConnections}
                    className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="font-medium">显示 {filteredConnections.length} 个连接</span>
                </div>
                <span>实时更新</span>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                <FixedVirtualList
                  items={filteredConnections}
                  height={500}
                  itemHeight={100}
                  overscan={20}
                  renderItem={(connection, index) => {
                    const destination = connection.metadata.host || 
                      `${connection.metadata.destinationIP}:${connection.metadata.destinationPort}`;
                    
                    const isSelected = selectedConnections.has(connection.id);
                    
                    return (
                      <div 
                        key={connection.id || index}
                        className={cn(
                          "border border-gray-200 dark:border-gray-600/50 rounded-lg p-4 m-2 transition-colors shadow-sm",
                          isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50" : "hover:bg-white dark:hover:bg-gray-800/50",
                          'closed' in connection && connection.closed === true ? "bg-gray-50 dark:bg-gray-800/30 opacity-70" : "",
                          "cursor-pointer"
                        )}
                        onClick={() => handleViewConnectionDetail(connection.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleViewConnectionDetail(connection.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleConnectionSelection(connection.id);
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <div className="flex-1 min-w-0">
                              {/* 主机名和网络类型 */}
                              <div className="flex items-center mb-3">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  'closed' in connection && connection.closed === true ? 'bg-gray-400' :
                                  connection.metadata.network === 'tcp' ? 'bg-blue-500' : 
                                  connection.metadata.network === 'udp' ? 'bg-green-500' : 'bg-gray-500'
                                }`}></div>
                                <span className="text-sm font-medium text-theme truncate mr-2">
                                  {destination}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                                    {connection.metadata.network?.toUpperCase()}
                                  </span>
                                  {'closed' in connection && connection.closed === true && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                                      已关闭
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* 连接详情 - 使用表格式布局 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-xs">
                                <div className="flex">
                                  <div className="w-16 text-gray-500 dark:text-gray-400">代理链:</div>
                                  <div className="flex-1 font-medium truncate text-theme-secondary">
                                    {connection.chains?.join(' → ') || 'Direct'}
                                  </div>
                                </div>
                                
                                <div className="flex">
                                  <div className="w-16 text-gray-500 dark:text-gray-400">规则:</div>
                                  <div className="flex-1 font-medium truncate text-theme-secondary">
                                    {connection.rule || 'Unknown'}
                                  </div>
                                </div>
                                
                                <div className="flex">
                                  <div className="w-16 text-gray-500 dark:text-gray-400">流量:</div>
                                  <div className="flex-1 font-medium">
                                    <span className="text-green-600 dark:text-green-400 inline-block w-24">↑{formatBytes(connection.upload)}</span>
                                    <span className="text-blue-600 dark:text-blue-400 inline-block w-24">↓{formatBytes(connection.download)}</span>
                                  </div>
                                </div>
                                
                                <div className="flex">
                                  <div className="w-16 text-gray-500 dark:text-gray-400">时长:</div>
                                  <div className="flex-1 font-medium text-theme-secondary">
                                    {formatDuration(connection.start)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 连接操作按钮 */}
                          <div 
                            className="flex items-center ml-2" 
                            onClick={(e) => e.stopPropagation()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCloseConnection(connection.id)}
                              disabled={closeConnection.isLoading}
                              className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              关闭
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  className="space-y-0"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 连接详情抽屉 */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="连接详情"
        size="lg"
      >
        <ConnectionDetail connection={selectedConnection} />
      </Drawer>
    </div>
  );
};

export default Connections;
