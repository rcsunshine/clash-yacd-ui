import React, { useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent,CardHeader } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
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
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600/50 last:border-b-0">
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
      <div className="space-y-6 p-6">
        {/* 统一的页面头部样式 */}
        <div className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-theme hidden lg:block">配置</h1>
              <p className="text-sm text-theme-secondary">
                管理 Clash 核心配置和应用设置
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status={'info'} 
              label={'加载中...'} 
            />
          </div>
        </div>
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
      <div className="space-y-6 p-6">
        {/* 统一的页面头部样式 */}
        <div className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-theme hidden lg:block">配置</h1>
              <p className="text-sm text-theme-secondary">
                管理 Clash 核心配置和应用设置
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status={'error'} 
              label={'加载失败'} 
            />
          </div>
        </div>
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
    <div className="space-y-4 p-6">
      {/* 统一的页面头部样式 */}
      <div className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-theme hidden lg:block">配置</h1>
              <p className="text-sm text-theme-secondary">
                管理 Clash 核心配置和应用设置
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status={saving ? 'info' : 'success'} 
              label={saving ? '保存中...' : '已同步'} 
            />
            <Button variant="outline" size="sm" className="text-sm" onClick={() => window.location.reload()}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </Button>
          </div>
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
            <Select
              value={config?.mode || 'rule'}
              onChange={(e) => handleModeChange(e.target.value)}
              disabled={saving}
              options={[
                { value: 'rule', label: '规则模式' },
                { value: 'global', label: '全局模式' },
                { value: 'direct', label: '直连模式' },
              ]}
              size="sm"
              className="min-w-[120px]"
            />
          </ConfigItem>

          <ConfigItem 
            label="日志级别" 
            description="控制日志输出的详细程度"
          >
            <Select
              value={config?.['log-level'] || 'info'}
              onChange={(e) => handleLogLevelChange(e.target.value)}
              disabled={saving}
              options={[
                { value: 'silent', label: '静默' },
                { value: 'error', label: '错误' },
                { value: 'warning', label: '警告' },
                { value: 'info', label: '信息' },
                { value: 'debug', label: '调试' },
              ]}
              size="sm"
              className="min-w-[100px]"
            />
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
            <Select
              value={state.preferences.refreshInterval.toString()}
              onChange={(e) => dispatch({
                type: 'UPDATE_PREFERENCES',
                payload: { refreshInterval: parseInt(e.target.value) }
              })}
              options={[
                { value: '1000', label: '1 秒' },
                { value: '3000', label: '3 秒' },
                { value: '5000', label: '5 秒' },
                { value: '10000', label: '10 秒' },
              ]}
              size="sm"
              className="min-w-[100px]"
            />
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

      {/* 版本信息 */}
      <ConfigSection 
        title="版本信息" 
        description="Clash 核心和应用版本信息"
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
            label="YACD 版本" 
            description="当前 YACD V2 版本"
          >
            <span className="text-theme font-mono">
              v2.0.0-dev
            </span>
          </ConfigItem>

          <ConfigItem 
            label="Premium 功能" 
            description="是否支持 Premium 功能"
          >
            {systemLoading ? (
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <StatusIndicator 
                status={systemInfo?.premium ? 'success' : 'warning'} 
                label={systemInfo?.premium ? '支持' : '不支持'} 
              />
            )}
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