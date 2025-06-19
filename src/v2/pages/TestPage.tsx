import { useAtom } from 'jotai';
import React, { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter,CardHeader } from '../components/ui/Card';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { v2ThemeAtom } from '../store/atoms';
import { getCurrentAppliedTheme } from '../utils/theme';

export const TestPage: React.FC = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [currentTheme] = useAtom(v2ThemeAtom);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  // 检测DOM中的实际主题状态
  useEffect(() => {
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains('dark');
      setIsDarkMode(hasDarkClass);
    };

    checkTheme();
    
    // 监听DOM变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('V2 Test Page')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('Verify that all components are working properly, use the theme dropdown at the bottom of the sidebar for theme switching')}
        </p>
      </div>

      {/* 主题调试信息 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">🎨 {t('Theme Debug Information')}</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t('Jotai State')}:</strong> {currentTheme}
            </div>
            <div>
              <strong>{t('DOM Class')}:</strong> {isDarkMode ? 'dark' : 'light'}
            </div>
            <div>
                              <strong>{t('getCurrentAppliedTheme()')}:</strong> {getCurrentAppliedTheme()}
            </div>
            <div>
              <strong>{t('System Preference')}:</strong> {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}
            </div>
            <div>
                              <strong>{t('localStorage')}:</strong> {localStorage.getItem('v2-theme') || t('Not Set')}
            </div>
            <div>
              <strong>{t('HTML data-theme')}:</strong> {document.documentElement.getAttribute('data-theme') || t('Not Set')}
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('If theme switching is not working, please check')}
              <br />
              1. {t('Whether Jotai state and DOM class are consistent')}
              <br />
              2. {t('Whether v2-theme value in localStorage is correct')}
              <br />
              3. {t('Whether there are error messages in the console')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('API Configuration')}
        </h2>
      </div>

      {/* Button Tests */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('Button Component Test')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="primary">{t('Primary Button')}</Button>
          <Button variant="secondary">{t('Secondary Button')}</Button>
          <Button variant="outline">{t('Outline Button')}</Button>
          <Button variant="ghost">{t('Ghost Button')}</Button>
          <Button variant="danger">{t('Danger Button')}</Button>
          <Button loading>{t('Loading...')}</Button>
        </div>
      </div>

      {/* Interactive Test */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('Interactive Test')}
        </h2>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">{t('Counter')}</h3>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {count}
              </div>
              <Button onClick={() => setCount(count + 1)}>
                {t('Click +1')}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setCount(0)} fullWidth>
              {t('Reset')}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Status Indicators */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('Status Test')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <StatusIndicator status="success" label={t('Success Status')} />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('Success Status')}</p>
          </div>
          <div className="text-center">
            <StatusIndicator status="warning" label={t('Warning Status')} />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('Warning Status')}</p>
          </div>
          <div className="text-center">
            <StatusIndicator status="error" label={t('Error Status')} />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('Error Status')}</p>
          </div>
          <div className="text-center">
            <StatusIndicator status="info" label={t('Info Status')} />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('Info Status')}</p>
          </div>
        </div>
      </div>

      {/* Card Variants */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('Card Test')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <CardHeader>
              <h3 className="font-semibold">{t('Default Card')}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">{t('This is a default style card')}</p>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <h3 className="font-semibold">{t('Outlined Card')}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">{t('This is a card with border')}</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <h3 className="font-semibold">{t('Elevated Card')}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">{t('This is a card with shadow and hover effect')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 响应式测试 */}
      <Card>
        <CardHeader title={t('Responsive Test')} />
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
        <CardHeader title={t('System Information')} />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t('Version')}:</strong> V2.0.0
            </div>
            <div>
              <strong>{t('Browser')}:</strong> {navigator.userAgent.split(' ')[0]}
            </div>
            <div>
              <strong>{t('Screen Size')}:</strong> {window.innerWidth} x {window.innerHeight}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 