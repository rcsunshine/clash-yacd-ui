import { formatDistance } from 'date-fns';
import * as React from 'react';
import Button from 'src/components/Button';
import { useUpdateRuleProviderItem } from 'src/components/rules/rules.hooks';
import { SectionNameType } from 'src/components/shared/Basic';
import { RotateIcon } from 'src/components/shared/RotateIcon';

import { ClashAPIConfig } from '$src/types';

import s from './RuleProviderItem.module.scss';

export function RuleProviderItem({
  idx,
  name,
  vehicleType,
  behavior,
  updatedAt,
  ruleCount,
  apiConfig,
}: {
  idx: number;
  name: string;
  vehicleType: string;
  behavior: string;
  updatedAt: string;
  ruleCount: number;
  apiConfig: ClashAPIConfig;
}) {
  const [onClickRefreshButton, isRefreshing] = useUpdateRuleProviderItem(name, apiConfig);
  const timeAgo = formatDistance(new Date(updatedAt), new Date());
  
  return (
    <div className={s.RuleProviderItem}>
      <div className={s.providerCard}>
        {/* Provider Icon & Index */}
        <div className={s.providerIcon}>
          <span className="avatar bg-primary text-white">
            <i className="ti ti-database"></i>
          </span>
          <span className="badge badge-outline text-muted position-absolute" 
                style={{ top: '-8px', right: '-8px', fontSize: '0.7rem' }}>
            #{idx}
          </span>
        </div>
        
        {/* Provider Info */}
        <div className={s.providerInfo}>
          <div className={s.providerHeader}>
            <h4 className="mb-1 fw-bold text-truncate" title={name}>
              <i className="ti ti-shield-check me-2 text-success"></i>
              {name}
            </h4>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge badge-outline text-info">
                <i className="ti ti-truck me-1"></i>
                {vehicleType}
              </span>
              <span className="badge badge-outline text-warning">
                <i className="ti ti-settings me-1"></i>
                {behavior}
              </span>
            </div>
          </div>
          
          <div className={s.providerStats}>
            <div className="d-flex align-items-center gap-3 text-muted">
              <div className="d-flex align-items-center gap-1">
                <i className="ti ti-list"></i>
                <span className="fw-medium">{ruleCount}</span>
                <span>{ruleCount === 1 ? 'rule' : 'rules'}</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <i className="ti ti-clock"></i>
                <span>Updated {timeAgo} ago</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Provider Actions */}
        <div className={s.providerActions}>
          <div className="d-flex flex-column gap-2">
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-2"
              onClick={onClickRefreshButton}
              disabled={isRefreshing}
            >
              <RotateIcon isRotating={isRefreshing} size={14} />
              <span>Update</span>
            </button>
            
            <div className="dropdown">
              <button 
                className="btn btn-ghost-secondary btn-sm" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="ti ti-dots-vertical"></i>
              </button>
              <div className="dropdown-menu dropdown-menu-end">
                <button className="dropdown-item">
                  <i className="ti ti-info-circle me-2"></i>
                  Provider Details
                </button>
                <button className="dropdown-item">
                  <i className="ti ti-download me-2"></i>
                  Download Rules
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item text-danger">
                  <i className="ti ti-trash me-2"></i>
                  Remove Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
