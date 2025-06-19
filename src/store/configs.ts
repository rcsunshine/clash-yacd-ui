import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { fetchConfigs2 } from '$src/api/configs';
import { ENDPOINT } from '$src/misc/constants';
import { useApiConfig } from '$src/store/app';

export function useClashConfig() {
  const apiConfig = useApiConfig();
  const prevApiConfigRef = useRef<typeof apiConfig>();
  
  // 监听API配置变化，确保查询使用最新配置
  useEffect(() => {
    const configChanged = prevApiConfigRef.current && 
      (prevApiConfigRef.current.baseURL !== apiConfig?.baseURL || 
       prevApiConfigRef.current.secret !== apiConfig?.secret);
    
    if (configChanged) {
      console.log('🔄 V1 ClashConfig: API config changed, cache will be refreshed');
    }
    
    prevApiConfigRef.current = apiConfig;
  }, [apiConfig]);
  
  return useQuery({
    queryKey: [ENDPOINT.config, apiConfig?.baseURL, apiConfig?.secret],
    queryFn: () => fetchConfigs2({ queryKey: [ENDPOINT.config, apiConfig] as const }),
    enabled: !!apiConfig?.baseURL,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
