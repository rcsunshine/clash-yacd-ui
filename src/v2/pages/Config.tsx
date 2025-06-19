import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
              <h1 className="text-xl font-bold text-theme hidden lg:block">{t('Config')}</h1>
              <p className="text-sm text-theme-secondary">
                {t('Configuration Management')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status={'info'} 
              label={t('Loading...')} 
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
              <h1 className="text-xl font-bold text-theme hidden lg:block">{t('Config')}</h1>
              <p className="text-sm text-theme-secondary">
                {t('Configuration Management')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status={'error'} 
              label={t('Load Failed')} 
            />
          </div>
        </div>
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-theme mb-2">
                {t('Load Failed')}
              </h3>
              <p className="text-theme-secondary mb-4">{String(error)}</p>
              <Button onClick={() => window.location.reload()}>{t('Retry')}</Button>
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
              <h1 className="text-xl font-bold text-theme hidden lg:block">{t('Config')}</h1>
              <p className="text-sm text-theme-secondary">
                {t('Configuration Management')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status={saving ? 'info' : 'success'} 
              label={saving ? t('Saving...') : t('Synced')} 
            />
            <Button variant="outline" size="sm" className="text-sm" onClick={() => window.location.reload()}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('Refresh')}
            </Button>
          </div>
        </div>

      {/* 系统信息 */}
      <ConfigSection 
        title={t('System Information')}
        description={t('Clash core version and runtime status information')}
      >
        <div className="space-y-0">
          <ConfigItem 
            label={t('Clash Version')}
            description={t('Current running Clash core version')}
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
            label={t('Version Type')}
            description={t('Whether it supports premium features')}
          >
            {systemLoading ? (
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <span className={`px-2 py-1 text-xs rounded-full ${
                systemInfo?.premium 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
              }`}>
                {systemInfo?.premium ? t('Premium') : t('Open Source')}
              </span>
            )}
          </ConfigItem>

          {systemInfo?.platform && (
            <ConfigItem 
              label={t('Platform')}
              description={t('System platform information')}
            >
              <span className="text-theme font-mono">
                {systemInfo.platform} {systemInfo.arch && `(${systemInfo.arch})`}
              </span>
            </ConfigItem>
          )}

          {systemInfo?.stack && (
            <ConfigItem 
              label={t('Network Stack')}
              description={t('TCP/IP stack type')}
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
        title={t('Clash Core Configuration')}
        description={t('These settings will directly affect Clash core behavior')}
      >
        <div className="space-y-0">
          <ConfigItem 
            label={t('Proxy Mode')}
            description={t('Select traffic processing method')}
          >
            <Select
              value={config?.mode || 'rule'}
              onChange={(e) => handleModeChange(e.target.value)}
              disabled={saving}
              options={[
                { value: 'rule', label: t('Rule Mode') },
                { value: 'global', label: t('Global Mode') },
                { value: 'direct', label: t('Direct Mode') },
              ]}
              size="sm"
              className="min-w-[120px]"
            />
          </ConfigItem>

          <ConfigItem 
            label={t('Log Level')}
            description={t('Control the verbosity of log output')}
          >
            <Select
              value={config?.['log-level'] || 'info'}
              onChange={(e) => handleLogLevelChange(e.target.value)}
              disabled={saving}
              options={[
                { value: 'silent', label: t('Silent') },
                { value: 'error', label: t('Error') },
                { value: 'warning', label: t('Warning') },
                { value: 'info', label: t('Info') },
                { value: 'debug', label: t('Debug') },
              ]}
              size="sm"
              className="min-w-[100px]"
            />
          </ConfigItem>

          <ConfigItem 
            label={t('Allow LAN')}
            description={t('Allow other devices to use proxy through LAN')}
          >
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config?.['allow-lan'] || false}
                onChange={(e) => handleAllowLanChange(e.target.checked)}
                disabled={saving}
                className="rounded disabled:opacity-50"
              />
              <span className="ml-2 text-sm">{t('Enable')}</span>
            </label>
          </ConfigItem>

          <ConfigItem 
            label={t('HTTP Port')}
            description={t('HTTP proxy service port')}
          >
            <span className="text-theme font-mono">
              {config?.port || 'N/A'}
            </span>
          </ConfigItem>

          <ConfigItem 
            label={t('SOCKS Port')}
            description={t('SOCKS5 proxy service port')}
          >
            <span className="text-theme font-mono">
              {config?.['socks-port'] || 'N/A'}
            </span>
          </ConfigItem>

          <ConfigItem 
            label={t('Mixed Port')}
            description={t('HTTP and SOCKS5 mixed port')}
          >
            <span className="text-theme font-mono">
              {config?.['mixed-port'] || 'N/A'}
            </span>
          </ConfigItem>
        </div>
      </ConfigSection>

      {/* 应用设置 */}
      <ConfigSection 
        title={t('App Settings')}
        description={t('YACD V2 interface and behavior settings')}
      >
        <div className="space-y-0">
          <ConfigItem 
            label={t('Auto Refresh')}
            description={t('Automatically refresh data and status')}
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
              <span className="ml-2 text-sm">{t('Enable')}</span>
            </label>
          </ConfigItem>

          <ConfigItem 
            label={t('Refresh Interval')}
            description={t('Time interval for automatic data refresh (milliseconds)')}
          >
            <Select
              value={state.preferences.refreshInterval.toString()}
              onChange={(e) => dispatch({
                type: 'UPDATE_PREFERENCES',
                payload: { refreshInterval: parseInt(e.target.value) }
              })}
              options={[
                { value: '1000', label: t('1 Second') },
                { value: '3000', label: t('3 Seconds') },
                { value: '5000', label: t('5 Seconds') },
                { value: '10000', label: t('10 Seconds') },
              ]}
              size="sm"
              className="min-w-[100px]"
            />
          </ConfigItem>

          <ConfigItem 
            label={t('Show Notifications')}
            description={t('Show system notifications and reminders')}
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
              <span className="ml-2 text-sm">{t('Enable')}</span>
            </label>
          </ConfigItem>

          <ConfigItem 
            label={t('Compact Mode')}
            description={t('Use more compact interface layout')}
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
              <span className="ml-2 text-sm">{t('Enable')}</span>
            </label>
          </ConfigItem>
        </div>
      </ConfigSection>

      {/* API 连接信息 */}
      <ConfigSection 
        title={t('API Connection Information')}
        description={t('Current connected Clash API information')}
      >
        <div className="space-y-0">
          <ConfigItem 
            label={t('API Address')}
            description={t('Clash API service address')}
          >
            <span className="text-theme font-mono">
              {state.apiConfig.baseURL}
            </span>
          </ConfigItem>

          <ConfigItem 
            label={t('Authentication Key')}
            description={t('API access key')}
          >
            <span className="text-theme font-mono">
              {state.apiConfig.secret ? '••••••••' : t('Not Set')}
            </span>
          </ConfigItem>

          <ConfigItem 
            label={t('Connection Status')}
            description={t('Connection status with Clash API')}
          >
            <StatusIndicator 
              status={config ? 'success' : 'error'} 
              label={config ? t('Connected') : t('Connection Failed')} 
            />
          </ConfigItem>
        </div>
      </ConfigSection>

      {/* 版本信息 */}
      <ConfigSection 
        title={t('Version Information')}
        description={t('Clash core and application version information')}
      >
        <div className="space-y-0">
          <ConfigItem 
            label={t('Clash Version')}
            description={t('Current running Clash core version')}
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
            label={t('YACD Version')}
            description={t('Current YACD V2 version')}
          >
            <span className="text-theme font-mono">
              v2.0.0-dev
            </span>
          </ConfigItem>

          <ConfigItem 
            label={t('Premium Features')}
            description={t('Whether premium features are supported')}
          >
            {systemLoading ? (
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <StatusIndicator 
                status={systemInfo?.premium ? 'success' : 'warning'} 
                label={systemInfo?.premium ? t('Supported') : t('Not Supported')} 
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
              <h3 className="font-medium text-theme">{t('Dangerous Operations')}</h3>
              <p className="text-sm text-theme-secondary">
                {t('These operations may affect system operation, please use with caution')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm(t('Are you sure you want to reset all V2 settings?'))) {
                    localStorage.removeItem('v2-preferences');
                    window.location.reload();
                  }
                }}
              >
                {t('Reset Settings')}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm(t('Are you sure you want to restart Clash core?'))) {
                    // 这里应该调用重启 API
                    console.log('Restart Clash core');
                  }
                }}
              >
                {t('Restart Core')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 