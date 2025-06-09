import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { useSystemInfo, useClashConfig, useTraffic, useConnections } from '../hooks/useAPI';
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">实时流量监控</h3>
          <StatusIndicator 
            status={isConnected ? 'success' : 'error'} 
            label={isConnected ? '已连接' : '未连接'} 
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">上传速度</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {latestData ? formatBytes(latestData.up) + '/s' : '0 B/s'}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">下载速度</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {latestData ? formatBytes(latestData.down) + '/s' : '0 B/s'}
              </div>
            </div>
          </div>
          
          {trafficData.length > 0 && (
            <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                流量趋势图 (最近 {trafficData.length} 个数据点)
              </div>
              <div className="h-20 flex items-end space-x-1">
                {trafficData.slice(-50).map((data, index) => {
                  const maxValue = Math.max(...trafficData.map(d => Math.max(d.up, d.down)));
                  const upHeight = maxValue > 0 ? (data.up / maxValue) * 100 : 0;
                  const downHeight = maxValue > 0 ? (data.down / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col justify-end h-full w-1">
                      <div 
                        className="bg-blue-400 w-full"
                        style={{ height: `${upHeight}%` }}
                      />
                      <div 
                        className="bg-green-400 w-full"
                        style={{ height: `${downHeight}%` }}
                      />
                    </div>
                  );
                })}
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
  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">系统信息</h3>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">
            <p>加载失败: {error}</p>
          </div>
        ) : systemInfo ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">版本</span>
              <span className="font-medium">{systemInfo.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">模式</span>
              <span className="font-medium capitalize">{systemInfo.mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Premium</span>
              <StatusIndicator 
                status={systemInfo.premium ? 'success' : 'warning'} 
                label={systemInfo.premium ? '是' : '否'} 
              />
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-400">总上传</span>
                <span className="font-medium">{(systemInfo.uploadTotal / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">总下载</span>
                <span className="font-medium">{(systemInfo.downloadTotal / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">暂无数据</p>
        )}
      </CardContent>
    </Card>
  );
};

const ConnectionsCard: React.FC = () => {
  const { data: connectionsData, isLoading, error } = useConnections();
  const connections = connectionsData?.connections || [];
  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">活跃连接</h3>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">
            <p>加载失败: {error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {connections.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              个活跃连接
            </div>
            
            {connections.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {connections.slice(0, 5).map((conn, index) => (
                  <div key={conn.id || index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="font-medium truncate">
                      {conn.metadata?.host || conn.metadata?.destinationIP || 'Unknown'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {conn.metadata?.network} • {conn.chains?.[0] || 'Direct'}
                    </div>
                  </div>
                ))}
                {connections.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    还有 {connections.length - 5} 个连接...
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
      await updateConfig({ mode: newMode });
    } catch (error) {
      console.error('Failed to update mode:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">配置状态</h3>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">
            <p>加载失败: {error}</p>
          </div>
        ) : config ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">代理模式</span>
              <select 
                value={config.mode}
                onChange={(e) => handleModeChange(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="rule">规则模式</option>
                <option value="global">全局模式</option>
                <option value="direct">直连模式</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">HTTP 端口</div>
                <div className="font-medium">{config.port}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">SOCKS 端口</div>
                <div className="font-medium">{config['socks-port']}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">允许局域网</div>
                <StatusIndicator 
                  status={config['allow-lan'] ? 'success' : 'warning'} 
                  label={config['allow-lan'] ? '是' : '否'} 
                />
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">日志级别</div>
                <div className="font-medium capitalize">{config['log-level']}</div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                API: {state.apiConfig.baseURL}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">暂无数据</p>
        )}
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            仪表板
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Clash 代理服务状态总览
          </p>
        </div>
        <Button variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SystemInfoCard />
        <ConnectionsCard />
        <ConfigStatusCard />
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">快速操作</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" fullWidth>
                代理设置
              </Button>
              <Button variant="outline" size="sm" fullWidth>
                规则管理
              </Button>
              <Button variant="outline" size="sm" fullWidth>
                连接管理
              </Button>
              <Button variant="outline" size="sm" fullWidth>
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