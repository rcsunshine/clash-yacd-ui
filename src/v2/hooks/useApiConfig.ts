import { useAtom } from 'jotai';

import { v2CurrentApiConfigAtom } from '../store/atoms';
import { ClashAPIConfig } from '../types/api';

// V2独立的API配置Hook
export function useApiConfig(): ClashAPIConfig {
  const [config] = useAtom(v2CurrentApiConfigAtom);
  return config;
}

// 检查API配置是否可用
export function useApiConfigReady(): boolean {
  const config = useApiConfig();
  return !!(config.baseURL && config.baseURL !== 'http://127.0.0.1:9090');
} 