import { clsx, type ClassValue } from 'clsx';

/**
 * 合并CSS类名的工具函数
 * 基于clsx，支持条件类名和去重
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
} 