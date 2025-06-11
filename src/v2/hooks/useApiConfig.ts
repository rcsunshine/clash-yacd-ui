import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

import { useApiConfig as useV1ApiConfig } from '../../store/app';
import { v2ApiConfigsAtom, v2CurrentApiConfigAtom, v2SelectedApiConfigIndexAtom } from '../store/atoms';
import type { ClashAPIConfig } from '../types/api';

// V2 API配置管理Hook
export function useApiConfig() {
  const v1ApiConfig = useV1ApiConfig();
  const [currentApiConfig] = useAtom(v2CurrentApiConfigAtom);
  
  // 优先返回V2配置，如果V2没有则使用V1配置
  return currentApiConfig || v1ApiConfig;
}

// V2 API配置管理Hook (完整版)
export function useV2ApiConfig() {
  const [apiConfigs, setApiConfigs] = useAtom(v2ApiConfigsAtom);
  const [selectedIndex, setSelectedIndex] = useAtom(v2SelectedApiConfigIndexAtom);
  const currentConfig = apiConfigs[selectedIndex] || apiConfigs[0];
  
  // 添加新配置
  const addConfig = useCallback((config: ClashAPIConfig) => {
    const newConfigs = [...apiConfigs, config];
    setApiConfigs(newConfigs);
    return newConfigs.length - 1; // 返回新配置的索引
  }, [apiConfigs, setApiConfigs]);
  
  // 删除配置
  const removeConfig = useCallback((index: number) => {
    if (index === 0 || index >= apiConfigs.length) return false; // 不能删除第一个配置
    
    const newConfigs = apiConfigs.filter((_, i) => i !== index);
    setApiConfigs(newConfigs);
    
    // 如果删除的是当前选中的配置，切换到第一个
    if (index === selectedIndex) {
      setSelectedIndex(0);
    } else if (index < selectedIndex) {
      setSelectedIndex(selectedIndex - 1);
    }
    
    return true;
  }, [apiConfigs, selectedIndex, setApiConfigs, setSelectedIndex]);
  
  // 更新配置
  const updateConfig = useCallback((index: number, config: ClashAPIConfig) => {
    if (index < 0 || index >= apiConfigs.length) return false;
    
    const newConfigs = [...apiConfigs];
    newConfigs[index] = config;
    setApiConfigs(newConfigs);
    
    return true;
  }, [apiConfigs, setApiConfigs]);
  
  // 切换配置
  const switchConfig = useCallback((index: number) => {
    if (index < 0 || index >= apiConfigs.length) return false;
    
    console.log(`🔄 V2: Switching to config ${index}: ${apiConfigs[index]?.baseURL}`);
    setSelectedIndex(index);
    
    return true;
  }, [apiConfigs, setSelectedIndex]);
  
  // 配置持久化监听
  useEffect(() => {
    // 这里的持久化通过V1V2同步机制自动处理
    // V2的配置变更会同步到V1，V1负责持久化到localStorage
    // 移除日志输出避免频繁渲染
  }, [apiConfigs, selectedIndex]);
  
  return {
    configs: apiConfigs,
    selectedIndex,
    currentConfig,
    addConfig,
    removeConfig,
    updateConfig,
    switchConfig,
  };
}

// 检查API配置是否可用
export function useApiConfigReady(): boolean {
  const config = useApiConfig();
  return !!(config.baseURL && config.baseURL !== 'http://127.0.0.1:9090');
} 