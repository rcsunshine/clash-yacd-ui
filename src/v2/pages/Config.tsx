import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useReducer,useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchConfigs2, updateConfigs } from '../../api/configs';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { useLatencyTestUrl, useSystemInfo } from '../hooks/useAPI';
import { useApiConfig } from '../hooks/useApiConfig';

const ConfigSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <Card>
    <CardContent>
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-theme">{title}</h2>
        {description && (
          <p className="text-sm text-theme-secondary mt-1">{description}</p>
        )}
      </div>
      {children}
    </CardContent>
  </Card>
);

const ConfigItem: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
    <div className="flex-1 mr-6">
      <div className="font-medium text-theme">{label}</div>
      {description && (
        <div className="text-sm text-theme-secondary mt-1">{description}</div>
      )}
    </div>
    <div className="flex-shrink-0">
      {children}
    </div>
  </div>
);

// 测速URL预设
const LATENCY_TEST_PRESETS = [
  { name: 'gstatic (Default)', url: 'http://www.gstatic.com/generate_204' },
  { name: 'Google', url: 'https://www.google.com/generate_204' },
  { name: 'Cloudflare', url: 'https://cloudflare.com/cdn-cgi/trace' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Baidu (国内)', url: 'https://www.baidu.com' },
  { name: '163.com (国内)', url: 'https://www.163.com' },
];

export const Config: React.FC = () => {
  const { t } = useTranslation();
  const apiConfig = useApiConfig();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { latencyTestUrl, setLatencyTestUrl } = useLatencyTestUrl();
  const [selectedPreset, setSelectedPreset] = useState('gstatic');
  const [customUrl, setCustomUrl] = useState('');

  // 简单的状态管理
  const [state, dispatch] = useReducer((state: any, action: any) => {
    switch (action.type) {
      case 'UPDATE_PREFERENCES':
        const newPreferences = { ...state.preferences, ...action.payload };
        localStorage.setItem('v2-preferences', JSON.stringify(newPreferences));
        return { ...state, preferences: newPreferences };
      default:
        return state;
    }
  }, {
    apiConfig,
    preferences: JSON.parse(localStorage.getItem('v2-preferences') || '{}'),
  });

  // 获取配置数据
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['configs', apiConfig.baseURL],
    queryFn: () => fetchConfigs2({ queryKey: ['configs', apiConfig] as const }),
    enabled: !!apiConfig.baseURL,
    retry: 1,
  });

  // 获取系统信息 - 使用V2标准的hook
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo();

  const handleModeChange = async (newMode: string) => {
    setSaving(true);
    try {
      await updateConfigs(apiConfig)({ mode: newMode });
      queryClient.invalidateQueries({ queryKey: ['configs', apiConfig.baseURL] });
    } catch (err) {
      console.error('Failed to update mode:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogLevelChange = async (newLevel: string) => {
    setSaving(true);
    try {
      await updateConfigs(apiConfig)({ 'log-level': newLevel });
      queryClient.invalidateQueries({ queryKey: ['configs', apiConfig.baseURL] });
    } catch (err) {
      console.error('Failed to update log level:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAllowLanChange = async (allowLan: boolean) => {
    setSaving(true);
    try {
      await updateConfigs(apiConfig)({ 'allow-lan': allowLan });
      queryClient.invalidateQueries({ queryKey: ['configs', apiConfig.baseURL] });
    } catch (err) {
      console.error('Failed to update allow-lan:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 统一的页面头部样式 - 固定顶部 */}
      <div className="flex-none p-6">
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
              status={error ? 'error' : (saving ? 'info' : 'success')}
              label={error ? t('Load Failed') : (saving ? t('Saving...') : t('Synced'))}
            />
            <Button variant="outline" size="sm" className="text-sm" onClick={() => window.location.reload()}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('Refresh')}
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {/* 错误状态显示 */}
          {error && (
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
          )}

          {/* 加载状态显示 */}
          {isLoading && (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-theme-secondary">{t('Loading...')}</p>
                </div>
              </CardContent>
            </Card>
          )}

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
            </div>
          </ConfigSection>

          {/* Clash 核心配置 - 只在有配置时显示 */}
          {config && (
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
              </div>
            </ConfigSection>
          )}

          {/* 测速URL配置 */}
          <ConfigSection
            title={t('Latency Test Configuration')}
            description={t('Configure custom latency test server for more accurate speed testing')}
          >
            <div className="space-y-0">
              <ConfigItem
                label={t('Test Server')}
                description={t('Select a predefined test server or use custom URL')}
              >
                <Select
                  value={selectedPreset}
                  onChange={(e) => {
                    setSelectedPreset(e.target.value);
                    const preset = LATENCY_TEST_PRESETS.find(p => p.name.toLowerCase().includes(e.target.value));
                    if (preset) {
                      setLatencyTestUrl(preset.url);
                    }
                  }}
                  options={[
                    { value: 'gstatic', label: 'gstatic (Default)' },
                    { value: 'google', label: 'Google' },
                    { value: 'cloudflare', label: 'Cloudflare' },
                    { value: 'github', label: 'GitHub' },
                    { value: 'baidu', label: 'Baidu (国内)' },
                    { value: '163', label: '163.com (国内)' },
                    { value: 'custom', label: t('Custom URL') },
                  ]}
                  size="sm"
                  className="min-w-[150px]"
                />
              </ConfigItem>

              <ConfigItem
                label={t('Current Test URL')}
                description={t('Currently configured latency test URL')}
              >
                <span className="text-theme font-mono text-sm break-all">
                  {latencyTestUrl}
                </span>
              </ConfigItem>

              {selectedPreset === 'custom' && (
                <ConfigItem
                  label={t('Custom URL')}
                  description={t('Enter a custom latency test URL (e.g., https://example.com)')}
                >
                  <div className="flex space-x-2 min-w-[300px]">
                    <Input
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (customUrl.trim()) {
                          setLatencyTestUrl(customUrl.trim());
                        }
                      }}
                      disabled={!customUrl.trim()}
                    >
                      {t('Apply')}
                    </Button>
                  </div>
                </ConfigItem>
              )}
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};