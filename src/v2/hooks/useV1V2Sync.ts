import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

import { useApiConfig as useV1ApiConfig } from '../../store/app';
import { clashAPIConfigsAtom, selectedClashAPIConfigIndexAtom } from '../../store/app';
import { v2ApiConfigsAtom, v2SelectedApiConfigIndexAtom } from '../store/atoms';
import type { ClashAPIConfig } from '../types/api';

// 全局同步状态管理
let globalSyncLock = false;
let syncLockTimeout: ReturnType<typeof setTimeout> | null = null;

// 配置签名函数 - 用于检测配置变化
function createConfigSignature(config: ClashAPIConfig): string {
  return `${config.baseURL}|${config.secret || ''}`;
}

// 设置同步锁定状态
function setGlobalSyncLock(duration = 1000) {
  globalSyncLock = true;
  if (syncLockTimeout) {
    clearTimeout(syncLockTimeout);
  }
  syncLockTimeout = setTimeout(() => {
    globalSyncLock = false;
    syncLockTimeout = null;
  }, duration);
}

export function useV1V2Sync() {
  const v1ApiConfig = useV1ApiConfig();
  const [v2ApiConfigs, setV2ApiConfigs] = useAtom(v2ApiConfigsAtom);
  const [v2SelectedIndex, setV2SelectedIndex] = useAtom(v2SelectedApiConfigIndexAtom);
  
  // V1 atoms for direct update
  const [v1ApiConfigs, setV1ApiConfigs] = useAtom(clashAPIConfigsAtom);
  const [v1SelectedIndex, setV1SelectedIndex] = useAtom(selectedClashAPIConfigIndexAtom);
  
  // 用于跟踪配置变化的引用
  const v1ConfigRef = useRef<ClashAPIConfig>();
  const v2ConfigRef = useRef<ClashAPIConfig>();
  const isInitializedRef = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 获取当前V2选中的配置
  const currentV2Config = v2ApiConfigs[v2SelectedIndex] || v2ApiConfigs[0];
  
  // 强制初始化同步 - 页面刷新后确保配置正确
  const forceInitSync = useCallback(() => {
    if (globalSyncLock || !v1ApiConfig) return;
    
    setGlobalSyncLock(1000); // 初始化锁定时间
    
    // 检查V2是否包含V1的配置
    const v1Signature = createConfigSignature(v1ApiConfig);
    const matchingIndex = v2ApiConfigs.findIndex(config => 
      createConfigSignature(config) === v1Signature
    );
    
    if (matchingIndex >= 0) {
      // V2中存在匹配配置，切换到该配置
      if (matchingIndex !== v2SelectedIndex) {
        setV2SelectedIndex(matchingIndex);
      }
    } else {
      // V2中不存在，添加V1配置并切换
      const newConfigs = [...v2ApiConfigs, { ...v1ApiConfig }];
      setV2ApiConfigs(newConfigs);
      setV2SelectedIndex(newConfigs.length - 1);
    }
    
    isInitializedRef.current = true;
  }, [v1ApiConfig, v2ApiConfigs, v2SelectedIndex, setV2ApiConfigs, setV2SelectedIndex]);

  // 初始化同步 - 延迟执行避免循环
  useEffect(() => {
    if (!isInitializedRef.current && v1ApiConfig) {
      initTimeoutRef.current = setTimeout(() => {
        forceInitSync();
      }, 500);
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [forceInitSync, v1ApiConfig]);

  // 主要同步逻辑
  useEffect(() => {
    // 跳过未初始化的状态
    if (!v1ApiConfig || !currentV2Config || globalSyncLock) return;

    // 生成配置签名
    const v1Signature = createConfigSignature(v1ApiConfig);
    const v2Signature = createConfigSignature(currentV2Config);
    
    // 检测配置是否发生变化
    const v1ConfigChanged = v1ConfigRef.current && 
      createConfigSignature(v1ConfigRef.current) !== v1Signature;
    const v2ConfigChanged = v2ConfigRef.current && 
      createConfigSignature(v2ConfigRef.current) !== v2Signature;
    
    // 更新引用 - 先更新，避免重复检测
    v1ConfigRef.current = v1ApiConfig;
    v2ConfigRef.current = currentV2Config;
    
    // 只有在配置真正不同步时才进行同步
    if (v1Signature === v2Signature) {
      // 配置已同步，无需操作
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }
      return;
    }
    
    // 检测到变化时的同步逻辑
    if (v1ConfigChanged || v2ConfigChanged) {
      // 确定同步方向 - 优先考虑V2的变化
      if (v2ConfigChanged && !v1ConfigChanged) {
        // V2配置变化 -> 同步到V1
        console.log(`🔄 V2→V1: ${currentV2Config?.baseURL}`);
        setGlobalSyncLock(1500);
        
        // 直接更新V1的配置
        const matchingV1Index = v1ApiConfigs.findIndex(config => 
          createConfigSignature(config) === v2Signature
        );
        
        if (matchingV1Index >= 0) {
          setV1SelectedIndex(matchingV1Index);
        } else {
          const newV1Configs = [...v1ApiConfigs, { ...currentV2Config }];
          setV1ApiConfigs(newV1Configs);
          setV1SelectedIndex(newV1Configs.length - 1);
        }
      } else if (v1ConfigChanged && !v2ConfigChanged) {
        // V1配置变化 -> 检查并同步到V2
        console.log(`🔄 V1→V2: ${v1ApiConfig.baseURL}`);
        setGlobalSyncLock(1500);
        
        const matchingIndex = v2ApiConfigs.findIndex(config => 
          createConfigSignature(config) === v1Signature
        );
        
        if (matchingIndex >= 0) {
          setV2SelectedIndex(matchingIndex);
        } else {
          const newConfigs = [...v2ApiConfigs, { ...v1ApiConfig }];
          setV2ApiConfigs(newConfigs);
          setV2SelectedIndex(newConfigs.length - 1);
        }
      } else if (v1ConfigChanged && v2ConfigChanged) {
        // 双向都有变化，以V2为准
        console.log(`⚠️ Conflict resolved: V2 priority`);
        setGlobalSyncLock(1500);
        
        const matchingV1Index = v1ApiConfigs.findIndex(config => 
          createConfigSignature(config) === v2Signature
        );
        
        if (matchingV1Index >= 0) {
          setV1SelectedIndex(matchingV1Index);
        } else {
          const newV1Configs = [...v1ApiConfigs, { ...currentV2Config }];
          setV1ApiConfigs(newV1Configs);
          setV1SelectedIndex(newV1Configs.length - 1);
        }
      }
    }
    
    // 标记为已初始化
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
    
  }, [v1ApiConfig, currentV2Config, v2ApiConfigs, v1ApiConfigs, setV2ApiConfigs, setV2SelectedIndex, setV1ApiConfigs, setV1SelectedIndex]);
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (syncLockTimeout) {
        clearTimeout(syncLockTimeout);
        syncLockTimeout = null;
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      globalSyncLock = false;
    };
  }, []);
} 