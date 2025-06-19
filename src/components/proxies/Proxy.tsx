import { TooltipPopup, useTooltip } from '@reach/tooltip';
import cx from 'clsx';
import * as React from 'react';

import { connect } from '$src/components/StateProvider';
import { getDelay, getProxies } from '$src/store/proxies';
import { State } from '$src/store/types';

import s0 from './Proxy.module.scss';

const { useMemo } = React;

type ProxyDelayItem = {
  kind: 'Result';
  number: number;
} | {
  kind: 'Testing';
} | {
  kind: 'Error';
  message: string;
} | {
  kind: 'None';
};

function getLabelColor(latency?: ProxyDelayItem) {
  if (!latency) return 'var(--color-text-secondary)';
  
  if (latency.kind === 'Testing') {
    return '#ffa726';  // 测试中使用橙色
  }
  
  if (latency.kind === 'Error' || latency.kind === 'None') {
    return 'var(--color-text-secondary)';
  }
  
  if (latency.kind === 'Result') {
    const number = latency.number;
    // 延迟颜色分级：200ms, 500ms, 2000ms, 5000ms
    if (number < 200) return '#2e7d32';       // 快 (< 200ms) - 深绿色
    if (number < 500) return '#66bb6a';       // 中等 (200-500ms) - 浅绿色
    if (number < 2000) return '#ff8f00';      // 慢 (500-2000ms) - 橙色
    if (number < 5000) return '#ef5350';      // 很慢 (2000-5000ms) - 浅红色
    return '#c62828';                         // 极慢 (> 5000ms) - 深红色
  }
  
  return 'var(--color-text-secondary)';
}

function getLatencyBadgeClass(latency?: ProxyDelayItem) {
  if (!latency) return 'badge-secondary';
  
  if (latency.kind === 'Testing') {
    return 'badge-warning';  // 测试中使用警告样式
  }
  
  if (latency.kind === 'Error' || latency.kind === 'None') {
    return 'badge-secondary';
  }
  
  if (latency.kind === 'Result') {
    const number = latency.number;
    // 徽章分类：200ms, 500ms, 2000ms, 5000ms
    if (number < 200) return 'badge-success';     // 快 (< 200ms)
    if (number < 500) return 'badge-warning';     // 中等 (200-500ms)
    if (number < 2000) return 'badge-danger';     // 慢 (500-2000ms)
    return 'badge-danger';                        // 很慢和极慢 (> 2000ms)
  }
  
  return 'badge-secondary';
}

function getProxyTypeIcon(type: string) {
  // 确保type存在且为字符串
  if (!type || typeof type !== 'string') {
    return 'ti-server';
  }
  
  switch (type.toLowerCase()) {
    case 'shadowsocks':
    case 'ss':
      return 'ti-shield';           // 盾牌 - Shadowsocks
    case 'vmess':
      return 'ti-message';          // 消息图标 - VMess
    case 'vless':
      return 'ti-lock';             // 锁图标 - VLess
    case 'trojan':
    case 'trojan-go':
      return 'ti-key';              // 钥匙图标 - Trojan
    case 'http':
    case 'https':
      return 'ti-world';            // 世界图标 - HTTP
    case 'socks5':
    case 'socks':
      return 'ti-plug';             // 插头图标 - SOCKS
    case 'snell':
      return 'ti-rocket';           // 火箭图标 - Snell
    case 'wireguard':
    case 'wg':
      return 'ti-shield-check';     // 带勾盾牌 - WireGuard
    case 'hysteria':
      return 'ti-bolt';             // 闪电图标 - Hysteria
    case 'hysteria2':
      return 'ti-flash';            // 闪光图标 - Hysteria2
    case 'tuic':
      return 'ti-chart-line';       // 图表图标 - TUIC
    case 'ssr':
      return 'ti-star';             // 星星图标 - SSR
    case 'direct':
      return 'ti-arrow-right';      // 右箭头 - 直连
    case 'reject':
      return 'ti-x';                // X图标 - 拒绝
    case 'selector':
      return 'ti-list';             // 列表图标 - 选择器
    case 'urltest':
      return 'ti-activity';         // 活动图标 - URL测试
    case 'fallback':
      return 'ti-refresh';          // 刷新图标 - 故障转移
    case 'loadbalance':
      return 'ti-scale';            // 天平图标 - 负载均衡
    case 'relay':
      return 'ti-repeat';           // 重复图标 - 中继
    default:
      return 'ti-server';           // 服务器图标 - 默认
  }
}

function formatProxyType(type: string) {
  return type.toUpperCase();
}

function getProxyTypeDisplayName(type: string) {
  switch (type.toLowerCase()) {
    case 'shadowsocks':
    case 'ss':
      return 'SS';
    case 'vmess':
      return 'VM';
    case 'vless':
      return 'VL';
    case 'trojan':
    case 'trojan-go':
      return 'TJ';
    case 'http':
    case 'https':
      return 'HTTP';
    case 'socks5':
    case 'socks':
      return 'SOCKS';
    case 'snell':
      return 'SNELL';
    case 'wireguard':
    case 'wg':
      return 'WG';
    case 'hysteria':
      return 'HY';
    case 'hysteria2':
      return 'HY2';
    case 'tuic':
      return 'TUIC';
    case 'ssr':
      return 'SSR';
    case 'direct':
      return 'DIRECT';
    case 'reject':
      return 'REJECT';
    case 'selector':
      return 'SELECT';
    case 'urltest':
      return 'URL';
    case 'fallback':
      return 'FALL';
    case 'loadbalance':
      return 'LB';
    case 'relay':
      return 'RELAY';
    default:
      return type.toUpperCase().slice(0, 4);
  }
}

function getProxyDotStyle(latency?: ProxyDelayItem, proxyType?: string) {
  let backgroundColor = 'var(--color-text-secondary)';
  
  if (proxyType === 'DIRECT') {
    backgroundColor = '#2e7d32';  // 直连使用深绿色
  } else if (proxyType === 'REJECT') {
    backgroundColor = '#c62828';  // 拒绝使用深红色
  } else if (latency) {
    if (latency.kind === 'Result') {
      // 使用与文字相同的颜色逻辑
      backgroundColor = getLabelColor(latency);
    } else if (latency.kind === 'Testing') {
      backgroundColor = '#ffa726';  // 测试中使用橙色
    } else {
      backgroundColor = 'var(--color-text-secondary)';  // 错误或无状态使用灰色
    }
  }
  
  return { 
    backgroundColor,
    background: backgroundColor,  // 添加backup属性
    '--dot-color': backgroundColor  // 添加CSS变量
  };
}

function ProxyLatency({ latency, color }: { latency?: ProxyDelayItem; color: string }) {
  if (!latency) return <span className="text-muted">-</span>;
  
  if (latency.kind === 'Testing') {
    return (
      <span className="fw-medium" style={{ color: '#ffa726' }}>
        <i className="ti ti-loader-2 me-1 spin"></i>
        Testing
      </span>
    );
  }
  
  if (latency.kind === 'Error') {
    return (
      <span className="fw-medium" style={{ color: 'var(--tblr-danger)' }}>
        <i className="ti ti-x me-1"></i>
        Error
      </span>
    );
  }
  
  if (latency.kind === 'None') {
    return <span className="text-muted">-</span>;
  }
  
  if (latency.kind === 'Result') {
    // 使用与小圆点相同的颜色逻辑
    const textColor = getLabelColor(latency);
    
    return (
      <span className="fw-medium" style={{ color: textColor }}>
        {latency.number}ms
      </span>
    );
  }
  
  return <span className="text-muted">-</span>;
}

type ProxyProps = {
  name: string;
  now?: boolean;
  proxy: any;
  latency?: ProxyDelayItem;
  isSelectable?: boolean;
  onClick?: (proxyName: string) => unknown;
};

function getLatencyLevel(latency?: ProxyDelayItem): string {
  if (!latency) return 'unknown';
  
  if (latency.kind === 'Testing') {
    return 'testing';  // 测试中状态
  }
  
  if (latency.kind === 'Error' || latency.kind === 'None') {
    return 'unknown';
  }
  
  if (latency.kind === 'Result') {
    const number = latency.number;
    // 延迟级别：200ms, 500ms, 2000ms, 5000ms
    if (number < 200) return 'fast';          // 快 (< 200ms)
    if (number < 500) return 'medium';        // 中等 (200-500ms)
    if (number < 2000) return 'slow';         // 慢 (500-2000ms)
    if (number < 5000) return 'very-slow';    // 很慢 (2000-5000ms)
    return 'extremely-slow';                  // 极慢 (> 5000ms)
  }
  
  return 'unknown';
}

function ProxySmallImpl({ now, name, proxy, latency, isSelectable, onClick }: ProxyProps) {
  const baseStyle = useMemo(() => getProxyDotStyle(latency, proxy.type), [latency, proxy]);
  
  // 创建完全独立的内联样式，不依赖CSS类
  const style = useMemo(() => {
    const color = baseStyle.backgroundColor;
    return {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      display: 'inline-block',
      cursor: isSelectable ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      border: now ? '2px solid var(--color-focus-blue)' : '2px solid transparent',
      backgroundColor: color,
      boxShadow: now ? '0 0 0 2px rgba(var(--color-focus-blue-rgb), 0.25)' : 'none',
      transform: now ? 'scale(1.2)' : 'scale(1)',
      outline: 'none',
      // 强制覆盖任何可能的背景样式
      backgroundImage: 'none',
      backgroundSize: 'auto',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'scroll',
      backgroundOrigin: 'padding-box',
      backgroundClip: 'border-box'
    };
  }, [baseStyle, now, isSelectable]);
  
  const title = useMemo(() => {
    let ret = name;
    if (latency && latency.kind === 'Result' && typeof latency.number === 'number') {
      ret += ' ' + latency.number + ' ms';
    }
    return ret;
  }, [name, latency]);

  const doSelect = React.useCallback(() => {
    isSelectable && onClick && onClick(name);
  }, [name, onClick, isSelectable]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') doSelect();
    },
    [doSelect],
  );

  const handleMouseEnter = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelectable) {
      e.currentTarget.style.transform = now ? 'scale(1.3)' : 'scale(1.15)';
      e.currentTarget.style.boxShadow = '0 0 6px rgba(0, 0, 0, 0.15)';
    }
  }, [isSelectable, now]);

  const handleMouseLeave = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelectable) {
      e.currentTarget.style.transform = now ? 'scale(1.2)' : 'scale(1)';
      e.currentTarget.style.boxShadow = now ? '0 0 0 2px rgba(var(--color-focus-blue-rgb), 0.25)' : 'none';
    }
  }, [isSelectable, now]);

  // 获取延迟级别用于CSS选择器
  const latencyLevel = useMemo(() => getLatencyLevel(latency), [latency]);
  const proxyTypeLevel = proxy.type === 'DIRECT' ? 'direct' : proxy.type === 'REJECT' ? 'reject' : 'proxy';

  return (
    <div
      title={title}
      style={style}
      data-latency={latencyLevel}
      data-proxy-type={proxyTypeLevel}
      data-color={baseStyle.backgroundColor}
      onClick={doSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={isSelectable ? 'menuitem' : ''}
      tabIndex={isSelectable ? 0 : -1}
    />
  );
}

const positionProxyNameTooltip = (triggerRect: { left: number; top: number }) => {
  return {
    left: triggerRect.left + window.scrollX - 5,
    top: triggerRect.top + window.scrollY - 38,
  };
};

function ProxyNameTooltip({
  children,
  label,
  'aria-label': ariaLabel,
}: {
  children: React.ReactElement;
  label: string;
  'aria-label': string;
}) {
  const [trigger, tooltip] = useTooltip();
  return (
    <>
      {React.cloneElement(children, trigger)}
      <TooltipPopup
        {...tooltip}
        label={label}
        aria-label={ariaLabel}
        position={positionProxyNameTooltip}
      />
    </>
  );
}

function ProxyImpl({ now, name, proxy, latency, isSelectable, onClick }: ProxyProps) {
  const color = useMemo(() => getLabelColor(latency), [latency]);
  const doSelect = React.useCallback(() => {
    isSelectable && onClick && onClick(name);
  }, [name, onClick, isSelectable]);
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') doSelect();
    },
    [doSelect],
  );
  const className = useMemo(() => {
    return cx(s0.proxy, s0.modernProxy, {
      [s0.now]: now,
      [s0.selectable]: isSelectable,
    });
  }, [isSelectable, now]);



  return (
    <div
      tabIndex={0}
      className={className}
      onClick={doSelect}
      onKeyDown={handleKeyDown}
      role={isSelectable ? 'menuitem' : ''}
    >
      <div className={s0.proxyHeader}>
        <div className={s0.proxyIcon}>
          <i 
            className={`ti ${getProxyTypeIcon(proxy.type)}`} 
            title={`${proxy.type}`}
          ></i>
        </div>
        <div className={s0.proxyName}>
          <ProxyNameTooltip label={name} aria-label={'proxy name: ' + name}>
            <span className="fw-medium">{name}</span>
          </ProxyNameTooltip>
        </div>
        {now && (
          <div className={s0.activeIndicator}>
            <i className="ti ti-point-filled text-success"></i>
          </div>
        )}
      </div>
      
      <div className={s0.proxyFooter}>
        <div className={s0.proxyType}>
          <span className={`badge badge-sm`}>
            {formatProxyType(proxy.type)}
          </span>
        </div>
        <div className={s0.proxyLatency}>
          <ProxyLatency latency={latency} color={color} />
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (s: State, { name }: { name: string }) => {
  const proxies = getProxies(s);
  const delay = getDelay(s);
  return {
    proxy: proxies[name],
    latency: delay[name],
  };
};

export const Proxy = connect(mapStateToProps)(ProxyImpl);
export const ProxySmall = connect(mapStateToProps)(ProxySmallImpl);
