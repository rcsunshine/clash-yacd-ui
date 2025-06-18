import React, { useMemo, useState, useRef } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { APIErrorAlert, ErrorAlert, NetworkErrorAlert } from '../components/ui/ErrorAlert';
import { PageErrorBoundary } from '../components/ui/ErrorBoundary';
import { HelpTooltip, KeyboardShortcutsTooltip } from '../components/ui/HelpTooltip';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { FixedVirtualList } from '../components/ui/VirtualList';
import { useRules } from '../hooks/useAPI';
import { useAPIErrorHandler } from '../hooks/useErrorHandler';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import useRulesSearch from '../hooks/useRulesSearch';
import { Rule, RuleProvider, RuleType } from '../types/api';

const RulesContent: React.FC = () => {
  const { data: rulesData, isLoading, error, refetch, updateRuleProvider } = useRules();
  const { handleError } = useAPIErrorHandler();
  const [activeTab, setActiveTab] = useState<'rules' | 'providers'>('rules');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // 使用增强的规则搜索钩子
  const {
    filteredRules: rules,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    resetFilters,
    searchHints
  } = useRulesSearch(rulesData?.rules || []);

  // 处理规则提供者数据
  const providers = useMemo(() => {
    if (!rulesData?.providers) return [];
    
    try {
      return Object.entries(rulesData.providers).map(([name, provider]: [string, RuleProvider]) => ({
        name,
        ...provider,
      }));
    } catch (error) {
      console.warn('处理规则提供者数据失败:', error);
      return []; // 返回空数组，避免页面崩溃
    }
  }, [rulesData?.providers]);

  // 获取规则类型列表
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

  // 添加键盘快捷键
  useKeyboardShortcut({
    key: 'f',
    callback: () => {
      searchInputRef.current?.focus();
    }
  });

  useKeyboardShortcut({
    key: 'r',
    callback: () => {
      refetch();
    }
  });

  useKeyboardShortcut({
    key: 'Escape',
    callback: () => {
      if (searchQuery) {
        resetFilters();
      }
    }
  });

  useKeyboardShortcut({
    key: '1',
    callback: () => {
      setActiveTab('rules');
    }
  });

  useKeyboardShortcut({
    key: '2',
    callback: () => {
      setActiveTab('providers');
    }
  });

  // 更新提供者的函数
  const handleUpdateProvider = async (name: string) => {
    try {
      setUpdatingProvider(name);
      await updateRuleProvider(name);
      setUpdateSuccess(name);
      
      // 3秒后清除成功提示
      setTimeout(() => {
        setUpdateSuccess(null);
      }, 3000);
    } catch (error) {
      handleError(error, `更新规则提供者 ${name} 失败`);
    } finally {
      setUpdatingProvider(null);
    }
  };

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
        <div className="flex items-center space-x-2">
          <KeyboardShortcutsTooltip />
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新 (R)
          </Button>
        </div>
      </div>

      {/* 标签页切换 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="flex border-b border-gray-200 dark:border-gray-600/50">
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
          <Card className="border-0 shadow-lg card-hover">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <SearchInput
                    ref={searchInputRef}
                    placeholder="搜索规则内容或代理... (按F聚焦)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={resetFilters}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <HelpTooltip
                      title="规则搜索语法"
                      content={
                        <div className="space-y-2">
                          <div>
                            <div className="font-medium mb-1">基本搜索:</div>
                            <div className="pl-2">直接输入关键词搜索规则内容和代理</div>
                          </div>
                          
                          <div>
                            <div className="font-medium mb-1">高级语法:</div>
                            <div className="pl-2 space-y-1">
                              <div><code>type:DOMAIN</code> - 搜索特定类型</div>
                              <div><code>proxy:DIRECT</code> - 搜索特定代理</div>
                              <div><code>payload:"google.com"</code> - 精确匹配内容</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium mb-1">组合搜索:</div>
                            <div className="pl-2">
                              <code>type:DOMAIN proxy:DIRECT google</code>
                            </div>
                          </div>
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
              </div>
              
              {/* 搜索提示 */}
              {searchQuery && searchHints.length > 0 && (
                <div className="mt-2 text-xs text-theme-secondary">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {searchHints.map((hint, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                        {hint}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

          {/* 规则列表 */}
          <Card className="border-0 shadow-lg">
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
                  {(searchQuery || typeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="mt-4"
                    >
                      清除过滤器
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-theme-secondary pb-2 mb-2 border-b border-gray-200 dark:border-gray-600/50">
                    <span>显示 {rules.length} / {totalRules} 条规则</span>
                    <span>按优先级排序</span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar pb-32">
                    <FixedVirtualList<Rule>
                      items={rules}
                      height={500}
                      itemHeight={70}
                      overscan={30}
                      containerClassName="pb-32"
                      renderItem={(rule: Rule, index: number) => (
                                                  <div 
                            key={index}
                            className="border border-gray-200 dark:border-gray-600/50 rounded-lg p-3 m-2 mb-6 hover:bg-white dark:hover:bg-gray-800/50 transition-colors"
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
                  {error && String(error).includes('404') ? 
                    '当前Clash核心不支持规则提供者API，或API路径已更改' : 
                    '当前没有配置任何规则提供者'}
                </p>
                {error && String(error).includes('404') && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg max-w-md mx-auto">
                    <p className="text-sm">
                      <strong>提示：</strong> 规则提供者API（/providers/rules）不可用。这可能是因为：
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li>您使用的Clash核心版本不支持此功能</li>
                      <li>API路径已更改或被禁用</li>
                      <li>服务器配置问题</li>
                    </ul>
                    <p className="text-sm mt-2">
                      页面其他功能不受影响，您仍可以正常使用规则列表。
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-theme-secondary pb-2 border-b border-gray-200 dark:border-gray-600/50">
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
                        className="border border-gray-200 dark:border-gray-600/50 rounded-lg p-4 hover:bg-white dark:hover:bg-gray-800/50 transition-colors"
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-4 text-xs"
                            onClick={async () => {
                              try {
                                await handleUpdateProvider(provider.name);
                                // 提示更新成功
                              } catch (error) {
                                // 处理错误
                                handleError(error, `更新规则提供者 ${provider.name} 失败`);
                              }
                            }}
                            disabled={updatingProvider === provider.name}
                            title={provider.vehicleType === 'HTTP' ? '更新规则提供者' : '本地文件规则提供者无需更新'}
                          >
                            {updatingProvider === provider.name ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                更新中...
                              </>
                            ) : updateSuccess === provider.name ? (
                              <>
                                <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                已更新
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {provider.vehicleType === 'HTTP' ? '更新' : '本地文件'}
                              </>
                            )}
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