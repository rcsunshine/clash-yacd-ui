import React, { useCallback, useMemo, useRef, useState } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number; // 容器高度
  itemHeight: number | ((index: number, item: T) => number); // 每项高度
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // 额外渲染的项目数量
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
  loading = false,
  emptyComponent
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    if (items.length === 0) return { start: 0, end: 0 };

    let start = 0;
    let end = 0;
    let currentTop = 0;

    // 如果是固定高度
    if (typeof itemHeight === 'number') {
      start = Math.floor(scrollTop / itemHeight);
      end = Math.min(
        items.length - 1,
        start + Math.ceil(height / itemHeight)
      );
    } else {
      // 动态高度计算
      for (let i = 0; i < items.length; i++) {
        const height = itemHeight(i, items[i]);
        if (currentTop + height > scrollTop && start === 0) {
          start = Math.max(0, i - overscan);
        }
        if (currentTop > scrollTop + height) {
          end = Math.min(items.length - 1, i + overscan);
          break;
        }
        currentTop += height;
      }
      if (end === 0) end = items.length - 1;
    }

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [items, scrollTop, height, itemHeight, overscan]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    
    return items.reduce((total, item, index) => {
      return total + itemHeight(index, item);
    }, 0);
  }, [items, itemHeight]);

  // 计算偏移量
  const offsetY = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return visibleRange.start * itemHeight;
    }
    
    let offset = 0;
    for (let i = 0; i < visibleRange.start; i++) {
      offset += itemHeight(i, items[i]);
    }
    return offset;
  }, [visibleRange.start, itemHeight, items]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i < items.length) {
        result.push({
          index: i,
          item: items[i]
        });
      }
    }
    return result;
  }, [items, visibleRange]);

  // 空状态处理
  if (!loading && items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        {emptyComponent || (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">暂无数据</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={`relative overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* 总高度占位 */}
      <div style={{ height: totalHeight }}>
        {/* 可见内容容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'relative'
          }}
        >
          {loading ? (
            // 加载状态
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
            </div>
          ) : (
            // 渲染可见项目
            visibleItems.map(({ index, item }) => (
              <div key={index} style={{ 
                height: typeof itemHeight === 'number' ? itemHeight : itemHeight(index, item) 
              }}>
                {renderItem(item, index)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 简化版本 - 固定高度项目
export function FixedVirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  ...props
}: Omit<VirtualListProps<T>, 'itemHeight'> & { itemHeight: number }) {
  return (
    <VirtualList
      items={items}
      height={height}
      itemHeight={itemHeight}
      renderItem={renderItem}
      className={className}
      {...props}
    />
  );
} 