// V2 API 类型定义
// 基于 Clash API 规范和 V2 架构要求

// 基础类型
export interface APIResponse<T = any> {
  status: number;
  data?: T;
  error?: string;
  message?: string;
}

export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
  retryDelay?: (attemptIndex: number) => number;
}

// 规则相关类型
export type RuleType = 
  | 'DOMAIN' 
  | 'DOMAIN-SUFFIX' 
  | 'DOMAIN-KEYWORD' 
  | 'IP-CIDR' 
  | 'IP-CIDR6'
  | 'GEOIP' 
  | 'GEOSITE'
  | 'MATCH'
  | 'RULE-SET'
  | 'PROCESS-NAME'
  | 'PROCESS-PATH';

export interface Rule {
  id: number;
  type: RuleType;
  payload: string;
  proxy: string;
  size?: number;
}

export interface RuleProvider {
  name: string;
  type: 'File' | 'HTTP';
  behavior: 'domain' | 'ipcidr' | 'classical';
  ruleCount: number;
  updatedAt?: string;
  vehicleType: 'HTTP' | 'File';
  format?: 'yaml' | 'text';
  url?: string;
  path?: string;
}

export interface RulesResponse {
  rules: Rule[];
  providers: Record<string, RuleProvider>;
}

// 代理相关类型
export interface ProxyItem {
  name: string;
  type: string;
  history: Array<{
    time: string;
    delay: number;
  }>;
  all?: string[];
  now?: string;
  udp?: boolean;
  xudp?: boolean;
}

export interface ProxiesResponse {
  proxies: Record<string, ProxyItem>;
}

// 连接相关类型
export interface ConnectionItem {
  id: string;
  metadata: {
    network: string;
    type: string;
    sourceIP: string;
    destinationIP: string;
    sourcePort: string;
    destinationPort: string;
    host: string;
    dnsMode: string;
    processPath: string;
    specialProxy: string;
    specialRules: string;
    remoteDestination: string;
    dscp: number;
    sniffHost: string;
  };
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload: string;
}

export interface ConnectionsResponse {
  downloadTotal: number;
  uploadTotal: number;
  connections: ConnectionItem[];
  memory: number;
}

// 流量数据类型
export interface TrafficData {
  up: number;    // 上传速率 bytes/s
  down: number;  // 下载速率 bytes/s
  timestamp: number;
}

// 日志相关类型
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'silent';

export interface LogItem {
  type: LogLevel;
  payload: string;
  time?: string;
}

// 配置相关类型
export interface ClashConfig {
  port: number;
  'socks-port': number;
  'redir-port': number;
  'tproxy-port': number;
  'mixed-port': number;
  authentication: string[];
  'allow-lan': boolean;
  'bind-address': string;
  mode: 'global' | 'rule' | 'direct';
  'log-level': LogLevel;
  ipv6: boolean;
  'external-controller': string;
  'external-ui': string;
  secret: string;
  'interface-name': string;
  'routing-mark': number;
  'geodata-mode': boolean;
  'geodata-loader': string;
  'tcp-concurrent': boolean;
  'find-process-mode': string;
  'global-client-fingerprint': string;
}

// 系统信息类型
export interface SystemInfo {
  version: string;
  premium?: boolean;
  mode: string;
  port: number;
  'socks-port': number;
  'mixed-port': number;
  'allow-lan': boolean;
  'log-level': LogLevel;
  'external-controller': string;
  secret: string;
  memory?: number;
  stack?: string;
  platform?: string;
  arch?: string;
}

// Clash API 配置类型
export interface ClashAPIConfig {
  baseURL: string;
  secret?: string;
}

// Hook 返回类型
export interface UseQueryResult<T> {
  data?: T;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  isFetching?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
}

// WebSocket 连接状态
export interface WebSocketState {
  isConnected: boolean;
  error?: string;
  reconnectCount?: number;
}

// 通用 API 错误类型
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// 组件 Props 基础类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 主题相关类型
export type Theme = 'light' | 'dark' | 'auto';

// 应用状态类型
export interface AppState {
  theme: Theme;
  apiConfig: ClashAPIConfig;
  autoRefresh: boolean;
  refreshInterval: number;
  compactMode: boolean;
  showNotifications: boolean;
}

// 统计数据类型
export interface StatsData {
  activeConnections: number;
  uploadTotal: number;
  downloadTotal: number;
  uploadSpeed: number;
  downloadSpeed: number;
  memory: number;
} 