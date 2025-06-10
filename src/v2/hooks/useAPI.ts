import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

// 导入现有的 V1 API 和状态管理
import { query } from '../../api/fetch';
import { fetchProxies } from '../../api/proxies';
import { fetchRules } from '../../api/rules';
import * as connAPI from '../../api/connections';
import { useApiConfig } from '../../store/app';

// 导入 V2 类型定义
import { 
  ClashAPIConfig, 
  APIResponse, 
  QueryOptions,
  TrafficData,
  ProxyItem,
  ConnectionItem,
  LogItem,
  ClashConfig,
  SystemInfo,
  RulesResponse,
  ProxiesResponse,
  ConnectionsResponse,
  UseQueryResult,
  LogLevel
} from '../types/api';

// 改进的基础查询Hook - 自动处理API配置变化
export function useQuery2<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
) {
  const { enabled = true, refetchInterval, staleTime = 0 } = options;
  const apiConfig = useApiConfig();
  
  return useQuery({
    queryKey: [queryKey, apiConfig?.baseURL, apiConfig?.secret],
    queryFn,
    enabled: enabled && !!apiConfig?.baseURL,
    refetchInterval,
    staleTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// 优化的API配置变更监听Hook - 只在App级别使用
export function useApiConfigEffect() {
  const queryClient = useQueryClient();
  const apiConfig = useApiConfig();
  const prevApiConfigRef = useRef<typeof apiConfig>();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // 跳过首次运行
    if (isFirstRun.current) {
      isFirstRun.current = false;
      prevApiConfigRef.current = apiConfig;
      return;
    }

    // 检查 API 配置是否发生变化
    if (prevApiConfigRef.current && 
        (prevApiConfigRef.current.baseURL !== apiConfig.baseURL || 
         prevApiConfigRef.current.secret !== apiConfig.secret)) {
      
      console.log('🔄 API config changed from', prevApiConfigRef.current.baseURL, 'to', apiConfig.baseURL);
      
      // 只清理特定的查询，避免清除所有缓存
      const apiRelatedKeys = [
        'system-info',
        'clash-config', 
        'proxies',
        'connections',
        'rules'
      ];
      
      apiRelatedKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      // 强制重新获取关键数据
      queryClient.refetchQueries({ queryKey: ['system-info'] });
    }
    
    prevApiConfigRef.current = apiConfig;
  }, [apiConfig, queryClient]);
}

// 系统信息Hook - 移除重复的useApiConfigEffect调用
export function useSystemInfo() {
  const apiConfig = useApiConfig();
  
  return useQuery2<SystemInfo>(
    'system-info',
    async () => {
      const data = await query({
        queryKey: ['/', apiConfig] as const
      });
      return data;
    },
    { refetchInterval: 5000 }
  );
}

// 配置Hook - 移除重复的useApiConfigEffect调用
export function useClashConfig() {
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();
  
  const queryResult = useQuery2<ClashConfig>(
    'clash-config',
    async () => {
      const data = await query({
        queryKey: ['/configs', apiConfig] as const
      });
      return data;
    },
    { staleTime: 30000 }
  );

  const updateConfig = useCallback(async (newConfig: Partial<ClashConfig>) => {
    if (!apiConfig?.baseURL) {
      return { error: 'API configuration not available' };
    }

    try {
      const response = await fetch(`${apiConfig.baseURL}/configs`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.secret && { 'Authorization': `Bearer ${apiConfig.secret}` }),
        },
        body: JSON.stringify(newConfig),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['clash-config'] });
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiConfig, queryClient]);

  return {
    ...queryResult,
    updateConfig,
  };
}

// 代理Hook - 移除重复的useApiConfigEffect调用
export function useProxies() {
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();
  
  const queryResult = useQuery2<{ proxies: Record<string, ProxyItem> }>(
    'proxies',
    () => fetchProxies(apiConfig),
    { refetchInterval: 3000 }
  );

  const switchProxy = useCallback(async (groupName: string, proxyName: string) => {
    if (!apiConfig?.baseURL) {
      return { error: 'API configuration not available' };
    }

    try {
      const response = await fetch(`${apiConfig.baseURL}/proxies/${encodeURIComponent(groupName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(apiConfig.secret && { 'Authorization': `Bearer ${apiConfig.secret}` }),
        },
        body: JSON.stringify({ name: proxyName }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiConfig, queryClient]);

  const testDelay = useCallback(async (proxyName: string, testUrl?: string) => {
    if (!apiConfig?.baseURL) {
      return { error: 'API configuration not available' };
    }

    try {
      const url = testUrl || 'http://www.gstatic.com/generate_204';
      const endpoint = `/proxies/${encodeURIComponent(proxyName)}/delay?timeout=5000&url=${encodeURIComponent(url)}`;
      const data = await query({
        queryKey: [endpoint, apiConfig] as const
      });
      return { data, error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiConfig]);

  return {
    ...queryResult,
    switchProxy,
    testDelay,
  };
}

// 连接Hook - 移除重复的useApiConfigEffect调用
export function useConnections() {
  const apiConfig = useApiConfig();
  
  return useQuery2<{ connections: ConnectionItem[] }>(
    'connections',
    async () => {
      const data = await query({
        queryKey: ['/connections', apiConfig] as const
      });
      return data;
    },
    { refetchInterval: 1000 }
  );
}

// 规则Hook - 移除重复的useApiConfigEffect调用
export function useRules(): UseQueryResult<RulesResponse> {
  const apiConfig = useApiConfig();
  
  return useQuery2<RulesResponse>(
    'rules',
    async () => {
      // 获取规则和规则提供者
      const rulesData = await query({
        queryKey: ['/rules', apiConfig] as const
      });
      
      let providersData = {};
      try {
        providersData = await query({
          queryKey: ['/providers/rules', apiConfig] as const
        });
      } catch (error) {
        console.log('No rule providers found:', error);
        providersData = {};
      }
      
      return {
        rules: rulesData?.rules || rulesData || [],
        providers: providersData || {}
      };
    },
    { staleTime: 30000 }
  );
}

// 连接统计Hook - 优化API配置检查和WebSocket管理
export function useConnectionStats() {
  const apiConfig = useApiConfig();
  const [stats, setStats] = useState({
    activeConnections: 0,
    uploadTotal: 0,
    downloadTotal: 0,
    isConnected: false,
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!apiConfig?.baseURL) {
      setStats(prev => ({ ...prev, isConnected: false }));
      return;
    }

    // 清理之前的连接
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const connectAPI = () => {
      try {
        // 使用连接 API 来获取统计数据
        const result = connAPI.fetchData(apiConfig, (data: any) => {
          setStats({
            activeConnections: Array.isArray(data.connections) ? data.connections.length : 0,
            uploadTotal: data.uploadTotal || 0,
            downloadTotal: data.downloadTotal || 0,
            isConnected: true,
          });
        });
        
        if (typeof result === 'function') {
          unsubscribeRef.current = result;
        }
      } catch (error) {
        console.error('Failed to connect connection stats API:', error);
        setStats(prev => ({ ...prev, isConnected: false }));
      }
    };

    connectAPI();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [apiConfig]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    ...stats,
    uploadTotalFormatted: formatBytes(stats.uploadTotal),
    downloadTotalFormatted: formatBytes(stats.downloadTotal),
  };
}

// 流量监控Hook - 优化WebSocket连接管理
export function useTraffic() {
  const apiConfig = useApiConfig();
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const maxDataPoints = 150;

  useEffect(() => {
    if (!apiConfig?.baseURL) {
      setIsConnected(false);
      setTrafficData([]);
      return;
    }

    // 清理之前的连接
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const connectWebSocket = () => {
      try {
        // 使用正确的 /traffic WebSocket 端点
        const baseWsUrl = apiConfig.baseURL.replace(/^http/, 'ws');
        const wsUrl = baseWsUrl + '/traffic' + (apiConfig.secret ? `?token=${encodeURIComponent(apiConfig.secret)}` : '');
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('🔗 Traffic WebSocket connected to', apiConfig.baseURL);
        };

        ws.onmessage = (event) => {
          try {
            // 解析实时速率数据 (bytes/s)
            const data = JSON.parse(event.data);
            const trafficPoint: TrafficData = {
              up: data.up || 0,      // 当前上传速率 bytes/s
              down: data.down || 0,  // 当前下载速率 bytes/s  
              timestamp: Date.now(),
            };
            
            setTrafficData(prev => {
              const newData = [...prev, trafficPoint];
              return newData.slice(-maxDataPoints);
            });
          } catch (error) {
            console.error('Failed to parse traffic data:', error);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('💔 Traffic WebSocket disconnected');
          // 重连逻辑
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('❌ Traffic WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect traffic WebSocket:', error);
        setIsConnected(false);
        // 重连逻辑
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [apiConfig]);

  const clearData = useCallback(() => {
    setTrafficData([]);
  }, []);

  return {
    data: trafficData,
    isConnected,
    clearData,
  };
}

// 日志Hook - 优化WebSocket连接管理
export function useLogs() {
  const apiConfig = useApiConfig();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const maxLogs = 500;

  useEffect(() => {
    if (!apiConfig?.baseURL) {
      setIsConnected(false);
      setLogs([]);
      return;
    }

    // 清理之前的连接
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const connectWebSocket = () => {
      try {
        const baseWsUrl = apiConfig.baseURL.replace(/^http/, 'ws');
        const wsUrl = baseWsUrl + '/logs' + (apiConfig.secret ? `?token=${encodeURIComponent(apiConfig.secret)}` : '');
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('📝 Logs WebSocket connected to', apiConfig.baseURL);
        };

        ws.onmessage = (event) => {
          try {
            const logItem: LogItem = JSON.parse(event.data);
            setLogs(prev => {
              const newLogs = [...prev, logItem];
              return newLogs.slice(-maxLogs);
            });
          } catch (error) {
            console.error('Failed to parse log data:', error);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('💔 Logs WebSocket disconnected');
          // 重连逻辑
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('❌ Logs WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect logs WebSocket:', error);
        setIsConnected(false);
        // 重连逻辑
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [apiConfig]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    isConnected,
    clearLogs,
  };
}