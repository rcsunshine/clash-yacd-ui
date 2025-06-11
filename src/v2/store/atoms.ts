import { atom } from 'jotai';

import { ClashAPIConfig } from '../types/api';
import { getStoredTheme, type Theme } from '../utils/theme';

// V2独立的API配置状态
export const v2ApiConfigsAtom = atom<ClashAPIConfig[]>([
  {
    baseURL: 'http://10.8.87.121:9090',
    secret: '4e431a56ead99c',
  }
]);

export const v2SelectedApiConfigIndexAtom = atom<number>(0);

// 当前选中的API配置（派生状态）
export const v2CurrentApiConfigAtom = atom<ClashAPIConfig>(
  (get) => {
    const configs = get(v2ApiConfigsAtom);
    const index = get(v2SelectedApiConfigIndexAtom);
    return configs[index] || configs[0] || {
      baseURL: 'http://10.8.87.121:9090',
      secret: '4e431a56ead99c',
    };
  }
);

// V2主题状态 - 使用官方推荐的初始化逻辑
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'auto';
  
  // 按照官方推荐的优先级：localStorage -> 默认auto
  const storedTheme = getStoredTheme();
  return storedTheme || 'auto';
};

export const v2ThemeAtom = atom<Theme>(getInitialTheme());

// V2侧边栏状态
export const v2SidebarCollapsedAtom = atom<boolean>(false);

// V2页面状态
export const v2CurrentPageAtom = atom<string>('dashboard'); 