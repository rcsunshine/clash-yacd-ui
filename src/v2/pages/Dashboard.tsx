import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { useSystemInfo, useClashConfig, useTraffic, useConnections, useConnectionStats } from '../hooks/useAPI';
import { useAppState } from '../store';

const TrafficChart: React.FC = () => {
  const { data: trafficData, isConnected } = useTraffic();
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const latestData = trafficData[trafficData.length - 1];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">实时流量监控</h3>
          </div>
          <StatusIndicator 
            status={isConnected ? 'success' : 'error'} 
            label={isConnected ? '已连接' : '未连接'} 
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 p-4 rounded-lg border border-slate-300 dark:border-slate-600/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-400/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">上传速度</div>
                </div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {latestData ? formatBytes(latestData.up) + '/s' : '0 B/s'}
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-700/30 p-4 rounded-lg border border-zinc-300 dark:border-zinc-600/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-zinc-400/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-zinc-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">下载速度</div>
                </div>
                <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">
                  {latestData ? formatBytes(latestData.down) + '/s' : '0 B/s'}
                </div>
              </div>
            </div>
          </div>
          
          {trafficData.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  流量趋势图
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  最近 {trafficData.length} 个数据点
                </div>
              </div>
              <div className="h-24 flex items-end space-x-1 bg-white dark:bg-gray-800 rounded-lg p-2">
                {trafficData.slice(-60).map((data, index) => {
                  const maxValue = Math.max(...trafficData.map(d => Math.max(d.up, d.down)));
                  const upHeight = maxValue > 0 ? (data.up / maxValue) * 100 : 0;
                  const downHeight = maxValue > 0 ? (data.down / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col justify-end h-full w-1 space-y-0.5">
                      <div 
                        className="bg-gradient-to-t from-slate-500 to-slate-600 w-full rounded-sm"
                        style={{ height: `${upHeight}%`, minHeight: upHeight > 0 ? '2px' : '0' }}
                      />
                      <div 
                        className="bg-gradient-to-t from-zinc-500 to-zinc-600 w-full rounded-sm"
                        style={{ height: `${downHeight}%`, minHeight: downHeight > 0 ? '2px' : '0' }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center space-x-6 mt-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">上传</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-zinc-500 to-zinc-600 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">下载</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SystemInfoCard: React.FC = () => {
  const { data: systemInfo, isLoading, error } = useSystemInfo();
  const { uploadTotalFormatted, downloadTotalFormatted, isConnected: statsConnected } = useConnectionStats();
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-stone-700 to-stone-800 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">系统信息</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400 text-center py-4">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>加载失败: {String(error)}</p>
          </div>
        ) : systemInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20 p-4 rounded-lg border border-slate-300 dark:border-slate-600/40">
                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">版本</div>
                <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{systemInfo.version}</div>
              </div>
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/30 dark:to-zinc-700/20 p-4 rounded-lg border border-zinc-300 dark:border-zinc-600/40">
                <div className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mb-1">模式</div>
                <div className="text-lg font-bold text-zinc-700 dark:text-zinc-200 capitalize">{systemInfo.mode}</div>
              </div>
            </div>
            

            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/20 rounded-lg border border-gray-300 dark:border-gray-600/40">
                <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">总上传</div>
                <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
                  {statsConnected ? uploadTotalFormatted : '0 B'}
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/30 dark:to-neutral-700/20 rounded-lg border border-neutral-300 dark:border-neutral-600/40">
                <div className="text-xs text-neutral-600 dark:text-neutral-300 font-medium mb-1">总下载</div>
                <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                  {statsConnected ? downloadTotalFormatted : '0 B'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">暂无数据</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ConnectionsCard: React.FC = () => {
  const { data: connectionsData, isLoading, error } = useConnections();
  const connections = connectionsData?.connections || [];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">活跃连接</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400 text-center py-4">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>加载失败: {String(error)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/20 rounded-lg border border-gray-300 dark:border-gray-600/40">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {connections.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                个活跃连接
              </div>
            </div>
            
            {connections.length > 0 && (
              <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar">
                {connections.slice(0, 3).map((conn, index) => (
                  <div key={conn.id || index} className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="font-medium truncate text-gray-900 dark:text-white">
                      {conn.metadata?.host || conn.metadata?.destinationIP || 'Unknown'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                      <span>{conn.metadata?.network}</span>
                      <span>•</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {conn.chains?.[0] || 'Direct'}
                      </span>
                    </div>
                  </div>
                ))}
                {connections.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                    还有 {connections.length - 3} 个连接...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ConfigStatusCard: React.FC = () => {
  const { data: config, isLoading, error, updateConfig } = useClashConfig();
  const { state } = useAppState();
  
  const handleModeChange = async (newMode: string) => {
    try {
      await updateConfig({ mode: newMode as 'global' | 'rule' | 'direct' });
    } catch (error) {
      console.error('Failed to update mode:', error);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-neutral-700 to-neutral-800 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">配置状态</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400 text-center py-4">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>加载失败: {String(error)}</p>
          </div>
        ) : config ? (
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800/30 dark:to-stone-700/20 rounded-lg border border-stone-300 dark:border-stone-600/40">
              <div className="flex justify-between items-center">
                <span className="text-stone-700 dark:text-stone-300 font-medium text-sm">代理模式</span>
                <select 
                  value={config.mode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-stone-400 dark:border-stone-600 rounded px-2 py-1 text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  <option value="rule">规则</option>
                  <option value="global">全局</option>
                  <option value="direct">直连</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20 rounded border border-slate-300 dark:border-slate-600/40">
                <div className="text-slate-600 dark:text-slate-400 font-medium">HTTP</div>
                <div className="text-slate-700 dark:text-slate-300 font-bold">{config.port}</div>
              </div>
              <div className="p-2 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/30 dark:to-zinc-700/20 rounded border border-zinc-300 dark:border-zinc-600/40">
                <div className="text-zinc-600 dark:text-zinc-400 font-medium">SOCKS</div>
                <div className="text-zinc-700 dark:text-zinc-300 font-bold">{config['socks-port']}</div>
              </div>
              <div className="p-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/20 rounded border border-gray-300 dark:border-gray-600/40">
                <div className="text-gray-600 dark:text-gray-400 font-medium">局域网</div>
                <StatusIndicator 
                  status={config['allow-lan'] ? 'success' : 'warning'} 
                  label={config['allow-lan'] ? '允许' : '禁止'} 
                />
              </div>
              <div className="p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/30 dark:to-neutral-700/20 rounded border border-neutral-300 dark:border-neutral-600/40">
                <div className="text-neutral-600 dark:text-neutral-400 font-medium">日志</div>
                <div className="text-neutral-700 dark:text-neutral-300 font-bold capitalize">{config['log-level']}</div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                <span className="font-medium">API:</span> {state.apiConfig.baseURL}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">暂无数据</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* 紧凑的页面头部 */}
      <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">仪表板</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Clash 代理服务状态总览</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SystemInfoCard />
        <ConnectionsCard />
        <ConfigStatusCard />
        <Card className="overflow-hidden card-hover">
          <CardHeader className="bg-gradient-to-r from-stone-700 to-neutral-800 text-white">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">快速操作</h3>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button variant="outline" size="sm" fullWidth className="text-xs justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                </svg>
                代理设置
              </Button>
              <Button variant="outline" size="sm" fullWidth className="text-xs justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                规则管理
              </Button>
              <Button variant="outline" size="sm" fullWidth className="text-xs justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                连接管理
              </Button>
              <Button variant="outline" size="sm" fullWidth className="text-xs justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                日志查看
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <TrafficChart />
    </div>
  );
}; 