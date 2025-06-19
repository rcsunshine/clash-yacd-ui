import { APIResponse,ClashAPIConfig } from '../types/api';

// 默认API配置 - 仅用作类型参考，实际配置从V1 store获取
export const DEFAULT_API_CONFIG: ClashAPIConfig = {
  baseURL: 'http://127.0.0.1:9090',
  secret: '4e431a56ead99c',
};

// 构建请求URL和初始化选项
export function buildRequestConfig(config: ClashAPIConfig, endpoint: string) {
  const url = `${config.baseURL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (config.secret) {
    headers['Authorization'] = `Bearer ${config.secret}`;
  }
  
  return {
    url,
    headers,
  };
}

// 构建WebSocket URL
export function buildWebSocketURL(config: ClashAPIConfig, endpoint: string): string {
  const wsProtocol = config.baseURL.startsWith('https') ? 'wss' : 'ws';
  const baseURL = config.baseURL.replace(/^https?/, wsProtocol);
  const url = new URL(endpoint, baseURL);
  
  if (config.secret) {
    url.searchParams.set('token', config.secret);
  }
  
  return url.toString();
}

// API请求包装器
export async function apiRequest<T = any>(
  config: ClashAPIConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const { url, headers } = buildRequestConfig(config, endpoint);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid API secret');
    }
    
    if (response.status === 404) {
      console.warn(`API endpoint not found: ${endpoint}`);
      return { status: 404, error: 'Endpoint not found' };
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        status: response.status,
        error: errorText || `HTTP ${response.status}`,
      };
    }
    
    const data = await response.json().catch(() => null);
    return { status: response.status, data };
    
  } catch (error) {
    console.error('API request failed:', error);
    return {
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// GET请求
export function apiGet<T = any>(config: ClashAPIConfig, endpoint: string): Promise<APIResponse<T>> {
  return apiRequest<T>(config, endpoint, { method: 'GET' });
}

// POST请求
export function apiPost<T = any>(
  config: ClashAPIConfig,
  endpoint: string,
  data?: any
): Promise<APIResponse<T>> {
  return apiRequest<T>(config, endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// PUT请求
export function apiPut<T = any>(
  config: ClashAPIConfig,
  endpoint: string,
  data?: any
): Promise<APIResponse<T>> {
  return apiRequest<T>(config, endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// DELETE请求
export function apiDelete<T = any>(
  config: ClashAPIConfig,
  endpoint: string
): Promise<APIResponse<T>> {
  return apiRequest<T>(config, endpoint, { method: 'DELETE' });
}

// 错误处理工具
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
} 