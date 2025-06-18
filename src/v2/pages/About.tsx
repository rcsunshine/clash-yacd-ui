import React from 'react';

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
  const { version, commitHash } = getVersionInfo();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-theme">关于</h1>
      
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
                <span className="text-theme-secondary">版本</span>
                <span className="text-theme font-mono">{version}</span>
              </div>
              
              {commitHash && (
                <div className="flex justify-between">
                  <span className="text-theme-secondary">提交哈希</span>
                  <span className="text-theme font-mono text-xs">{commitHash.slice(0, 8)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-theme-secondary">架构版本</span>
                <span className="text-theme font-semibold text-blue-600 dark:text-blue-400">V2</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-theme-secondary">构建时间</span>
                <span className="text-theme">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 项目信息 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">项目信息</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-theme mb-2">描述</h4>
                <p className="text-theme-secondary text-sm">
                  基于 React + TypeScript 的现代化 Clash Dashboard，
                  提供直观的代理管理、连接监控和规则配置功能。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-theme mb-2">技术栈</h4>
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
            <h3 className="text-lg font-semibold text-theme mb-4">开源许可</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-theme">MIT License</span>
                </div>
                <p className="text-theme-secondary text-sm">
                  本项目基于 MIT 许可证开源，您可以自由使用、修改和分发。
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
            <h3 className="text-lg font-semibold text-theme mb-4">项目链接</h3>
            
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
                  <div className="font-medium text-theme">GitHub 仓库</div>
                  <div className="text-sm text-theme-secondary">查看源代码和贡献</div>
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
                  <div className="font-medium text-theme">问题反馈</div>
                  <div className="text-sm text-theme-secondary">报告 Bug 或请求功能</div>
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
                  <div className="font-medium text-theme">Clash 核心</div>
                  <div className="text-sm text-theme-secondary">了解 Clash 代理工具</div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 贡献者信息 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">致谢</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-theme mb-2">原作者</h4>
              <p className="text-theme-secondary text-sm">
                感谢 <a href="https://github.com/haishanh" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@haishanh</a> 创建了这个优秀的项目。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-theme mb-2">开源社区</h4>
              <p className="text-theme-secondary text-sm">
                感谢所有为项目做出贡献的开发者和用户，包括代码贡献、问题反馈、功能建议等。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-theme mb-2">V2 架构</h4>
              <p className="text-theme-secondary text-sm">
                V2 版本采用现代化技术栈重构，提供更好的性能和用户体验。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 