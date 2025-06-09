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
    <Card className="overflow-hidden border-0 shadow-lg card-hover">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0a2 2 0 002 2v2a2 2 0 01-2 2M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2M5 9h14" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
              <div className="flex items-center space-x-2 text-sm">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                  {group.type}
                </span>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  当前: <span className="font-medium text-gray-700 dark:text-gray-300">{group.now}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
              <span>{group.all.length} 个节点</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="ml-1">{expanded ? '收起' : '展开'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <div className="grid gap-1 p-4">
              {group.all.map((proxyName, index) => {
                const delay = getProxyDelay(proxyName);
                const isSelected = group.now === proxyName;
                
                return (
                  <div
                    key={proxyName}
                    className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-gray-500 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => onSwitchProxy(group.name, proxyName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isSelected && (
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                        )}
                        <div className="font-medium text-gray-900 dark:text-white">
                          {proxyName}
                        </div>
                        {isSelected && (
                          <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full font-medium">
                            当前
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-mono px-2 py-1 rounded-lg ${
                          delay === 0 
                            ? 'text-gray-400 bg-gray-100 dark:bg-gray-800' 
                            : delay < 100 
                              ? 'text-green-600 bg-green-100 dark:bg-green-900/30' 
                              : delay < 300 
                                ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' 
                                : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {delay === 0 ? 'N/A' : `${delay}ms`}
                        </div>
                        {!isSelected && (
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
    <div className="space-y-4">
      {/* 紧凑的页面头部 */}
      <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">代理</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              管理代理组和节点 • 模式: <span className="font-medium text-gray-700 dark:text-gray-300">{config?.mode || 'Unknown'}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </Button>
      </div>

      {/* 美化的搜索和过滤 */}
      <Card className="overflow-hidden border-0 shadow-lg card-hover">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索代理组..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
              >
                <option value="all">所有类型</option>
                <option value="Selector">手动选择</option>
                <option value="URLTest">自动选择</option>
                <option value="Fallback">故障转移</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 美化的统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {proxyCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">总代理数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0a2 2 0 002 2v2a2 2 0 01-2 2M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2M5 9h14" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                  {proxyGroups.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">代理组</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-stone-600 to-stone-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-stone-700 dark:text-stone-300 capitalize">
                  {config?.mode || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">当前模式</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 代理组列表 */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  没有找到代理组
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {searchQuery ? '尝试调整搜索条件或清空搜索框' : '当前没有可用的代理组，请检查 Clash 配置'}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchQuery('')}
                    className="mt-4"
                  >
                    清空搜索
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group, index) => (
              <div 
                key={group.name}
                className="animate-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProxyGroupCard
                  group={group}
                  proxiesData={proxiesData}
                  onSwitchProxy={handleSwitchProxy}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
