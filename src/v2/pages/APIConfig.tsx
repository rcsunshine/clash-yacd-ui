import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { useApiConfig } from '../hooks/useApiConfig';
import {
  v2ApiConfigsAtom,
  v2SelectedApiConfigIndexAtom,
} from '../store/atoms';
import { ClashAPIConfig } from '../types/api';

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
  onEdit: () => void;
  onTest: () => Promise<APITestResult>;
}> = ({ config, index, isSelected, onSelect, onDelete, onEdit, onTest }) => {
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
                  {isSelected && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      当前使用
                    </span>
                  )}
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700"
            >
              编辑
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
    baseURL: 'http://10.8.87.121:9090',
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
            <label htmlFor="metaLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              显示名称 (可选)
            </label>
            <input
              id="metaLabel"
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
            <label htmlFor="baseURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API 地址 *
            </label>
            <input
              id="baseURL"
              type="url"
              value={formData.baseURL}
              onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
              placeholder="http://10.8.87.121:9090"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Clash API 的完整地址，包括协议和端口
            </p>
          </div>

          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密钥 (可选)
            </label>
            <input
              id="secret"
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

const EditAPIForm: React.FC<{
  config: ClashAPIConfig;
  onSave: (config: ClashAPIConfig) => void;
  onCancel: () => void;
}> = ({ config, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    baseURL: config.baseURL || 'http://10.8.87.121:9090',
    secret: config.secret || '',
    metaLabel: config.metaLabel || ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<APITestResult | null>(null);

  // 当表单数据变化时，清除测试结果
  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 如果API地址或密钥变化，清除之前的测试结果
    if (field === 'baseURL' || field === 'secret') {
      setTestResult(null);
    }
  };

  const handleTest = async () => {
    if (!formData.baseURL.trim()) {
      setTestResult({
        success: false,
        message: '请输入有效的API地址',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${formData.baseURL}/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(formData.secret && { 'Authorization': `Bearer ${formData.secret}` }),
        },
        // 添加超时和错误处理
        signal: AbortSignal.timeout(10000), // 10秒超时
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
    
    const updatedConfig: ClashAPIConfig = {
      ...config,
      baseURL: formData.baseURL.trim(),
      secret: formData.secret.trim() || undefined,
      metaLabel: formData.metaLabel.trim() || undefined,
    };
    
    onSave(updatedConfig);
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">编辑 API 配置</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          修改当前 API 连接设置
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editMetaLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              显示名称 (可选)
            </label>
            <input
              id="editMetaLabel"
              type="text"
              value={formData.metaLabel}
              onChange={(e) => handleFormDataChange('metaLabel', e.target.value)}
              placeholder="例如: 本地 Clash"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="editBaseURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API 地址 *
            </label>
            <input
              id="editBaseURL"
              type="url"
              required
              value={formData.baseURL}
              onChange={(e) => handleFormDataChange('baseURL', e.target.value)}
              placeholder="http://10.8.87.121:9090"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Clash API 的完整地址，包括协议和端口
            </p>
          </div>

          <div>
            <label htmlFor="editSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密钥 (可选)
            </label>
            <input
              id="editSecret"
              type="password"
              value={formData.secret}
              onChange={(e) => handleFormDataChange('secret', e.target.value)}
              placeholder="API 访问密钥"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 测试结果显示 */}
          {testResult && (
            <div className={`p-3 rounded-md ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{testResult.message}</p>
                  {testResult.version && (
                    <p className="text-sm mt-1">Clash 版本: {testResult.version}</p>
                  )}
                  {testResult.error && (
                    <p className="text-sm mt-1 opacity-75">{testResult.error}</p>
                  )}
                </div>
                {!testResult.success && (
                  <button
                    type="button"
                    onClick={() => setTestResult(null)}
                    className="ml-2 text-red-500 hover:text-red-700 p-1"
                    title="清除测试结果"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !formData.baseURL.trim()}
            >
              {testing ? '测试中...' : testResult ? '重新测试' : '测试连接'}
            </Button>
            
            <Button
              type="submit"
              disabled={!formData.baseURL.trim()}
            >
              保存修改
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const APIConfig: React.FC = () => {
  const [apiConfigs, setApiConfigs] = useAtom(v2ApiConfigsAtom);
  const [selectedIndex, setSelectedIndex] = useAtom(v2SelectedApiConfigIndexAtom);
  const currentApiConfig = useApiConfig();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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

  // 页面加载时检查当前API配置状态
  useEffect(() => {
    checkCurrentAPI();
  }, [checkCurrentAPI]);

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

  const handleEditConfig = (index: number) => {
    // 关闭添加表单
    setShowAddForm(false);
    // 打开编辑表单
    setEditingIndex(index);
  };

  const handleShowAddForm = () => {
    // 关闭编辑表单
    setEditingIndex(null);
    // 打开添加表单
    setShowAddForm(true);
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
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleShowAddForm}
                    disabled={showAddForm || editingIndex !== null}
                  >
                    添加新的 API 配置
                  </Button>
                  {selectedIndex >= 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditConfig(selectedIndex)}
                      disabled={editingIndex !== null || showAddForm}
                    >
                      编辑当前配置
                    </Button>
                  )}
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
          
          {!showAddForm && editingIndex === null && (
            <Button onClick={handleShowAddForm}>
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
            onEdit={() => handleEditConfig(index)}
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

      {/* 编辑配置表单 */}
      {editingIndex !== null && (
        <EditAPIForm
          config={apiConfigs[editingIndex]}
          onSave={(updatedConfig) => {
            const newConfigs = apiConfigs.map((config, index) =>
              index === editingIndex ? updatedConfig : config
            );
            setApiConfigs(newConfigs);
            setEditingIndex(null);
          }}
          onCancel={() => setEditingIndex(null)}
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