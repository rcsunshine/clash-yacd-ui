

import React, { useMemo,useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { APIErrorAlert,ErrorAlert, NetworkErrorAlert } from '../components/ui/ErrorAlert';
import { PageErrorBoundary } from '../components/ui/ErrorBoundary';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { FixedVirtualList } from '../components/ui/VirtualList';
import { useRules } from '../hooks/useAPI';
import { useAPIErrorHandler } from '../hooks/useErrorHandler';
import { Rule, RuleProvider, RuleType } from '../types/api';

const RulesContent: React.FC = () => {
  const { data: rulesData, isLoading, error, refetch } = useRules();
  const { handleError } = useAPIErrorHandler();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<RuleType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'rules' | 'providers'>('rules');

  const rules = useMemo(() => {
    if (!rulesData?.rules) return [];
    
    const filtered = rulesData.rules.filter((rule: Rule) => {
      const searchMatch = searchQuery === '' || 
        rule.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.proxy.toLowerCase().includes(searchQuery.toLowerCase());
      
      const typeMatch = typeFilter === 'all' || rule.type === typeFilter;
      
      return searchMatch && typeMatch;
    });

    return filtered;
  }, [rulesData?.rules, searchQuery, typeFilter]);

  const providers = useMemo(() => {
    if (!rulesData?.providers) return [];
    return Object.entries(rulesData.providers).map(([name, provider]: [string, RuleProvider]) => ({
      name,
      ...provider,
    }));
  }, [rulesData?.providers]);

  const ruleTypes = useMemo(() => {
    if (!rulesData?.rules) return [];
    const types = [...new Set(rulesData.rules.map((rule: Rule) => rule.type))];
    return types.sort();
  }, [rulesData?.rules]);

    // 处理API错误
  React.useEffect(() => {
    if (error) {
      handleError(error, '规则页面数据加载失败');
    }
  }, [error, handleError]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    const isNetworkError = String(error).includes('Network Error') || String(error).includes('fetch');
    const isAPIError = String(error).includes('API') || String(error).includes('401') || String(error).includes('403');

    return (
      <div className="space-y-4 p-6">
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-theme hidden lg:block">规则</h1>
          
          {isNetworkError ? (
            <NetworkErrorAlert
              message="无法连接到 Clash API，请检查网络连接和API配置"
              details={String(error)}
              onRetry={() => refetch()}
              showDetails={process.env.NODE_ENV === 'development'}
            />
          ) : isAPIError ? (
            <APIErrorAlert
              message="API 请求失败，请检查API配置或权限"
              details={String(error)}
              onRetry={() => refetch()}
              showDetails={process.env.NODE_ENV === 'development'}
            />
          ) : (
            <ErrorAlert
              title="规则数据加载失败"
              message="无法获取规则信息，请稍后重试"
              details={String(error)}
              onRetry={() => refetch()}
              showDetails={process.env.NODE_ENV === 'development'}
            />
          )}
        </div>
      </div>
    );
  }

  const totalRules = rulesData?.rules?.length || 0;
  const totalProviders = providers.length;

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
            <h1 className="text-xl font-bold text-theme hidden lg:block">规则</h1>
            <p className="text-sm text-theme-secondary">
              流量分流规则管理 • 共 {totalRules} 条规则
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

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {totalRules}
                </div>
                <div className="text-xs text-theme-secondary font-medium">总规则数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                  {totalProviders}
                </div>
                <div className="text-xs text-theme-secondary font-medium">规则提供者</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-lg card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-stone-600 to-stone-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-700 dark:text-stone-300">
                  {ruleTypes.length}
                </div>
                <div className="text-xs text-theme-secondary font-medium">规则类型</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页切换 */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="flex border-b border-theme">
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'rules'
                  ? 'text-slate-700 dark:text-slate-300 border-b-2 border-slate-500 bg-slate-50 dark:bg-slate-800/50'
                  : 'text-theme-secondary hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              规则列表 ({totalRules})
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'providers'
                  ? 'text-slate-700 dark:text-slate-300 border-b-2 border-slate-500 bg-slate-50 dark:bg-slate-800/50'
                  : 'text-theme-secondary hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              规则提供者 ({totalProviders})
            </button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'rules' && (
        <>
          {/* 搜索和过滤 */}
          <Card className="overflow-hidden border-0 shadow-lg card-hover">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <SearchInput
                    placeholder="搜索规则内容或代理..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as RuleType)}
                  options={[
                    { value: 'all', label: '所有类型' },
                    ...ruleTypes.map(type => ({ value: type, label: type }))
                  ]}
                  size="sm"
                  className="min-w-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 规则列表 */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-4">
              {rules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-theme mb-3">
                    {searchQuery || typeFilter !== 'all' ? '没有找到匹配的规则' : '暂无规则'}
                  </h3>
                  <p className="text-theme-secondary max-w-md mx-auto">
                    {searchQuery || typeFilter !== 'all' 
                      ? '尝试调整搜索条件或筛选器'
                      : '当前没有配置任何规则'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-theme-secondary pb-2 border-b border-theme">
                    <span>显示 {rules.length} 条规则</span>
                    <span>按优先级排序</span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    <FixedVirtualList<Rule>
                      items={rules}
                      height={384}
                      itemHeight={60}
                      renderItem={(rule: Rule, index: number) => (
                        <div 
                          key={index}
                          className="border border-theme rounded-lg p-3 m-2 hover:bg-white dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium">
                                  {rule.type}
                                </span>
                                <span className="text-sm font-medium text-theme truncate">
                                  {rule.payload}
                                </span>
                              </div>
                              <div className="text-xs text-theme-secondary">
                                <span className="font-medium">代理: </span>
                                <span className="text-theme-secondary">{rule.proxy}</span>
                              </div>
                            </div>
                            <div className="text-xs text-theme-tertiary text-right">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      )}
                      className="space-y-0"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'providers' && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-4">
            {providers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-theme mb-3">
                  暂无规则提供者
                </h3>
                <p className="text-theme-secondary max-w-md mx-auto">
                  当前没有配置任何规则提供者
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-theme-secondary pb-2 border-b border-theme">
                  <span>共 {providers.length} 个规则提供者</span>
                  <span>实时状态</span>
                </div>
                <div className="grid gap-4">
                  <FixedVirtualList<{ name: string } & RuleProvider>
                    items={providers}
                    height={400}
                    itemHeight={120}
                    renderItem={(provider, _index) => (
                      <div 
                        key={provider.name}
                        className="border border-theme rounded-lg p-4 hover:bg-white dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-medium text-theme">
                                {provider.name}
                              </h3>
                              <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">
                                {provider.type}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-theme-secondary">行为:</span>
                                <div className="font-medium text-theme">
                                  {provider.behavior || 'domain'}
                                </div>
                              </div>
                              <div>
                                <span className="text-theme-secondary">规则数:</span>
                                <div className="font-medium text-theme">
                                  {provider.ruleCount || 0}
                                </div>
                              </div>
                              <div>
                                <span className="text-theme-secondary">载体:</span>
                                <div className="font-medium text-theme">
                                  {provider.vehicleType || 'HTTP'}
                                </div>
                              </div>
                              <div>
                                <span className="text-theme-secondary">更新时间:</span>
                                <div className="font-medium text-theme">
                                  {provider.updatedAt ? new Date(provider.updatedAt).toLocaleString() : '未知'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="ml-4 text-xs">
                            更新
                          </Button>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 包装错误边界的主要导出组件
export const Rules: React.FC = () => {
  return (
    <PageErrorBoundary>
      <RulesContent />
    </PageErrorBoundary>
  );
};