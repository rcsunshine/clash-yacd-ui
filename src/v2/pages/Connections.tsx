import React, { useMemo,useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { FixedVirtualList } from '../components/ui/VirtualList';
import { useCloseAllConnections,useCloseConnection, useConnections } from '../hooks/useAPI';

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
  const { data: connectionsData, isLoading, error, refetch } = useConnections();
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  
  const closeConnection = useCloseConnection();
  const closeAllConnections = useCloseAllConnections();

  // 处理连接数据 - 移到Hook后面但在使用前
  const connections = useMemo(() => {
    if (!connectionsData?.connections) return [];
    
    const filtered = connectionsData.connections.filter((conn: Connection) => {
      const searchMatch = searchQuery === '' || 
        (conn.metadata.host && conn.metadata.host.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conn.metadata.destinationIP.includes(searchQuery) ||
        conn.chains.some(chain => chain.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const networkMatch = networkFilter === 'all' || 
        conn.metadata.network.toLowerCase() === networkFilter.toLowerCase();
      
      return searchMatch && networkMatch;
    });

    return filtered;
  }, [connectionsData?.connections, searchQuery, networkFilter]);

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
      setSelectedConnections(new Set());
    } catch (error) {
      console.error('关闭所有连接失败:', error);
    }
  };

  // 处理选中的连接
  const _toggleConnectionSelection = (connectionId: string) => {
    const newSelected = new Set(selectedConnections);
    if (newSelected.has(connectionId)) {
      newSelected.delete(connectionId);
    } else {
      newSelected.add(connectionId);
    }
    setSelectedConnections(newSelected);
  };

  // 全选/取消全选
  const _toggleAllConnections = () => {
    if (selectedConnections.size === connections.length) {
      setSelectedConnections(new Set());
    } else {
      setSelectedConnections(new Set(connections.map(conn => conn.id)));
    }
  };

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
  const tcpConnections = connectionsData?.connections?.filter((c: Connection) => c.metadata.network === 'tcp')?.length || 0;
  const udpConnections = connectionsData?.connections?.filter((c: Connection) => c.metadata.network === 'udp')?.length || 0;
  const totalTraffic = connectionsData?.connections?.reduce((acc: number, conn: Connection) => acc + conn.upload + conn.download, 0) || 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (start: string) => {
    const startTime = new Date(start);
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-4">
      {/* 紧凑的页面头部 */}
      <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-theme hidden lg:block">连接</h1>
            <p className="text-sm text-theme-secondary">
              实时网络连接监控 • 共 {totalConnections} 个连接
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* 搜索和过滤 */}
      <Card className="overflow-hidden border-0 shadow-lg card-hover">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="搜索主机名、IP地址或代理链..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              options={[
                { value: 'all', label: '所有协议' },
                { value: 'tcp', label: 'TCP' },
                { value: 'udp', label: 'UDP' },
              ]}
              size="sm"
              className="min-w-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* 连接列表 */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-4">
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-theme mb-3">
                {searchQuery || networkFilter !== 'all' ? '没有找到匹配的连接' : '暂无活跃连接'}
              </h3>
              <p className="text-theme-secondary max-w-md mx-auto">
                {searchQuery || networkFilter !== 'all' 
                  ? '尝试调整搜索条件或筛选器'
                  : '当前没有活跃的网络连接'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-theme-secondary pb-2 border-b border-theme">
                <span>显示 {connections.length} 个连接</span>
                <span>实时更新</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                <FixedVirtualList
                  items={connections}
                  height={384}
                  itemHeight={120}
                  renderItem={(connection, index) => {
                    const destination = connection.metadata.host || 
                      `${connection.metadata.destinationIP}:${connection.metadata.destinationPort}`;
                    
                    return (
                      <div 
                        key={connection.id || index}
                        className="border border-theme rounded-lg p-3 m-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${
                                connection.metadata.network === 'tcp' ? 'bg-blue-500' : 
                                connection.metadata.network === 'udp' ? 'bg-green-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="text-sm font-medium text-theme truncate">
                                {destination}
                              </span>
                              <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                                {connection.metadata.network?.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-theme-secondary">
                              <div>
                                <span className="font-medium">代理链:</span>
                                <div className="truncate text-theme-secondary">
                                  {connection.chains?.join(' → ') || 'Direct'}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">规则:</span>
                                <div className="truncate text-theme-secondary">
                                  {connection.rule || 'Unknown'}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">流量:</span>
                                <div className="text-theme-secondary">
                                  ↑{formatBytes(connection.upload)} ↓{formatBytes(connection.download)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">持续时间:</span>
                                <div className="text-theme-secondary">
                                  {formatDuration(connection.start)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 连接操作按钮 */}
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCloseConnection(connection.id)}
                              disabled={closeConnection.isLoading}
                              className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
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
    </div>
  );
};
