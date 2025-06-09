import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

// 导入现有的 V1 API 和状态管理
import { query } from '../../api/fetch';
import { fetchProxies } from '../../api/proxies';
import { fetchRules } from '../../api/rules';
import * as connAPI from '../../api/connections';
import { useApiConfig } from '../../store/app';
import { 
  ClashAPIConfig, 
  APIResponse, 
  QueryOptions,
  TrafficData,
  ProxyItem,
  ConnectionItem,
  LogItem,
  ClashConfig,
  SystemInfo
} from '../types/api';

// 基础查询Hook - 使用现有的 React Query 集成
export function useQuery2<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
) {
  const { enabled = true, refetchInterval, staleTime = 0 } = options;
  const apiConfig = useApiConfig();
  
  return useQuery({
    queryKey: [queryKey, apiConfig],
    queryFn,
    enabled,
    refetchInterval,
    staleTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// API 配置变更监听Hook
export function useApiConfigEffect() {
  const queryClient = useQueryClient();
  const apiConfig = useApiConfig();
  const prevApiConfigRef = useRef<typeof apiConfig>();

  useEffect(() => {
    // 检查 API 配置是否发生变化
    if (prevApiConfigRef.current && 
        (prevApiConfigRef.current.baseURL !== apiConfig.baseURL || 
         prevApiConfigRef.current.secret !== apiConfig.secret)) {
      
      console.log('API config changed, invalidating all queries');
      // 清除所有查询缓存
      queryClient.invalidateQueries();
      queryClient.clear();
    }
    
    prevApiConfigRef.current = apiConfig;
  }, [apiConfig, queryClient]);
}

// 系统信息Hook - 使用现有的 API
export function useSystemInfo() {
  const apiConfig = useApiConfig();
  useApiConfigEffect();
  
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

// 配置Hook - 使用现有的 API
export function useClashConfig() {
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();
  useApiConfigEffect();
  
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
    try {
      // 使用现有的 API 更新配置
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

// 代理Hook - 使用现有的 API
export function useProxies() {
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();
  useApiConfigEffect();
  
  const queryResult = useQuery2<{ proxies: Record<string, ProxyItem> }>(
    'proxies',
    () => fetchProxies(apiConfig),
    { refetchInterval: 3000 }
  );

  const switchProxy = useCallback(async (groupName: string, proxyName: string) => {
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

// 连接Hook - 使用现有的 API
export function useConnections() {
  const apiConfig = useApiConfig();
  useApiConfigEffect();
  
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

// 流量监控Hook - 使用现有的 WebSocket 连接
export function useTraffic() {
  const apiConfig = useApiConfig();
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const maxDataPoints = 150;

  useEffect(() => {
    if (!apiConfig?.baseURL) {
      setIsConnected(false);
      return;
    }

    // 清理之前的连接
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const connectWebSocket = () => {
      try {
        // 使用现有的连接 API 来获取流量数据
        const result = connAPI.fetchData(apiConfig, (data: any) => {
          if (data.uploadTotal !== undefined && data.downloadTotal !== undefined) {
            const trafficPoint: TrafficData = {
              up: data.uploadTotal || 0,
              down: data.downloadTotal || 0,
              timestamp: Date.now(),
            };
            
            setTrafficData(prev => {
              const newData = [...prev, trafficPoint];
              return newData.slice(-maxDataPoints);
            });
          }
        });
        
        if (typeof result === 'function') {
          unsubscribeRef.current = result;
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to connect traffic WebSocket:', error);
        setIsConnected(false);
        // 重连逻辑
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
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

// 日志Hook - 使用现有的日志 API
export function useLogs() {
  const apiConfig = useApiConfig();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const maxLogs = 500;

  useEffect(() => {
    if (!apiConfig?.baseURL) {
      setIsConnected(false);
      return;
    }

    // 清理之前的连接
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const connectWebSocket = () => {
      try {
        const wsUrl = apiConfig.baseURL.replace(/^http/, 'ws') + '/logs';
        const ws = new WebSocket(wsUrl + (apiConfig.secret ? `?token=${encodeURIComponent(apiConfig.secret)}` : ''));
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('Logs WebSocket connected');
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
          console.log('Logs WebSocket disconnected');
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('Logs WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect logs WebSocket:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [apiConfig]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    data: logs,
    isConnected,
    clearLogs,
  };
}