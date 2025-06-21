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
  RulesQueryResult,
  RulesResponse,
  SystemInfo,
  TrafficData} from '../types/api';
// 导入 V2 独立的 API 和状态管理
import { useApiConfig } from './useApiConfig';

// 全局配置变更锁
let isConfigChanging = false;
let configChangePromise: Promise<void> | null = null;

// ================================
// 彻底重写：全局唯一 WebSocket 管理器
// ================================

interface WebSocketConnection {
  ws: WebSocket | null;
  endpoint: string;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastError: string | null;
  subscribers: number;
  lastActivity: number;
}

class GlobalWebSocketManager {
  private static instance: GlobalWebSocketManager;
  private connections = new Map<string, WebSocketConnection>();
  private eventListeners = new Map<string, Set<(data: any) => void>>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private currentApiConfig: any = null;
  private isInitialized = false;

  private constructor() {
    console.log('🏗️ GlobalWebSocketManager: Initializing singleton');
    this.isInitialized = true;
    
    // 页面卸载时清理
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.destroy());
      
      // 开发环境调试工具
      if (process.env.NODE_ENV === 'development') {
        (window as any).wsManager = {
          status: () => this.getDebugInfo(),
          cleanup: () => this.destroy(),
          reconnect: (endpoint: string) => this.forceReconnect(endpoint),
          connections: () => Array.from(this.connections.entries())
        };
        console.log('🔧 WebSocket debug: window.wsManager');
      }
    }
  }

  public static getInstance(): GlobalWebSocketManager {
    if (!GlobalWebSocketManager.instance) {
      GlobalWebSocketManager.instance = new GlobalWebSocketManager();
    }
    return GlobalWebSocketManager.instance;
  }

  public subscribe(endpoint: string, callback: (data: any) => void, apiConfig: any): () => void {
    // 检查 API 配置变化
    this.checkApiConfigChange(apiConfig);
    
    const connectionKey = this.getConnectionKey(endpoint);
    
    console.log(`📝 Subscribe: ${connectionKey}`, {
      hasConnection: this.connections.has(connectionKey),
      status: this.connections.get(connectionKey)?.status,
      currentSubscribers: this.eventListeners.get(connectionKey)?.size || 0
    });

    // 初始化事件监听器
    if (!this.eventListeners.has(connectionKey)) {
      this.eventListeners.set(connectionKey, new Set());
    }

    // 防止重复订阅
    const listeners = this.eventListeners.get(connectionKey)!;
    if (listeners.has(callback)) {
      console.warn(`⚠️ Duplicate subscription attempt: ${connectionKey}`);
      return () => {}; // 返回空函数
    }

    // 添加监听器
    listeners.add(callback);

    // 如果连接状态异常，先强制关闭并重置
    const existingConnection = this.connections.get(connectionKey);
    if (existingConnection && (existingConnection.status === 'error' || existingConnection.status === 'disconnected')) {
      console.log(`🔄 Resetting problematic connection: ${connectionKey} (${existingConnection.status})`);
      
      // 关闭现有WebSocket连接
      if (existingConnection.ws) {
        try {
          existingConnection.ws.onopen = null;
          existingConnection.ws.onmessage = null;
          existingConnection.ws.onerror = null;
          existingConnection.ws.onclose = null;
          existingConnection.ws.close(1000, 'Reset before subscribe');
        } catch (err) {
          console.error('Error closing problematic WebSocket:', err);
        }
        existingConnection.ws = null;
      }
      
      // 清除所有重连定时器
      this.clearReconnectTimer(connectionKey);
      
      // 重置连接状态
      existingConnection.status = 'idle';
      existingConnection.lastError = null;
    }

    // 确保连接存在
    this.ensureConnection(connectionKey, endpoint, apiConfig);
    
    // 更新订阅者计数
    const connection = this.connections.get(connectionKey);
    if (connection) {
      connection.subscribers = listeners.size;
    }

    // 返回取消订阅函数
    return () => this.unsubscribe(connectionKey, callback);
  }

  private unsubscribe(connectionKey: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(connectionKey);
    if (!listeners) return;

    listeners.delete(callback);
    console.log(`🗑️ Unsubscribe: ${connectionKey}, remaining: ${listeners.size}`);

    // 更新订阅者计数
    const connection = this.connections.get(connectionKey);
    if (connection) {
      connection.subscribers = listeners.size;
    }

    // 如果没有订阅者了，关闭连接
    if (listeners.size === 0) {
      this.closeConnection(connectionKey);
    }
  }

  private checkApiConfigChange(newApiConfig: any): void {
    const configChanged = this.currentApiConfig && (
      this.currentApiConfig.baseURL !== newApiConfig?.baseURL ||
      this.currentApiConfig.secret !== newApiConfig?.secret
    );

    if (configChanged) {
      console.log('🔄 API config changed, destroying all connections');
      this.destroy();
    }

    this.currentApiConfig = newApiConfig;
  }

  private ensureConnection(connectionKey: string, endpoint: string, apiConfig: any): void {
    let connection = this.connections.get(connectionKey);
    
    // 如果连接不存在，创建新的
    if (!connection) {
      connection = {
        ws: null,
        endpoint,
        status: 'idle',
        lastError: null,
        subscribers: 0,
        lastActivity: Date.now()
      };
      this.connections.set(connectionKey, connection);
    }

    // 检查连接状态
    if (connection.status === 'connecting' || connection.status === 'connected') {
      console.log(`✅ Connection already active: ${connectionKey} (${connection.status})`);
      return;
    }

    // 检查 WebSocket 实际状态
    if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      connection.status = 'connected';
      console.log(`✅ WebSocket restored: ${connectionKey}`);
      return;
    }

    // 创建新连接
    this.createConnection(connectionKey, endpoint, apiConfig);
  }

  private createConnection(connectionKey: string, endpoint: string, apiConfig: any): void {
    const connection = this.connections.get(connectionKey);
    if (!connection) return;

    // 防止重复连接
    if (connection.status === 'connecting') {
      console.log(`⏳ Already connecting: ${connectionKey}`);
      return;
    }

    console.log(`🚀 Creating WebSocket: ${connectionKey}`);
    connection.status = 'connecting';
    connection.lastError = null;

    try {
      // 关闭现有连接
      if (connection.ws) {
        try {
          // 先移除所有事件监听器，防止旧连接的事件触发
          connection.ws.onopen = null;
          connection.ws.onmessage = null;
          connection.ws.onerror = null;
          connection.ws.onclose = null;
          
          // 关闭连接
          connection.ws.close(1000, 'Replacing');
        } catch (err) {
          console.error('Error closing existing WebSocket:', err);
        }
        connection.ws = null;
      }

      // 构建 WebSocket URL
      const wsURL = new URL(apiConfig.baseURL);
      wsURL.protocol = wsURL.protocol.replace('http', 'ws');
      
      const [path, params] = endpoint.split('?');
      wsURL.pathname = path;
      
      if (apiConfig.secret) {
        wsURL.searchParams.set('token', apiConfig.secret);
      }
      
      if (params) {
        const urlParams = new URLSearchParams(params);
        urlParams.forEach((value, key) => {
          wsURL.searchParams.set(key, value);
        });
      }

      console.log(`🔗 Connecting to: ${wsURL.toString()}`);

      // 创建 WebSocket
      const ws = new WebSocket(wsURL.toString());
      connection.ws = ws;

      ws.onopen = () => {
        console.log(`📡 Connected: ${connectionKey}`);
        connection.status = 'connected';
        connection.lastActivity = Date.now();
        this.clearReconnectTimer(connectionKey);
      };

      ws.onmessage = (event) => {
        connection.lastActivity = Date.now();
        try {
          const data = JSON.parse(event.data);
          this.broadcast(connectionKey, data);
        } catch (error) {
          console.error(`❌ Parse error for ${connectionKey}:`, error);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 Disconnected: ${connectionKey} (code: ${event.code})`);
        connection.status = 'disconnected';
        connection.ws = null;

        // 如果还有订阅者且不是主动关闭，尝试重连
        const listeners = this.eventListeners.get(connectionKey);
        if (listeners && listeners.size > 0 && event.code !== 1000) {
          this.scheduleReconnect(connectionKey, endpoint, apiConfig);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error: ${connectionKey}`, error);
        connection.status = 'error';
        connection.lastError = 'Connection error';
      };

    } catch (error) {
      console.error(`❌ Failed to create WebSocket: ${connectionKey}`, error);
      connection.status = 'error';
      connection.lastError = String(error);
    }
  }

  private broadcast(connectionKey: string, data: any): void {
    const listeners = this.eventListeners.get(connectionKey);
    if (!listeners) return;

    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Callback error for ${connectionKey}:`, error);
      }
    });
  }

  private scheduleReconnect(connectionKey: string, endpoint: string, apiConfig: any): void {
    this.clearReconnectTimer(connectionKey);

    console.log(`⏰ Scheduling reconnect: ${connectionKey} in 3s`);
    const timer = setTimeout(() => {
      this.reconnectTimers.delete(connectionKey);
      const listeners = this.eventListeners.get(connectionKey);
      if (listeners && listeners.size > 0) {
        console.log(`🔄 Reconnecting: ${connectionKey}`);
        this.createConnection(connectionKey, endpoint, apiConfig);
      }
    }, 3000);

    this.reconnectTimers.set(connectionKey, timer);
  }

  private clearReconnectTimer(connectionKey: string): void {
    const timer = this.reconnectTimers.get(connectionKey);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(connectionKey);
    }
  }

  private closeConnection(connectionKey: string): void {
    console.log(`🗑️ Closing connection: ${connectionKey}`);
    
    const connection = this.connections.get(connectionKey);
    if (connection?.ws) {
      connection.ws.close(1000, 'No subscribers');
    }

    this.connections.delete(connectionKey);
    this.eventListeners.delete(connectionKey);
    this.clearReconnectTimer(connectionKey);
  }

  public forceReconnect(endpoint: string): void {
    const connectionKey = this.getConnectionKey(endpoint);
    const connection = this.connections.get(connectionKey);
    
    if (connection) {
      console.log(`🔄 Force reconnecting: ${connectionKey}`);
      
      // 设置重连锁，防止在清理过程中创建新连接
      connection.status = 'reconnecting';
      
      // 关闭现有WebSocket连接
      if (connection.ws) {
        try {
          // 先移除所有事件监听器，防止旧连接的事件触发
          connection.ws.onopen = null;
          connection.ws.onmessage = null;
          connection.ws.onerror = null;
          connection.ws.onclose = null;
          
          // 关闭连接
          connection.ws.close(1000, 'Force reconnect');
        } catch (err) {
          console.error('Error closing WebSocket during force reconnect:', err);
        }
        connection.ws = null;
      }
      
      // 清除所有重连定时器
      this.clearReconnectTimer(connectionKey);
      
      // 从连接映射中删除当前连接
      this.connections.delete(connectionKey);
      
      // 延迟创建新连接，确保旧连接完全关闭
      setTimeout(() => {
        // 创建全新的连接对象
        const newConnection: WebSocketConnection = {
          ws: null,
          endpoint: connection.endpoint,
          status: 'idle',
          lastError: null,
          subscribers: connection.subscribers,
          lastActivity: Date.now()
        };
        
        // 添加到连接映射
        this.connections.set(connectionKey, newConnection);
        
        // 确保创建新连接
        if (this.currentApiConfig) {
          this.ensureConnection(connectionKey, connection.endpoint, this.currentApiConfig);
          console.log(`🔄 Reconnection completed for: ${connectionKey}`);
        }
      }, 300); // 延迟300ms确保旧连接完全关闭
    }
  }

  public destroy(): void {
    console.log('🧹 Destroying all WebSocket connections');
    
    // 关闭所有连接
    this.connections.forEach((connection, _key) => {
      if (connection.ws) {
        connection.ws.close(1000, 'Manager destroyed');
      }
    });

    // 清除所有定时器
    this.reconnectTimers.forEach(timer => clearTimeout(timer));

    // 清空所有状态
    this.connections.clear();
    this.eventListeners.clear();
    this.reconnectTimers.clear();
  }

  private getConnectionKey(endpoint: string): string {
    // 使用端点作为键，确保唯一性
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  public getDebugInfo(): any {
    return {
      initialized: this.isInitialized,
      connectionCount: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([key, conn]) => ({
        key,
        endpoint: conn.endpoint,
        status: conn.status,
        subscribers: conn.subscribers,
        lastActivity: conn.lastActivity,
        lastError: conn.lastError,
        wsState: conn.ws?.readyState
      })),
      eventListeners: Array.from(this.eventListeners.entries()).map(([connectionKey, listeners]) => ({
        key: connectionKey,
        listenerCount: listeners.size
      })),
      reconnectTimers: Array.from(this.reconnectTimers.keys())
    };
  }
}

// 全局实例
const globalWsManager = GlobalWebSocketManager.getInstance();

// ================================
// 兼容层：替换原有的 manageWebSocket
// ================================

interface WebSocketManager {
  ws: WebSocket | null;
  subscribers: Set<(data: any) => void>;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  currentApiConfig: any;
  isConnecting: boolean;
}

// 保留原有变量以避免破坏现有代码
const connectionsManager: WebSocketManager = {
  ws: null,
  subscribers: new Set(),
  reconnectTimeout: null,
  currentApiConfig: null,
  isConnecting: false,
};

const trafficManager: WebSocketManager = {
  ws: null,
  subscribers: new Set(),
  reconnectTimeout: null,
  currentApiConfig: null,
  isConnecting: false,
};

const logsManager: WebSocketManager = {
  ws: null,
  subscribers: new Set(),
  reconnectTimeout: null,
  currentApiConfig: null,
  isConnecting: false,
};

// 替换 manageWebSocket 为全局管理器
function manageWebSocket(
  manager: WebSocketManager,
  endpoint: string,
  apiConfig: any,
  subscriber: (data: any) => void,
  onConnected?: () => void,
  onDisconnected?: () => void
): () => void {
  console.log(`🎯 manageWebSocket: ${endpoint}`);
  
  // 使用全局管理器订阅数据
  const unsubscribeData = globalWsManager.subscribe(endpoint, subscriber, apiConfig);
  
  // 监听连接状态变化
  let statusCheckInterval: ReturnType<typeof setInterval> | null = null;
  let lastStatus = 'idle';
  
  // 定期检查连接状态
  const checkConnectionStatus = () => {
    const debugInfo = globalWsManager.getDebugInfo();
    const connection = debugInfo.connections.find((conn: any) => conn.endpoint === endpoint);
    
    if (connection) {
      const currentStatus = connection.status;
      
      // 状态变化时触发回调
      if (currentStatus !== lastStatus) {
        console.log(`📡 ${endpoint} status: ${lastStatus} -> ${currentStatus}`);
        
        if (currentStatus === 'connected' && onConnected) {
          onConnected();
        } else if (currentStatus === 'disconnected' && onDisconnected) {
          onDisconnected();
        }
        
        lastStatus = currentStatus;
      }
    }
  };
  
  // 立即检查一次状态
  setTimeout(checkConnectionStatus, 100);
  
  // 开始定期检查状态
  statusCheckInterval = setInterval(checkConnectionStatus, 1000);
  
  // 返回清理函数
  return () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    unsubscribeData();
  };
}

// 全局清理函数
function clearAllWebSockets() {
  console.log('🧹 clearAllWebSockets called');
  globalWsManager.destroy();
}

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
      
      // 立即清理所有 WebSocket 连接
      clearAllWebSockets();
      
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
      // 获取系统基本配置信息
      const infoResponse = await client.get('/configs');
      // 获取版本信息
      const versionResponse = await client.get('/version');
      
      if (infoResponse.data && versionResponse.data) {
        // 合并信息，确保包含版本字段
        return {
          ...infoResponse.data,
          version: versionResponse.data.version || 'N/A'
        };
      }
      throw new Error(infoResponse.error || versionResponse.error || 'Failed to fetch system info');
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

  const testDelay = useCallback(async (proxyName: string, testUrl?: string, signal?: AbortSignal) => {
    if (!apiConfig?.baseURL) {
      return { error: 'API configuration not available' };
    }

    try {
      const url = testUrl || 'http://www.gstatic.com/generate_204';
      const endpoint = `/proxies/${encodeURIComponent(proxyName)}/delay?timeout=5000&url=${encodeURIComponent(url)}`;
      const client = createAPIClient(apiConfig);
      const response = await client.get(endpoint, signal);
      if (response.data) {
        return { data: response.data, error: null };
      }
      return { data: null, error: response.error || 'Failed to test delay' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { error: 'Request cancelled' };
      }
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiConfig]);

  return {
    ...queryResult,
    switchProxy,
    testDelay,
  };
}

// 连接Hook - 使用全局单例管理器
export function useConnections() {
  const apiConfig = useApiConfig();
  const [connections, setConnections] = useState<{ connections: ConnectionItem[] }>({ connections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const mountedRef = useRef(true);
  const lastConnectionsRef = useRef<{ connections: ConnectionItem[] }>({ connections: [] });

  useEffect(() => {
    mountedRef.current = true;

    // 如果正在配置变更，等待完成
    if (isConfigChanging) {
      console.log('⏳ Connections: Waiting for config change to complete...');
      setIsLoading(true);
      setError(null);
      return;
    }

    if (!apiConfig?.baseURL) {
      setIsLoading(true);
      setError(null);
      return;
    }

    // 如果暂停刷新，不进行WebSocket连接
    if (isPaused) {
      console.log('⏸️ Connections: Updates paused');
      return () => {};
    }

    // 创建订阅者函数
    const subscriber = (data: any) => {
      if (mountedRef.current && !isPaused) {
        setConnections(data);
        lastConnectionsRef.current = data;
        setIsLoading(false);
        setError(null);
      }
    };

    // 使用全局管理器
    const cleanup = manageWebSocket(
      connectionsManager,
      '/connections',
      apiConfig,
      subscriber,
      () => {
        if (mountedRef.current) {
          setIsLoading(false);
          setError(null);
        }
      },
      () => {
        if (mountedRef.current) {
          setError(new Error('Connection lost'));
        }
      }
    );

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [apiConfig, isPaused]);

  // 暂停/恢复刷新
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  return {
    data: isPaused ? lastConnectionsRef.current : connections,
    isLoading: !isPaused && isLoading,
    error,
    isPaused,
    togglePause,
    refetch: () => {
      if (isPaused) {
        // 如果暂停状态，恢复刷新
        setIsPaused(false);
      }
      // 重新连接WebSocket - 使用全局管理器
      globalWsManager.forceReconnect('/connections');
    }
  };
}

// 规则Hook - 移除重复的useApiConfigEffect调用
export function useRules(): RulesQueryResult {
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();

  // 使用useQuery2获取规则
  const rulesQuery = useQuery2<RulesResponse>(
    'rules',
    async () => {
      if (!apiConfig?.baseURL) throw new Error('API配置未设置');
      
      const client = createAPIClient(apiConfig);
      const rulesResponse = await client.get('/rules');
      
      if (rulesResponse.error) {
        throw new Error(rulesResponse.error);
      }
      
      // 尝试获取规则提供者，但如果失败不影响整体功能
      let providers = {};
      try {
        const providersResponse = await client.get('/providers/rules');
        if (!providersResponse.error && providersResponse.data?.providers) {
          providers = providersResponse.data.providers;
        }
      } catch (error) {
        console.warn('规则提供者API不可用:', error);
        // 不抛出错误，继续使用空的providers对象
      }
      
      // 合并规则和提供者数据
      return {
        rules: rulesResponse.data?.rules || [],
        providers: providers
      };
    },
    {
      staleTime: 30000, // 30秒缓存
      retry: 1
    }
  );

  // 添加更新规则提供者的方法
  const updateRuleProvider = async (providerName: string) => {
    if (!apiConfig?.baseURL) throw new Error('API配置未设置');
    
    try {
      const client = createAPIClient(apiConfig);
      const response = await client.put(`/providers/rules/${providerName}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // 更新缓存
      queryClient.invalidateQueries(['rules']);
      
      return response.data;
    } catch (error) {
      console.error('更新规则提供者失败:', error);
      throw new Error(`更新规则提供者失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return {
    ...rulesQuery,
    updateRuleProvider
  } as RulesQueryResult;
}

// 连接统计Hook - 接收连接数据避免重复WebSocket连接
export function useConnectionStats(connectionsData?: { connections: ConnectionItem[] }, isLoading?: boolean, error?: any) {
  const [stats, setStats] = useState({
    activeConnections: 0,
    uploadTotal: 0,
    downloadTotal: 0,
    isConnected: false,
  });
  
  useEffect(() => {
    if (connectionsData) {
      setStats({
        activeConnections: Array.isArray(connectionsData.connections) ? connectionsData.connections.length : 0,
        uploadTotal: (connectionsData as any).uploadTotal || 0,
        downloadTotal: (connectionsData as any).downloadTotal || 0,
        isConnected: !isLoading && !error,
      });
    } else if (error) {
      setStats(prev => ({ ...prev, isConnected: false }));
    }
  }, [connectionsData, isLoading, error]);

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

// 流量监控Hook - 使用全局单例管理器
export function useTraffic() {
  const apiConfig = useApiConfig();
  const maxDataPoints = 150;
  // 初始化为maxDataPoints个全部为0的数据点，方便首次渲染
  // 这样可以避免首次渲染时的空白状态，并提供更好的用户体验
  // 注意：这里使用maxDataPoints而不是固定值，确保与数据上限保持一致
  const [trafficData, setTrafficData] = useState<TrafficData[]>(() => {
    // 创建一个包含maxDataPoints个空数据点的数组，时间戳递减
    const now = Date.now();
    return Array.from({ length: maxDataPoints }, (_, i) => ({
      up: 0,
      down: 0,
      timestamp: now - (maxDataPoints - 1 - i) * 1000, // 递增时间戳，模拟每秒一个数据点
    }));
  });
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // 如果正在配置变更，等待完成
    if (isConfigChanging) {
      console.log('⏳ Traffic: Waiting for config change to complete...');
      setIsConnected(false);
      return;
    }

    if (!apiConfig?.baseURL) {
      setIsConnected(false);
      return;
    }

    // 创建订阅者函数
    const subscriber = (data: any) => {
      if (mountedRef.current) {
        const trafficPoint: TrafficData = {
          up: Math.max(0, data.up || 0),    // 确保非负数
          down: Math.max(0, data.down || 0), // 确保非负数
          timestamp: Date.now(),
        };
        setTrafficData(prev => {
          const newData = [...prev, trafficPoint];
          return newData.slice(-maxDataPoints);
        });
      }
    };

    // 使用全局管理器
    const cleanup = manageWebSocket(
      trafficManager,
      '/traffic',
      apiConfig,
      subscriber,
      () => {
        if (mountedRef.current) {
          setIsConnected(true);
        }
      },
      () => {
        if (mountedRef.current) {
          setIsConnected(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [apiConfig]);

  return {
    data: trafficData,
    isConnected,
  };
}

// 日志Hook - 使用全局单例管理器
export function useLogs() {
  const apiConfig = useApiConfig();
  const { data: clashConfig } = useClashConfig(); // 获取Clash配置以获得日志级别
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);
  const maxLogs = 500;
  const wsEndpointRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    
    // 如果正在配置变更，等待完成
    if (isConfigChanging) {
      console.log('⏳ Logs: Waiting for config change to complete...');
      setIsConnected(false);
      return;
    }

    // 确保 API 配置已正确设置
    if (!apiConfig?.baseURL) {
      setIsConnected(false);
      setLogs([]);
      return;
    }

    // 等待Clash配置加载完成，确保有日志级别
    if (!clashConfig?.['log-level']) {
      console.log('⏳ Logs: Waiting for clash config with log level...');
      setIsConnected(false);
      return;
    }

    // 构建带日志级别的参数
    const extraParams = `level=${clashConfig['log-level']}`;
    const endpoint = `/logs?${extraParams}`;
    
    // 保存当前的endpoint以便刷新时使用
    wsEndpointRef.current = endpoint;

    // 创建订阅者函数
    const subscriber = (data: any) => {
      if (mountedRef.current) {
        setLogs(prev => {
          const newLogs = [...prev, data];
          return newLogs.slice(-maxLogs);
        });
      }
    };

    // 使用全局管理器
    const cleanup = manageWebSocket(
      logsManager,
      endpoint,
      apiConfig,
      subscriber,
      () => {
        if (mountedRef.current) {
          setIsConnected(true);
        }
      },
      () => {
        if (mountedRef.current) {
          setIsConnected(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [apiConfig, clashConfig]); // 依赖项包含clashConfig以便在日志级别变化时重连

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 刷新日志 - 通过重新连接WebSocket实现
  const refreshLogs = useCallback(() => {
    if (wsEndpointRef.current) {
      console.log('🔄 Logs: Starting refresh process');
      
      // 先清空当前日志，给用户一个明确的刷新反馈
      setLogs([]);
      
      // 使用延迟确保UI更新后再重连WebSocket
      setTimeout(() => {
        // 强制重连WebSocket
        globalWsManager.forceReconnect(wsEndpointRef.current!);
        console.log('🔄 Logs: WebSocket connection refresh requested');
      }, 100);
    }
  }, []);

  return {
    logs,
    isConnected,
    clearLogs,
    refreshLogs
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