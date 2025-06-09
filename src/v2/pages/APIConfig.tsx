import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { 
  clashAPIConfigsAtom, 
  selectedClashAPIConfigIndexAtom,
  useApiConfig 
} from '../../store/app';
import { ClashAPIConfig } from '../../types';

interface APITestResult {
  success: boolean;
  message: string;
  version?: string;
  error?: string;
}

const APIConfigItem: React.FC<{
  config: ClashAPIConfig;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTest: () => Promise<APITestResult>;
}> = ({ config, index, isSelected, onSelect, onDelete, onTest }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<APITestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: '测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setTesting(false);
    }
  };

  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  };

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                checked={isSelected}
                onChange={onSelect}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {config.metaLabel || `API ${index + 1}`}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {getDisplayUrl(config.baseURL)}
                </div>
                {config.secret && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    密钥: ••••••••
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {testResult && (
              <StatusIndicator
                status={testResult.success ? 'success' : 'error'}
                label={testResult.success ? '连接正常' : '连接失败'}
              />
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? '测试中...' : '测试'}
            </Button>
            
            {index > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700"
              >
                删除
              </Button>
            )}
          </div>
        </div>
        
        {testResult && !testResult.success && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
            {testResult.message}
            {testResult.error && (
              <div className="text-xs mt-1 opacity-75">{testResult.error}</div>
            )}
          </div>
        )}
        
        {testResult && testResult.success && testResult.version && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-600 dark:text-green-400">
            连接成功！Clash 版本: {testResult.version}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AddAPIForm: React.FC<{
  onAdd: (config: ClashAPIConfig) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    baseURL: 'http://127.0.0.1:9090',
    secret: '',
    metaLabel: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<APITestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${formData.baseURL}/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(formData.secret && { 'Authorization': `Bearer ${formData.secret}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: '连接成功',
          version: data.version || 'Unknown'
        });
      } else {
        setTestResult({
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '连接失败',
        error: error instanceof Error ? error.message : '网络错误'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.baseURL.trim()) return;
    
    const newConfig: ClashAPIConfig = {
      baseURL: formData.baseURL.trim(),
      secret: formData.secret.trim() || undefined,
      metaLabel: formData.metaLabel.trim() || undefined,
      addedAt: Date.now(),
    };
    
    onAdd(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">添加新的 API 配置</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          配置新的 Clash API 连接
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              显示名称 (可选)
            </label>
            <input
              type="text"
              value={formData.metaLabel}
              onChange={(e) => setFormData({ ...formData, metaLabel: e.target.value })}
              placeholder="例如: 本地 Clash"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API 地址 *
            </label>
            <input
              type="url"
              value={formData.baseURL}
              onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
              placeholder="http://127.0.0.1:9090"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              完整的 Clash API 地址，包括协议和端口
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密钥 (可选)
            </label>
            <input
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              placeholder="API 访问密钥"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !formData.baseURL.trim()}
            >
              {testing ? '测试中...' : '测试连接'}
            </Button>
            
            <Button
              type="submit"
              disabled={!formData.baseURL.trim() || (testResult && !testResult.success)}
            >
              添加配置
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              取消
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-md ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              <div className="font-medium">{testResult.message}</div>
              {testResult.version && (
                <div className="text-sm mt-1">Clash 版本: {testResult.version}</div>
              )}
              {testResult.error && (
                <div className="text-sm mt-1 opacity-75">{testResult.error}</div>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export const APIConfig: React.FC = () => {
  const [apiConfigs, setApiConfigs] = useAtom(clashAPIConfigsAtom);
  const [selectedIndex, setSelectedIndex] = useAtom(selectedClashAPIConfigIndexAtom);
  const currentApiConfig = useApiConfig();
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentApiStatus, setCurrentApiStatus] = useState<APITestResult | null>(null);
  const [checkingCurrentAPI, setCheckingCurrentAPI] = useState(false);

  // 检测当前 API 状态
  const checkCurrentAPI = async () => {
    setCheckingCurrentAPI(true);
    try {
      const response = await fetch(`${currentApiConfig.baseURL}/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(currentApiConfig.secret && { 'Authorization': `Bearer ${currentApiConfig.secret}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentApiStatus({
          success: true,
          message: '当前 API 连接正常',
          version: data.version || 'Unknown'
        });
      } else {
        setCurrentApiStatus({
          success: false,
          message: `当前 API 连接失败: HTTP ${response.status}`,
        });
      }
    } catch (error) {
      setCurrentApiStatus({
        success: false,
        message: '当前 API 无法连接',
        error: error instanceof Error ? error.message : '网络错误'
      });
    } finally {
      setCheckingCurrentAPI(false);
    }
  };

  // 页面加载时检测当前 API
  useEffect(() => {
    checkCurrentAPI();
  }, [currentApiConfig]);

  const testAPIConfig = async (config: ClashAPIConfig): Promise<APITestResult> => {
    try {
      const response = await fetch(`${config.baseURL}/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.secret && { 'Authorization': `Bearer ${config.secret}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: '连接成功',
          version: data.version || 'Unknown'
        };
      } else {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '连接失败',
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  };

  const handleAddConfig = (newConfig: ClashAPIConfig) => {
    setApiConfigs([...apiConfigs, newConfig]);
    setShowAddForm(false);
    
    // 如果当前 API 不可用，自动切换到新添加的配置
    if (currentApiStatus && !currentApiStatus.success) {
      setSelectedIndex(apiConfigs.length);
    }
  };

  const handleDeleteConfig = (index: number) => {
    if (index === 0) return; // 不能删除第一个配置
    
    const newConfigs = apiConfigs.filter((_, i) => i !== index);
    setApiConfigs(newConfigs);
    
    // 如果删除的是当前选中的配置，切换到第一个
    if (index === selectedIndex) {
      setSelectedIndex(0);
    } else if (index < selectedIndex) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API 配置管理</h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理 Clash API 连接配置
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={checkCurrentAPI}
            disabled={checkingCurrentAPI}
          >
            {checkingCurrentAPI ? '检测中...' : '重新检测'}
          </Button>
          
          {currentApiStatus && (
            <StatusIndicator
              status={currentApiStatus.success ? 'success' : 'error'}
              label={currentApiStatus.success ? '当前 API 正常' : '当前 API 异常'}
            />
          )}
        </div>
      </div>

      {/* 当前 API 状态 */}
      {currentApiStatus && !currentApiStatus.success && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  当前 API 连接异常
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {currentApiStatus.message}
                </p>
                {currentApiStatus.error && (
                  <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                    {currentApiStatus.error}
                  </p>
                )}
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                  >
                    添加新的 API 配置
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API 配置列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            已配置的 API ({apiConfigs.length})
          </h2>
          
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              添加新配置
            </Button>
          )}
        </div>

        {apiConfigs.map((config, index) => (
          <APIConfigItem
            key={`${config.baseURL}-${config.addedAt || index}`}
            config={config}
            index={index}
            isSelected={index === selectedIndex}
            onSelect={() => setSelectedIndex(index)}
            onDelete={() => handleDeleteConfig(index)}
            onTest={() => testAPIConfig(config)}
          />
        ))}
      </div>

      {/* 添加新配置表单 */}
      {showAddForm && (
        <AddAPIForm
          onAdd={handleAddConfig}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">使用说明</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• 系统会自动检测当前 API 的连接状态</p>
          <p>• 当检测到 API 连接异常时，建议添加新的 API 配置</p>
          <p>• 可以添加多个 API 配置，并在它们之间切换</p>
          <p>• 第一个配置是默认配置，无法删除</p>
          <p>• 建议在添加配置前先测试连接</p>
        </CardContent>
      </Card>
    </div>
  );
}; 