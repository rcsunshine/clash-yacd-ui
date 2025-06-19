import { atom } from 'jotai';

import { ClashAPIConfig } from '../types/api';
import { getStoredTheme, type Theme } from '../utils/theme';

// V2独立的API配置初始化
function getInitialApiConfigs(): { configs: ClashAPIConfig[], selectedIndex: number } {
  try {
    // 从V2配置中获取
    const savedV2 = localStorage.getItem('v2-api-config');
    if (savedV2) {
      const parsedV2 = JSON.parse(savedV2);
      if (parsedV2.apiConfigs && Array.isArray(parsedV2.apiConfigs) && parsedV2.apiConfigs.length > 0) {
        return {
          configs: parsedV2.apiConfigs,
          selectedIndex: parsedV2.selectedIndex || 0
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load V2 API config from localStorage:', error);
  }

  // 默认配置
  return {
    configs: [{
      baseURL: 'http://127.0.0.1:9090',
      secret: '',
    }],
    selectedIndex: 0
  };
}

// 初始化API配置
const initialApiData = getInitialApiConfigs();

// V2独立的API配置状态
export const v2ApiConfigsAtom = atom<ClashAPIConfig[]>(initialApiData.configs);

export const v2SelectedApiConfigIndexAtom = atom<number>(initialApiData.selectedIndex);

// 当前选中的API配置（派生状态）
export const v2CurrentApiConfigAtom = atom<ClashAPIConfig>(
  (get) => {
    const configs = get(v2ApiConfigsAtom);
    const index = get(v2SelectedApiConfigIndexAtom);
    return configs[index] || configs[0] || {
      baseURL: 'http://127.0.0.1:9090',
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

// V2当前页面状态 - 支持持久化
function getInitialPage(): string {
  if (typeof window === 'undefined') return 'dashboard';
  
  try {
    const saved = localStorage.getItem('v2-current-page');
    if (saved && typeof saved === 'string') {
      // 验证页面名称有效性
      const validPages = ['dashboard', 'proxies', 'connections', 'rules', 'logs', 'config', 'api-config', 'about'];
      if (validPages.includes(saved)) {
        return saved;
      }
    }
  } catch (error) {
    console.warn('Failed to load V2 current page from localStorage:', error);
  }
  
  return 'dashboard';
}

export const v2CurrentPageAtom = atom<string>(getInitialPage()); 