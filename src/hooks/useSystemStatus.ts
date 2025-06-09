import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo,useState } from 'react';

import * as connAPI from '../api/connections';
import { fetchProxies } from '../api/proxies';
import { fetchRules } from '../api/rules';
import { useApiConfig } from '../store/app';

interface SystemStatus {
  connectionStatus: 'active' | 'inactive' | 'error';
  activeConnections: number;
  totalProxies: number;
  activeProxies: number;
  totalRules: number;
  uploadTotal: string;
  downloadTotal: string;
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface ConnectionData {
  activeConnections: number;
  uploadTotal: string;
  downloadTotal: string;
  connectionStatus: 'active' | 'inactive' | 'error';
  lastUpdated: Date;
}

export function useSystemStatus(): SystemStatus {
  const apiConfig = useApiConfig();
  const [connectionData, setConnectionData] = useState<ConnectionData>({
    activeConnections: 0,
    uploadTotal: '0 B',
    downloadTotal: '0 B',
    connectionStatus: 'inactive',
    lastUpdated: new Date(),
  });

  // 统一的刷新间隔
  const REFRESH_INTERVAL = 15000; // 15秒统一刷新间隔
  const STALE_TIME = 5000; // 5秒内认为数据是新鲜的

  // 获取连接数据
  const readConnectionData = useCallback(
    ({ downloadTotal, uploadTotal, connections }: { 
      downloadTotal: number; 
      uploadTotal: number; 
      connections: any[] 
    }) => {
      try {
        setConnectionData({
          activeConnections: Array.isArray(connections) ? connections.length : 0,
          uploadTotal: formatBytes(uploadTotal || 0),
          downloadTotal: formatBytes(downloadTotal || 0),
          connectionStatus: 'active',
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error('Error processing connection data:', error);
        setConnectionData(prev => ({ 
          ...prev, 
          connectionStatus: 'error',
          lastUpdated: new Date(),
        }));
      }
    },
    [],
  );

  // WebSocket连接管理
  useEffect(() => {
    if (!apiConfig?.baseURL) {
      setConnectionData(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        lastUpdated: new Date(),
      }));
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      try {
        const result = connAPI.fetchData(apiConfig, readConnectionData);
        if (typeof result === 'function') {
          unsubscribe = result;
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionData(prev => ({ 
          ...prev, 
          connectionStatus: 'error',
          lastUpdated: new Date(),
        }));
        
        // 5秒后重试连接
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (unsubscribe) unsubscribe();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [apiConfig, readConnectionData]);

  // 获取代理数据 - 统一刷新频率
  const { data: proxiesData, isLoading: proxiesLoading, error: proxiesError } = useQuery({
    queryKey: ['proxies', apiConfig?.baseURL],
    queryFn: () => fetchProxies(apiConfig),
    refetchInterval: REFRESH_INTERVAL,
    staleTime: STALE_TIME,
    enabled: !!apiConfig?.baseURL,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 获取规则数据 - 统一刷新频率
  const { data: rulesData, isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['/rules', apiConfig] as const,
    queryFn: (ctx) => fetchRules({ queryKey: ['/rules', apiConfig] }),
    refetchInterval: REFRESH_INTERVAL,
    staleTime: STALE_TIME,
    enabled: !!apiConfig?.baseURL,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 计算代理统计 - 优化计算逻辑
  const proxyStats = useMemo(() => {
    return calculateProxyStats(proxiesData);
  }, [proxiesData]);
  
  // 计算规则统计
  const ruleStats = useMemo(() => {
    return calculateRuleStats(rulesData);
  }, [rulesData]);

  // 计算整体加载状态
  const isLoading = useMemo(() => {
    return proxiesLoading || rulesLoading;
  }, [proxiesLoading, rulesLoading]);

  // 计算连接状态 - 考虑所有错误情况
  const connectionStatus = useMemo(() => {
    if (proxiesError || rulesError) {
      return 'error' as const;
    }
    return connectionData.connectionStatus;
  }, [connectionData.connectionStatus, proxiesError, rulesError]);

  // 计算最后更新时间
  const lastUpdated = useMemo(() => {
    const times = [connectionData.lastUpdated];
    return times.reduce((latest, current) => 
      current > latest ? current : latest
    );
  }, [connectionData.lastUpdated]);

  // 数据一致性检查
  const dataConsistency = useMemo(() => {
    return checkDataConsistency({
      connectionStatus,
      activeConnections: connectionData.activeConnections,
      totalProxies: proxyStats.total,
      activeProxies: proxyStats.active,
      totalRules: ruleStats.total,
      isLoading,
    });
  }, [connectionStatus, connectionData.activeConnections, proxyStats, ruleStats, isLoading]);

  return {
    connectionStatus: dataConsistency.hasIssues ? 'error' : connectionStatus,
    activeConnections: connectionData.activeConnections,
    totalProxies: proxyStats.total,
    activeProxies: proxyStats.active,
    totalRules: ruleStats.total,
    uploadTotal: connectionData.uploadTotal,
    downloadTotal: connectionData.downloadTotal,
    isLoading,
    lastUpdated,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (typeof bytes !== 'number' || isNaN(bytes)) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  if (i < 0 || i >= sizes.length) return '0 B';
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateProxyStats(proxiesData: any) {
  try {
    if (!proxiesData?.proxies || typeof proxiesData.proxies !== 'object') {
      console.debug('No proxy data available');
      return { total: 0, active: 0 };
    }

    const proxies = Object.values(proxiesData.proxies);
    if (!Array.isArray(proxies)) {
      console.debug('Proxy data is not an array');
      return { total: 0, active: 0 };
    }

    // 排除代理组，只统计实际的代理节点
    const actualProxies = proxies.filter((proxy: any) => {
      if (!proxy || typeof proxy !== 'object') return false;
      
      // 排除代理组类型
      const groupTypes = ['Selector', 'URLTest', 'Fallback', 'LoadBalance', 'Relay'];
      if (groupTypes.includes(proxy.type)) return false;
      
      return true;
    });

    const total = actualProxies.length;
    
    // 计算活跃代理 - 基于延迟数据和代理类型
    let activeCount = 0;
    let withHistoryCount = 0;
    let withoutHistoryCount = 0;
    let excludedCount = 0;
    
    actualProxies.forEach((proxy: any) => {
      if (!proxy || typeof proxy !== 'object') return;
      
      // 排除特殊类型的代理（这些不算活跃代理）
      const excludeTypes = ['Direct', 'Reject', 'DIRECT', 'REJECT'];
      if (excludeTypes.includes(proxy.type)) {
        excludedCount++;
        return;
      }
      
      // 检查延迟历史记录
      if (proxy.history && Array.isArray(proxy.history) && proxy.history.length > 0) {
        withHistoryCount++;
        const latestHistory = proxy.history[proxy.history.length - 1];
        // 如果有延迟记录且延迟大于0，认为是活跃的
        if (latestHistory && typeof latestHistory.delay === 'number' && latestHistory.delay > 0) {
          activeCount++;
          return;
        }
        // 如果延迟为0，认为是不可用的
        if (latestHistory && latestHistory.delay === 0) {
          return;
        }
      } else {
        withoutHistoryCount++;
      }
      
      // 对于没有延迟测试记录的代理，根据类型判断
      // Direct类型的代理默认认为是活跃的
      if (proxy.type === 'Direct' || proxy.type === 'DIRECT') {
        activeCount++;
        return;
      }
      
      // 其他类型的代理如果没有延迟记录，认为是未知状态，暂时算作活跃
      // 这样可以避免在初始加载时显示0个活跃代理
      activeCount++;
    });

    console.debug('Proxy statistics:', {
      totalProxies: proxies.length,
      actualProxies: total,
      activeProxies: activeCount,
      withHistory: withHistoryCount,
      withoutHistory: withoutHistoryCount,
      excluded: excludedCount
    });

    return { total, active: activeCount };
  } catch (error) {
    console.error('Error calculating proxy stats:', error);
    return { total: 0, active: 0 };
  }
}

function calculateRuleStats(rulesData: any) {
  try {
    if (!rulesData) {
      return { total: 0 };
    }

    // 处理不同的数据格式
    let rules;
    if (Array.isArray(rulesData)) {
      rules = rulesData;
    } else if (rulesData.rules && Array.isArray(rulesData.rules)) {
      rules = rulesData.rules;
    } else {
      return { total: 0 };
    }

    return { total: rules.length };
  } catch (error) {
    console.error('Error calculating rule stats:', error);
    return { total: 0 };
  }
}

function checkDataConsistency(data: {
  connectionStatus: 'active' | 'inactive' | 'error';
  activeConnections: number;
  totalProxies: number;
  activeProxies: number;
  totalRules: number;
  isLoading: boolean;
}) {
  const issues: string[] = [];

  // 检查基本数据合理性
  if (data.activeProxies > data.totalProxies) {
    issues.push('Active proxies count exceeds total proxies');
  }

  if (data.totalProxies < 0 || data.activeProxies < 0 || data.totalRules < 0 || data.activeConnections < 0) {
    issues.push('Negative values detected in statistics');
  }

  // 检查代理数据的合理性
  if (data.totalProxies === 0 && data.activeProxies > 0) {
    issues.push('Active proxies exist but total proxies is zero');
  }

  // 检查连接状态与数据的一致性
  if (data.connectionStatus === 'active' && data.totalProxies === 0 && data.totalRules === 0 && !data.isLoading) {
    issues.push('Connection active but no proxy or rule data available');
  }

  // 检查数据是否过于异常（可能的数据获取错误）
  if (data.connectionStatus === 'active' && data.totalProxies > 10000) {
    issues.push('Unusually high proxy count detected');
  }

  if (data.connectionStatus === 'active' && data.totalRules > 50000) {
    issues.push('Unusually high rule count detected');
  }

  // 检查活跃代理比例是否合理
  if (data.totalProxies > 0) {
    const activeRatio = data.activeProxies / data.totalProxies;
    if (activeRatio > 1) {
      issues.push('Active proxy ratio exceeds 100%');
    }
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
} 