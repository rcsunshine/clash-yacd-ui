import { Tooltip } from '@reach/tooltip';
import { useAtom } from 'jotai';
import * as React from 'react';

import { connect, useStoreActions } from '$src/components/StateProvider';
import { useState2 } from '$src/hooks/basic';
import {
  autoCloseOldConnsAtom,
  collapsibleIsOpenAtom,
  hideUnavailableProxiesAtom,
  latencyTestUrlAtom,
  proxySortByAtom,
} from '$src/store/app';
import { getProxies, switchProxy } from '$src/store/proxies';
import { DelayMapping, DispatchFn, ProxiesMapping, State } from '$src/store/types';
import { ClashAPIConfig } from '$src/types';

import { useFilteredAndSorted } from './hooks';
import s0 from './ProxyGroup.module.scss';
import { ProxyList, ProxyListSummaryView } from './ProxyList';

const { createElement, useCallback, useMemo, useState, useEffect, useRef } = React;

type ProxyGroupImplProps = {
  name: string;
  index: number;
  all: string[];
  delay: DelayMapping;
  proxies: ProxiesMapping;
  type: string;
  now: string;
  apiConfig: ClashAPIConfig;
  dispatch: DispatchFn;
};

// 流式加载的代理列表组件
const StreamingProxyList = React.memo(({ 
  all, 
  now, 
  isSelectable, 
  itemOnTapCallback 
}: {
  all: string[];
  now: string;
  isSelectable: boolean;
  itemOnTapCallback: (proxyName: string) => void;
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>();

  // 流式加载配置
  const BATCH_SIZE = 12; // 每批加载的数量
  const LOAD_DELAY = 30; // 每批之间的延迟（毫秒）
  const INITIAL_DELAY = 50; // 初始延迟

  useEffect(() => {
    if (all.length === 0) {
      setIsLoading(false);
      return;
    }

    // 重置状态
    setVisibleCount(0);
    setIsLoading(true);

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 开始流式加载
    const startStreaming = () => {
      let currentCount = 0;
      
      const loadNextBatch = () => {
        if (currentCount >= all.length) {
          setIsLoading(false);
          return;
        }

        const nextCount = Math.min(currentCount + BATCH_SIZE, all.length);
        setVisibleCount(nextCount);
        currentCount = nextCount;

        if (currentCount < all.length) {
          timeoutRef.current = setTimeout(loadNextBatch, LOAD_DELAY);
        } else {
          setIsLoading(false);
        }
      };

      // 初始延迟后开始加载
      timeoutRef.current = setTimeout(loadNextBatch, INITIAL_DELAY);
    };

    startStreaming();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [all.length]);

  // 获取当前可见的代理列表
  const visibleProxies = useMemo(() => {
    return all.slice(0, visibleCount);
  }, [all, visibleCount]);

  // 如果没有代理，显示空状态
  if (all.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-4">
        <i className="ti ti-server-off text-muted mb-2" style={{ fontSize: '2rem' }}></i>
        <span className="text-muted">No proxies available</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={s0.proxyContainer}>
      {/* 渲染已加载的代理 */}
      {visibleCount > 0 && (
        <div className={s0.streamingContainer}>
          {createElement(ProxyList, {
            all: visibleProxies,
            now,
            isSelectable,
            itemOnTapCallback,
          })}
        </div>
      )}

             {/* 流式加载进度条 */}
       {isLoading && (
         <div className={s0.loadingIndicator}>
           <div className={s0.progressBar}>
             <div 
               className={s0.progressFill}
               style={{ 
                 width: `${(visibleCount / all.length) * 100}%`,
                 transition: 'width 0.3s ease-out'
               }}
             />
           </div>
         </div>
       )}
    </div>
  );
});

StreamingProxyList.displayName = 'StreamingProxyList';

function ProxyGroupImpl({
  name,
  index,
  all: allItems,
  delay,
  proxies,
  type,
  now,
  apiConfig,
  dispatch,
}: ProxyGroupImplProps) {
  const [collapsibleIsOpen, setCollapsibleIsOpen] = useAtom(collapsibleIsOpenAtom);
  const isOpen = collapsibleIsOpen[`proxyGroup:${name}`];
  const [proxySortBy] = useAtom(proxySortByAtom);
  const [hideUnavailableProxies] = useAtom(hideUnavailableProxiesAtom);
  const all = useFilteredAndSorted(allItems, delay, hideUnavailableProxies, proxySortBy, proxies);
  const isSelectable = useMemo(() => type === 'Selector', [type]);
  const {
    proxies: { requestDelayForProxies },
  } = useStoreActions();
  
  const updateCollapsibleIsOpen = useCallback(
    (prefix: string, name: string, v: boolean) => {
      setCollapsibleIsOpen((s) => ({ ...s, [`${prefix}:${name}`]: v }));
    },
    [setCollapsibleIsOpen],
  );
  
  const toggle = useCallback(() => {
    updateCollapsibleIsOpen('proxyGroup', name, !isOpen);
  }, [isOpen, updateCollapsibleIsOpen, name]);
  
  const [autoCloseOldConns] = useAtom(autoCloseOldConnsAtom);
  const itemOnTapCallback = useCallback(
    (proxyName: string) => {
      if (!isSelectable) return;
      dispatch(switchProxy(apiConfig, name, proxyName, autoCloseOldConns));
    },
    [apiConfig, dispatch, name, isSelectable, autoCloseOldConns],
  );

  const [latencyTestUrl] = useAtom(latencyTestUrlAtom);
  const testingLatency = useState2(false);
  const testLatency = useCallback(async () => {
    if (testingLatency.value) return;
    testingLatency.set(true);
    try {
      await requestDelayForProxies(apiConfig, all, latencyTestUrl);
    } catch (err) {}
    testingLatency.set(false);
  }, [all, apiConfig, latencyTestUrl, requestDelayForProxies, testingLatency]);

  // Get type icon and color
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Selector':
        return 'ti-hand-click';
      case 'URLTest':
        return 'ti-speedboat';
      case 'Fallback':
        return 'ti-shield-check';
      case 'LoadBalance':
        return 'ti-scale';
      case 'Relay':
        return 'ti-route';
      default:
        return 'ti-server';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Selector':
        return 'badge-info';
      case 'URLTest':
        return 'badge-success';
      case 'Fallback':
        return 'badge-warning';
      case 'LoadBalance':
        return 'badge-purple';
      case 'Relay':
        return 'badge-secondary';
      default:
        return 'badge-outline';
    }
  };

  return (
    <div className={s0.modernGroup}>
      <div className={s0.groupHeader}>
        <div className={s0.groupInfo}>
          <div className={s0.groupTitle}>
            <div className="d-flex align-items-center gap-2">
              <button
                className={`btn btn-ghost p-0 d-flex align-items-center gap-2 ${s0.toggleButton}`}
                onClick={toggle}
              >
                <i className={`ti ${isOpen ? 'ti-chevron-down' : 'ti-chevron-right'} ${s0.chevron}`}></i>
                <div className="d-flex align-items-center gap-2">
                  <span className={s0.groupIndex}>
                    {index}
                  </span>
                  <i className={`ti ${getTypeIcon(type)} text-primary`}></i>
                  <span className="fw-semibold">{name}</span>
                </div>
              </button>
              
              <Tooltip label="Test latency">
                <button
                  className="btn btn-ghost-secondary btn-sm d-flex align-items-center justify-content-center"
                  style={{ width: '28px', height: '28px' }}
                  onClick={testLatency}
                  disabled={testingLatency.value}
                >
                  {testingLatency.value ? (
                    <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <i className="ti ti-bolt" style={{ fontSize: '14px' }}></i>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
          
          <div className={s0.groupMeta}>
            <span className={`badge ${getTypeBadgeClass(type)} badge-sm`}>
              {type}
            </span>
            <span className="text-muted">
              {all.length} {all.length === 1 ? 'proxy' : 'proxies'}
            </span>
            {now && (
              <div className="d-flex align-items-center gap-1">
                <i className="ti ti-point-filled text-success" style={{ fontSize: '8px' }}></i>
                <span className="text-success fw-medium">{now}</span>
              </div>
            )}
          </div>
        </div>

        <div className={s0.groupActions}>
          {/* 保留右侧区域以备将来扩展 */}
        </div>
      </div>

      {isOpen && (
        <div className={s0.groupContent}>
          <StreamingProxyList
            all={all}
            now={now}
            isSelectable={isSelectable}
            itemOnTapCallback={itemOnTapCallback}
          />
        </div>
      )}

      {!isOpen && all.length > 0 && (
        <div className={s0.summaryView}>
          {createElement(ProxyListSummaryView, {
            all: all.slice(0, 20), // Show max 20 dots in summary
            now,
            isSelectable,
            itemOnTapCallback,
          })}
          {all.length > 20 && (
            <span className="text-muted ms-2">+{all.length - 20} more</span>
          )}
        </div>
      )}
    </div>
  );
}

export const ProxyGroup = connect((s: State, { name, index, delay }) => {
  const proxies = getProxies(s);
  const group = proxies[name];
  const { all, type, now } = group;
  return {
    all,
    delay,
    proxies,
    type,
    now,
    index,
  };
})(ProxyGroupImpl);
