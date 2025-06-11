import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import { 
  clashAPIConfigsAtom,
  selectedClashAPIConfigIndexAtom 
} from '../../store/app';
import { 
  v2ApiConfigsAtom, 
  v2SelectedApiConfigIndexAtom 
} from '../store/atoms';

// 深度比较配置对象
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

// V1和V2状态同步Hook
export function useV1V2Sync() {
  const [v1Configs, setV1Configs] = useAtom(clashAPIConfigsAtom);
  const [v1SelectedIndex, setV1SelectedIndex] = useAtom(selectedClashAPIConfigIndexAtom);
  const [v2Configs, setV2Configs] = useAtom(v2ApiConfigsAtom);
  const [v2SelectedIndex, setV2SelectedIndex] = useAtom(v2SelectedApiConfigIndexAtom);

  // 使用ref来跟踪同步状态，避免循环更新
  const syncingFromV1 = useRef(false);
  const syncingFromV2 = useRef(false);
  const lastV1ConfigsHash = useRef<string>('');
  const lastV2ConfigsHash = useRef<string>('');

  // 立即从V1同步到V2（无论是否初次运行）
  useEffect(() => {
    // 如果V1配置非空且非默认值，立即同步
    if (v1Configs.length > 0 && 
        v1Configs[v1SelectedIndex]?.baseURL && 
        v1Configs[v1SelectedIndex].baseURL !== 'http://127.0.0.1:9090' &&
        !syncingFromV2.current) {
      
      const currentV1Hash = JSON.stringify({ configs: v1Configs, index: v1SelectedIndex });
      if (currentV1Hash === lastV1ConfigsHash.current) return;
      
      console.log('🔄 V1V2Sync: Syncing from V1 to V2', { v1Configs, v1SelectedIndex });
      
      syncingFromV1.current = true;
      
      const v2FormattedConfigs = v1Configs.map(config => ({
        baseURL: config.baseURL || 'http://127.0.0.1:9090',
        secret: config.secret || '',
      }));
      
      console.log('🔄 V1V2Sync: Setting V2 configs to', v2FormattedConfigs);
      
      setV2Configs(v2FormattedConfigs);
      setV2SelectedIndex(v1SelectedIndex);
      
      // 更新hash值
      lastV1ConfigsHash.current = currentV1Hash;
      lastV2ConfigsHash.current = JSON.stringify({ configs: v2FormattedConfigs, index: v1SelectedIndex });
      
      setTimeout(() => {
        syncingFromV1.current = false;
      }, 50);
    }
  }, [v1Configs, v1SelectedIndex, setV2Configs, setV2SelectedIndex]);

  // 从V2同步到V1（仅当V2主动变更时）
  useEffect(() => {
    if (syncingFromV1.current) return;
    
    const currentV2Hash = JSON.stringify({ configs: v2Configs, index: v2SelectedIndex });
    if (currentV2Hash === lastV2ConfigsHash.current) return;
    
    // 只有当V2配置真的有变化且不是默认值时才同步回V1
    if (v2Configs.length > 0 && 
        v2Configs[v2SelectedIndex]?.baseURL &&
        v2Configs[v2SelectedIndex].baseURL !== 'http://127.0.0.1:9090') {
      
      syncingFromV2.current = true;
      
      const v1FormattedConfigs = v2Configs.map(config => ({
        baseURL: config.baseURL,
        secret: config.secret,
      }));
      
      // 检查是否真的需要更新
      if (!deepEqual(v1FormattedConfigs, v1Configs) || v2SelectedIndex !== v1SelectedIndex) {
        console.log('🔄 V1V2Sync: Syncing from V2 to V1', v1FormattedConfigs);
        setV1Configs(v1FormattedConfigs);
        setV1SelectedIndex(v2SelectedIndex);
        lastV1ConfigsHash.current = JSON.stringify({ configs: v1FormattedConfigs, index: v2SelectedIndex });
      }
      
      lastV2ConfigsHash.current = currentV2Hash;
      
      setTimeout(() => {
        syncingFromV2.current = false;
      }, 50);
    }
  }, [v2Configs, v2SelectedIndex]);
} 