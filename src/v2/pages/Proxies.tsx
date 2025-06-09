import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { useProxies, useClashConfig } from '../hooks/useAPI';

interface ProxyGroup {
  name: string;
  type: string;
  now: string;
  all: string[];
}

const ProxyGroupCard: React.FC<{
  group: ProxyGroup;
  proxiesData: any;
  onSwitchProxy: (groupName: string, proxyName: string) => void;
}> = ({ group, proxiesData, onSwitchProxy }) => {
  const [expanded, setExpanded] = useState(false);

  const getProxyDelay = (proxyName: string) => {
    const proxy = proxiesData?.proxies?.[proxyName];
    return proxy?.history?.[0]?.delay || 0;
  };

  const getDelayColor = (delay: number) => {
    if (delay === 0) return 'text-gray-400';
    if (delay < 100) return 'text-green-500';
    if (delay < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {group.type} • 当前: {group.now}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator
              status="success"
              label={`${group.all.length} 个节点`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '收起' : '展开'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="space-y-2">
            {group.all.map((proxyName) => {
              const delay = getProxyDelay(proxyName);
              const isSelected = group.now === proxyName;
              
              return (
                <div
                  key={proxyName}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => onSwitchProxy(group.name, proxyName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {proxyName}
                    </div>
                    <div className={`text-sm font-mono ${getDelayColor(delay)}`}>
                      {delay === 0 ? 'N/A' : `${delay}ms`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export const Proxies: React.FC = () => {
  const { data: proxiesData, isLoading, error, refetch, switchProxy } = useProxies();
  const { data: config } = useClashConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // 处理代理数据
  const proxyGroups = useMemo(() => {
    if (!proxiesData?.proxies) return [];

    const groups: ProxyGroup[] = [];
    Object.entries(proxiesData.proxies).forEach(([name, proxy]: [string, any]) => {
      if (proxy.type === 'Selector' || proxy.type === 'URLTest' || proxy.type === 'Fallback') {
        groups.push({
          name,
          type: proxy.type,
          now: proxy.now || '',
          all: proxy.all || [],
        });
      }
    });
    return groups;
  }, [proxiesData]);

  // 过滤代理组
  const filteredGroups = useMemo(() => {
    return proxyGroups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || group.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [proxyGroups, searchQuery, filterType]);

  // 切换代理
  const handleSwitchProxy = async (groupName: string, proxyName: string) => {
    try {
      const result = await switchProxy(groupName, proxyName);
      if (result.error) {
        console.error('Failed to switch proxy:', result.error);
      } else {
        console.log(`Successfully switched ${groupName} to ${proxyName}`);
        refetch();
      }
    } catch (error) {
      console.error('Failed to switch proxy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">代理</h1>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">代理</h1>
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                加载失败
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{String(error)}</p>
              <Button onClick={() => refetch()}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const proxyCount = proxiesData?.proxies ? Object.keys(proxiesData.proxies).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">代理</h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理代理组和节点，当前模式: {config?.mode || 'Unknown'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          刷新
        </Button>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索代理组..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">所有类型</option>
              <option value="Selector">手动选择</option>
              <option value="URLTest">自动选择</option>
              <option value="Fallback">故障转移</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">代理统计</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {proxyCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">总代理数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {proxyGroups.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">代理组</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {config?.mode || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">当前模式</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 代理组列表 */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  没有找到代理组
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? '尝试调整搜索条件' : '当前没有可用的代理组'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <ProxyGroupCard
              key={group.name}
              group={group}
              proxiesData={proxiesData}
              onSwitchProxy={handleSwitchProxy}
            />
          ))
        )}
      </div>
    </div>
  );
};
