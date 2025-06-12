import React, { useCallback,useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { useV2ApiConfig } from '../hooks/useApiConfig';
import type { ClashAPIConfig } from '../types/api';

interface APITestResult {
  success: boolean;
  message: string;
  version?: string;
  error?: string;
}

interface ConfigFormData {
  baseURL: string;
  secret: string;
}

export const APIConfig: React.FC = () => {
  const {
    configs,
    selectedIndex,
    currentConfig,
    addConfig,
    removeConfig,
    updateConfig,
    switchConfig,
  } = useV2ApiConfig();

  const [formData, setFormData] = useState<ConfigFormData>({
    baseURL: '',
    secret: '',
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [testingCurrent, setTestingCurrent] = useState(false);
  const [currentTestResult, setCurrentTestResult] = useState<APITestResult | null>(null);
  const [testingConfigs, setTestingConfigs] = useState<Set<number>>(new Set());
  const [configTestResults, setConfigTestResults] = useState<Map<number, APITestResult>>(new Map());
  const [testingForm, setTestingForm] = useState(false);
  const [formTestResult, setFormTestResult] = useState<APITestResult | null>(null);

  // 测试API连接
  const testAPIConnection = useCallback(async (config: ClashAPIConfig): Promise<APITestResult> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(`${config.baseURL}/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.secret && { 'Authorization': `Bearer ${config.secret}` }),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: '连接超时',
          error: '请求超时（10秒）'
        };
      }
      return {
        success: false,
        message: '连接失败',
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }, []);

  // 测试当前API配置
  const handleTestCurrent = useCallback(async () => {
    setTestingCurrent(true);
    setCurrentTestResult(null);
    
    try {
      const result = await testAPIConnection(currentConfig);
      setCurrentTestResult(result);
    } catch (error) {
      setCurrentTestResult({
        success: false,
        message: '测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setTestingCurrent(false);
    }
  }, [currentConfig, testAPIConnection]);

  // 测试指定配置
  const handleTestConfig = useCallback(async (index: number) => {
    const config = configs[index];
    if (!config) return;

    setTestingConfigs(prev => new Set([...prev, index]));
    
    try {
      const result = await testAPIConnection(config);
      setConfigTestResults(prev => new Map([...prev, [index, result]]));
    } catch (error) {
      setConfigTestResults(prev => new Map([...prev, [index, {
        success: false,
        message: '测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      }]]));
    } finally {
      setTestingConfigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  }, [configs, testAPIConnection]);

  // 测试表单配置
  const handleTestForm = useCallback(async () => {
    if (!formData.baseURL.trim()) {
      setFormTestResult({
        success: false,
        message: '请输入API地址',
      });
      return;
    }

    setTestingForm(true);
    setFormTestResult(null);

    const testConfig: ClashAPIConfig = {
      baseURL: formData.baseURL.trim(),
      secret: formData.secret.trim(),
    };

    try {
      const result = await testAPIConnection(testConfig);
      setFormTestResult(result);
    } catch (error) {
      setFormTestResult({
        success: false,
        message: '测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setTestingForm(false);
    }
  }, [formData, testAPIConnection]);

  // 开始添加新配置
  const handleStartAdd = useCallback(() => {
    setFormData({ baseURL: '', secret: '' });
    setIsAdding(true);
    setEditingIndex(null);
    setFormTestResult(null);
  }, []);

  // 开始编辑配置
  const handleStartEdit = useCallback((index: number) => {
    const config = configs[index];
    setFormData({
      baseURL: config.baseURL,
      secret: config.secret,
    });
    setIsAdding(false);
    setEditingIndex(index);
    setFormTestResult(null);
  }, [configs]);

  // 取消编辑
  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setEditingIndex(null);
    setFormData({ baseURL: '', secret: '' });
    setFormTestResult(null);
  }, []);

  // 保存配置
  const handleSave = useCallback(() => {
    if (!formData.baseURL.trim()) {
      alert('请输入API地址');
      return;
    }

    const newConfig: ClashAPIConfig = {
      baseURL: formData.baseURL.trim(),
      secret: formData.secret.trim(),
    };

    if (isAdding) {
      // 添加新配置
      const newIndex = addConfig(newConfig);
      console.log(`✅ 添加新配置成功，索引: ${newIndex}`);
    } else if (editingIndex !== null) {
      // 更新现有配置
      const success = updateConfig(editingIndex, newConfig);
      if (success) {
        console.log(`✅ 更新配置 ${editingIndex} 成功`);
      }
    }

    handleCancel();
  }, [formData, isAdding, editingIndex, addConfig, updateConfig, handleCancel]);

  // 删除配置
  const handleDelete = useCallback((index: number) => {
    if (index === 0) {
      alert('不能删除默认配置');
      return;
    }

    if (confirm('确定要删除这个配置吗？')) {
      const success = removeConfig(index);
      if (success) {
        console.log(`✅ 删除配置 ${index} 成功`);
      }
    }
  }, [removeConfig]);

  // 切换配置
  const handleSwitch = useCallback((index: number) => {
    const success = switchConfig(index);
    if (success) {
      console.log(`✅ 切换到配置 ${index} 成功`);
    }
  }, [switchConfig]);

  if (!currentConfig) {
    return <LoadingState text="正在加载API配置..." />;
  }

  return (
    <div className="space-y-4 p-6">
      {/* 统一的页面头部样式 */}
      <div className="flex items-center justify-between py-6 px-6 bg-gradient-to-r from-slate-500/10 to-stone-500/10 dark:from-slate-500/20 dark:to-stone-500/20 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-stone-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-theme hidden lg:block">API 配置</h1>
            <p className="text-sm text-theme-secondary">
              管理 Clash API 连接和多配置切换
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            onClick={handleTestCurrent}
            disabled={testingCurrent}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {testingCurrent ? '测试中...' : '测试连接'}
          </Button>
          <Button variant="outline" size="sm" className="text-sm" onClick={() => window.location.reload()}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </Button>
        </div>
      </div>
              
      {/* 当前配置测试结果 */}
      {currentTestResult && (
        <Card>
          <div className="p-4">
            <div className={`p-3 rounded-md ${
              currentTestResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              <div className="font-medium">{currentTestResult.message}</div>
              {currentTestResult.version && (
                <div className="text-sm mt-1">Clash 版本: {currentTestResult.version}</div>
              )}
              {currentTestResult.error && (
                <div className="text-sm mt-1 opacity-75">{currentTestResult.error}</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 配置列表 */}
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              配置列表
            </h2>
            <Button variant="primary" onClick={handleStartAdd}>
              添加配置
            </Button>
          </div>

          <div className="space-y-3">
            {configs.map((config, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  index === selectedIndex
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {config.baseURL}
                    </div>
                    {config.secret && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Secret: ••••••••
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {index === selectedIndex && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                        当前
                      </span>
                    )}
                    
                    {index !== selectedIndex && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitch(index)}
                      >
                        切换
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConfig(index)}
                      disabled={testingConfigs.has(index)}
                    >
                      {testingConfigs.has(index) ? '测试中...' : '测试'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(index)}
                    >
                      编辑
                    </Button>
                    
                    {index !== 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        删除
                      </Button>
                    )}
                  </div>
                </div>

                {/* 配置测试结果 */}
                {configTestResults.has(index) && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    configTestResults.get(index)?.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}>
                    <div className="font-medium">{configTestResults.get(index)?.message}</div>
                    {configTestResults.get(index)?.version && (
                      <div className="text-xs mt-1">版本: {configTestResults.get(index)?.version}</div>
                    )}
                    {configTestResults.get(index)?.error && (
                      <div className="text-xs mt-1 opacity-75">{configTestResults.get(index)?.error}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 添加/编辑表单 */}
      {(isAdding || editingIndex !== null) && (
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isAdding ? '添加新配置' : '编辑配置'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="baseURL" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API 地址 *
                </label>
                <Input
                  id="baseURL"
                  type="text"
                  placeholder="http://127.0.0.1:9090"
                  value={formData.baseURL}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseURL: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret
                </label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="留空表示无密码"
                  value={formData.secret}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                />
              </div>
              
              {/* 测试结果显示 */}
              {formTestResult && (
                <div className={`p-3 rounded-md ${
                  formTestResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  <div className="font-medium">{formTestResult.message}</div>
                  {formTestResult.version && (
                    <div className="text-sm mt-1">Clash 版本: {formTestResult.version}</div>
                  )}
                  {formTestResult.error && (
                    <div className="text-sm mt-1 opacity-75">{formTestResult.error}</div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleTestForm}
                  disabled={testingForm || !formData.baseURL.trim()}
                >
                  {testingForm ? '测试中...' : '测试连接'}
                </Button>
                
                <Button variant="primary" onClick={handleSave}>
                  保存
                </Button>
                
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}; 