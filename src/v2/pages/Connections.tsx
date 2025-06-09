import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useConnections } from '../hooks/useAPI';

export const Connections: React.FC = () => {
  const { data: connectionsData, isLoading, error, refetch } = useConnections();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">连接</h1>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">连接</h1>
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                加载失败
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{String(error)}</p>
              <Button onClick={() => refetch()}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const connections = connectionsData?.connections || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">连接</h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理活跃的网络连接，共 {connections.length} 个连接
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">连接统计</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {connections.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">活跃连接</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              连接管理功能开发中
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              完整的连接管理功能正在开发中，敬请期待
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
