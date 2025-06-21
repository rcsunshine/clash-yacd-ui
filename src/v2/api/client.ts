import { APIResponse,ClashAPIConfig } from '../types/api';

// V2独立的API客户端类
export class ClashAPIClient {
  private config: ClashAPIConfig;

  constructor(config: ClashAPIConfig) {
    this.config = config;
  }

  // 构建请求headers
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.config.secret) {
      headers['Authorization'] = `Bearer ${this.config.secret}`;
    }
    
    return headers;
  }

  // 基础请求方法 - 添加AbortSignal支持
  async request<T = any>(
    endpoint: string, 
    options: RequestInit & { signal?: AbortSignal } = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const headers = this.buildHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: options.signal, // 支持取消信号
      });

      if (response.status === 401) {
        return {
          status: response.status,
          error: 'Unauthorized: Invalid API secret',
        };
      }

      if (response.status === 404) {
        return {
          status: response.status,
          error: 'Endpoint not found',
        };
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
      // 检查是否是取消错误
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 0,
          error: 'Request cancelled',
        };
      }
      
      return {
        status: 0,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET请求 - 添加AbortSignal支持
  async get<T = any>(endpoint: string, signal?: AbortSignal): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', signal });
  }

  // POST请求 - 添加AbortSignal支持
  async post<T = any>(endpoint: string, data?: any, signal?: AbortSignal): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  // PUT请求 - 添加AbortSignal支持
  async put<T = any>(endpoint: string, data?: any, signal?: AbortSignal): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  // PATCH请求 - 添加AbortSignal支持
  async patch<T = any>(endpoint: string, data?: any, signal?: AbortSignal): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  // DELETE请求 - 添加AbortSignal支持
  async delete<T = any>(endpoint: string, signal?: AbortSignal): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', signal });
  }

  // 构建WebSocket URL
  buildWebSocketURL(endpoint: string): string {
    const wsProtocol = this.config.baseURL.startsWith('https') ? 'wss' : 'ws';
    const baseURL = this.config.baseURL.replace(/^https?/, wsProtocol);
    const url = new URL(endpoint, baseURL);
    
    if (this.config.secret) {
      url.searchParams.set('token', this.config.secret);
    }
    
    return url.toString();
  }
}

// 创建API客户端实例的便捷函数
export function createAPIClient(config: ClashAPIConfig): ClashAPIClient {
  return new ClashAPIClient(config);
} 