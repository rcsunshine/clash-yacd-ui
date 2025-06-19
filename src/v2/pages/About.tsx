import React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '../components/ui/Card';

// 获取版本信息
const getVersionInfo = () => {
  try {
    // 尝试从全局变量获取版本信息
    const version = (window as any).__VERSION__ || 'Development';
    const commitHash = (window as any).__COMMIT_HASH__ || '';
    return { version, commitHash };
  } catch {
    return { version: 'Development', commitHash: '' };
  }
};

export const About: React.FC = () => {
  const { t } = useTranslation();
  const { version, commitHash } = getVersionInfo();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-theme">{t('About')}</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 应用信息 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-theme">Clash YACD</h2>
                <p className="text-theme-secondary text-sm">Yet Another Clash Dashboard</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-theme-secondary">{t('Version')}</span>
                <span className="text-theme font-mono">{version}</span>
              </div>
              
              {commitHash && (
                <div className="flex justify-between">
                  <span className="text-theme-secondary">{t('Commit Hash')}</span>
                  <span className="text-theme font-mono text-xs">{commitHash.slice(0, 8)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-theme-secondary">{t('Architecture Version')}</span>
                <span className="text-theme font-semibold text-blue-600 dark:text-blue-400">V2</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-theme-secondary">{t('Build Time')}</span>
                <span className="text-theme">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 项目信息 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">{t('Project Info')}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-theme mb-2">{t('Description')}</h4>
                <p className="text-theme-secondary text-sm">
                  {t('Based on React + TypeScript modern Clash Dashboard, providing intuitive proxy management, connection monitoring and rule configuration functions.')}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-theme mb-2">{t('Tech Stack')}</h4>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'TypeScript', 'Tailwind CSS', 'React Query', 'Jotai', 'Vite'].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-md text-theme"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 开源许可 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">{t('Open Source License')}</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-theme">MIT License</span>
                </div>
                <p className="text-theme-secondary text-sm">
                  {t('This project is open source under the MIT license, you can freely use, modify and distribute it.')}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-theme-secondary font-mono leading-relaxed">
                  Copyright (c) 2024 Clash YACD Contributors<br/>
                  Permission is hereby granted, free of charge, to any person obtaining a copy
                  of this software and associated documentation files...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 项目链接 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">{t('Project Links')}</h3>
            
            <div className="space-y-3">
              <a
                href="https://github.com/haishanh/yacd"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-theme" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <div>
                  <div className="font-medium text-theme">{t('GitHub Repository')}</div>
                  <div className="text-sm text-theme-secondary">{t('View project source code on GitHub')}</div>
                </div>
              </a>
              
              <a
                href="https://github.com/haishanh/yacd/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="font-medium text-theme">{t('Issue Feedback')}</div>
                  <div className="text-sm text-theme-secondary">{t('Report bugs or request features')}</div>
                </div>
              </a>
              
              <a
                href="https://github.com/Dreamacro/clash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <div className="font-medium text-theme">{t('Clash Core')}</div>
                  <div className="text-sm text-theme-secondary">{t('Learn about Clash proxy tool')}</div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 贡献者信息 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t('Acknowledgments')}</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-theme mb-2">{t('Original Author')}</h4>
              <p className="text-theme-secondary text-sm">
                {t('Thanks to @haishanh for creating this excellent project.')}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-theme mb-2">{t('Open Source Community')}</h4>
              <p className="text-theme-secondary text-sm">
                {t('Thanks to all developers and users who contributed to the project, including code contributions, issue feedback, feature suggestions, etc.')}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-theme mb-2">{t('V2 Architecture')}</h4>
              <p className="text-theme-secondary text-sm">
                {t('V2 version uses modern technology stack reconstruction, providing better performance and user experience.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 