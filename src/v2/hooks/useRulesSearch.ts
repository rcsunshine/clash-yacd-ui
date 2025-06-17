import { useMemo, useState } from 'react';
import { Rule, RuleType } from '../types/api';

interface UseRulesSearchOptions {
  /**
   * 是否启用高级搜索语法
   * @example "type:DOMAIN payload:google"
   * @default true
   */
  enableAdvancedSyntax?: boolean;
  
  /**
   * 默认搜索字段
   * @default ['payload', 'proxy']
   */
  defaultSearchFields?: Array<keyof Rule>;
  
  /**
   * 是否忽略大小写
   * @default true
   */
  caseInsensitive?: boolean;
}

interface UseRulesSearchResult {
  /**
   * 过滤后的规则列表
   */
  filteredRules: Rule[];
  
  /**
   * 搜索查询
   */
  searchQuery: string;
  
  /**
   * 设置搜索查询
   */
  setSearchQuery: (query: string) => void;
  
  /**
   * 类型过滤器
   */
  typeFilter: RuleType | 'all';
  
  /**
   * 设置类型过滤器
   */
  setTypeFilter: (type: RuleType | 'all') => void;
  
  /**
   * 重置所有过滤器
   */
  resetFilters: () => void;
  
  /**
   * 搜索提示
   */
  searchHints: string[];
}

/**
 * 解析高级搜索语法
 * @example "type:DOMAIN payload:google proxy:DIRECT"
 */
function parseAdvancedQuery(query: string): { 
  field: string; 
  value: string;
  isExact: boolean;
}[] {
  const result: { field: string; value: string; isExact: boolean }[] = [];
  
  // 匹配 field:value 或 field:"value with spaces"
  const regex = /(\w+):(?:"([^"]+)"|([^\s]+))/g;
  let match;
  let remainingQuery = query;
  
  while ((match = regex.exec(query)) !== null) {
    const field = match[1];
    const value = match[2] || match[3]; // 带引号或不带引号的值
    const isExact = !!match[2]; // 如果有引号，则为精确匹配
    
    result.push({ field, value, isExact });
    
    // 从剩余查询中移除已匹配部分
    remainingQuery = remainingQuery.replace(match[0], '');
  }
  
  // 处理剩余的普通查询文本
  const trimmedRemaining = remainingQuery.trim();
  if (trimmedRemaining) {
    result.push({ field: '_general', value: trimmedRemaining, isExact: false });
  }
  
  return result;
}

/**
 * 规则搜索钩子
 * @param rules 规则列表
 * @param options 选项
 */
export function useRulesSearch(
  rules: Rule[],
  options: UseRulesSearchOptions = {}
): UseRulesSearchResult {
  const {
    enableAdvancedSyntax = true,
    defaultSearchFields = ['payload', 'proxy'],
    caseInsensitive = true,
  } = options;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<RuleType | 'all'>('all');
  
  // 生成搜索提示
  const searchHints = useMemo(() => {
    if (!rules.length) return [];
    
    const types = [...new Set(rules.map(rule => rule.type))];
    const proxies = [...new Set(rules.map(rule => rule.proxy))];
    
    return [
      '搜索语法: type:DOMAIN payload:"google.com"',
      `可用类型: ${types.slice(0, 3).join(', ')}${types.length > 3 ? '...' : ''}`,
      `可用代理: ${proxies.slice(0, 3).join(', ')}${proxies.length > 3 ? '...' : ''}`,
    ];
  }, [rules]);
  
  // 过滤规则
  const filteredRules = useMemo(() => {
    if (!rules.length) return [];
    if (!searchQuery && typeFilter === 'all') return rules;
    
    return rules.filter(rule => {
      // 类型过滤
      if (typeFilter !== 'all' && rule.type !== typeFilter) {
        return false;
      }
      
      // 如果没有搜索查询，只应用类型过滤
      if (!searchQuery) {
        return true;
      }
      
      // 高级搜索语法
      if (enableAdvancedSyntax && /\w+:/.test(searchQuery)) {
        const parsedQuery = parseAdvancedQuery(searchQuery);
        
        return parsedQuery.every(({ field, value, isExact }) => {
          // 通用搜索
          if (field === '_general') {
            return defaultSearchFields.some(searchField => {
              const fieldValue = String(rule[searchField] || '');
              return caseInsensitive
                ? fieldValue.toLowerCase().includes(value.toLowerCase())
                : fieldValue.includes(value);
            });
          }
          
          // 特定字段搜索
          if (field in rule) {
            const fieldValue = String(rule[field as keyof Rule] || '');
            
            if (isExact) {
              return caseInsensitive
                ? fieldValue.toLowerCase() === value.toLowerCase()
                : fieldValue === value;
            }
            
            return caseInsensitive
              ? fieldValue.toLowerCase().includes(value.toLowerCase())
              : fieldValue.includes(value);
          }
          
          return false;
        });
      }
      
      // 简单搜索
      const normalizedQuery = caseInsensitive ? searchQuery.toLowerCase() : searchQuery;
      
      return defaultSearchFields.some(field => {
        const fieldValue = String(rule[field] || '');
        return caseInsensitive
          ? fieldValue.toLowerCase().includes(normalizedQuery)
          : fieldValue.includes(normalizedQuery);
      });
    });
  }, [rules, searchQuery, typeFilter, enableAdvancedSyntax, defaultSearchFields, caseInsensitive]);
  
  // 重置所有过滤器
  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
  };
  
  return {
    filteredRules,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    resetFilters,
    searchHints,
  };
}

export default useRulesSearch; 