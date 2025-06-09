import React from 'react';
import { Pause, Play, X as IconClose } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { List } from 'reselect/es/types';
import { ConnectionItem } from 'src/api/connections';
import BaseModal from 'src/components/shared/BaseModal';

import { useApiConfig } from '$src/store/app';

import * as connAPI from '../api/connections';
import useRemainingViewPortHeight from '../hooks/useRemainingViewPortHeight';
import styles from './Connections.module.scss';
import ConnectionTable from './ConnectionTable';
import { MutableConnRefCtx } from './conns/ConnCtx';
import ModalCloseAllConnections from './ModalCloseAllConnections';
import SourceIP from './SourceIP';

const { useEffect, useState, useRef, useCallback } = React;

const paddingBottom = 30;

function arrayToIdKv<T extends { id: string }>(items: T[]) {
  const o = {};
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    o[item.id] = item;
  }
  return o;
}

function basePath(path: string) {
  return path?.replace(/.*[/\\]/, '');
}

type FormattedConn = {
  id: string;
  upload: number;
  download: number;
  start: number;
  chains: string;
  rule: string;
  destinationPort: string;
  destinationIP: string;
  sourceIP: string;
  sourcePort: string;
  source: string;
  host: string;
  type: string;
  network: string;
  processPath?: string;
  downloadSpeedCurr?: number;
  uploadSpeedCurr?: number;
};

function hasSubstring(s: string, pat: string) {
  return (s ?? '').toLowerCase().includes(pat.toLowerCase());
}
function filterConnIps(conns: FormattedConn[], ipStr: string) {
  return conns.filter((each) => each.sourceIP === ipStr);
}

function getConnIpList(conns: FormattedConn[]): List<string> {
  return Array.from(new Set(conns.map((x) => x.sourceIP))).sort();
}

function filterConns(conns: FormattedConn[], keyword: string, sourceIp: string) {
  let result = conns;
  if (keyword !== '') {
    result = conns.filter((conn) =>
      [
        conn.host,
        conn.sourceIP,
        conn.sourcePort,
        conn.destinationIP,
        conn.chains,
        conn.rule,
        conn.type,
        conn.network,
        conn.processPath,
      ].some((field) => {
        return hasSubstring(field, keyword);
      }),
    );
  }
  if (sourceIp !== '') {
    result = filterConnIps(result, sourceIp);
  }
  // result.forEach((e) => console.log(e.sourceIP));
  return result;
}

function fmtConnItem(
  i: ConnectionItem,
  prevKv: Record<string, { upload: number; download: number }>,
  now: number,
  mutConnCtxRef: { hasProcessPath: boolean },
): FormattedConn {
  const { id, metadata, upload, download, start, chains, rule, rulePayload } = i;
  const { host, destinationPort, destinationIP, network, type, sourceIP, sourcePort } = metadata;
  const processPath = metadata.processPath;
  if (mutConnCtxRef.hasProcessPath === false && typeof processPath !== 'undefined') {
    mutConnCtxRef.hasProcessPath = true;
  }
  // host could be an empty string if it's direct IP connection
  const host2 = host || destinationIP || '';
  const prev = prevKv[id];
  const ret = {
    id,
    upload,
    download,
    start: now - new Date(start).valueOf(),
    chains: chains.reverse().join(' / '),
    rule: !rulePayload ? rule : `${rule}(${rulePayload})`,
    ...metadata,
    host: `${host2}:${destinationPort}`,
    type: `${type}(${network})`,
    source: `${sourceIP}:${sourcePort}`,
    downloadSpeedCurr: download - (prev ? prev.download : 0),
    uploadSpeedCurr: upload - (prev ? prev.upload : 0),
    process: basePath(processPath),
  };
  return ret;
}

function RenderTableOrPlaceholder({ conns, type = 'active' }: { conns: FormattedConn[], type?: 'active' | 'closed' }) {
  const { t } = useTranslation();
  
  return conns.length > 0 ? (
    <ConnectionTable data={conns} />
  ) : (
    <div className="empty">
      <div className="empty-img">
        <div className="empty-icon-wrapper">
          <i className={`ti ${type === 'active' ? 'ti-wifi-off' : 'ti-history'} empty-icon`}></i>
        </div>
      </div>
      <p className="empty-title">
        {type === 'active' ? t('No active connections') : t('No closed connections')}
      </p>
      <p className="empty-subtitle text-muted">
        {type === 'active' 
          ? t('When applications make network requests, they will appear here.')
          : t('Recently closed connections will be displayed in this section.')
        }
      </p>
    </div>
  );
}

function connQty({ qty }) {
  return qty < 100 ? '' + qty : '99+';
}

// 连接统计组件
function ConnectionStats({ activeCount, closedCount, isLoading = false }: { activeCount: number, closedCount: number, isLoading?: boolean }) {
  const { t } = useTranslation();
  
  return (
    <div className="d-flex align-items-center gap-3 text-muted">
      <div className="d-flex align-items-center gap-1">
        <div className="position-relative">
          <i className="ti ti-wifi"></i>
          {isLoading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </div>
        <span className="fw-medium">{activeCount}</span>
        <span className="text-muted">{t('Active')}</span>
        {activeCount > 0 && (
          <div className="badge badge-success badge-pill ms-1">
            <div className="status-dot status-dot-animated bg-success"></div>
          </div>
        )}
      </div>
      <div className="d-flex align-items-center gap-1">
        <i className="ti ti-wifi-off"></i>
        <span className="fw-medium">{closedCount}</span>
        <span className="text-muted">{t('Closed')}</span>
        {closedCount > 0 && (
          <div className="badge badge-warning badge-pill ms-1">
            <div className="status-dot bg-warning"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Conn() {
  const apiConfig = useApiConfig();
  const [refContainer, containerHeight] = useRemainingViewPortHeight();

  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);

  const [conns, setConns] = useState([]);
  const [closedConns, setClosedConns] = useState([]);

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterSourceIpStr, setFilterSourceIpStr] = useState('');
  
  // Tab状态管理
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabTransition, setTabTransition] = useState(false);
  const tabListRef = useRef<HTMLUListElement>(null);

  const filteredConns = filterConns(conns, filterKeyword, filterSourceIpStr);
  const filteredClosedConns = filterConns(closedConns, filterKeyword, filterSourceIpStr);

  const connIpSet = getConnIpList(conns);

  const [isCloseAllModalOpen, setIsCloseAllModalOpen] = useState(false);
  const openExtraModal = useCallback(() => {
    setIsExtraModalOpen(true);
  }, []);
  const closeExtraModal = useCallback(() => {
    setIsExtraModalOpen(false);
  }, []);

  const openCloseAllModal = useCallback(() => setIsCloseAllModalOpen(true), []);
  const closeCloseAllModal = useCallback(() => setIsCloseAllModalOpen(false), []);
  const [isRefreshPaused, setIsRefreshPaused] = useState(false);
  const toggleIsRefreshPaused = useCallback(() => setIsRefreshPaused((x) => !x), []);
  const closeAllConnections = useCallback(() => {
    connAPI.closeAllConnections(apiConfig);
    closeCloseAllModal();
  }, [apiConfig, closeCloseAllModal]);
  
  // Tab切换处理
  const handleTabSelect = useCallback((index: number) => {
    if (index !== activeTabIndex) {
      setTabTransition(true);
      setTimeout(() => {
        setActiveTabIndex(index);
        setTabTransition(false);
      }, 150);
    }
  }, [activeTabIndex]);

  // 动态计算指示器位置和宽度
  useEffect(() => {
    const updateIndicator = () => {
      if (tabListRef.current) {
        const tabList = tabListRef.current;
        const tabs = tabList.querySelectorAll('.nav-item');
        
        if (tabs.length > 0) {
          const activeTab = tabs[activeTabIndex] as HTMLElement;
          const tabRect = activeTab.getBoundingClientRect();
          const listRect = tabList.getBoundingClientRect();
          
          const width = tabRect.width;
          const offset = tabRect.left - listRect.left;
          
          // 设置CSS变量
          tabList.style.setProperty('--indicator-width', `${width}px`);
          tabList.style.setProperty('--indicator-offset', `${offset}px`);
        }
      }
    };

    // 小延迟确保DOM更新完成
    const timer = setTimeout(updateIndicator, 10);
    return () => clearTimeout(timer);
  }, [activeTabIndex, filteredConns.length, filteredClosedConns.length]);
  const prevConnsRef = useRef(conns);
  const connCtx = React.useContext(MutableConnRefCtx);
  const read = useCallback(
    ({ connections }: { connections: ConnectionItem[] }) => {
      const prevConnsKv = arrayToIdKv(prevConnsRef.current);
      const now = Date.now();
      const x = connections.map((c) => fmtConnItem(c, prevConnsKv, now, connCtx));
      const closed = [];
      for (const c of prevConnsRef.current) {
        const idx = x.findIndex((conn) => conn.id === c.id);
        if (idx < 0) closed.push(c);
      }
      setClosedConns((prev) => {
        // keep max 100 entries
        return [...closed, ...prev].slice(0, 101);
      });
      // if previous connections and current connections are both empty
      // arrays, we wont update state to avoid rerender
      if (x && (x.length !== 0 || prevConnsRef.current.length !== 0) && !isRefreshPaused) {
        prevConnsRef.current = x;
        setConns(x);
      } else {
        prevConnsRef.current = x;
      }
    },
    [setConns, isRefreshPaused, connCtx],
  );
  useEffect(() => {
    return connAPI.fetchData(apiConfig, read);
  }, [apiConfig, read]);

  const { t } = useTranslation();

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header d-print-none">
        <div className="container-fluid px-4">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                {t('Network')}
              </div>
              <h2 className="page-title d-flex align-items-center gap-2">
                <i className="ti ti-network"></i>
                {t('Connections')}
                {filterSourceIpStr && (
                  <span className="badge badge-outline text-primary ms-2">
                    <i className="ti ti-filter me-1"></i>
                    {filterSourceIpStr}
                  </span>
                )}
              </h2>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2 align-items-center flex-wrap">
                {/* Statistics */}
                <ConnectionStats 
                  activeCount={filteredConns.length}
                  closedCount={filteredClosedConns.length}
                  isLoading={isRefreshPaused}
                />
                
                {/* Action Buttons */}
                <div className="btn-group" role="group">
                  <button
                    className={`btn ${isRefreshPaused ? 'btn-danger' : 'btn-primary'} d-flex align-items-center gap-2`}
                    onClick={toggleIsRefreshPaused}
                  >
                    {isRefreshPaused ? <Play size={16} /> : <Pause size={16} />}
                    <span className="d-none d-sm-inline">{isRefreshPaused ? t('Resume') : t('Pause')}</span>
                  </button>
                  <button
                    className="btn btn-outline-danger d-flex align-items-center gap-2"
                    onClick={openCloseAllModal}
                  >
                    <IconClose size={16} />
                    <span className="d-none d-sm-inline">{t('Close All')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div className="page-body">
        <div className="container-fluid px-4">
          {/* Main Content Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title d-flex align-items-center gap-2">
                <i className="ti ti-list"></i>
                {t('Connection List')}
              </h3>
              <div className="card-actions">
                <div className="d-flex gap-2 flex-wrap">
                  {/* Search Input */}
                  <div className="input-group input-group-flat unified-input-group" style={{ minWidth: '200px', maxWidth: '300px' }}>
                    <span className="input-group-text">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('Filter by keyword...')}
                      value={filterKeyword}
                      onChange={(e) => setFilterKeyword(e.target.value)}
                    />
                    {filterKeyword && (
                      <span className="input-group-text">
                        <button
                          className="btn btn-link btn-sm p-0"
                          onClick={() => setFilterKeyword('')}
                        >
                          <i className="ti ti-x"></i>
                        </button>
                      </span>
                    )}
                  </div>
                  
                  {/* IP Filter Button */}
                  <button
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={openExtraModal}
                  >
                    <i className="ti ti-filter"></i>
                    <span className="d-none d-md-inline">{t('Filter by IP')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs 
              className={styles.modernTabs}
              selectedIndex={activeTabIndex}
              onSelect={handleTabSelect}
              selectedTabClassName="react-tabs__tab--selected"
              selectedTabPanelClassName="react-tabs__tab-panel--selected"
              data-active-tab={activeTabIndex}
            >
              <div className="card-body p-0">
                <div className="nav nav-tabs nav-fill" role="tablist">
                  <TabList className="nav nav-tabs nav-fill" ref={tabListRef}>
                    <Tab className="nav-item">
                      <div className="nav-link d-flex align-items-center gap-2">
                        <i className="ti ti-wifi"></i>
                        <span>{t('Active')}</span>
                        <span className={`badge badge-sm ms-auto ${filteredConns.length > 0 ? 'badge-success' : 'badge-secondary'}`}>
                          {connQty({ qty: filteredConns.length })}
                        </span>
                      </div>
                    </Tab>
                    <Tab className="nav-item">
                      <div className="nav-link d-flex align-items-center gap-2">
                        <i className="ti ti-wifi-off"></i>
                        <span>{t('Closed')}</span>
                        <span className={`badge badge-sm ms-auto ${filteredClosedConns.length > 0 ? 'badge-warning' : 'badge-secondary'}`}>
                          {connQty({ qty: filteredClosedConns.length })}
                        </span>
                      </div>
                    </Tab>
                  </TabList>
                </div>

                <div ref={refContainer} className="tab-content">
          <div
            style={{
                      height: Math.max(containerHeight - 100, 400),
              overflow: 'auto',
            }}
            className={tabTransition ? 'tab-transitioning' : ''}
          >
            <TabPanel>
                      <div className="p-3">
                        <div className={`tab-panel-content ${activeTabIndex === 0 ? 'active' : ''}`}>
                          <RenderTableOrPlaceholder conns={filteredConns} type="active" />
                        </div>
                      </div>
            </TabPanel>
            <TabPanel>
                      <div className="p-3">
                        <div className={`tab-panel-content ${activeTabIndex === 1 ? 'active' : ''}`}>
                          <RenderTableOrPlaceholder conns={filteredClosedConns} type="closed" />
                        </div>
                      </div>
            </TabPanel>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BaseModal isOpen={isExtraModalOpen} onRequestClose={closeExtraModal}>
        <div className="modal-header">
          <h4 className="modal-title d-flex align-items-center gap-2">
            <i className="ti ti-filter"></i>
            {t('Filter by Source IP')}
          </h4>
          <button
            type="button"
            className="btn-close"
            onClick={closeExtraModal}
          ></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">{t('pleaseSelectSourceIP')}</label>
            <SourceIP connIPset={connIpSet} setFilterIpStr={setFilterSourceIpStr} />
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeExtraModal}
          >
            {t('Close')}
          </button>
        </div>
      </BaseModal>

        <ModalCloseAllConnections
          isOpen={isCloseAllModalOpen}
          primaryButtonOnTap={closeAllConnections}
          onRequestClose={closeCloseAllModal}
        />
    </div>
  );
}
