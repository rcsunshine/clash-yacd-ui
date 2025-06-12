import React, { useMemo,useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent,CardHeader } from '../components/ui/Card';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { useClashConfig,useProxies } from '../hooks/useAPI';

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
  onTestGroupDelay: (group: ProxyGroup) => void;
  onTestSingleProxy: (proxyName: string) => void;
  testingProxies: Set<string>;
  testingSingleProxies: Set<string>;
  sortBy: string;
  hideUnavailable: boolean;
}> = ({ group, proxiesData, onSwitchProxy, onTestGroupDelay, onTestSingleProxy, testingProxies, testingSingleProxies, sortBy, hideUnavailable }) => {
  const [expanded, setExpanded] = useState(false);

  const getProxyDelay = (proxyName: string) => {
    const proxy = proxiesData?.proxies?.[proxyName];
    return proxy?.history?.[0]?.delay || 0;
  };

  const getProxyType = (proxyName: string) => {
    const proxy = proxiesData?.proxies?.[proxyName];
    return proxy?.type || 'Unknown';
  };

  const getProxyExtra = (proxyName: string) => {
    const proxy = proxiesData?.proxies?.[proxyName];
    if (!proxy) return '';
    
    // 根据代理类型显示不同的额外信息
    switch (proxy.type) {
      case 'Trojan':
        return proxy.server ? `${proxy.server}:${proxy.port}` : '';
      case 'Shadowsocks':
        return proxy.server ? `${proxy.server}:${proxy.port}` : '';
      case 'ShadowsocksR':
        return proxy.server ? `${proxy.server}:${proxy.port}` : '';
      case 'VMess':
        return proxy.server ? `${proxy.server}:${proxy.port}` : '';
      case 'Vless':
        return proxy.server ? `${proxy.server}:${proxy.port}` : '';
      default:
        return '';
    }
  };

  const getDelayColor = (delay: number) => {
    if (delay === 0) return 'text-gray-400';
    if (delay < 100) return 'text-green-500';
    if (delay < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDelayBgColor = (delay: number) => {
    if (delay === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (delay < 100) return 'bg-green-100 dark:bg-green-900/30';
    if (delay < 300) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getTypeIcon = (type: string) => {
    const iconProps = "w-4 h-4";
    switch (type.toLowerCase()) {
      case 'trojan':
        return <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
      case 'shadowsocks':
      case 'shadowsocksr':
        return <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
      case 'vmess':
      case 'vless':
        return <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24"><path d="M12 1l9 4-9 4-9-4 9-4zm0 6l-7 3 7 3 7-3-7-3zm0 6l-7 3 7 3 7-3-7-3z"/></svg>;
      default:
        return <svg className={iconProps} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
    }
  };

  // 生成代理组的小圆点延迟指示器
  const generateProxyDots = (group: ProxyGroup) => {
    const maxDots = 30; // 最多显示30个圆点
    const proxies = group.all.slice(0, maxDots);
    const remainingCount = Math.max(0, group.all.length - maxDots);
    
    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center space-x-0.5 flex-wrap">
          {proxies.map((proxyName, index) => {
            const delay = getProxyDelay(proxyName);
            const isSelected = group.now === proxyName;
            
            let dotColor = 'bg-gray-400'; // 默认未测试
            if (delay > 0) {
              if (delay < 100) dotColor = 'bg-green-500';
              else if (delay < 300) dotColor = 'bg-yellow-500';
              else dotColor = 'bg-red-500';
            }
            
            return (
              <div
                key={proxyName}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${dotColor} ${
                  isSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 scale-125' : ''
                }`}
                title={`${proxyName}: ${delay === 0 ? '未测试' : `${delay}ms`}`}
              />
            );
          })}
        </div>
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };

  // 排序和过滤代理节点
  const getSortedAndFilteredProxies = (proxies: string[]) => {
    let filtered = [...proxies];
    
    // 过滤不可用的代理
    if (hideUnavailable) {
      filtered = filtered.filter((proxyName) => {
        const delay = getProxyDelay(proxyName);
        return delay !== 0; // 只显示有延迟数据的代理
      });
    }
    
    // 排序
    switch (sortBy) {
      case 'LatencyAsc':
        filtered.sort((a, b) => {
          const delayA = getProxyDelay(a) || 999999;
          const delayB = getProxyDelay(b) || 999999;
          return delayA - delayB;
        });
        break;
      case 'LatencyDesc':
        filtered.sort((a, b) => {
          const delayA = getProxyDelay(a) || 0;
          const delayB = getProxyDelay(b) || 0;
          return delayB - delayA;
        });
        break;
      case 'NameAsc':
        filtered.sort((a, b) => a.localeCompare(b));
        break;
      case 'NameDesc':
        filtered.sort((a, b) => b.localeCompare(a));
        break;
      case 'Natural':
      default:
        // 保持原始顺序
        break;
    }
    
    return filtered;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg card-hover">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0a2 2 0 002 2v2a2 2 0 01-2 2M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2M5 9h14" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-theme">{group.name}</h3>
              <div className="flex items-center space-x-2 text-sm mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  group.type === 'Selector' 
                    ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300' 
                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}>
                  {group.type === 'Selector' ? '手动选择' : 
                   group.type === 'URLTest' ? '自动选择' : 
                   group.type === 'Fallback' ? '故障转移' : group.type}
                </span>
                <span className="text-theme-tertiary">•</span>
                <span className="text-theme-secondary">
                  当前: <span className="font-medium text-theme-secondary">{group.now}</span>
                </span>
                {group.type !== 'Selector' && (
                  <>
                    <span className="text-theme-tertiary">•</span>
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      自动管理
                    </span>
                  </>
                )}
              </div>
              {/* 小圆点延迟指示器 */}
              <div className="mt-1">
                {generateProxyDots(group)}
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
              onClick={() => onTestGroupDelay(group)}
              className="border-theme hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              disabled={testingProxies.has(group.name)}
            >
              <svg 
                className={`w-4 h-4 mr-1 ${testingProxies.has(group.name) ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{testingProxies.has(group.name) ? `测试中 (${group.all.length}个)` : '组测速'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="border-theme hover:bg-gray-50 dark:hover:bg-gray-800"
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
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {/* 美观的网格卡片布局 - 紧凑版 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-4">
              {getSortedAndFilteredProxies(group.all).map((proxyName, index) => {
                const delay = getProxyDelay(proxyName);
                const proxyType = getProxyType(proxyName);
                const proxyExtra = getProxyExtra(proxyName);
                const isSelected = group.now === proxyName;
                const canSwitch = group.type === 'Selector'; // 只有Selector类型的组可以手动切换
                
                return (
                  <div
                    key={proxyName}
                    className={`group relative p-3 rounded-lg border transition-all duration-300 transform ${
                      canSwitch ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
                    } ${
                      isSelected
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-md ring-1 ring-blue-200 dark:ring-blue-800'
                        : canSwitch 
                          ? 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 opacity-75'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                    onClick={canSwitch ? () => onSwitchProxy(group.name, proxyName) : undefined}
                    role={canSwitch ? "button" : undefined}
                    tabIndex={canSwitch ? 0 : undefined}
                    onKeyDown={canSwitch ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSwitchProxy(group.name, proxyName);
                      }
                    } : undefined}
                  >
                    {/* 选中状态指示器 - 紧凑版 */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* 测试延迟按钮 */}
                    {!isSelected && (
                      <div 
                        className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                          testingSingleProxies.has(proxyName) 
                            ? 'bg-blue-500 opacity-100 scale-110' 
                            : 'bg-yellow-500 hover:bg-yellow-600 opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTestSingleProxy(proxyName);
                        }}
                        title={testingSingleProxies.has(proxyName) ? '测试中...' : '测试延迟'}
                      >
                        <svg 
                          className={`w-3 h-3 text-white ${testingSingleProxies.has(proxyName) ? 'animate-spin' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    )}

                    {/* 代理类型和图标 - 紧凑版 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                        proxyType === 'Trojan' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        proxyType === 'Shadowsocks' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        proxyType === 'ShadowsocksR' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                        proxyType === 'VMess' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        proxyType === 'Vless' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {getTypeIcon(proxyType)}
                        <span className="hidden sm:block">{proxyType}</span>
                      </div>
                      
                      {/* 延迟显示 */}
                      <div className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${getDelayBgColor(delay)} ${getDelayColor(delay)}`}>
                        {delay === 0 ? 'N/A' : `${delay}ms`}
                      </div>
                    </div>

                    {/* 代理名称 - 紧凑版 */}
                    <div className="mb-1.5">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm" title={proxyName}>
                        {proxyName}
                      </h4>
                      {proxyExtra && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={proxyExtra}>
                          {proxyExtra}
                        </p>
                      )}
                    </div>

                    {/* 状态指示 - 紧凑版 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-blue-500 animate-pulse' : 
                          delay === 0 ? 'bg-gray-400' :
                          delay < 100 ? 'bg-green-500' :
                          delay < 300 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                          {isSelected ? '使用中' : 
                           !canSwitch ? '自动' : 
                           delay === 0 ? '未测试' : '可用'}
                        </span>
                      </div>
                      
                      {!isSelected && canSwitch && (
                        <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      {!isSelected && !canSwitch && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-9a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
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
  const { data: proxiesData, isLoading, error, refetch, switchProxy, testDelay } = useProxies();
  const { data: config } = useClashConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('Natural');
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const [testingProxies, setTestingProxies] = useState<Set<string>>(new Set());
  const [testingSingleProxies, setTestingSingleProxies] = useState<Set<string>>(new Set());
  const [testingAllProxies, setTestingAllProxies] = useState(false);
  
  // 测速进度状态
  const [testingProgress, setTestingProgress] = useState({ current: 0, total: 0 });
  const [testingStats, setTestingStats] = useState({ success: 0, failed: 0 });
  const [showTestingProgress, setShowTestingProgress] = useState(false);
  
  // 通知提示状态
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({ type: 'info', message: '', show: false });

  // 显示通知的辅助函数
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

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
        showNotification('error', `切换到 "${proxyName}" 失败，请重试`);
      } else {
        console.log(`Successfully switched ${groupName} to ${proxyName}`);
        showNotification('success', `已切换到 "${proxyName}"`);
        refetch();
      }
    } catch (error) {
      console.error('Failed to switch proxy:', error);
      showNotification('error', `切换代理失败，请检查网络连接`);
    }
  };

  // 测试代理组延迟
  const handleTestGroupDelay = async (group: ProxyGroup) => {
    if (testingProxies.has(group.name)) return;
    
    setTestingProxies(prev => new Set([...prev, group.name]));
    
    try {
      // 并发测试组内所有代理的延迟
      const testPromises = group.all.map(async (proxyName) => {
        try {
          await testDelay(proxyName);
        } catch (error) {
          console.error(`Failed to test delay for ${proxyName}:`, error);
        }
      });
      
      await Promise.all(testPromises);
      refetch(); // 刷新数据以获取最新的延迟结果
      showNotification('success', `代理组 "${group.name}" 测试完成！共测试 ${group.all.length} 个节点`);
    } catch (error) {
      console.error('Failed to test group delay:', error);
      showNotification('error', `代理组 "${group.name}" 测试失败，请重试`);
    } finally {
      setTestingProxies(prev => {
        const next = new Set(prev);
        next.delete(group.name);
        return next;
      });
    }
  };

  // 测试单个代理延迟
  const handleTestSingleProxy = async (proxyName: string) => {
    if (testingSingleProxies.has(proxyName)) return;
    
    setTestingSingleProxies(prev => new Set([...prev, proxyName]));
    
    try {
      await testDelay(proxyName);
      refetch(); // 刷新数据以获取最新的延迟结果
      showNotification('success', `代理 "${proxyName}" 延迟测试完成`);
    } catch (error) {
      console.error(`Failed to test delay for ${proxyName}:`, error);
      showNotification('error', `代理 "${proxyName}" 测试失败，请重试`);
    } finally {
      setTestingSingleProxies(prev => {
        const next = new Set(prev);
        next.delete(proxyName);
        return next;
      });
    }
  };

  // 测试所有代理延迟
  const handleTestAllProxies = async () => {
    if (testingAllProxies) return;
    
    setTestingAllProxies(true);
    setShowTestingProgress(true);
    
    try {
      // 获取所有代理名称
      const allProxyNames = proxyGroups.flatMap(group => group.all);
      const uniqueProxyNames = [...new Set(allProxyNames)];
      
      // 初始化进度
      const total = uniqueProxyNames.length;
      setTestingProgress({ current: 0, total });
      setTestingStats({ success: 0, failed: 0 });
      
      let completed = 0;
      let success = 0;
      let failed = 0;
      
      // 并发测试所有代理的延迟（限制并发数以避免过载）
      const batchSize = 10; // 每批测试10个代理
      for (let i = 0; i < uniqueProxyNames.length; i += batchSize) {
        const batch = uniqueProxyNames.slice(i, i + batchSize);
        const batchPromises = batch.map(async (proxyName) => {
          try {
            await testDelay(proxyName);
            success++;
          } catch (error) {
            console.error(`Failed to test delay for ${proxyName}:`, error);
            failed++;
          } finally {
            completed++;
            setTestingProgress({ current: completed, total });
            setTestingStats({ success, failed });
          }
        });
        await Promise.all(batchPromises);
      }
      
      refetch(); // 刷新数据以获取最新的延迟结果
      
      // 显示完成提示，3秒后隐藏进度条
      showNotification('success', `测试完成！成功 ${success} 个，失败 ${failed} 个，共 ${total} 个代理节点`);
      setTimeout(() => {
        setShowTestingProgress(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to test all proxies delay:', error);
      showNotification('error', '测试失败，请检查网络连接或代理配置');
      setTimeout(() => {
        setShowTestingProgress(false);
      }, 3000);
    } finally {
      setTestingAllProxies(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-theme hidden lg:block">代理</h1>
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
        <h1 className="text-2xl font-bold text-theme hidden lg:block">代理</h1>
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

  const proxyCount = proxiesData?.proxies ? Object.keys(proxiesData.proxies).length : 0;

  return (
    <div className="proxy-page h-screen flex flex-col overflow-hidden">
      {/* 简化的紧凑头部 */}
      <div className="flex-none p-3">
        <div className="flex items-center justify-between py-2 px-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          {/* 左侧：标题和统计信息 */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-stone-700 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                </svg>
              </div>
              <span className="font-semibold text-theme">代理</span>
            </div>
            
            {/* 紧凑的统计信息 */}
            <div className="flex items-center space-x-4 text-xs text-theme-secondary">
              <span>{proxyGroups.length} 组</span>
              <span>{proxyCount} 节点</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                {config?.mode || 'N/A'}
              </span>
            </div>
          </div>
          
          {/* 右侧：操作按钮 */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleTestAllProxies()} 
              className="text-xs px-3 py-1 h-7 text-blue-600 dark:text-blue-400 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              disabled={testingAllProxies}
            >
              <svg 
                className={`w-3 h-3 mr-1 ${testingAllProxies ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {testingAllProxies 
                ? `测试中 ${testingProgress.current}/${testingProgress.total}` 
                : '全部测速'
              }
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs px-3 py-1 h-7">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </Button>
          </div>
        </div>
        
        {/* 紧凑的搜索和过滤控件 - 优化深色主题协调性 */}
        <div className="flex items-center space-x-3 flex-wrap gap-2 mt-2 py-3 px-4 bg-gray-50/90 dark:bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-300/50 dark:border-gray-700/50 shadow-sm dark:shadow-none">
          <div className="flex-1 min-w-[180px]">
            <SearchInput
              placeholder="搜索代理组..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!h-8 !text-sm !font-medium !text-gray-900 dark:!text-gray-100 !bg-white dark:!bg-gray-800/60 !border-gray-300 dark:!border-gray-600"
            />
          </div>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: 'all', label: '所有类型' },
              { value: 'Selector', label: '手动选择' },
              { value: 'URLTest', label: '自动选择' },
              { value: 'Fallback', label: '故障转移' },
            ]}
            size="sm"
            className="min-w-[120px] !h-9 !text-sm !font-bold !text-gray-900 dark:!text-gray-100 !bg-white dark:!bg-gray-800/60 !border !border-gray-300 dark:!border-gray-600 !leading-5"
          />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'Natural', label: '原始顺序' },
              { value: 'LatencyAsc', label: '延迟升序' },
              { value: 'LatencyDesc', label: '延迟降序' },
              { value: 'NameAsc', label: '名称 A-Z' },
              { value: 'NameDesc', label: '名称 Z-A' },
            ]}
            size="sm"
            className="min-w-[120px] !h-9 !text-sm !font-bold !text-gray-900 dark:!text-gray-100 !bg-white dark:!bg-gray-800/60 !border !border-gray-300 dark:!border-gray-600 !leading-5"
          />
          <label className="flex items-center space-x-2 cursor-pointer whitespace-nowrap px-3 py-2 bg-white dark:bg-gray-800/60 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-600 border-2 border-gray-500 dark:border-gray-400 rounded focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:ring-offset-0 checked:bg-blue-600 dark:checked:bg-blue-500 checked:border-blue-600 dark:checked:border-blue-500"
              checked={hideUnavailable}
              onChange={(e) => setHideUnavailable(e.target.checked)}
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 select-none">
              隐藏未测试
            </span>
          </label>
        </div>

        {/* 测速进度提示 - 优化紧凑样式 */}
        {showTestingProgress && (
          <div className="mt-1.5 p-2.5 bg-blue-50/90 dark:bg-blue-900/20 rounded-lg border border-blue-200/70 dark:border-blue-800/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {testingAllProxies ? '延迟测试中...' : '测试完成'}
                </span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 font-mono bg-blue-100/50 dark:bg-blue-800/30 px-2 py-0.5 rounded">
                {testingProgress.current}/{testingProgress.total}
                {testingProgress.total > 0 && (
                  <span className="ml-1 text-blue-600 dark:text-blue-400 font-semibold">
                    {Math.round((testingProgress.current / testingProgress.total) * 100)}%
                  </span>
                )}
              </div>
            </div>
            
            {/* 进度条 - 增强视觉效果 */}
            <div className="w-full bg-blue-200/80 dark:bg-blue-800/60 rounded-full h-2 mb-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 h-2 rounded-full transition-all duration-500 ease-out relative"
                style={{ 
                  width: testingProgress.total > 0 
                    ? `${(testingProgress.current / testingProgress.total) * 100}%` 
                    : '0%' 
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            {/* 统计信息 - 增强设计 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex space-x-3">
                <span className="text-green-700 dark:text-green-400 font-mono bg-green-100/50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                  ✓ {testingStats.success}
                </span>
                {testingStats.failed > 0 && (
                  <span className="text-red-700 dark:text-red-400 font-mono bg-red-100/50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                    ✗ {testingStats.failed}
                  </span>
                )}
              </div>
              {!testingAllProxies && testingProgress.current === testingProgress.total && (
                <span className="text-blue-700 dark:text-blue-300 animate-pulse text-sm flex items-center space-x-1">
                  <span>✨</span>
                  <span className="font-medium">完成!</span>
                </span>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* 可滚动的内容区域 */}
      <div className="scrollable-content flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* 代理组列表 */}
        {filteredGroups.length === 0 ? (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-theme mb-3">
                  没有找到代理组
                </h3>
                <p className="text-theme-secondary max-w-md mx-auto">
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
                  onTestGroupDelay={handleTestGroupDelay}
                  onTestSingleProxy={handleTestSingleProxy}
                  testingProxies={testingProxies}
                  testingSingleProxies={testingSingleProxies}
                  sortBy={sortBy}
                  hideUnavailable={hideUnavailable}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 通知提示 */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border transition-all duration-300 transform ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
            : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
        } ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
