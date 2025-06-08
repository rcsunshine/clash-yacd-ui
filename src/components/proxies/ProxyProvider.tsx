import { Tooltip } from '@reach/tooltip';
import { formatDistance } from 'date-fns';
import { useAtom } from 'jotai';
import * as React from 'react';
import { RotateCw } from 'react-feather';
import Button from 'src/components/Button';
import CollapsibleSectionHeader from 'src/components/CollapsibleSectionHeader';
import { useUpdateProviderItem } from 'src/components/proxies/proxies.hooks';
import { connect } from 'src/components/StateProvider';
import { framerMotionResource } from 'src/misc/motion';
import {
  collapsibleIsOpenAtom,
  hideUnavailableProxiesAtom,
  proxySortByAtom,
  useApiConfig,
} from 'src/store/app';
import { getDelay, healthcheckProviderByName } from 'src/store/proxies';
import { DelayMapping, State } from 'src/store/types';

import { ZapAnimated } from '$src/components/shared/ZapAnimated';
import { useState2 } from '$src/hooks/basic';

import { useFilteredAndSorted } from './hooks';
import { ProxyList, ProxyListSummaryView } from './ProxyList';
import s from './ProxyProvider.module.scss';

const { useCallback } = React;

type Props = {
  name: string;
  proxies: string[];
  delay: DelayMapping;
  type: 'Proxy' | 'Rule';
  vehicleType: 'HTTP' | 'File' | 'Compatible';
  updatedAt?: string;
  dispatch: (x: any) => Promise<any>;
};

function ProxyProviderImpl({ name, proxies: all, delay, vehicleType, updatedAt, dispatch }: Props) {
  const [collapsibleIsOpen, setCollapsibleIsOpen] = useAtom(collapsibleIsOpenAtom);
  const isOpen = collapsibleIsOpen[`proxyProvider:${name}`];
  const [proxySortBy] = useAtom(proxySortByAtom);
  const [hideUnavailableProxies] = useAtom(hideUnavailableProxiesAtom);
  const apiConfig = useApiConfig();
  const proxies = useFilteredAndSorted(all, delay, hideUnavailableProxies, proxySortBy);
  const checkingHealth = useState2(false);
  const updateProvider = useUpdateProviderItem({ dispatch, apiConfig, name });
  const healthcheckProvider = useCallback(() => {
    if (checkingHealth.value) return;
    checkingHealth.set(true);
    const stop = () => checkingHealth.set(false);
    dispatch(healthcheckProviderByName(apiConfig, name)).then(stop, stop);
  }, [apiConfig, dispatch, name, checkingHealth]);
  const updateCollapsibleIsOpen = useCallback(
    (prefix: string, name: string, v: boolean) => {
      setCollapsibleIsOpen((s) => ({ ...s, [`${prefix}:${name}`]: v }));
    },
    [setCollapsibleIsOpen],
  );
  const toggle = useCallback(() => {
    updateCollapsibleIsOpen('proxyProvider', name, !isOpen);
  }, [isOpen, updateCollapsibleIsOpen, name]);

  const timeAgo = formatDistance(new Date(updatedAt), new Date());

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'HTTP':
        return 'ti-world-www';
      case 'File':
        return 'ti-file';
      case 'Compatible':
        return 'ti-puzzle';
      default:
        return 'ti-cloud';
    }
  };

  const getVehicleTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'HTTP':
        return 'badge-info';
      case 'File':
        return 'badge-warning';
      case 'Compatible':
        return 'badge-secondary';
      default:
        return 'badge-outline';
    }
  };

  return (
    <div className={s.modernProvider}>
      <div className={s.providerHeader}>
        <div className={s.providerInfo}>
          <div className={s.providerTitle}>
            <div className="d-flex align-items-center gap-2">
              <button
                className={`btn btn-ghost p-0 d-flex align-items-center gap-2 ${s.toggleButton}`}
                onClick={toggle}
              >
                <i className={`ti ${isOpen ? 'ti-chevron-down' : 'ti-chevron-right'} ${s.chevron}`}></i>
                <div className="d-flex align-items-center gap-2">
                  <i className={`ti ${getVehicleTypeIcon(vehicleType)} text-primary`}></i>
                  <span className="fw-semibold">{name}</span>
                </div>
              </button>
              
              <Tooltip label="Health check">
                <button
                  className="btn btn-ghost-secondary btn-sm d-flex align-items-center justify-content-center"
                  style={{ width: '28px', height: '28px' }}
                  onClick={healthcheckProvider}
                  disabled={checkingHealth.value}
                >
                  {checkingHealth.value ? (
                    <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <i className="ti ti-bolt" style={{ fontSize: '14px' }}></i>
                  )}
                </button>
              </Tooltip>
              
              <Tooltip label="Update provider">
                <button
                  className="btn btn-ghost-secondary btn-sm d-flex align-items-center justify-content-center"
                  style={{ width: '28px', height: '28px' }}
                  onClick={updateProvider}
                >
                  <i className="ti ti-refresh" style={{ fontSize: '14px' }}></i>
                </button>
              </Tooltip>
            </div>
          </div>
          
          <div className={s.providerMeta}>
            <span className={`badge ${getVehicleTypeBadgeClass(vehicleType)} badge-sm`}>
              {vehicleType}
            </span>
            <span className="text-muted">
              {proxies.length} {proxies.length === 1 ? 'proxy' : 'proxies'}
            </span>
            {updatedAt && (
              <div className="d-flex align-items-center gap-1 text-muted">
                <i className="ti ti-clock" style={{ fontSize: '12px' }}></i>
                <span style={{ fontSize: '0.8rem' }}>Updated {timeAgo} ago</span>
              </div>
            )}
          </div>
        </div>

        <div className={s.providerActions}>
          {/* 保留右侧区域以备将来扩展 */}
        </div>
      </div>

      {isOpen && (
        <div className={s.providerContent}>
          <div className={s.proxyContainer}>
            <ProxyList all={proxies} />
          </div>
        </div>
      )}

      {!isOpen && proxies.length > 0 && (
        <div className={s.summaryView}>
          <ProxyListSummaryView all={proxies.slice(0, 20)} />
          {proxies.length > 20 && (
            <span className="text-muted ms-2">+{proxies.length - 20} more</span>
          )}
        </div>
      )}
    </div>
  );
}

const button = {
  rest: { scale: 1 },
  pressed: { scale: 0.95 },
};
const arrow = {
  rest: { rotate: 0 },
  hover: { rotate: 360, transition: { duration: 0.3 } },
};
function Refresh() {
  const module = framerMotionResource.read();
  const motion = module.motion;
  return (
    <motion.div
      className={s.refresh}
      variants={button}
      initial="rest"
      whileHover="hover"
      whileTap="pressed"
    >
      <motion.div className="flexCenter" variants={arrow}>
        <RotateCw size={16} />
      </motion.div>
    </motion.div>
  );
}

const mapState = (s: State, { proxies }) => {
  const delay = getDelay(s);
  return {
    proxies,
    delay,
  };
};

export const ProxyProvider = connect(mapState)(ProxyProviderImpl);
