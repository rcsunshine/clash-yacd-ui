import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

import { v2ApiConfigsAtom, v2CurrentApiConfigAtom, v2SelectedApiConfigIndexAtom } from '../store/atoms';
import type { ClashAPIConfig } from '../types/api';

// V2 独立的API配置管理Hook
export function useApiConfig() {
  const [currentApiConfig] = useAtom(v2CurrentApiConfigAtom);
  return currentApiConfig;
}

// V2 完整的API配置管理Hook
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
  
  // V2独立的配置持久化
  useEffect(() => {
    // 保存V2配置到localStorage
    const v2State = {
      apiConfigs,
      selectedIndex,
    };
    localStorage.setItem('v2-api-config', JSON.stringify(v2State));
    
    // 同步到V1配置
    try {
      const savedV1 = localStorage.getItem('app');
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        // 更新V1配置中的API设置
        parsedV1.apiConfig = {
          ...parsedV1.apiConfig,
          baseURL: currentConfig.baseURL,
          secret: currentConfig.secret,
        };
        // 保存回localStorage
        localStorage.setItem('app', JSON.stringify(parsedV1));
        console.log('📝 API配置已同步到V1:', currentConfig.baseURL);
      }
    } catch (error) {
      console.warn('同步API配置到V1失败:', error);
    }
  }, [apiConfigs, selectedIndex, currentConfig]);
  
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