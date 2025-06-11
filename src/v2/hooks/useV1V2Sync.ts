import { useAtom } from 'jotai';
import { useCallback,useEffect, useRef } from 'react';

import { useApiConfig as useV1ApiConfig } from '../../store/app';
import { v2ApiConfigsAtom, v2SelectedApiConfigIndexAtom } from '../store/atoms';
import type { ClashAPIConfig } from '../types/api';

// 全局同步状态管理
let globalSyncLock = false;
let syncLockTimeout: ReturnType<typeof setTimeout> | null = null;

// 配置签名函数 - 用于检测配置变化
function createConfigSignature(config: ClashAPIConfig): string {
  return `${config.baseURL}|${config.secret || ''}`;
}

// 设置全局同步锁
function setGlobalSyncLock(duration = 1000) {
  if (syncLockTimeout) {
    clearTimeout(syncLockTimeout);
  }
  
  globalSyncLock = true;
  syncLockTimeout = setTimeout(() => {
    globalSyncLock = false;
    syncLockTimeout = null;
  }, duration);
}

export function useV1V2Sync() {
  const v1ApiConfig = useV1ApiConfig();
  const [v2ApiConfigs, setV2ApiConfigs] = useAtom(v2ApiConfigsAtom);
  const [v2SelectedIndex, setV2SelectedIndex] = useAtom(v2SelectedApiConfigIndexAtom);
  
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
    
    console.log('🔄 Forcing initial V1V2 sync after page refresh...');
    setGlobalSyncLock(1500); // 更长的锁定时间确保初始化完成
    
    // 检查V2是否包含V1的配置
    const v1Signature = createConfigSignature(v1ApiConfig);
    const matchingIndex = v2ApiConfigs.findIndex(config => 
      createConfigSignature(config) === v1Signature
    );
    
    if (matchingIndex >= 0) {
      // V2中存在匹配配置，切换到该配置
      if (matchingIndex !== v2SelectedIndex) {
        console.log(`✅ Found matching config in V2 at index ${matchingIndex}, switching...`);
        setV2SelectedIndex(matchingIndex);
      }
    } else {
      // V2中不存在，添加V1配置并切换
      console.log('➕ Adding V1 config to V2 and switching...');
      const newConfigs = [...v2ApiConfigs, { ...v1ApiConfig }];
      setV2ApiConfigs(newConfigs);
      setV2SelectedIndex(newConfigs.length - 1);
    }
    
    isInitializedRef.current = true;
  }, [v1ApiConfig, v2ApiConfigs, v2SelectedIndex, setV2ApiConfigs, setV2SelectedIndex]);
  
  // 页面加载时的初始化延迟同步
  useEffect(() => {
    initTimeoutRef.current = setTimeout(() => {
      if (!isInitializedRef.current && v1ApiConfig) {
        forceInitSync();
      }
    }, 500); // 500ms后执行强制同步

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [forceInitSync, v1ApiConfig]); // 添加缺失的依赖项
  
  // 主同步逻辑
  useEffect(() => {
    if (globalSyncLock || !v1ApiConfig) return;
    
    const v1Signature = createConfigSignature(v1ApiConfig);
    const v2Signature = currentV2Config ? createConfigSignature(currentV2Config) : '';
    
    const v1ConfigChanged = v1ConfigRef.current && 
      createConfigSignature(v1ConfigRef.current) !== v1Signature;
    const v2ConfigChanged = v2ConfigRef.current && 
      createConfigSignature(v2ConfigRef.current) !== v2Signature;
    
    // 检测到变化时的同步逻辑
    if (v1ConfigChanged || v2ConfigChanged) {
      // 确定同步方向
      if (v2ConfigChanged && !v1ConfigChanged) {
        // V2配置变化 -> 同步到V1
        if (v2Signature !== v1Signature) {
          console.log(`✅ Syncing V2→V1: ${currentV2Config?.baseURL}`);
          setGlobalSyncLock();
          // 这里需要调用V1的API配置更新函数
          // 由于V1的实现，我们通过事件或其他方式通知V1更新
          window.dispatchEvent(new CustomEvent('v2-config-change', { 
            detail: currentV2Config 
          }));
        }
      } else if (v1ConfigChanged && !v2ConfigChanged) {
        // V1配置变化 -> 检查并同步到V2
        if (v1Signature !== v2Signature) {
          console.log(`✅ Syncing V1→V2: ${v1ApiConfig.baseURL}`);
          setGlobalSyncLock();
          
          const matchingIndex = v2ApiConfigs.findIndex(config => 
            createConfigSignature(config) === v1Signature
          );
          
          if (matchingIndex >= 0) {
            setV2SelectedIndex(matchingIndex);
          } else {
            // 添加新配置
            const newConfigs = [...v2ApiConfigs, { ...v1ApiConfig }];
            setV2ApiConfigs(newConfigs);
            setV2SelectedIndex(newConfigs.length - 1);
          }
        }
      }
    }
    
    // 更新引用
    v1ConfigRef.current = v1ApiConfig;
    v2ConfigRef.current = currentV2Config;
    
    // 标记为已初始化
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
    
  }, [v1ApiConfig, currentV2Config, v2ApiConfigs, setV2ApiConfigs, setV2SelectedIndex]);
  
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