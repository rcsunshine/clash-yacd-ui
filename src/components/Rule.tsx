import React from 'react';

import s0 from './Rule.module.scss';

const colorMap = {
  _default: '#59caf9',
  DIRECT: '#f5bc41',
  REJECT: '#cb3166',
};

const proxyTypeMap = {
  DIRECT: { color: 'success', icon: 'arrow-right' },
  REJECT: { color: 'danger', icon: 'x' },
  _default: { color: 'info', icon: 'world' },
};

function getProxyStyle({ proxy }) {
  return proxyTypeMap[proxy] || proxyTypeMap._default;
}

function getStyleFor({ proxy }) {
  let color = colorMap._default;
  if (colorMap[proxy]) {
    color = colorMap[proxy];
  }
  return { color };
}

type Props = {
  id?: number;
  type?: string;
  payload?: string;
  proxy?: string;
};

function Rule({ type, payload, proxy, id }: Props) {
  const styleProxy = getStyleFor({ proxy });
  const proxyStyle = getProxyStyle({ proxy });
  
  return (
    <div className={s0.rule}>
      <div className={s0.ruleCard}>
        {/* Rule ID */}
        <div className={s0.ruleId}>
          <span className="badge badge-outline text-muted">
            #{id}
          </span>
        </div>
        
        {/* Rule Content */}
        <div className={s0.ruleContent}>
          {/* Payload */}
          <div className={s0.payload}>
            <i className="ti ti-code me-2 text-muted"></i>
            <code className="text-primary">{payload}</code>
          </div>
          
          {/* Rule Details */}
          <div className={s0.ruleDetails}>
            {/* Rule Type */}
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-outline text-secondary">
                <i className="ti ti-filter me-1"></i>
                {type}
              </span>
              
              {/* Proxy */}
              <span className={`badge badge-outline text-${proxyStyle.color}`}>
                <i className={`ti ti-${proxyStyle.icon} me-1`}></i>
                {proxy}
              </span>
            </div>
          </div>
        </div>
        
        {/* Rule Actions */}
        <div className={s0.ruleActions}>
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
                <i className="ti ti-copy me-2"></i>
                Copy Rule
              </button>
              <button className="dropdown-item">
                <i className="ti ti-info-circle me-2"></i>
                Rule Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rule;
