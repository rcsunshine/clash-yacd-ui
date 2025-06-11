import { useAtom } from 'jotai';
import React, { useState } from 'react';

import { createAPIClient } from '../api/client';
import { v2ApiConfigsAtom, v2SelectedApiConfigIndexAtom } from '../store/atoms';
import { ClashAPIConfig } from '../types/api';
import { Button } from './ui/Button';
import { Card, CardContent,CardHeader } from './ui/Card';

export function APIConfig() {
  const [apiConfigs, setApiConfigs] = useAtom(v2ApiConfigsAtom);
  const [selectedIndex] = useAtom(v2SelectedApiConfigIndexAtom);
  
  const currentConfig = apiConfigs[selectedIndex] || {
    baseURL: 'http://127.0.0.1:9090',
    secret: '',
  };
  
  const [tempConfig, setTempConfig] = useState<ClashAPIConfig>(currentConfig);
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
          message: `连接成功！Clash 版本: ${response.data.version || 'Unknown'}`
        });
      } else {
        setConnectionStatus({
          type: 'error',
          message: response.error || '连接失败'
        });
      }
    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: '网络错误，请检查 API 地址和端口'
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
      message: 'API 配置已保存'
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

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          API 配置
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          配置 Clash API 连接设置
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="apiConfigBaseURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API 地址 *
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
            Clash API 的完整地址，包括协议和端口
          </p>
        </div>

        <div>
          <label htmlFor="apiConfigSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            密钥 (可选)
          </label>
          <input
            id="apiConfigSecret"
            type="password"
            value={tempConfig.secret}
            onChange={(e) => setTempConfig({ ...tempConfig, secret: e.target.value })}
            placeholder="API 访问密钥"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            如果 Clash 配置了 secret，请在此输入
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
            测试连接
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex-1"
            disabled={isConnecting}
          >
            保存配置
          </Button>
          <Button
            onClick={handleReset}
            variant="ghost"
            disabled={isConnecting}
          >
            重置
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            常见问题
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• 确保 Clash 正在运行并启用了 RESTful API</li>
            <li>• 检查 Clash 配置文件中的 external-controller 设置</li>
            <li>• 默认端口通常是 9090，如有不同请修改地址</li>
            <li>• 如果使用了 secret，请确保输入正确</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 