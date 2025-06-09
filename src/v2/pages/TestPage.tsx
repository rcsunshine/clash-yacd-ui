import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { APIConfig } from '../components/APIConfig';

export const TestPage: React.FC = () => {
  const [count, setCount] = React.useState(0);
  const [theme, setTheme] = React.useState('auto');

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    if (nextTheme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          V2 测试页面
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          验证所有组件是否正常工作
        </p>
      </div>

      {/* API Configuration Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          API 配置
        </h2>
        <APIConfig />
      </div>

      {/* Button Tests */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          按钮组件测试
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="primary">Primary 按钮</Button>
          <Button variant="secondary">Secondary 按钮</Button>
          <Button variant="outline">Outline 按钮</Button>
          <Button variant="ghost">Ghost 按钮</Button>
          <Button variant="danger">Danger 按钮</Button>
          <Button loading>加载中...</Button>
        </div>
      </div>

      {/* Interactive Test */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          交互测试
        </h2>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">计数器</h3>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {count}
              </div>
              <Button onClick={() => setCount(count + 1)}>
                点击 +1
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setCount(0)} fullWidth>
              重置
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Status Indicators */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          状态测试
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <StatusIndicator status="success" label="成功状态" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">成功状态</p>
          </div>
          <div className="text-center">
            <StatusIndicator status="warning" label="警告状态" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">警告状态</p>
          </div>
          <div className="text-center">
            <StatusIndicator status="error" label="错误状态" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">错误状态</p>
          </div>
          <div className="text-center">
            <StatusIndicator status="info" label="信息状态" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">信息状态</p>
          </div>
        </div>
      </div>

      {/* Card Variants */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          卡片测试
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <CardHeader>
              <h3 className="font-semibold">默认卡片</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">这是默认样式的卡片</p>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <h3 className="font-semibold">边框卡片</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">这是带边框的卡片</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <h3 className="font-semibold">阴影卡片</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">这是带阴影和悬停效果的卡片</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 响应式测试 */}
      <Card>
        <CardHeader title="响应式测试" />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 系统信息 */}
      <Card>
        <CardHeader title="系统信息" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>版本:</strong> V2.0.0
            </div>
            <div>
              <strong>当前主题:</strong> {theme}
            </div>
            <div>
              <strong>浏览器:</strong> {navigator.userAgent.split(' ')[0]}
            </div>
            <div>
              <strong>屏幕尺寸:</strong> {window.innerWidth} x {window.innerHeight}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 