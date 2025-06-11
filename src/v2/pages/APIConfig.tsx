import React, { useState, useCallback } from 'react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { useV2ApiConfig } from '../hooks/useApiConfig';
import type { ClashAPIConfig } from '../types/api';

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
  const [showSecret, setShowSecret] = useState(false);

  // 开始添加新配置
  const handleStartAdd = useCallback(() => {
    setFormData({ baseURL: '', secret: '' });
    setIsAdding(true);
    setEditingIndex(null);
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
  }, [configs]);

  // 取消编辑
  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setEditingIndex(null);
    setFormData({ baseURL: '', secret: '' });
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
    <div className="page-wrapper api-config-page">
      <div className="page-body">
        <div className="container-fluid px-4">
          <div className="space-y-6">
            {/* 页面标题 */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                API 配置管理
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                管理 Clash API 连接配置
              </p>
            </div>

            {/* 当前配置状态 */}
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  当前配置
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API 地址
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border">
                      {currentConfig.baseURL}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Secret
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="flex-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border">
                        {currentConfig.secret 
                          ? (showSecret ? currentConfig.secret : '••••••••••••')
                          : '(未设置)'
                        }
                      </p>
                      {currentConfig.secret && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSecret(!showSecret)}
                          className="px-2 py-1 text-xs"
                        >
                          {showSecret ? '隐藏' : '显示'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

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
                    
                    <div className="flex space-x-3">
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
        </div>
      </div>
    </div>
  );
}; 