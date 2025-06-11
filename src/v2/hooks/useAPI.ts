import { useMutation,useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef,useState } from 'react';

import { createAPIClient } from '../api/client';
// 导入 V2 类型定义
import { 
  ClashConfig,
  ConnectionItem,
  LogItem,
  ProxyItem,
  QueryOptions,
  RulesResponse,
  SystemInfo,
  TrafficData,
  UseQueryResult} from '../types/api';
// 导入 V2 独立的 API 和状态管理
import { useApiConfig } from './useApiConfig';

// 全局配置变更锁
let isConfigChanging = false;
let configChangePromise: Promise<void> | null = null;

// 改进的基础查询Hook - 自动处理API配置变化
export function useQuery2<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
) {
  const queryClient = useQueryClient();
  const apiConfig = useApiConfig();
  const prevApiConfigRef = useRef<typeof apiConfig>();
  
  // 检查配置是否变化，如果变化则立即重新初始化查询
  useEffect(() => {
    const configChanged = prevApiConfigRef.current && 
      (prevApiConfigRef.current.baseURL !== apiConfig?.baseURL || 
       prevApiConfigRef.current.secret !== apiConfig?.secret);
    
    if (configChanged) {
      console.log(`🔄 Query ${queryKey} detected config change, restarting...`);
      // 立即停止当前查询
      queryClient.cancelQueries({ queryKey: [queryKey] });
      // 清除该查询的缓存
      queryClient.removeQueries({ queryKey: [queryKey] });
      // 重新启动查询
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }, 100);
    }
    
    prevApiConfigRef.current = apiConfig;
  }, [apiConfig, queryClient, queryKey]);
  
  return useQuery<T>({
    queryKey: [queryKey, apiConfig?.baseURL, apiConfig?.secret], // 包含配置作为查询键
    queryFn: async () => {
      // 如果正在进行配置变更，等待完成
      if (isConfigChanging) {
        console.log(`⏳ Query ${queryKey} waiting for config change to complete...`);
        await waitForConfigChange();
      }
      
      // 再次检查配置变更状态
      if (isConfigChanging) {
        throw new Error('API configuration is changing, query cancelled');
      }
      
      return queryFn();
    },
    enabled: !!apiConfig?.baseURL && !isConfigChanging, // 配置变更时禁用查询
    ...options,
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
      
      console.log('🔄 API config changing from', prevApiConfigRef.current.baseURL, 'to', apiConfig.baseURL);
      
      // 设置配置变更锁定
      isConfigChanging = true;
      
      // 创建配置变更Promise
      configChangePromise = new Promise(async (resolve) => {
        try {
          // 立即停止所有正在进行的查询
          queryClient.cancelQueries();
          
          // 完全清理查询缓存
          queryClient.clear();
          
          console.log('🧹 Cleared all query cache due to API config change');
          
          // 等待一段时间确保所有请求都停止
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // 重新初始化关键查询
          const apiRelatedKeys = [
            'system-info',
            'clash-config', 
            'proxies',
            'connections',
            'rules'
          ];
          
          console.log('🚀 Restarting queries with new API config:', apiConfig.baseURL);
          
          // 依次重新启动查询，避免并发冲突
          for (const key of apiRelatedKeys) {
            queryClient.invalidateQueries({ queryKey: [key] });
            await new Promise(resolve => setTimeout(resolve, 50)); // 小延迟避免冲突
          }
          
          // 强制重新获取关键数据
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['system-info'] });
            queryClient.refetchQueries({ queryKey: ['proxies'] });
          }, 100);
          
        } finally {
          // 延迟释放配置变更锁定
          setTimeout(() => {
            isConfigChanging = false;
            configChangePromise = null;
            console.log('✅ API config change completed, lock released');
          }, 1000);
          
          resolve();
        }
      });
    }
    
    prevApiConfigRef.current = apiConfig;
  }, [apiConfig, queryClient]);
}

// 获取配置变更状态的辅助函数
export function isApiConfigChanging(): boolean {
  return isConfigChanging;
}

// 等待配置变更完成的辅助函数
export async function waitForConfigChange(): Promise<void> {
  if (configChangePromise) {
    await configChangePromise;
  }
}

// 系统信息Hook - 使用V2独立API
export function useSystemInfo() {
  const apiConfig = useApiConfig();
  
  return useQuery2<SystemInfo>(
    'system-info',
    async () => {
      const client = createAPIClient(apiConfig);
      const response = await client.get('/');
      if (response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch system info');
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
      const client = createAPIClient(apiConfig);
      const response = await client.get('/configs');
      if (response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch config');
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
    async () => {
      const client = createAPIClient(apiConfig);
      const response = await client.get('/proxies');
      if (response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch proxies');
    },
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
      const client = createAPIClient(apiConfig);
      const response = await client.get(endpoint);
      if (response.data) {
        return { data: response.data, error: null };
      }
      return { data: null, error: response.error || 'Failed to test delay' };
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

// 连接Hook - 使用V2独立API
export function useConnections() {
  const apiConfig = useApiConfig();
  
  return useQuery2<{ connections: ConnectionItem[] }>(
    'connections',
    async () => {
      const client = createAPIClient(apiConfig);
      const response = await client.get('/connections');
      if (response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch connections');
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
      const client = createAPIClient(apiConfig);
      
      // 获取规则
      const rulesResponse = await client.get('/rules');
      const rulesData = rulesResponse.data || [];
      
      // 获取规则提供者
      let providersData = {};
      try {
        const providersResponse = await client.get('/providers/rules');
        providersData = providersResponse.data || {};
      } catch (error) {
        console.log('No rule providers found:', error);
        providersData = {};
      }
      
      return {
        rules: Array.isArray(rulesData) ? rulesData : (rulesData?.rules || []),
        providers: providersData || {}
      };
    },
    { staleTime: 30000 }
  );
}

// 连接统计Hook - 优化API配置检查和定时器管理
export function useConnectionStats() {
  const apiConfig = useApiConfig();
  const [stats, setStats] = useState({
    activeConnections: 0,
    uploadTotal: 0,
    downloadTotal: 0,
    isConnected: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const lastApiConfigRef = useRef<typeof apiConfig>();

  useEffect(() => {
    mountedRef.current = true;
    
    // 检查API配置是否变化
    const configChanged = lastApiConfigRef.current && 
      (lastApiConfigRef.current.baseURL !== apiConfig?.baseURL || 
       lastApiConfigRef.current.secret !== apiConfig?.secret);
    
    if (configChanged || !lastApiConfigRef.current) {
      console.log('🔄 ConnectionStats: API config changed, restarting timers...');
      // 清理旧的定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStats(prev => ({ ...prev, isConnected: false }));
    }
    
    lastApiConfigRef.current = apiConfig;
    
    // 如果正在配置变更，等待完成
    if (isConfigChanging) {
      console.log('⏳ ConnectionStats: Waiting for config change to complete...');
      setStats(prev => ({ ...prev, isConnected: false }));
      return;
    }
    
    if (!apiConfig?.baseURL) {
      setStats(prev => ({ ...prev, isConnected: false }));
      return;
    }

    const fetchStats = async () => {
      if (!mountedRef.current || isConfigChanging) return;
      
      try {
        // 使用当前的API配置
        const client = createAPIClient(apiConfig);
        const response = await client.get('/connections');
        if (response.data && mountedRef.current && !isConfigChanging) {
          setStats({
            activeConnections: Array.isArray(response.data.connections) ? response.data.connections.length : 0,
            uploadTotal: response.data.uploadTotal || 0,
            downloadTotal: response.data.downloadTotal || 0,
            isConnected: true,
          });
        }
      } catch (error) {
        if (mountedRef.current && !isConfigChanging) {
          setStats(prev => ({ ...prev, isConnected: false }));
        }
      }
    };
    
    // 立即获取一次数据
    fetchStats();
    
    // 设置定时更新，确保没有重复的定时器
    if (!intervalRef.current) {
      intervalRef.current = setInterval(fetchStats, 3000);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const lastApiConfigRef = useRef<typeof apiConfig>();
  const maxDataPoints = 150;

  useEffect(() => {
    mountedRef.current = true;
    
    // 检查API配置是否变化
    const configChanged = lastApiConfigRef.current && 
      (lastApiConfigRef.current.baseURL !== apiConfig?.baseURL || 
       lastApiConfigRef.current.secret !== apiConfig?.secret);
    
    if (configChanged) {
      console.log('🔄 Traffic WebSocket: API config changed, reconnecting...');
      // 立即关闭现有连接
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setTrafficData([]);
    }
    
    lastApiConfigRef.current = apiConfig;
    
    // 如果正在配置变更，等待完成
    if (isConfigChanging) {
      console.log('⏳ Traffic WebSocket: Waiting for config change to complete...');
      setIsConnected(false);
      setTrafficData([]);
      return;
    }
    
    // 确保 API 配置已正确设置
    if (!apiConfig?.baseURL) {
      console.log('⏳ Traffic WebSocket: Waiting for API config...');
      setIsConnected(false);
      setTrafficData([]);
      return;
    }

    // 清理之前的连接和定时器
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const connectWebSocket = () => {
      if (!mountedRef.current) return;
      
      try {
        // 使用正确的 /traffic WebSocket 端点
        const baseWsUrl = apiConfig.baseURL.replace(/^http/, 'ws');
        const wsUrl = baseWsUrl + '/traffic' + (apiConfig.secret ? `?token=${encodeURIComponent(apiConfig.secret)}` : '');
        
        // 在React严格模式下延迟连接，避免重复连接
        const ws = new WebSocket(wsUrl);
        
        // 立即检查组件是否仍然挂载
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) return;
          setIsConnected(true);
          console.log('🔗 Traffic WebSocket connected to', apiConfig.baseURL);
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
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

        ws.onclose = (event) => {
          if (!mountedRef.current) return;
          setIsConnected(false);
          
          // 只有在非正常关闭时才重连
          if (event.code !== 1000 && event.code !== 1001) {
            console.log('💔 Traffic WebSocket disconnected, attempting reconnect...');
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                connectWebSocket();
              }
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          if (!mountedRef.current) return;
          console.error('❌ Traffic WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        if (!mountedRef.current) return;
        console.error('Failed to connect traffic WebSocket:', error);
        setIsConnected(false);
        // 重连逻辑
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectWebSocket();
          }
        }, 3000);
      }
    };

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        
        // 只关闭已连接或正在连接的WebSocket
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close(1000, 'Component unmounted');
          } catch (error) {
            // 忽略关闭时的错误，这通常发生在连接还没建立时
            console.debug('Traffic WebSocket close error (ignored):', error);
          }
        }
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const maxLogs = 500;

  useEffect(() => {
    mountedRef.current = true;
    
    // 确保 API 配置已正确设置且不是默认值
    if (!apiConfig?.baseURL || apiConfig.baseURL === 'http://127.0.0.1:9090') {
      console.log('⏳ Logs WebSocket: Waiting for API config, current:', apiConfig?.baseURL);
      setIsConnected(false);
      setLogs([]);
      return;
    }

    // 清理之前的连接和定时器
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const connectWebSocket = () => {
      if (!mountedRef.current) return;
      
      try {
        const baseWsUrl = apiConfig.baseURL.replace(/^http/, 'ws');
        const wsUrl = baseWsUrl + '/logs' + (apiConfig.secret ? `?token=${encodeURIComponent(apiConfig.secret)}` : '');
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) return;
          setIsConnected(true);
          console.log('📝 Logs WebSocket connected to', apiConfig.baseURL);
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
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

        ws.onclose = (event) => {
          if (!mountedRef.current) return;
          setIsConnected(false);
          
          // 只有在非正常关闭时才重连
          if (event.code !== 1000 && event.code !== 1001) {
            console.log('💔 Logs WebSocket disconnected, attempting reconnect...');
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                connectWebSocket();
              }
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          if (!mountedRef.current) return;
          console.error('❌ Logs WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        if (!mountedRef.current) return;
        console.error('Failed to connect logs WebSocket:', error);
        setIsConnected(false);
        // 重连逻辑
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectWebSocket();
          }
        }, 3000);
      }
    };

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        
        // 只关闭已连接或正在连接的WebSocket
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close(1000, 'Component unmounted');
          } catch (error) {
            // 忽略关闭时的错误，这通常发生在连接还没建立时
            console.debug('Logs WebSocket close error (ignored):', error);
          }
        }
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
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

// 关闭连接Hook
export function useCloseConnection() {
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!apiConfig) throw new Error('API config not available');
      
      const client = createAPIClient(apiConfig);
      const response = await client.delete(`/connections/${connectionId}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      // 刷新连接列表
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

// 批量关闭连接Hook
export function useCloseAllConnections() {
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!apiConfig) throw new Error('API config not available');
      
      const client = createAPIClient(apiConfig);
      const response = await client.delete('/connections');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      // 刷新连接列表
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}