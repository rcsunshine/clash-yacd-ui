import { useEffect, useRef } from 'react';

type KeyboardEventHandler = (event: KeyboardEvent) => void;
type KeyboardShortcutOptions = {
  /**
   * 是否在输入框中也触发快捷键
   * @default false
   */
  enabledInInputs?: boolean;
  /**
   * 是否阻止默认行为
   * @default true
   */
  preventDefault?: boolean;
  /**
   * 是否阻止事件冒泡
   * @default false
   */
  stopPropagation?: boolean;
};

/**
 * 键盘快捷键钩子
 * @param key 要监听的键，例如 'f', 'r', '/'
 * @param callback 回调函数
 * @param options 选项
 */
export function useKeyboardShortcut(
  key: string,
  callback: KeyboardEventHandler,
  options: KeyboardShortcutOptions = {}
) {
  const {
    enabledInInputs = false,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  // 使用 ref 存储回调函数，避免依赖项变化
  const savedCallback = useRef<KeyboardEventHandler>(callback);

  // 更新 ref 中存储的回调函数
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果当前焦点在输入框中且不允许在输入框中触发，则不处理
      if (
        !enabledInInputs &&
        (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // 检查是否是目标按键
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        savedCallback.current(event);
      }
    };

    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, enabledInInputs, preventDefault, stopPropagation]);
}

/**
 * 组合键盘快捷键钩子
 * @param keys 要监听的键的数组，例如 ['f', 'r', '/']
 * @param callback 回调函数
 * @param options 选项
 */
export function useKeyboardShortcuts(
  keys: string[],
  callback: (key: string, event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
) {
  const {
    enabledInInputs = false,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  // 使用 ref 存储回调函数，避免依赖项变化
  const savedCallback = useRef<(key: string, event: KeyboardEvent) => void>(callback);

  // 更新 ref 中存储的回调函数
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果当前焦点在输入框中且不允许在输入框中触发，则不处理
      if (
        !enabledInInputs &&
        (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // 检查是否是目标按键之一
      const pressedKey = event.key.toLowerCase();
      if (
        keys.some(k => k.toLowerCase() === pressedKey) &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        savedCallback.current(pressedKey, event);
      }
    };

    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keys, enabledInInputs, preventDefault, stopPropagation]);
}

export default useKeyboardShortcut; 