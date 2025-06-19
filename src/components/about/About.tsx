import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { fetchVersion } from 'src/api/version';
import { ContentHeader } from 'src/components/ContentHeader';
import { useApiConfig } from 'src/store/app';

import { GitHubIcon } from '../icon/GitHubIcon';
import s from './About.module.scss';

function Version({ name, link, version }: { name: string; link: string; version: string }) {
  return (
    <div className={s.root}>
      <h2>{name}</h2>
      <p>
        <span>Version </span>
        <span className={s.mono}>{version}</span>
      </p>
      <p>
        <a className={s.link} href={link} target="_blank" rel="noopener noreferrer">
          <GitHubIcon size={20} />
          <span>Source</span>
        </a>
      </p>
    </div>
  );
}

export function About() {
  const apiConfig = useApiConfig();
  
  const { data: version } = useQuery({
    queryKey: ['/version', apiConfig?.baseURL, apiConfig?.secret],
    queryFn: () => fetchVersion({ queryKey: ['/version', apiConfig] as const }),
    enabled: !!apiConfig?.baseURL,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  return (
    <>
      <ContentHeader title="About" />
      {version && version.version ? (
        <Version name="Clash" version={version.version} link="https://github.com/Dreamacro/clash" />
      ) : null}
      <Version name="Yacd" version={__VERSION__} link="https://github.com/haishanh/yacd" />
    </>
  );
}
