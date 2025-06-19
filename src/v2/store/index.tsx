import { useAtom } from 'jotai';
import React, { createContext, useContext, useEffect,useReducer } from 'react';

// 导入现有的 V1 状态管理
import { 
  clashAPIConfigsAtom,
  selectedClashAPIConfigIndexAtom, 
  themeAtom, 
  useApiConfig} from '../../store/app';

// V2 特有的状态类型
interface V2State {
  currentPage: string;
  sidebarCollapsed: boolean;
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number;
    showNotifications: boolean;
    compactMode: boolean;
  };
  apiConfig: {
    baseURL: string;
    secret: string;
  };
  theme: 'light' | 'dark' | 'auto';
}

// V2 特有的动作类型
type V2Action =
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<V2State['preferences']> }
  | { type: 'SET_API_CONFIG'; payload: Partial<V2State['apiConfig']> }
  | { type: 'SET_THEME'; payload: V2State['theme'] };

// 默认状态
const defaultState: V2State = {
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  preferences: {
    autoRefresh: true,
    refreshInterval: 3000,
    showNotifications: true,
    compactMode: false,
  },
  apiConfig: {
    baseURL: 'http://127.0.0.1:9090',
    secret: '4e431a56ead99c',
  },
  theme: 'auto',
};

// Reducer
function v2Reducer(state: V2State, action: V2Action): V2State {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };
    case 'UPDATE_PREFERENCES':
      return { 
        ...state, 
        preferences: { ...state.preferences, ...action.payload } 
      };
    case 'SET_API_CONFIG':
      return { 
        ...state, 
        apiConfig: { ...state.apiConfig, ...action.payload } 
      };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<{
  state: V2State;
  dispatch: React.Dispatch<V2Action>;
  // 集成 V1 的状态和方法
  v1ApiConfig: ReturnType<typeof useApiConfig>;
} | null>(null);

// Provider 组件
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(v2Reducer, defaultState);
  
  // 集成 V1 的状态管理
  const [v1Theme] = useAtom(themeAtom);
  const [v1ApiConfigs] = useAtom(clashAPIConfigsAtom);
  const [v1SelectedIndex] = useAtom(selectedClashAPIConfigIndexAtom);
  const v1ApiConfig = v1ApiConfigs[v1SelectedIndex];

  // 同步 V1 和 V2 的主题状态
  useEffect(() => {
    if (v1Theme !== state.theme) {
      dispatch({ type: 'SET_THEME', payload: v1Theme });
    }
  }, [v1Theme, state.theme]);

  // 同步 V1 和 V2 的 API 配置
  useEffect(() => {
    if (v1ApiConfig) {
      dispatch({ 
        type: 'SET_API_CONFIG', 
        payload: {
          baseURL: v1ApiConfig.baseURL,
          secret: v1ApiConfig.secret || '',
        }
      });
    }
  }, [v1ApiConfig]);

  // 持久化 V2 特有的偏好设置
  useEffect(() => {
    const savedPreferences = localStorage.getItem('v2-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.warn('Failed to parse saved V2 preferences:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('v2-preferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  const value = {
    state,
    dispatch,
    v1ApiConfig,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

// Action creators
export const actions = {
  setCurrentPage: (page: string): V2Action => ({ type: 'SET_CURRENT_PAGE', payload: page }),
  toggleSidebar: (): V2Action => ({ type: 'TOGGLE_SIDEBAR' }),
  setSidebarCollapsed: (collapsed: boolean): V2Action => ({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed }),
  updatePreferences: (preferences: Partial<V2State['preferences']>): V2Action => ({ type: 'UPDATE_PREFERENCES', payload: preferences }),
  setApiConfig: (config: Partial<V2State['apiConfig']>): V2Action => ({ type: 'SET_API_CONFIG', payload: config }),
  setTheme: (theme: V2State['theme']): V2Action => ({ type: 'SET_THEME', payload: theme }),
};