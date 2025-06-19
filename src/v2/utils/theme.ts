// Tailwind CSS 官方推荐的主题切换逻辑
// 参考: https://tailwind.nodejs.cn/docs/dark-mode#toggling-dark-mode-manually

export type Theme = 'light' | 'dark' | 'auto';

/**
 * 应用主题到DOM
 * 按照官方推荐，使用 class 方式控制主题
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // auto - 根据系统偏好设置
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemPrefersDark);
  }
}

/**
 * 从localStorage获取保存的主题
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('v2-theme') as Theme | null;
}

/**
 * 保存主题到localStorage
 */
export function storeTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('v2-theme', theme);
}

/**
 * 清除localStorage中的主题设置
 */
export function clearStoredTheme() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('v2-theme');
}

/**
 * 初始化主题
 * 按照官方推荐的逻辑：检查localStorage -> 系统偏好 -> 默认浅色
 */
export function initializeTheme(): Theme {
  const storedTheme = getStoredTheme();
  
  if (storedTheme) {
    applyTheme(storedTheme);
    return storedTheme;
  }
  
  // 没有存储的主题，使用auto模式
  const theme: Theme = 'auto';
  applyTheme(theme);
  return theme;
}

/**
 * 切换到指定主题
 */
export function setTheme(theme: Theme) {
  if (theme === 'auto') {
    clearStoredTheme();
  } else {
    storeTheme(theme);
  }
  applyTheme(theme);
}

/**
 * 监听系统主题变化
 */
export function watchSystemTheme(callback: (isDark: boolean) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  // 返回清理函数
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

/**
 * 获取当前实际应用的主题（考虑auto模式）
 */
export function getCurrentAppliedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * 官方推荐的初始化脚本
 * 建议内联到HTML head中避免FOUC
 */
export const themeInitScript = `
(function() {
  function applyTheme() {
    document.documentElement.classList.toggle(
      'dark',
      localStorage['v2-theme'] === 'dark' ||
      (!('v2-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }
  applyTheme();
  
  // 监听存储变化（多标签页同步）
  window.addEventListener('storage', function(e) {
    if (e.key === 'v2-theme') {
      applyTheme();
    }
  });
})();
`; 