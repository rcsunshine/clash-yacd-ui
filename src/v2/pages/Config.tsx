import React, { useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent,CardHeader } from '../components/ui/Card';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { useClashConfig, useSystemInfo } from '../hooks/useAPI';
import { useAppState } from '../store';
import { LogLevel } from '../types/api';

const ConfigSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <Card>
    <CardHeader>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-theme-secondary">{description}</p>
      )}
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

const ConfigItem: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-theme last:border-b-0">
    <div className="flex-1">
      <div className="font-medium text-theme">{label}</div>
      {description && (
        <div className="text-sm text-theme-secondary">{description}</div>
      )}
    </div>
    <div className="ml-4">
      {children}
    </div>
  </div>
);

export const Config: React.FC = () => {
  const { data: config, isLoading, error, updateConfig } = useClashConfig();
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo();
  const { state, dispatch } = useAppState();
  const [saving, setSaving] = useState(false);

  const handleModeChange = async (newMode: string) => {
    setSaving(true);
    try {
      await updateConfig({ mode: newMode as 'global' | 'rule' | 'direct' });
    } catch (error) {
      console.error('Failed to update mode:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogLevelChange = async (newLevel: string) => {
    setSaving(true);
    try {
      await updateConfig({ 'log-level': newLevel as LogLevel });
    } catch (error) {
      console.error('Failed to update log level:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAllowLanChange = async (allowLan: boolean) => {
    setSaving(true);
    try {
      await updateConfig({ 'allow-lan': allowLan });
    } catch (error) {
      console.error('Failed to update allow-lan:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-theme">配置</h1>
        <Card>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-theme">配置</h1>
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-theme mb-2">
                加载失败
              </h3>
              <p className="text-theme-secondary mb-4">{String(error)}</p>
              <Button onClick={() => window.location.reload()}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme">配置</h1>
          <p className="text-theme-secondary">
            管理 Clash 核心配置和应用设置
          </p>
        </div>
        <StatusIndicator 
          status={saving ? 'info' : 'success'} 
          label={saving ? '保存中...' : '已同步'} 
        />
      </div>

      {/* 系统信息 */}
      <ConfigSection 
        title="系统信息" 
        description="Clash 核心版本和运行状态信息"
      >
        <div className="space-y-0">
          <ConfigItem 
            label="Clash 版本" 
            description="当前运行的 Clash 核心版本"
          >
            {systemLoading ? (
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <span className="text-theme font-mono">
                {systemInfo?.version || 'N/A'}
              </span>
            )}
          </ConfigItem>

          <ConfigItem 
            label="版本类型" 
            description="是否为高级版本"
          >
            {systemLoading ? (
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <span className={`px-2 py-1 text-xs rounded-full ${
                systemInfo?.premium 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
              }`}>
                {systemInfo?.premium ? '高级版' : '开源版'}
              </span>
            )}
          </ConfigItem>

          {systemInfo?.platform && (
            <ConfigItem 
              label="平台" 
              description="系统平台信息"
            >
              <span className="text-theme font-mono">
                {systemInfo.platform} {systemInfo.arch && `(${systemInfo.arch})`}
              </span>
            </ConfigItem>
          )}

          {systemInfo?.stack && (
            <ConfigItem 
              label="网络栈" 
              description="TCP/IP 栈类型"
            >
              <span className="text-theme font-mono">
                {systemInfo.stack}
              </span>
            </ConfigItem>
          )}
        </div>
      </ConfigSection>

      {/* Clash 核心配置 */}
      <ConfigSection 
        title="Clash 核心配置" 
        description="这些设置会直接影响 Clash 核心的行为"
      >
        <div className="space-y-0">
          <ConfigItem 
            label="代理模式" 
            description="选择流量处理方式"
          >
            <select
              value={config?.mode || 'rule'}
              onChange={(e) => handleModeChange(e.target.value)}
              disabled={saving}
              className="px-3 py-2 border border-theme rounded-md bg-surface text-theme disabled:opacity-50"
            >
              <option value="rule">规则模式</option>
              <option value="global">全局模式</option>
              <option value="direct">直连模式</option>
            </select>
          </ConfigItem>

          <ConfigItem 
            label="日志级别" 
            description="控制日志输出的详细程度"
          >
            <select
              value={config?.['log-level'] || 'info'}
              onChange={(e) => handleLogLevelChange(e.target.value)}
              disabled={saving}
              className="px-3 py-2 border border-theme rounded-md bg-surface text-theme disabled:opacity-50"
            >
              <option value="silent">静默</option>
              <option value="error">错误</option>
              <option value="warning">警告</option>
              <option value="info">信息</option>
              <option value="debug">调试</option>
            </select>
          </ConfigItem>

          <ConfigItem 
            label="允许局域网连接" 
            description="允许其他设备通过局域网使用代理"
          >
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config?.['allow-lan'] || false}
                onChange={(e) => handleAllowLanChange(e.target.checked)}
                disabled={saving}
                className="rounded disabled:opacity-50"
              />
              <span className="ml-2 text-sm">启用</span>
            </label>
          </ConfigItem>

          <ConfigItem 
            label="HTTP 端口" 
            description="HTTP 代理服务端口"
          >
            <span className="text-theme font-mono">
              {config?.port || 'N/A'}
            </span>
          </ConfigItem>

          <ConfigItem 
            label="SOCKS 端口" 
            description="SOCKS5 代理服务端口"
          >
            <span className="text-theme font-mono">
              {config?.['socks-port'] || 'N/A'}
            </span>
          </ConfigItem>

          <ConfigItem 
            label="混合端口" 
            description="HTTP 和 SOCKS5 混合端口"
          >
            <span className="text-theme font-mono">
              {config?.['mixed-port'] || 'N/A'}
            </span>
          </ConfigItem>
        </div>
      </ConfigSection>

      {/* 应用设置 */}
      <ConfigSection 
        title="应用设置" 
        description="YACD V2 界面和行为设置"
      >
        <div className="space-y-0">
          <ConfigItem 
            label="自动刷新" 
            description="自动刷新数据和状态"
          >
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.preferences.autoRefresh}
                onChange={(e) => dispatch({
                  type: 'UPDATE_PREFERENCES',
                  payload: { autoRefresh: e.target.checked }
                })}
                className="rounded"
              />
              <span className="ml-2 text-sm">启用</span>
            </label>
          </ConfigItem>

          <ConfigItem 
            label="刷新间隔" 
            description="数据自动刷新的时间间隔（毫秒）"
          >
            <select
              value={state.preferences.refreshInterval}
              onChange={(e) => dispatch({
                type: 'UPDATE_PREFERENCES',
                payload: { refreshInterval: parseInt(e.target.value) }
              })}
              className="px-3 py-2 border border-theme rounded-md bg-surface text-theme"
            >
              <option value={1000}>1 秒</option>
              <option value={3000}>3 秒</option>
              <option value={5000}>5 秒</option>
              <option value={10000}>10 秒</option>
            </select>
          </ConfigItem>

          <ConfigItem 
            label="显示通知" 
            description="显示系统通知和提醒"
          >
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.preferences.showNotifications}
                onChange={(e) => dispatch({
                  type: 'UPDATE_PREFERENCES',
                  payload: { showNotifications: e.target.checked }
                })}
                className="rounded"
              />
              <span className="ml-2 text-sm">启用</span>
            </label>
          </ConfigItem>

          <ConfigItem 
            label="紧凑模式" 
            description="使用更紧凑的界面布局"
          >
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.preferences.compactMode}
                onChange={(e) => dispatch({
                  type: 'UPDATE_PREFERENCES',
                  payload: { compactMode: e.target.checked }
                })}
                className="rounded"
              />
              <span className="ml-2 text-sm">启用</span>
            </label>
          </ConfigItem>
        </div>
      </ConfigSection>

      {/* API 连接信息 */}
      <ConfigSection 
        title="API 连接信息" 
        description="当前连接的 Clash API 信息"
      >
        <div className="space-y-0">
          <ConfigItem 
            label="API 地址" 
            description="Clash API 服务地址"
          >
            <span className="text-theme font-mono">
              {state.apiConfig.baseURL}
            </span>
          </ConfigItem>

          <ConfigItem 
            label="认证密钥" 
            description="API 访问密钥"
          >
            <span className="text-theme font-mono">
              {state.apiConfig.secret ? '••••••••' : '未设置'}
            </span>
          </ConfigItem>

          <ConfigItem 
            label="连接状态" 
            description="与 Clash API 的连接状态"
          >
            <StatusIndicator 
              status={config ? 'success' : 'error'} 
              label={config ? '已连接' : '连接失败'} 
            />
          </ConfigItem>
        </div>
      </ConfigSection>

      {/* 系统信息 */}
      <ConfigSection 
        title="系统信息" 
        description="Clash 核心和应用版本信息"
      >
        <div className="space-y-0">
          <ConfigItem 
            label="Clash 版本" 
            description="当前运行的 Clash 核心版本"
          >
            <span className="text-theme font-mono">
              {systemInfo.version}
            </span>
          </ConfigItem>

          <ConfigItem 
            label="YACD 版本" 
            description="当前 YACD V2 版本"
          >
            <span className="text-theme font-mono">
              2.0.0-dev
            </span>
          </ConfigItem>

          <ConfigItem 
            label="Premium 功能" 
            description="是否支持 Premium 功能"
          >
            <StatusIndicator 
              status={systemInfo.premium ? 'success' : 'warning'} 
              label={systemInfo.premium ? '支持' : '不支持'} 
            />
          </ConfigItem>
        </div>
      </ConfigSection>

      {/* 操作按钮 */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-theme">危险操作</h3>
              <p className="text-sm text-theme-secondary">
                这些操作可能会影响系统运行，请谨慎使用
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm('确定要重置所有 V2 设置吗？')) {
                    localStorage.removeItem('v2-preferences');
                    window.location.reload();
                  }
                }}
              >
                重置设置
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm('确定要重启 Clash 核心吗？')) {
                    // 这里应该调用重启 API
                    console.log('Restart Clash core');
                  }
                }}
              >
                重启核心
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 