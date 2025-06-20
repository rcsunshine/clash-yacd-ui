import React from 'react';
import { useTranslation } from 'react-i18next';
import { List } from 'reselect/es/types';

import Button from './Button';
import styles from './SourceIP.module.scss';

type Props = {
  setFilterIpStr?: (string) => void;
  connIPset?: List<string>;
};

function SourceIp({ setFilterIpStr: toggle, connIPset: conns }: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.srcIps}>
      <Button onClick={() => toggle('')} kind="minimal">
        {t('All')}
      </Button>
      {conns.map((ip, index) => {
        return (
          <Button key={index} onClick={() => toggle(ip)} kind="minimal">
            {ip}
          </Button>
        );
      })}
    </div>
  );
}

export default SourceIp;
