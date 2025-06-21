import isNetworkError from 'is-network-error';

import {
  YacdBackendGeneralError,
  YacdBackendUnauthorizedError,
  YacdFetchNetworkError,
} from '$src/misc/errors';
import { getURLAndInit } from '$src/misc/request-helper';
import { ClashAPIConfig, FetchCtx } from '$src/types';

export type QueryCtx = {
  queryKey: readonly [string, ClashAPIConfig];
};

export function req(url: string, init: RequestInit) {
  // 禁用mock，总是使用真实API
  return fetch(url, init);
}

export async function query(ctx: QueryCtx) {
  const endpoint = ctx.queryKey[0];
  const apiConfig = ctx.queryKey[1];
  const { url, init } = getURLAndInit(apiConfig);

  // 修复URL拼接问题：确保baseURL和endpoint之间有正确的斜杠
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const endpointPath = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const fullUrl = baseUrl + endpointPath;

  let res: Response;
  try {
    res = await req(fullUrl, init);
  } catch (err) {
    handleFetchError(err, { endpoint, apiConfig });
  }
  await validateFetchResponse(res, { endpoint, apiConfig });
  if (res.ok) {
    return await res.json();
  }
  // can return undefined
}

export function handleFetchError(err: unknown, ctx: FetchCtx) {
  if (isNetworkError(err)) throw new YacdFetchNetworkError('', ctx);
  throw err;
}

async function validateFetchResponse(res: Response, ctx: FetchCtx) {
  if (res.status === 401) throw new YacdBackendUnauthorizedError('', ctx);
  if (res.status === 404) {
    console.warn(`Server returns 404: ${ctx.endpoint}`);
    return res;
  }
  if (!res.ok)
    throw new YacdBackendGeneralError('', {
      ...ctx,
      response: await simplifyRes(res),
    });
  return res;
}

export type SimplifiedResponse = {
  status: number;
  headers: string[];
  data?: any;
};

async function simplifyRes(res: Response): Promise<SimplifiedResponse> {
  const headers: string[] = [];
  for (const [k, v] of res.headers) {
    headers.push(`${k}: ${v}`);
  }

  let data: any;
  try {
    data = await res.text();
  } catch (e) {
    // ignore
  }

  return {
    status: res.status,
    headers,
    data,
  };
}
