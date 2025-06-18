import { useMemo, useState } from 'react';

export interface Connection {
  id: string;
  metadata: {
    network: string;
    type: string;
    sourceIP: string;
    sourcePort: string;
    destinationIP: string;
    destinationPort: string;
    host?: string;
    processPath?: string;
  };
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload: string;
  closed?: boolean;
}

export type NetworkType = 'tcp' | 'udp' | 'all';

export type ConnectionSortKey = 'time' | 'host' | 'upload' | 'download' | 'total';

export type ConnectionSortOrder = 'asc' | 'desc';

export type ConnectionStatus = 'active' | 'closed' | 'all';

interface UseConnectionsSearchOptions {
  /**
   * 是否启用高级搜索语法
   * @example "host:google.com network:tcp"
   * @default true
   */
  enableAdvancedSyntax?: boolean;
  
  /**
   * 默认搜索字段
   * @default ['host', 'destinationIP', 'chains']
   */
  defaultSearchFields?: Array<string>;
  
  /**
   * 是否忽略大小写
   * @default true
   */
  caseInsensitive?: boolean;
}

interface UseConnectionsSearchResult {
  /**
   * 过滤后的连接列表
   */
  filteredConnections: Connection[];
  
  /**
   * 搜索查询
   */
  searchQuery: string;
  
  /**
   * 设置搜索查询
   */
  setSearchQuery: (query: string) => void;
  
  /**
   * 网络类型过滤器
   */
  networkFilter: NetworkType;
  
  /**
   * 设置网络类型过滤器
   */
  setNetworkFilter: (type: NetworkType) => void;
  
  /**
   * 连接状态过滤器
   */
  statusFilter: ConnectionStatus;
  
  /**
   * 设置连接状态过滤器
   */
  setStatusFilter: (status: ConnectionStatus) => void;
  
  /**
   * 排序键
   */
  sortKey: ConnectionSortKey;
  
  /**
   * 设置排序键
   */
  setSortKey: (key: ConnectionSortKey) => void;
  
  /**
   * 排序顺序
   */
  sortOrder: ConnectionSortOrder;
  
  /**
   * 设置排序顺序
   */
  setSortOrder: (order: ConnectionSortOrder) => void;
  
  /**
   * 重置所有过滤器
   */
  resetFilters: () => void;
  
  /**
   * 搜索提示
   */
  searchHints: string[];
  
  /**
   * 选中的连接
   */
  selectedConnections: Set<string>;
  
  /**
   * 设置选中的连接
   */
  setSelectedConnections: (connections: Set<string>) => void;
  
  /**
   * 切换连接选中状态
   */
  toggleConnectionSelection: (connectionId: string) => void;
  
  /**
   * 切换全选/取消全选
   */
  toggleAllConnections: () => void;
  
  /**
   * 是否有选中的连接
   */
  hasSelectedConnections: boolean;
  
  /**
   * 关闭的连接数量
   */
  closedConnectionsCount: number;
  
  /**
   * 活跃的连接数量
   */
  activeConnectionsCount: number;
}

/**
 * 解析高级搜索语法
 * @example "host:google.com network:tcp"
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
 * 连接搜索钩子
 * @param connections 连接列表
 * @param options 选项
 */
export function useConnectionsSearch(
  connections: Connection[],
  options: UseConnectionsSearchOptions = {}
): UseConnectionsSearchResult {
  const {
    enableAdvancedSyntax = true,
    defaultSearchFields: _defaultSearchFields = ['host', 'destinationIP', 'chains'],
    caseInsensitive = true,
  } = options;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<NetworkType>('all');
  const [statusFilter, setStatusFilter] = useState<ConnectionStatus>('all');
  const [sortKey, setSortKey] = useState<ConnectionSortKey>('time');
  const [sortOrder, setSortOrder] = useState<ConnectionSortOrder>('desc');
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  
  // 生成搜索提示
  const searchHints = useMemo(() => {
    if (!connections.length) return [];
    
    const networks = [...new Set(connections.map(conn => conn.metadata.network))];
    const rules = [...new Set(connections.map(conn => conn.rule))];
    
    return [
      '搜索语法: host:google.com network:tcp',
      `可用网络类型: ${networks.join(', ')}`,
      `可用规则: ${rules.slice(0, 3).join(', ')}${rules.length > 3 ? '...' : ''}`,
    ];
  }, [connections]);
  
  // 过滤连接
  const filteredConnections = useMemo(() => {
    if (!connections.length) return [];
    
    // 第一步：应用过滤器
    const filtered = connections.filter(conn => {
      // 网络类型过滤
      if (networkFilter !== 'all' && conn.metadata.network !== networkFilter) {
        return false;
      }
      
      // 连接状态过滤 - 与V1版本保持一致的判断逻辑
      if (statusFilter !== 'all') {
        // V1版本中，closed属性不是布尔值，而是通过连接不在当前活跃连接列表中来判断
        // 在V2版本中，我们使用closed属性来标记连接是否已关闭
        const isClosed = conn.closed === true;
        if (statusFilter === 'active' && isClosed) return false;
        if (statusFilter === 'closed' && !isClosed) return false;
      }
      
      // 如果没有搜索查询，只应用网络类型和状态过滤
      if (!searchQuery) {
        return true;
      }
      
      // 高级搜索语法
      if (enableAdvancedSyntax && /\w+:/.test(searchQuery)) {
        const parsedQuery = parseAdvancedQuery(searchQuery);
        
        return parsedQuery.every(({ field, value, isExact }) => {
          // 通用搜索
          if (field === '_general') {
            // 检查主机名
            if (conn.metadata.host) {
              const hostMatch = caseInsensitive
                ? conn.metadata.host.toLowerCase().includes(value.toLowerCase())
                : conn.metadata.host.includes(value);
              if (hostMatch) return true;
            }
            
            // 检查目标IP
            const ipMatch = conn.metadata.destinationIP.includes(value);
            if (ipMatch) return true;
            
            // 检查代理链
            const chainMatch = conn.chains.some(chain => 
              caseInsensitive
                ? chain.toLowerCase().includes(value.toLowerCase())
                : chain.includes(value)
            );
            if (chainMatch) return true;
            
            return false;
          }
          
          // 特定字段搜索
          switch (field) {
            case 'host':
              if (!conn.metadata.host) return false;
              return isExact
                ? (caseInsensitive 
                    ? conn.metadata.host.toLowerCase() === value.toLowerCase()
                    : conn.metadata.host === value)
                : (caseInsensitive
                    ? conn.metadata.host.toLowerCase().includes(value.toLowerCase())
                    : conn.metadata.host.includes(value));
            
            case 'ip':
            case 'destinationIP':
              return conn.metadata.destinationIP.includes(value);
            
            case 'network':
              return caseInsensitive
                ? conn.metadata.network.toLowerCase() === value.toLowerCase()
                : conn.metadata.network === value;
            
            case 'rule':
              return caseInsensitive
                ? conn.rule.toLowerCase().includes(value.toLowerCase())
                : conn.rule.includes(value);
            
            case 'chain':
            case 'proxy':
              return conn.chains.some(chain => 
                caseInsensitive
                  ? chain.toLowerCase().includes(value.toLowerCase())
                  : chain.includes(value)
              );
            
            default:
              return false;
          }
        });
      }
      
      // 简单搜索
      // 检查主机名
      if (conn.metadata.host) {
        const hostMatch = caseInsensitive
          ? conn.metadata.host.toLowerCase().includes(searchQuery.toLowerCase())
          : conn.metadata.host.includes(searchQuery);
        if (hostMatch) return true;
      }
      
      // 检查目标IP
      const ipMatch = conn.metadata.destinationIP.includes(searchQuery);
      if (ipMatch) return true;
      
      // 检查代理链
      const chainMatch = conn.chains.some(chain => 
        caseInsensitive
          ? chain.toLowerCase().includes(searchQuery.toLowerCase())
          : chain.includes(searchQuery)
      );
      
      return chainMatch;
    });
    
    // 第二步：应用排序
    const sorted = filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortKey) {
        case 'time':
          // 时间排序：
          // - 对于显示来说，时长越长的连接start时间越早（时间戳越小）
          // - 升序(asc)：短时长在前（新连接，大时间戳）
          // - 降序(desc)：长时长在前（旧连接，小时间戳）
          const timeA = new Date(a.start).getTime();
          const timeB = new Date(b.start).getTime();
          comparison = timeA - timeB; // 小时间戳(早，长时长) - 大时间戳(晚，短时长)
          break;
        case 'host':
          const hostA = a.metadata.host || a.metadata.destinationIP;
          const hostB = b.metadata.host || b.metadata.destinationIP;
          comparison = hostA.localeCompare(hostB);
          break;
        case 'upload':
          comparison = b.upload - a.upload;
          break;
        case 'download':
          comparison = b.download - a.download;
          break;
        case 'total':
          comparison = (b.upload + b.download) - (a.upload + a.download);
          break;
      }
      
      // 升序(asc)：
      // - 时间：短时长在前（新连接）
      // - 主机名：字母顺序A-Z
      // - 流量：小值在前
      //
      // 降序(desc)：
      // - 时间：长时长在前（旧连接）
      // - 主机名：字母顺序Z-A
      // - 流量：大值在前
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [connections, searchQuery, networkFilter, statusFilter, sortKey, sortOrder, enableAdvancedSyntax, caseInsensitive]);
  
  // 添加连接状态计数
  const closedConnectionsCount = useMemo(() => {
    return connections.filter(conn => conn.closed === true).length;
  }, [connections]);
  
  const activeConnectionsCount = useMemo(() => {
    return connections.length - closedConnectionsCount;
  }, [connections, closedConnectionsCount]);
  
  // 重置所有过滤器
  const resetFilters = () => {
    setSearchQuery('');
    setNetworkFilter('all');
    setStatusFilter('all');
    setSortKey('time');
    setSortOrder('desc');
  };
  
  // 切换连接选中状态
  const toggleConnectionSelection = (connectionId: string) => {
    const newSelected = new Set(selectedConnections);
    if (newSelected.has(connectionId)) {
      newSelected.delete(connectionId);
    } else {
      newSelected.add(connectionId);
    }
    setSelectedConnections(newSelected);
  };
  
  // 切换全选/取消全选
  const toggleAllConnections = () => {
    if (selectedConnections.size === filteredConnections.length) {
      setSelectedConnections(new Set());
    } else {
      setSelectedConnections(new Set(filteredConnections.map(conn => conn.id)));
    }
  };
  
  return {
    filteredConnections,
    searchQuery,
    setSearchQuery,
    networkFilter,
    setNetworkFilter,
    statusFilter,
    setStatusFilter,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    resetFilters,
    searchHints,
    selectedConnections,
    setSelectedConnections,
    toggleConnectionSelection,
    toggleAllConnections,
    hasSelectedConnections: selectedConnections.size > 0,
    closedConnectionsCount,
    activeConnectionsCount
  };
}

export default useConnectionsSearch; 