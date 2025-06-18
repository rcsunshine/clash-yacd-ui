import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useApiConfig } from '../hooks/useApiConfig';
import { createAPIClient } from '../api/client';
import { useTranslation } from '../i18n';

export function APIConfig() {
  const { t } = useTranslation();
  const { apiConfigs, setApiConfigs, selectedIndex } = useApiConfig();
  const [tempConfig, setTempConfig] = useState(apiConfigs[selectedIndex]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleTest = async () => {
    setIsConnecting(true);
    setConnectionStatus({ type: null, message: '' });

    try {
      const client = createAPIClient(tempConfig);
      const response = await client.get('/version');
      
      if (response.status === 200 && response.data) {
        setConnectionStatus({
          type: 'success',
          message: `${t('Connection successful! Clash version')}: ${response.data.version || 'Unknown'}`
        });
      } else {
        setConnectionStatus({
          type: 'error',
          message: response.error || t('Connection failed')
        });
      }
    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: t('Network error, please check API address and port')
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = () => {
    // 更新现有配置
    const newConfigs = [...apiConfigs];
    newConfigs[selectedIndex] = tempConfig;
    setApiConfigs(newConfigs);
    
    setConnectionStatus({
      type: 'success',
      message: t('API configuration saved')
    });
  };

  const handleReset = () => {
    const defaultConfig = {
      baseURL: 'http://127.0.0.1:9090',
      secret: '',
    };
    setTempConfig(defaultConfig);
    setConnectionStatus({ type: null, message: '' });
  };

  const handleClearCache = () => {
    // 清除V2配置缓存
    localStorage.removeItem('v2-api-config');
    
    // 重置为默认配置
    const defaultConfig = {
      baseURL: 'http://127.0.0.1:9090',
      secret: '',
    };
    
    setTempConfig(defaultConfig);
    setApiConfigs([defaultConfig]);
    
    setConnectionStatus({
      type: 'success',
      message: t('V2 configuration cache cleared, please refresh page')
    });
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('API Configuration')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('Configure Clash API connection settings')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="apiConfigBaseURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('API Address')} *
          </label>
          <input
            id="apiConfigBaseURL"
            type="url"
            value={tempConfig.baseURL}
            onChange={(e) => setTempConfig({ ...tempConfig, baseURL: e.target.value })}
            placeholder="http://127.0.0.1:9090"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('Complete Clash API address including protocol and port')}
          </p>
        </div>

        <div>
          <label htmlFor="apiConfigSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('Secret')} ({t('Optional')})
          </label>
          <input
            id="apiConfigSecret"
            type="password"
            value={tempConfig.secret}
            onChange={(e) => setTempConfig({ ...tempConfig, secret: e.target.value })}
            placeholder={t('API access secret')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('If Clash is configured with secret, please enter it here')}
          </p>
        </div>

        {connectionStatus.message && (
          <div className={`p-3 rounded-md ${
            connectionStatus.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center">
              <div className={`w-4 h-4 mr-2 ${
                connectionStatus.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {connectionStatus.type === 'success' ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm">{connectionStatus.message}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <Button
            onClick={handleTest}
            loading={isConnecting}
            variant="outline"
            className="flex-1"
          >
            {t('Test Connection')}
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex-1"
            disabled={isConnecting}
          >
            {t('Save Configuration')}
          </Button>
          <Button
            onClick={handleReset}
            variant="ghost"
            disabled={isConnecting}
          >
            {t('Reset')}
          </Button>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleClearCache}
            variant="outline"
            disabled={isConnecting}
            className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            {t('Clear V2 Configuration Cache')}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {t('If configuration display is abnormal, you can clear cache and refresh page')}
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            {t('Common Issues')}
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• {t('Ensure Clash is running and RESTful API is enabled')}</li>
            <li>• {t('Check external-controller setting in Clash configuration file')}</li>
            <li>• {t('Default port is usually 9090, modify address if different')}</li>
            <li>• {t('If using secret, please ensure correct input')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 