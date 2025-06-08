import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { useSystemStatus } from '../hooks/useSystemStatus';
import { ContentHeader } from './ContentHeader';
import s0 from './Home.module.scss';
import Loading from './Loading';
import TrafficChart from './TrafficChart';
import TrafficNow from './TrafficNow';

export default function Home() {
  const { t } = useTranslation();
  const systemStatus = useSystemStatus();
  
  return (
    <div className="page-wrapper">
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                Dashboard
              </div>
              <h2 className="page-title">
                {t('Overview')}
              </h2>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards">
            {/* Traffic Statistics Card */}
            <div className="col-12 col-lg-6">
              <div className="card tabler-card fade-in">
                <div className="card-header">
                  <h3 className="card-title d-flex align-items-center gap-2">
                    <i className="ti ti-activity"></i>
                    {t('Traffic Statistics')}
                  </h3>
                </div>
                <div className="card-body">
                  <TrafficNow />
                </div>
              </div>
            </div>
            
            {/* Traffic Chart Card */}
            <div className="col-12 col-lg-6">
              <div className="card tabler-card fade-in">
                <div className="card-header">
                  <h3 className="card-title d-flex align-items-center gap-2">
                    <i className="ti ti-chart-line"></i>
                    {t('Traffic Chart')}
                  </h3>
                </div>
                <div className="card-body">
                  <div style={{ height: '250px', position: 'relative' }}>
                    <Suspense fallback={<Loading height="250px" />}>
                      <TrafficChart />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Traffic Summary Cards */}
            <div className="col-12 col-lg-6">
              <div className="card tabler-card fade-in">
                <div className="card-header">
                  <h3 className="card-title d-flex align-items-center gap-2">
                    <i className="ti ti-arrow-up"></i>
                    {t('Upload Total')}
                  </h3>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <span className="bg-success text-white avatar">
                        <i className="ti ti-upload"></i>
                      </span>
                    </div>
                    <div>
                      <div className="h2 mb-0">{systemStatus.uploadTotal}</div>
                      <div className="text-muted">{t('Total uploaded data')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-lg-6">
              <div className="card tabler-card fade-in">
                <div className="card-header">
                  <h3 className="card-title d-flex align-items-center gap-2">
                    <i className="ti ti-arrow-down"></i>
                    {t('Download Total')}
                  </h3>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <span className="bg-info text-white avatar">
                        <i className="ti ti-download"></i>
                      </span>
                    </div>
                    <div>
                      <div className="h2 mb-0">{systemStatus.downloadTotal}</div>
                      <div className="text-muted">{t('Total downloaded data')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status Card */}
            <div className="col-12">
              <div className="card tabler-card fade-in">
                <div className="card-header">
                  <h3 className="card-title d-flex align-items-center gap-2">
                    <i className="ti ti-server"></i>
                    {t('System Status')}
                  </h3>
                  <div className="card-actions">
                    <div className="d-flex align-items-center gap-2 text-muted">
                      {systemStatus.connectionStatus === 'error' && (
                        <span className="badge badge-danger badge-sm">
                          <i className="ti ti-alert-circle me-1"></i>
                          {t('Data Error')}
                        </span>
                      )}
                      {systemStatus.isLoading && (
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      )}
                      <small>
                        {systemStatus.lastUpdated 
                          ? `${t('Last updated')}: ${systemStatus.lastUpdated.toLocaleTimeString()}`
                          : t('Initializing...')
                        }
                      </small>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-sm-6 col-lg-3">
                      <div className="card card-sm">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className={`avatar ${
                                systemStatus.connectionStatus === 'active' ? 'bg-success' : 
                                systemStatus.connectionStatus === 'error' ? 'bg-danger' : 'bg-secondary'
                              } text-white`}>
                                <i className="ti ti-wifi"></i>
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {t('Connection Status')}
                              </div>
                              <div className={`text-${
                                systemStatus.connectionStatus === 'active' ? 'success' : 
                                systemStatus.connectionStatus === 'error' ? 'danger' : 'muted'
                              }`}>
                                {systemStatus.connectionStatus === 'active' ? t('Active') : 
                                 systemStatus.connectionStatus === 'error' ? t('Error') : t('Inactive')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-sm-6 col-lg-3">
                      <div className="card card-sm">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className="bg-info text-white avatar">
                                <i className="ti ti-users"></i>
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {t('Active Connections')}
                              </div>
                              <div className="text-muted">
                                {systemStatus.isLoading ? '...' : systemStatus.activeConnections}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-sm-6 col-lg-3">
                      <div className="card card-sm">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className="bg-warning text-white avatar">
                                <i className="ti ti-world"></i>
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {t('Active Proxies')}
                              </div>
                              <div className="text-muted">
                                {systemStatus.isLoading ? '...' : `${systemStatus.activeProxies}/${systemStatus.totalProxies}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-sm-6 col-lg-3">
                      <div className="card card-sm">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className="bg-primary text-white avatar">
                                <i className="ti ti-ruler-2"></i>
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {t('Total Rules')}
                              </div>
                              <div className="text-muted">
                                {systemStatus.isLoading ? '...' : systemStatus.totalRules}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
