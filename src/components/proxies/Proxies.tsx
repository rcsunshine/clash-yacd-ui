import { Tooltip } from '@reach/tooltip';
import { useAtom } from 'jotai';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClosePrevConns } from 'src/components/proxies/ClosePrevConns';
import { ProxyGroup } from 'src/components/proxies/ProxyGroup';
import { ProxyPageFab } from 'src/components/proxies/ProxyPageFab';
import { ProxyProviderList } from 'src/components/proxies/ProxyProviderList';
import Settings from 'src/components/proxies/Settings';
import BaseModal from 'src/components/shared/BaseModal';
import { connect, useStoreActions } from 'src/components/StateProvider';
import { collapsibleIsOpenAtom } from 'src/store/app';
import {
  fetchProxies,
  getDelay,
  getProxiesLoading,
  getProxyGroupNames,
  getProxyProviders,
  getShowModalClosePrevConns,
  proxyFilterTextAtom,
} from 'src/store/proxies';
import type { DelayMapping, DispatchFn, FormattedProxyProvider, State } from 'src/store/types';

import { TextFilter } from '$src/components/shared/TextFilter';
import { useApiConfig } from '$src/store/app';


const { useState, useEffect, useCallback, useRef, useMemo, startTransition } = React;

function Proxies({
  dispatch,
  groupNames,
  delay,
  proxyProviders,
  showModalClosePrevConns,
  isLoading,
}: {
  dispatch: DispatchFn;
  groupNames: string[];
  delay: DelayMapping;
  proxyProviders: FormattedProxyProvider[];
  showModalClosePrevConns: boolean;
  isLoading: boolean;
}) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [visibleGroupCount, setVisibleGroupCount] = useState(0);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const apiConfig = useApiConfig();
  const { t } = useTranslation();
  const {
    proxies: { requestDelayForProxies },
  } = useStoreActions();
  
  // 代理搜索状态管理
  const [, setProxyFilterText] = useAtom(proxyFilterTextAtom);

  // 全局展开收缩状态管理
  const [collapsibleIsOpen, setCollapsibleIsOpen] = useAtom(collapsibleIsOpenAtom);
  
  // 检查是否所有代理组都已展开
  const allGroupsExpanded = useMemo(() => {
    return groupNames.every(groupName => collapsibleIsOpen[`proxyGroup:${groupName}`] === true);
  }, [groupNames, collapsibleIsOpen]);
  
  // 切换所有代理组状态
  const toggleAllGroups = useCallback(() => {
    const newState = { ...collapsibleIsOpen };
    const targetState = !allGroupsExpanded; // 如果当前全部展开，则收缩；否则展开
    
    groupNames.forEach(groupName => {
      newState[`proxyGroup:${groupName}`] = targetState;
    });
    setCollapsibleIsOpen(newState);
  }, [groupNames, collapsibleIsOpen, setCollapsibleIsOpen, allGroupsExpanded]);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  const {
    proxies: { closeModalClosePrevConns, closePrevConnsAndTheModal },
  } = useStoreActions();

  useEffect(() => {
    dispatch(fetchProxies(apiConfig));
  }, [apiConfig, dispatch]);
  
  // 组件卸载时清空搜索状态
  useEffect(() => {
    return () => {
      setProxyFilterText('');
    };
  }, [setProxyFilterText]);

  // 流式加载代理组
  useEffect(() => {
    if (groupNames.length === 0) {
      setIsGroupsLoading(false);
      setVisibleGroupCount(0);
      return;
    }

    // 重置状态
    setVisibleGroupCount(0);
    setIsGroupsLoading(true);

    const BATCH_SIZE = 4; // 每批加载4个组
    const LOAD_DELAY = 100; // 每批之间的延迟

    let currentCount = 0;
    const loadNextBatch = () => {
      if (currentCount >= groupNames.length) {
        setIsGroupsLoading(false);
        return;
      }

      const nextCount = Math.min(currentCount + BATCH_SIZE, groupNames.length);
      
      startTransition(() => {
        setVisibleGroupCount(nextCount);
      });
      
      currentCount = nextCount;

      if (currentCount < groupNames.length) {
        setTimeout(loadNextBatch, LOAD_DELAY);
      } else {
        setTimeout(() => setIsGroupsLoading(false), LOAD_DELAY);
      }
    };

    // 开始加载
    setTimeout(loadNextBatch, 50);
  }, [groupNames.length]);

  // Calculate statistics
  const totalProxies = groupNames.reduce((acc, groupName) => {
    // This would need access to the actual proxy data
    return acc + 1; // Simplified for now
  }, 0);

  const totalProviders = proxyProviders.length;

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header d-print-none">
        <div className="container-fluid px-4">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                Network
              </div>
              <h2 className="page-title d-flex align-items-center gap-2">
                <i className="ti ti-world"></i>
                {t('Proxies')}
              </h2>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2 align-items-center flex-wrap">
                {/* Statistics */}
                <div className="d-flex align-items-center gap-3 text-muted">
                  <div className="d-flex align-items-center gap-1">
                    <i className="ti ti-server"></i>
                    <span className="fw-medium">{groupNames.length}</span>
                    <span className="text-muted d-none d-sm-inline">Groups</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <i className="ti ti-database"></i>
                    <span className="fw-medium">{totalProviders}</span>
                    <span className="text-muted d-none d-sm-inline">Providers</span>
                  </div>
                </div>
                
                {/* Search Filter */}
                <div style={{ minWidth: '200px', maxWidth: '300px', flex: '1 1 auto' }}>
                  <TextFilter textAtom={proxyFilterTextAtom} placeholder={t('Search proxies...')} />
                </div>
                
                {/* Settings Button */}
                <Tooltip label={t('settings')}>
                  <button
                    className="btn btn-ghost-secondary btn-sm d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => setIsSettingsModalOpen(true)}
                  >
                    <i className="ti ti-settings"></i>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div className="page-body">
        <div className="container-fluid px-4">
          {/* Proxy Groups */}
          {groupNames.length > 0 && (
            <div className="card mb-3">
              <div className="card-header">
                <h3 className="card-title d-flex align-items-center gap-2">
                  <i className="ti ti-layers-intersect"></i>
                  {t('Proxy Groups')}
                  
                  {/* 全局展开收缩切换按钮 */}
                  <Tooltip label={allGroupsExpanded ? t('Collapse all groups') : t('Expand all groups')}>
                    <button
                      className="btn btn-ghost-secondary btn-sm d-flex align-items-center justify-content-center"
                      style={{ width: '28px', height: '28px' }}
                      onClick={toggleAllGroups}
                      disabled={groupNames.length === 0}
                    >
                      <i 
                        className="ti ti-chevrons-down" 
                        style={{ 
                          fontSize: '14px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: allGroupsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: allGroupsExpanded ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                        }}
                      ></i>
                    </button>
                  </Tooltip>
                </h3>
                <div className="card-actions">
                  <div className="text-muted">
                    {groupNames.length} {t('groups')}
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                {/* 渲染可见的代理组 */}
                {groupNames.slice(0, visibleGroupCount).map((groupName: string, index: number) => {
                  return (
                    <div key={groupName} className="border-bottom" style={{
                      animation: 'fadeInUp 0.3s ease-out',
                      animationDelay: `${(index % 4) * 30}ms`,
                      animationFillMode: 'both'
                    }}>
                      <ProxyGroup
                        name={groupName}
                        index={index + 1}
                        delay={delay}
                        apiConfig={apiConfig}
                        dispatch={dispatch}
                      />
                    </div>
                  );
                })}
                
                {/* 流式加载进度条 */}
                {isGroupsLoading && visibleGroupCount < groupNames.length && (
                  <div className="d-flex align-items-center justify-content-center py-3">
                    <div style={{ width: '200px', height: '2px', backgroundColor: 'var(--color-separator)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--tblr-primary), var(--tblr-info))',
                          borderRadius: '1px',
                          width: `${(visibleGroupCount / groupNames.length) * 100}%`,
                          transition: 'width 0.3s ease-out'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proxy Providers */}
          {proxyProviders.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title d-flex align-items-center gap-2">
                  <i className="ti ti-cloud-download"></i>
                  {t('Proxy Providers')}
                </h3>
                <div className="card-actions">
                  <div className="text-muted">
                    {proxyProviders.length} {t('providers')}
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <ProxyProviderList items={proxyProviders} />
              </div>
            </div>
          )}



          {/* Empty State */}
          {!isLoading && groupNames.length === 0 && proxyProviders.length === 0 && (
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="empty">
                  <div className="empty-icon">
                    <i className="ti ti-world-off" style={{ fontSize: '48px', color: 'var(--color-text-secondary)' }}></i>
                  </div>
                  <p className="empty-title">{t('No proxies found')}</p>
                  <p className="empty-subtitle text-muted">
                    {t('Configure your proxy groups and providers to get started')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <ProxyPageFab dispatch={dispatch} apiConfig={apiConfig} proxyProviders={proxyProviders} />

      {/* Modals */}
      <BaseModal isOpen={isSettingsModalOpen} onRequestClose={closeSettingsModal}>
        <Settings />
      </BaseModal>

      <BaseModal isOpen={showModalClosePrevConns} onRequestClose={closeModalClosePrevConns}>
        <ClosePrevConns
          onClickPrimaryButton={() => closePrevConnsAndTheModal(apiConfig)}
          onClickSecondaryButton={closeModalClosePrevConns}
        />
      </BaseModal>
    </div>
  );
}

const mapState = (s: State) => ({
  groupNames: getProxyGroupNames(s),
  proxyProviders: getProxyProviders(s),
  delay: getDelay(s),
  showModalClosePrevConns: getShowModalClosePrevConns(s),
  isLoading: getProxiesLoading(s),
});

export default connect(mapState)(Proxies);
