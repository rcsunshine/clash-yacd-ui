export interface ClashAPIConfig {
  baseURL: string;
  secret?: string;
}

export interface TrafficData {
  up: number;
  down: number;
  timestamp?: number;
}

export interface ProxyItem {
  name: string;
  type: string;
  history: Array<{ time: string; delay: number }>;
  all?: string[];
  now?: string;
  provider?: string;
}

export interface ProxyGroup {
  name: string;
  type: string;
  now: string;
  all: string[];
  history: Array<{ time: string; delay: number }>;
}

export interface ProxyProvider {
  name: string;
  type: 'Proxy';
  updatedAt: string;
  vehicleType: 'HTTP' | 'File' | 'Compatible';
  proxies: ProxyItem[];
}

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
  };
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload: string;
}

export interface LogItem {
  type: 'info' | 'warning' | 'error' | 'debug';
  payload: string;
  time: string;
}

export interface ClashConfig {
  port: number;
  'socks-port': number;
  'redir-port': number;
  'allow-lan': boolean;
  mode: string;
  'log-level': string;
  authentication?: unknown[];
  'bind-address'?: string;
  ipv6?: boolean;
  'mixed-port'?: number;
  'tproxy-port'?: number;
}

export interface RuleItem {
  type: string;
  payload: string;
  proxy: string;
}

export interface SystemInfo {
  version: string;
  premium: boolean;
  mode: string;
  uploadTotal: number;
  downloadTotal: number;
}

export type ProxyDelayStatus = 
  | { status: 'success'; delay: number }
  | { status: 'testing' }
  | { status: 'error'; message: string }
  | { status: 'timeout' };

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
} 