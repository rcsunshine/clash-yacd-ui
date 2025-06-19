import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../../utils/cn';

interface VirtualListProps<T> {
  /**
   * 列表项数据
   */
  items: T[];
  
  /**
   * 列表高度
   */
  height: number;
  
  /**
   * 列表项高度
   */
  itemHeight: number;
  
  /**
   * 渲染列表项的函数
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  
  /**
   * 额外的类名
   */
  className?: string;
  
  /**
   * 列表容器类名
   */
  containerClassName?: string;
  
  /**
   * 缓冲区大小（额外渲染的项数）
   * @default 5
   */
  overscan?: number;
  
  /**
   * 是否显示滚动条
   * @default true
   */
  showScrollbar?: boolean;
  
  /**
   * 是否启用平滑滚动
   * @default true
   */
  smoothScroll?: boolean;
  
  /**
   * 滚动到指定索引的项
   */
  scrollToIndex?: number;
  
  /**
   * 滚动行为
   * @default 'auto'
   */
  scrollBehavior?: ScrollBehavior;
  
  /**
   * 滚动位置
   * @default 'start'
   */
  scrollPosition?: 'start' | 'center' | 'end';
  
  /**
   * 滚动事件回调
   */
  onScroll?: (scrollTop: number) => void;
  
  /**
   * 是否禁用虚拟化（用于小列表）
   * @default false
   */
  disableVirtualization?: boolean;
  
  /**
   * 列表为空时显示的内容
   */
  emptyComponent?: React.ReactNode;
}

/**
 * 固定高度的虚拟列表组件
 */
export function FixedVirtualList<T>(props: VirtualListProps<T>) {
  const {
    items,
    height,
    itemHeight,
    renderItem,
    className,
    containerClassName,
    overscan = 5,
    showScrollbar = true,
    smoothScroll = true,
    scrollToIndex,
    scrollBehavior = 'auto',
    scrollPosition: _scrollPositionProp = 'start',
    onScroll,
    disableVirtualization = false,
    emptyComponent,
  } = props;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [_scrollPosition, setScrollTop] = useState(0);
  const totalHeight = items.length * itemHeight;
  
  // 计算可见项的范围
  const startIndex = disableVirtualization 
    ? 0 
    : Math.max(0, Math.floor(_scrollPosition / itemHeight) - overscan);
    
  const visibleCount = disableVirtualization 
    ? items.length 
    : Math.min(
        items.length - startIndex,
        Math.ceil(height / itemHeight) + 2 * overscan
      );
      
  const endIndex = disableVirtualization 
    ? items.length 
    : Math.min(startIndex + visibleCount, items.length);
  
  const offsetY = disableVirtualization ? 0 : startIndex * itemHeight;
  
  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);
  
  // 滚动到指定索引
  useEffect(() => {
    if (scrollToIndex === undefined || !containerRef.current) return;
    
    const targetPosition = itemHeight * scrollToIndex;
    let scrollPosition = targetPosition;
    
    if (_scrollPositionProp === 'center') {
      scrollPosition = targetPosition - (height / 2) + (itemHeight / 2);
    } else if (_scrollPositionProp === 'end') {
      scrollPosition = targetPosition - height + itemHeight;
    }
    
    containerRef.current.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: scrollBehavior,
    });
  }, [scrollToIndex, height, itemHeight, scrollBehavior, _scrollPositionProp]);
  
  // 如果列表为空，显示空状态
  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-y-auto',
        !showScrollbar && 'scrollbar-hide',
        smoothScroll && 'scroll-smooth',
        containerClassName
      )}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        className={cn('relative', className)}
        style={{ height: totalHeight + 150 }} // 添加更多底部空间
      >
        <div
          className="absolute left-0 right-0"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {items.slice(startIndex, endIndex).map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 可变高度的虚拟列表组件
 * 注意：此组件需要预先知道每个项的高度或提供估计高度
 */
export function VariableVirtualList<T>(props: VirtualListProps<T> & {
  /**
   * 获取项高度的函数
   */
  getItemHeight: (item: T, index: number) => number;
  
  /**
   * 估计的项高度（用于初始渲染）
   * @default 50
   */
  estimatedItemHeight?: number;
}) {
  const {
    items,
    height,
    getItemHeight,
    estimatedItemHeight = 50,
    renderItem,
    className,
    containerClassName,
    overscan = 5,
    showScrollbar = true,
    smoothScroll = true,
    scrollToIndex,
    scrollBehavior = 'auto',
    onScroll,
    disableVirtualization = false,
    emptyComponent,
  } = props;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // 计算每个项的位置和高度
  const itemPositions = React.useMemo(() => {
    let total = 0;
    const positions = items.map((item, index) => {
      const height = getItemHeight(item, index);
      const position = { top: total, height };
      total += height;
      return position;
    });
    
    return {
      positions,
      totalHeight: total,
    };
  }, [items, getItemHeight]);
  
  // 找到第一个可见项的索引
  const findStartIndex = useCallback(() => {
    if (disableVirtualization) return 0;
    
    const { positions } = itemPositions;
    let start = 0;
    let end = positions.length - 1;
    
    while (start <= end) {
      const middle = Math.floor((start + end) / 2);
      const { top, height } = positions[middle];
      
      if (top + height < scrollTop) {
        start = middle + 1;
      } else if (top > scrollTop) {
        end = middle - 1;
      } else {
        return middle;
      }
    }
    
    return Math.max(0, start - 1);
  }, [itemPositions, scrollTop, disableVirtualization]);
  
  // 计算可见项的范围
  const range = React.useMemo(() => {
    if (disableVirtualization) {
      return { startIndex: 0, endIndex: items.length };
    }
    
    const { positions } = itemPositions;
    const startIndex = Math.max(0, findStartIndex() - overscan);
    
    let endIndex = startIndex;
    let visibleHeight = 0;
    
    while (endIndex < positions.length && visibleHeight < height + 2 * overscan * estimatedItemHeight) {
      visibleHeight += positions[endIndex].height;
      endIndex += 1;
    }
    
    return {
      startIndex,
      endIndex: Math.min(endIndex + overscan, positions.length),
      totalHeight: itemPositions.totalHeight,
    };
  }, [itemPositions, height, findStartIndex, overscan, estimatedItemHeight, disableVirtualization, items.length]);
  
  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);
  
  // 滚动到指定索引
  useEffect(() => {
    if (scrollToIndex === undefined || !containerRef.current) return;
    
    const { positions } = itemPositions;
    if (scrollToIndex >= 0 && scrollToIndex < positions.length) {
      containerRef.current.scrollTo({
        top: positions[scrollToIndex].top,
        behavior: scrollBehavior,
      });
    }
  }, [scrollToIndex, itemPositions, scrollBehavior]);
  
  // 如果列表为空，显示空状态
  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-y-auto',
        !showScrollbar && 'scrollbar-hide',
        smoothScroll && 'scroll-smooth',
        containerClassName
      )}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        className={cn('relative', className)}
        style={{ height: range.totalHeight }}
      >
        {items.slice(range.startIndex, range.endIndex).map((item, index) => {
          const actualIndex = range.startIndex + index;
          const { top, height } = itemPositions.positions[actualIndex];
          
          return (
            <div
              key={actualIndex}
              className="absolute left-0 right-0"
              style={{ top, height }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FixedVirtualList; 