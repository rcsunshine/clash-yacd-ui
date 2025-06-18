import { useEffect, useCallback, useRef } from 'react';

export type KeyboardKey = 
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' 
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12'
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  | 'Escape' | 'Tab' | 'Enter' | 'Space' | 'Backspace' | 'Delete'
  | 'Home' | 'End' | 'PageUp' | 'PageDown'
  | '/' | '.' | ',' | ';' | "'" | '[' | ']' | '\\' | '-' | '=' | '`';

export interface KeyboardShortcut {
  /**
   * 快捷键
   */
  key: KeyboardKey | KeyboardKey[];
  
  /**
   * 是否需要按住 Ctrl 键
   * @default false
   */
  ctrl?: boolean;
  
  /**
   * 是否需要按住 Alt 键
   * @default false
   */
  alt?: boolean;
  
  /**
   * 是否需要按住 Shift 键
   * @default false
   */
  shift?: boolean;
  
  /**
   * 是否需要按住 Meta 键 (Windows 键或 Command 键)
   * @default false
   */
  meta?: boolean;
  
  /**
   * 回调函数
   */
  callback: (event: KeyboardEvent) => void;
  
  /**
   * 是否阻止默认行为
   * @default true
   */
  preventDefault?: boolean;
  
  /**
   * 是否阻止事件冒泡
   * @default true
   */
  stopPropagation?: boolean;
  
  /**
   * 是否在输入框中也触发快捷键
   * @default false
   */
  enableInInput?: boolean;
  
  /**
   * 是否启用快捷键
   * @default true
   */
  enabled?: boolean;
  
  /**
   * 快捷键描述
   */
  description?: string;
}

export interface UseKeyboardShortcutOptions {
  /**
   * 是否全局监听
   * @default true
   */
  global?: boolean;
  
  /**
   * 目标元素
   * 当 global 为 false 时，只在该元素上监听快捷键
   */
  target?: React.RefObject<HTMLElement>;
}

/**
 * 键盘快捷键钩子
 * @param shortcuts 快捷键配置
 * @param options 选项
 */
export function useKeyboardShortcut(
  shortcuts: KeyboardShortcut | KeyboardShortcut[],
  options: UseKeyboardShortcutOptions = {}
) {
  const { global = true, target } = options;
  
  // 转换为数组
  const shortcutsArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts];
  
  // 使用 ref 存储快捷键配置，避免重复创建回调函数
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcutsArray);
  
  // 更新 ref
  useEffect(() => {
    shortcutsRef.current = Array.isArray(shortcuts) ? shortcuts : [shortcuts];
  }, [shortcuts]);
  
  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 如果当前焦点在输入框中，且快捷键不允许在输入框中触发，则不处理
    if (
      !event.target ||
      ((event.target as HTMLElement).tagName === 'INPUT' ||
       (event.target as HTMLElement).tagName === 'TEXTAREA' ||
       (event.target as HTMLElement).isContentEditable)
    ) {
      // 检查是否有允许在输入框中触发的快捷键
      const inputEnabledShortcuts = shortcutsRef.current.filter(s => s.enableInInput);
      if (inputEnabledShortcuts.length === 0) {
        return;
      }
      
      // 只处理允许在输入框中触发的快捷键
      for (const shortcut of inputEnabledShortcuts) {
        if (!shortcut.enabled && shortcut.enabled !== undefined) continue;
        
        const keyMatch = Array.isArray(shortcut.key)
          ? shortcut.key.some(k => k.toLowerCase() === event.key.toLowerCase())
          : shortcut.key.toLowerCase() === event.key.toLowerCase();
        
        if (
          keyMatch &&
          (shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl) &&
          (shortcut.alt === undefined || event.altKey === shortcut.alt) &&
          (shortcut.shift === undefined || event.shiftKey === shortcut.shift) &&
          (shortcut.meta === undefined || event.metaKey === shortcut.meta)
        ) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          
          if (shortcut.stopPropagation !== false) {
            event.stopPropagation();
          }
          
          shortcut.callback(event);
          return;
        }
      }
      
      return;
    }
    
    // 处理所有快捷键
    for (const shortcut of shortcutsRef.current) {
      if (!shortcut.enabled && shortcut.enabled !== undefined) continue;
      
      const keyMatch = Array.isArray(shortcut.key)
        ? shortcut.key.some(k => k.toLowerCase() === event.key.toLowerCase())
        : shortcut.key.toLowerCase() === event.key.toLowerCase();
      
      if (
        keyMatch &&
        (shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl) &&
        (shortcut.alt === undefined || event.altKey === shortcut.alt) &&
        (shortcut.shift === undefined || event.shiftKey === shortcut.shift) &&
        (shortcut.meta === undefined || event.metaKey === shortcut.meta)
      ) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        if (shortcut.stopPropagation !== false) {
          event.stopPropagation();
        }
        
        shortcut.callback(event);
        return;
      }
    }
  }, []);
  
  useEffect(() => {
    // 如果是全局监听，则在 document 上监听
    if (global) {
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    
    // 如果不是全局监听，则在目标元素上监听
    if (target?.current) {
      const element = target.current;
      element.addEventListener('keydown', handleKeyDown);
      
      return () => {
        element.removeEventListener('keydown', handleKeyDown);
      };
    }
    
    return undefined;
  }, [global, target, handleKeyDown]);
  
  // 返回所有快捷键的描述
  return {
    shortcuts: shortcutsRef.current.map(shortcut => ({
      key: shortcut.key,
      ctrl: shortcut.ctrl,
      alt: shortcut.alt,
      shift: shortcut.shift,
      meta: shortcut.meta,
      description: shortcut.description,
      enabled: shortcut.enabled !== false,
    })),
  };
}

export default useKeyboardShortcut; 