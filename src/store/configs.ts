import { useQuery } from '@tanstack/react-query';

import { fetchConfigs2 } from '$src/api/configs';
import { ENDPOINT } from '$src/misc/constants';
import { useApiConfig } from '$src/store/app';

export function useClashConfig() {
  const apiConfig = useApiConfig();
  
  return useQuery({
    queryKey: [ENDPOINT.config, apiConfig?.baseURL, apiConfig?.secret],
    queryFn: () => fetchConfigs2({ queryKey: [ENDPOINT.config, apiConfig] as const }),
    enabled: !!apiConfig?.baseURL,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
