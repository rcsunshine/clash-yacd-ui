import { useAtom } from 'jotai';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { areEqual, VariableSizeList } from 'react-window';

import { RuleProviderItem } from '$src/components/rules/RuleProviderItem';
import { useRuleAndProvider } from '$src/components/rules/rules.hooks';
import { RulesPageFab } from '$src/components/rules/RulesPageFab';
import { TextFilter } from '$src/components/shared/TextFilter';
import { useApiConfig } from '$src/store/app';
import { ruleFilterTextAtom } from '$src/store/rules';
import { ClashAPIConfig, RuleType } from '$src/types';

import useRemainingViewPortHeight from '../hooks/useRemainingViewPortHeight';
import Rule from './Rule';
import s from './Rules.module.scss';

const { memo, useState, useEffect, useMemo, startTransition, useCallback, useRef } = React;

const paddingBottom = 30;

type ItemData = {
  rules: any[];
  provider: any;
  apiConfig: ClashAPIConfig;
};

function itemKey(index: number, { rules, provider }: ItemData) {
  const providerQty = provider?.names?.length || 0;

  if (index < providerQty) {
    return provider.names[index];
  }
  const ruleIndex = index - providerQty;
  const item = rules[ruleIndex];
  // 在流式加载过程中，item可能为undefined，需要提供fallback
  return item?.id || `rule-${ruleIndex}`;
}

function getItemSizeFactory({ provider }) {
  return function getItemSize(idx: number) {
    const providerQty = provider?.names?.length || 0;
    if (idx < providerQty) {
      // provider
      return 130;
    }
    // rule
    return 90;
  };
}

type RowProps = {
  index: number;
  style: React.CSSProperties;
  data: {
    apiConfig: ClashAPIConfig;
    rules: RuleType[];
    provider: { names: string[]; byName: any };
  };
};

const Row = memo(({ index, style, data }: RowProps) => {
  const { rules, provider, apiConfig } = data;
  const providerQty = provider?.names?.length || 0;

  if (index < providerQty) {
    const name = provider.names[index];
    const item = provider.byName[name];
    // 传递当前显示的索引（从1开始）而不是原始的idx
    return (
      <div style={style} className={s.RuleProviderItemWrapper}>
        <RuleProviderItem 
          apiConfig={apiConfig} 
          {...item} 
          idx={index + 1} // 覆盖原始idx，使用当前显示位置
        />
      </div>
    );
  }

  const ruleIndex = index - providerQty;
  const r = rules[ruleIndex];
  
  // 在流式加载过程中，规则可能还未加载，显示占位符
  if (!r) {
    return (
      <div style={style} className="d-flex align-items-center justify-content-center">
        <div className="spinner-border spinner-border-sm text-muted" role="status" style={{ width: '16px', height: '16px' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={style}>
      <Rule 
        {...r} 
        id={index + 1} // 覆盖原始id，使用当前显示位置
      />
    </div>
  );
}, areEqual);

Row.displayName = 'MemoRow';

export default function Rules() {
  const apiConfig = useApiConfig();
  const [refRulesContainer, containerHeight] = useRemainingViewPortHeight();
  const { rules, provider } = useRuleAndProvider(apiConfig);
  const [filterText, setFilterText] = useAtom(ruleFilterTextAtom);
  const { t } = useTranslation();
  
  // 流式加载状态
  const [visibleItemCount, setVisibleItemCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(true);
  const [isScrollLoading, setIsScrollLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [nearLoadTrigger, setNearLoadTrigger] = useState(false);
  const loadingTimeoutRef = useRef<number>();
  const virtualListRef = useRef<any>(null);
  
  // 计算总项目数
  const totalItems = useMemo(() => {
    return (rules?.length || 0) + (provider?.names?.length || 0);
  }, [rules?.length, provider?.names?.length]);
  
  // 计算基于窗口高度的初始加载数量
  const calculateInitialLoadCount = useCallback(() => {
    if (containerHeight <= 0) return 20;
    
    // 估算每个项目的平均高度（提供者130px，规则90px）
    const providerCount = provider?.names?.length || 0;
    const ruleCount = rules?.length || 0;
    const avgItemHeight = providerCount > 0 && ruleCount > 0 
      ? (providerCount * 130 + ruleCount * 90) / (providerCount + ruleCount)
      : 110; // 默认平均高度
    
    // 计算可见区域能容纳的项目数，加上缓冲区
    const visibleItems = Math.ceil(containerHeight / avgItemHeight);
    const bufferItems = Math.ceil(visibleItems * 0.5); // 50% 缓冲区
    
    return Math.min(visibleItems + bufferItems, totalItems);
  }, [containerHeight, provider?.names?.length, rules?.length, totalItems]);
  
  // 自适应初始加载
  useEffect(() => {
    if (totalItems === 0) {
      setIsStreaming(false);
      setVisibleItemCount(0);
      return;
    }

    // 重置状态
    setVisibleItemCount(0);
    setIsStreaming(true);

    const initialLoadCount = calculateInitialLoadCount();
    const LOAD_DELAY = 10; // 进一步减少延迟以提高响应性

    let currentCount = 0;
    const loadNextBatch = () => {
      if (currentCount >= initialLoadCount) {
        setIsStreaming(false);
        return;
      }

      // 动态批次大小：初始加载更大批次，后续较小批次
      const remainingItems = initialLoadCount - currentCount;
      const batchSize = Math.min(
        currentCount === 0 ? Math.ceil(initialLoadCount * 0.4) : 15, // 首批40%，后续15个
        remainingItems
      );
      
      const nextCount = currentCount + batchSize;
      
      startTransition(() => {
        setVisibleItemCount(nextCount);
      });
      
      currentCount = nextCount;

      if (currentCount < initialLoadCount) {
        setTimeout(loadNextBatch, LOAD_DELAY);
      } else {
        setTimeout(() => setIsStreaming(false), LOAD_DELAY);
      }
    };

    // 开始自适应加载
    setTimeout(loadNextBatch, 20);
  }, [totalItems, calculateInitialLoadCount]);
  
  // 滚动加载更多数据
  const loadMoreItems = useCallback(() => {
    if (isScrollLoading || visibleItemCount >= totalItems) return;
    
    setIsScrollLoading(true);
    
    // 清除之前的定时器
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      const SCROLL_BATCH_SIZE = 30; // 增加批次大小，减少加载次数
      const nextCount = Math.min(visibleItemCount + SCROLL_BATCH_SIZE, totalItems);
      
      startTransition(() => {
        setVisibleItemCount(nextCount);
        setIsScrollLoading(false);
      });
    }, 20); // 大幅减少延迟到20ms
  }, [isScrollLoading, visibleItemCount, totalItems]);
  
  // 防抖引用
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // 防抖的加载更多函数
  const debouncedLoadMore = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (!isScrollLoading && visibleItemCount < totalItems) {
        loadMoreItems();
      }
    }, 10); // 减少到10ms防抖，几乎即时响应
  }, [isScrollLoading, visibleItemCount, totalItems, loadMoreItems]);
  
  // 滚动事件处理
  const handleScroll = useCallback(({ scrollDirection, scrollOffset, scrollUpdateWasRequested }) => {
    // 只在向下滚动且不是程序触发的滚动时检查
    if (scrollDirection === 'forward' && !scrollUpdateWasRequested) {
      const scrollableHeight = virtualListRef.current?.props?.height || containerHeight;
      const totalContentHeight = totalItems * 100; // 估算总高度
      const scrollPercentage = Math.min(scrollOffset / (totalContentHeight - scrollableHeight), 1);
      
      // 更新滚动进度（虚拟列表的滚动事件）
      setScrollProgress(Math.round(scrollPercentage * 100));
      
      // 检查是否接近触发点
      const isNearTrigger = scrollPercentage > 0.5 && visibleItemCount < totalItems;
      setNearLoadTrigger(isNearTrigger);
      
      // 即时加载：当滚动到90%以上时立即加载，无延迟
      if (scrollPercentage > 0.9 && visibleItemCount < totalItems && !isScrollLoading) {
        loadMoreItems(); // 直接调用，无防抖
      }
      // 当滚动到60%时开始加载更多（更早触发）
      else if (scrollPercentage > 0.6 && visibleItemCount < totalItems && !isScrollLoading) {
        debouncedLoadMore();
      }
    }
  }, [containerHeight, totalItems, visibleItemCount, isScrollLoading, debouncedLoadMore]);
  
  // 增强的滚动检测 - 监听原生滚动事件
  const enhancedScrollHandler = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;
    
    const virtualListWrapper = target.closest('[data-testid="virtual-list"]') as HTMLElement;
    
    if (virtualListWrapper) {
      const virtualListContainer = virtualListWrapper.querySelector(`.${s.virtualListContainer}`) as HTMLElement;
      
      if (virtualListContainer) {
        const { scrollTop, scrollHeight, clientHeight } = virtualListContainer;
        const scrollPercentage = Math.min(scrollTop / (scrollHeight - clientHeight), 1);
        
        // 更新滚动进度
        setScrollProgress(Math.round(scrollPercentage * 100));
        
        // 检查是否接近触发点
        const isNearTrigger = scrollPercentage > 0.5 && visibleItemCount < totalItems;
        setNearLoadTrigger(isNearTrigger);
        
        // 即时加载：当滚动到90%以上时立即加载，无延迟
        if (scrollPercentage > 0.9 && !isScrollLoading && visibleItemCount < totalItems) {
          loadMoreItems(); // 直接调用，无防抖
        }
        // 更灵敏的触发条件：滚动到50%时开始加载
        else if (scrollPercentage > 0.5 && !isScrollLoading && visibleItemCount < totalItems) {
          debouncedLoadMore();
        }
      }
    }
  }, [isScrollLoading, visibleItemCount, totalItems, debouncedLoadMore, loadMoreItems]);
  
  // 鼠标滚轮事件处理
  const handleWheel = useCallback((event: WheelEvent) => {
    // 只处理向下滚动
    if (event.deltaY > 0 && !isScrollLoading && visibleItemCount < totalItems) {
      const target = event.target as HTMLElement;
      const virtualListWrapper = target.closest('[data-testid="virtual-list"]') as HTMLElement;
      
      if (virtualListWrapper) {
        const virtualListContainer = virtualListWrapper.querySelector(`.${s.virtualListContainer}`) as HTMLElement;
        
        if (virtualListContainer) {
          const { scrollTop, scrollHeight, clientHeight } = virtualListContainer;
          const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
          
          // 即时加载：当滚动到85%以上时立即加载
          if (scrollPercentage > 0.85) {
            loadMoreItems(); // 直接调用，无防抖
          }
          // 滚轮滚动时更积极地加载：40%时触发
          else if (scrollPercentage > 0.4) {
            debouncedLoadMore();
          }
        }
      }
    }
  }, [isScrollLoading, visibleItemCount, totalItems, debouncedLoadMore]);
  
  // 触摸滚动事件处理（移动设备支持）
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (isScrollLoading || visibleItemCount >= totalItems) return;
    
    const target = event.target as HTMLElement;
    const virtualListWrapper = target.closest('[data-testid="virtual-list"]') as HTMLElement;
    
    if (virtualListWrapper) {
      const virtualListContainer = virtualListWrapper.querySelector(`.${s.virtualListContainer}`) as HTMLElement;
      
      if (virtualListContainer) {
        const { scrollTop, scrollHeight, clientHeight } = virtualListContainer;
        const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
        
        // 即时加载：当滚动到85%以上时立即加载
        if (scrollPercentage > 0.85) {
          loadMoreItems(); // 直接调用，无防抖
        }
        // 触摸滚动时在55%时触发
        else if (scrollPercentage > 0.55) {
          debouncedLoadMore();
        }
      }
    }
  }, [isScrollLoading, visibleItemCount, totalItems, debouncedLoadMore]);
  
  // 清理定时器和搜索状态
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // 组件卸载时清空搜索状态
      setFilterText('');
    };
  }, [setFilterText]);

  // 获取当前可见的数据
  const visibleData = useMemo(() => {
    if (!rules || !provider) return { rules: [], provider: { names: [], byName: {} } };
    
    const providerQty = provider?.names?.length || 0;
    
    if (visibleItemCount <= providerQty) {
      // 只显示部分提供者
      return {
        rules: [],
        provider: {
          names: provider.names.slice(0, visibleItemCount),
          byName: provider.byName
        }
      };
    } else {
      // 显示所有提供者和部分规则
      const visibleRulesCount = Math.min(visibleItemCount - providerQty, rules.length);
      return {
        rules: rules.slice(0, visibleRulesCount),
        provider
      };
    }
  }, [rules, provider, visibleItemCount]);
  
  // 计算实际可渲染的项目数量
  const actualItemCount = useMemo(() => {
    const providerCount = visibleData.provider?.names?.length || 0;
    const rulesCount = visibleData.rules?.length || 0;
    return providerCount + rulesCount;
  }, [visibleData.provider?.names?.length, visibleData.rules?.length]);
  
  // 鼠标拖拽滚动条检测
  const handleMouseDown = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    // 检测是否点击了滚动条区域
    if (target.closest(`.${s.virtualListContainer}`)) {
      const container = target.closest(`.${s.virtualListContainer}`) as HTMLElement;
      const { clientWidth, scrollWidth } = container;
      
      // 如果有水平滚动条，检测是否点击了滚动条
      if (scrollWidth > clientWidth) {
        const rect = container.getBoundingClientRect();
        const isScrollbarClick = event.clientX > rect.right - 20; // 滚动条大约20px宽
        
        if (isScrollbarClick) {
          // 标记为滚动条拖拽，增强后续滚动检测
          setNearLoadTrigger(true);
        }
      }
    }
  }, []);
  
  // 增强滚动事件监听
  useEffect(() => {
    const container = refRulesContainer.current;
    if (!container) return;

    // 添加原生滚动事件监听
    container.addEventListener('scroll', enhancedScrollHandler, { passive: true });
    // 添加滚轮事件监听
    container.addEventListener('wheel', handleWheel, { passive: true });
    // 添加触摸滚动事件监听（移动设备）
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    // 添加鼠标按下事件监听（检测滚动条拖拽）
    container.addEventListener('mousedown', handleMouseDown, { passive: true });

    return () => {
      container.removeEventListener('scroll', enhancedScrollHandler);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enhancedScrollHandler, handleWheel, handleTouchMove, handleMouseDown]);
  
  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + L 快速加载更多
      if ((event.ctrlKey || event.metaKey) && event.key === 'l' && !isScrollLoading && actualItemCount < totalItems) {
        event.preventDefault();
        loadMoreItems();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadMoreItems, isScrollLoading, actualItemCount, totalItems]);
  
  // 初始加载状态
  if (!rules || !provider) {
    return (
      <div className="page-wrapper">
        <div className="page-body">
          <div className="container-xl">
            <div className="card tabler-card">
              <div className="card-body text-center py-5">
                <div className="empty">
                  <div className="empty-icon">
                    <div className="spinner-border text-primary" role="status" style={{ width: '32px', height: '32px' }}>
                  <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <p className="empty-title">Loading rules...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getItemSize = getItemSizeFactory({ provider: visibleData.provider });

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                Configuration
              </div>
              <h2 className="page-title d-flex align-items-center gap-2">
                <i className="ti ti-list-details"></i>
                {t('Rules')}
              </h2>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2">
                {/* Statistics */}
                <div className={`d-flex align-items-center gap-3 text-muted ${s.statsContainer}`}>
                  <div className="d-flex align-items-center gap-1">
                    <i className="ti ti-database"></i>
                    <span className="fw-medium">
                      {provider?.names?.length || 0}
                    </span>
                    <span className="text-muted">Providers</span>
                    {filterText && (
                      <span className="badge badge-outline badge-sm text-info">
                        <i className="ti ti-filter me-1"></i>
                        Filtered
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <i className="ti ti-list"></i>
                    <span className="fw-medium">
                      {rules?.length || 0}
                    </span>
                    <span className="text-muted">Rules</span>
                    {filterText && (
                      <span className="badge badge-outline badge-sm text-info">
                        <i className="ti ti-filter me-1"></i>
                        Filtered
                      </span>
                    )}
                  </div>
                </div>
                {/* Search Filter */}
                <div style={{ minWidth: '300px' }}>
                  <TextFilter placeholder={t('Search rules...')} textAtom={ruleFilterTextAtom} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div className="page-body">
        <div className="container-xl">
          <div className={`card tabler-card ${s.rulesCard}`}>
            <div className="card-header">
              <h3 className="card-title d-flex align-items-center gap-2">
                <i className="ti ti-shield-check"></i>
                {t('Rules & Providers')}
              </h3>
              <div className="card-actions">
                <div className="text-muted d-flex align-items-center gap-2">
                  <span>
                    {totalItems} {t('items')}
                    {filterText && (
                      <span className="badge badge-outline badge-sm text-info ms-2">
                        <i className="ti ti-filter me-1"></i>
                        Filtered Results
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div ref={refRulesContainer} style={{ paddingBottom }} className={s.streamingContainer}>

                
                <div data-testid="virtual-list" className={s.virtualListWrapper}>
                <VariableSizeList
                    ref={virtualListRef}
                  height={containerHeight - paddingBottom}
                  width="100%"
                    itemCount={actualItemCount}
                  itemSize={getItemSize}
                    itemData={{ rules: visibleData.rules, provider: visibleData.provider, apiConfig }}
                  itemKey={itemKey}
                    className={s.virtualListContainer}
                    onScroll={handleScroll}
                    overscanCount={5}
                >
                  {Row}
                </VariableSizeList>
              </div>
              </div>
              

              

            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {provider?.names && provider.names.length > 0 ? (
        <RulesPageFab apiConfig={apiConfig} />
      ) : null}
    </div>
  );
}
