import { atom } from 'jotai';
import { ClashAPIConfig } from '../types/api';

// V2独立的API配置状态
export const v2ApiConfigsAtom = atom<ClashAPIConfig[]>([
  {
    baseURL: 'http://127.0.0.1:9090',
    secret: '',
  }
]);

export const v2SelectedApiConfigIndexAtom = atom<number>(0);

// 当前选中的API配置（派生状态）
export const v2CurrentApiConfigAtom = atom<ClashAPIConfig>(
  (get) => {
    const configs = get(v2ApiConfigsAtom);
    const index = get(v2SelectedApiConfigIndexAtom);
    return configs[index] || configs[0] || {
      baseURL: 'http://127.0.0.1:9090',
      secret: '',
    };
  }
);

// V2主题状态
export const v2ThemeAtom = atom<'light' | 'dark' | 'auto'>('auto');

// V2侧边栏状态
export const v2SidebarCollapsedAtom = atom<boolean>(false);

// V2页面状态
export const v2CurrentPageAtom = atom<string>('dashboard'); 