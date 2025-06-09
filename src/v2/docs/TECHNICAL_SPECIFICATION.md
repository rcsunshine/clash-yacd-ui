# YACD V2 技术规范文档

## 📋 项目概述

**项目名称**: YACD V2 - Yet Another Clash Dashboard V2  
**版本**: 2.0.0  
**开发状态**: 开发中 (Phase 2 完成)  
**最后更新**: 2024年12月  

### 🎯 项目目标

基于现代化技术栈重构YACD，提供更好的用户体验、性能和可维护性，同时保持与V1版本的功能兼容性。

## 🏗️ 架构设计

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 4.4.9
- **样式方案**: Tailwind CSS + CSS Variables
- **状态管理**: React Context + useReducer
- **数据获取**: 自定义 Hooks + WebSocket
- **开发工具**: ESLint + Prettier

### 目录结构

```
src/v2/
├── components/           # 组件库
│   ├── ui/              # 基础UI组件
│   │   ├── Button.tsx   # 按钮组件 (5种变体)
│   │   ├── Card.tsx     # 卡片组件 (3种变体)
│   │   └── StatusIndicator.tsx # 状态指示器
│   ├── layout/          # 布局组件
│   │   ├── AppLayout.tsx    # 主布局
│   │   └── Sidebar.tsx      # 侧边栏 (含连接状态)
│   └── APIConfig.tsx    # API配置组件
├── pages/               # 页面组件
│   ├── Dashboard.tsx    # 仪表板 (实时数据)
│   └── TestPage.tsx     # 测试页面 (组件展示)
├── hooks/               # 自定义Hooks
│   └── useAPI.ts        # API数据管理
├── store/               # 状态管理
│   └── index.tsx        # 全局状态 + localStorage
├── types/               # 类型定义
│   └── api.ts           # API接口类型
├── utils/               # 工具函数
│   ├── api.ts           # API请求封装
│   └── cn.ts            # 样式工具
├── styles/              # 样式文件
│   └── globals.css      # 全局样式 + 主题变量
├── docs/                # 项目文档
│   ├── TECHNICAL_SPECIFICATION.md  # 技术规范文档
│   ├── QUICK_START.md              # 快速开始指南
│   ├── DEVELOPMENT_PROGRESS.md     # 开发进度跟踪
│   └── GIT_COMMIT_GUIDE.md         # Git提交指南
├── App.tsx              # 主应用组件
└── dev.tsx              # 开发入口
```

### 构建配置

- **开发服务器**: `vite.v2.config.ts` (端口: 3001)
- **HTML入口**: `index.v2.html`
- **构建输出**: `dist-v2/`

## 🔧 开发环境设置

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 启动V2开发服务器
npm run dev:v2

# 构建V2版本
npm run build:v2

# 同时运行V1和V2
npm run dev:both

# 构建所有版本
npm run build:all
```

### 访问地址

- **V2开发版**: http://localhost:3001
- **V2测试页面**: http://localhost:3001/#test
- **V1版本**: http://localhost:3000

## 📦 组件库规范

### 基础组件

#### Button 组件
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}
```

#### Card 组件
```typescript
interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}
```

#### StatusIndicator 组件
```typescript
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
  className?: string;
}
```

### 布局组件

#### Sidebar 组件
- **功能**: 导航菜单 + 实时连接状态
- **特性**: 响应式设计、主题切换、状态监控
- **连接检查**: 每10秒自动检测API连接状态

#### AppLayout 组件
- **功能**: 主应用布局容器
- **结构**: 侧边栏 + 主内容区域
- **响应式**: 支持移动端适配

## 🔌 API集成规范

### API配置

```typescript
interface ClashAPIConfig {
  baseURL: string;    // 默认: http://127.0.0.1:9090
  secret: string;     // 可选: API密钥
}
```

### API工具函数

```typescript
// 基础请求
apiGet<T>(config: ClashAPIConfig, endpoint: string): Promise<APIResponse<T>>
apiPost<T>(config: ClashAPIConfig, endpoint: string, data?: any): Promise<APIResponse<T>>
apiPut<T>(config: ClashAPIConfig, endpoint: string, data?: any): Promise<APIResponse<T>>
apiDelete<T>(config: ClashAPIConfig, endpoint: string): Promise<APIResponse<T>>

// WebSocket URL构建
buildWebSocketURL(config: ClashAPIConfig, endpoint: string): string
```

### 数据管理Hooks

```typescript
// 基础查询Hook
useQuery<T>(key: string, fetcher: () => Promise<T>, options?: QueryOptions): QueryResult<T>

// 专用Hooks
useSystemInfo(): QueryResult<SystemInfo>
useClashConfig(): QueryResult<ClashConfig>
useProxies(): QueryResult<ProxyItem[]>
useConnections(): QueryResult<ConnectionItem[]>
useTraffic(): TrafficData | null
useLogs(): LogItem[]
```

## 🎨 主题系统

### CSS变量定义

```css
:root[data-theme="light"] {
  --color-background: #ffffff;
  --color-text-primary: #0f172a;
  --color-primary: #3b82f6;
  /* ... 更多变量 */
}

:root[data-theme="dark"] {
  --color-background: #0f172a;
  --color-text-primary: #f8fafc;
  --color-primary: #3b82f6;
  /* ... 更多变量 */
}
```

### 主题切换

- **支持模式**: light / dark / auto
- **存储方式**: localStorage
- **自动检测**: 系统偏好设置
- **切换位置**: 侧边栏底部按钮

## 📊 状态管理

### 全局状态结构

```typescript
interface AppState {
  apiConfig: ClashAPIConfig;           // API配置
  theme: 'light' | 'dark' | 'auto';   // 主题设置
  sidebarCollapsed: boolean;           // 侧边栏状态
  currentPage: string;                 // 当前页面
  autoRefresh: boolean;                // 自动刷新
  refreshInterval: number;             // 刷新间隔
  searchQuery: string;                 // 搜索查询
  filters: FilterState;                // 过滤器状态
  preferences: UserPreferences;        // 用户偏好
}
```

### 持久化存储

- **存储键**: `yacd-v2-state`
- **存储内容**: apiConfig, theme, preferences
- **自动保存**: 状态变更时自动保存到localStorage
- **自动加载**: 应用启动时自动恢复状态

## 🚀 开发进度

### ✅ Phase 1: 基础架构 (已完成)
- [x] 项目结构搭建
- [x] 构建配置 (Vite + TypeScript)
- [x] 基础组件库 (Button, Card, StatusIndicator)
- [x] 布局系统 (AppLayout, Sidebar)
- [x] 主题系统 (CSS Variables + 切换逻辑)
- [x] 开发环境配置

### ✅ Phase 2: 数据层集成 (已完成)
- [x] API类型定义
- [x] API请求封装
- [x] WebSocket连接管理
- [x] React Hooks数据管理
- [x] 全局状态管理
- [x] localStorage持久化
- [x] API配置界面
- [x] 实时连接状态监控

### 🔄 Phase 3: 核心页面 (进行中)
- [ ] Proxies 页面 (代理管理)
- [ ] Connections 页面 (连接监控)
- [ ] Rules 页面 (规则管理)
- [ ] Logs 页面 (日志查看)
- [ ] Config 页面 (配置管理)

### 📋 Phase 4: 完善优化 (计划中)
- [ ] 路由系统完善
- [ ] 国际化支持
- [ ] 性能优化
- [ ] 单元测试
- [ ] E2E测试
- [ ] 文档完善

## 🔧 API配置指南

### Clash配置要求

在Clash配置文件中添加：

```yaml
# 启用外部控制器
external-controller: 127.0.0.1:9090

# 可选：设置API密钥
secret: "your-secret-here"

# 可选：允许局域网访问
external-controller-bind: 0.0.0.0:9090
```

### V2配置步骤

1. **访问配置页面**: http://localhost:3001/#test
2. **配置API地址**: 输入Clash API地址 (默认: http://127.0.0.1:9090)
3. **设置密钥**: 如果Clash配置了secret，请输入对应密钥
4. **测试连接**: 点击"测试连接"验证配置
5. **保存设置**: 点击"保存配置"持久化设置

### 常见问题排查

- **连接被拒绝**: 检查Clash是否运行，external-controller是否启用
- **端口错误**: 确认Clash配置中的端口号
- **认证失败**: 验证secret配置是否正确
- **CORS问题**: 某些Clash版本可能需要额外CORS配置

## 🧪 测试规范

### 组件测试

访问测试页面查看所有组件状态：http://localhost:3001/#test

- **API配置测试**: 连接测试、保存/重置功能
- **按钮组件测试**: 5种变体、加载状态、禁用状态
- **交互测试**: 计数器功能、状态更新
- **状态指示器测试**: 4种状态显示
- **卡片组件测试**: 3种变体、悬停效果

### 连接状态测试

- **成功连接**: 绿色指示器 + 版本信息
- **连接失败**: 红色指示器 + 错误信息
- **检查中**: 蓝色指示器 + 加载动画
- **自动重试**: 每10秒自动检测连接状态

## 📝 代码规范

### TypeScript规范

- **严格模式**: 启用strict模式
- **类型定义**: 所有API接口必须有类型定义
- **组件Props**: 使用interface定义组件属性
- **Hooks返回值**: 明确定义返回类型

### React规范

- **函数组件**: 优先使用函数组件
- **Hooks使用**: 遵循Hooks规则，正确处理依赖
- **错误边界**: 关键组件添加错误边界
- **性能优化**: 合理使用useMemo、useCallback

### 样式规范

- **Tailwind优先**: 优先使用Tailwind CSS类
- **CSS变量**: 主题相关使用CSS变量
- **响应式**: 移动端优先的响应式设计
- **暗色模式**: 所有组件支持暗色模式

## 🔄 Git工作流

### 分支策略

- **main**: 主分支，稳定版本
- **develop**: 开发分支，集成新功能
- **feature/**: 功能分支，单独功能开发
- **hotfix/**: 热修复分支，紧急修复

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 重要文件

确保以下文件包含在Git提交中：

```
src/v2/                    # V2源代码
├── docs/                  # 项目文档
vite.v2.config.ts         # V2构建配置
index.v2.html             # V2入口文件
package.json              # 依赖配置
```

## 🚀 部署指南

### 开发环境

```bash
# 克隆项目
git clone <repository-url>
cd clash-yacd-ui

# 安装依赖
npm install

# 启动V2开发服务器
npm run dev:v2
```

### 生产构建

```bash
# 构建V2版本
npm run build:v2

# 构建产物位置
dist-v2/
├── index.v2.html
├── assets/
│   ├── index.v2-[hash].css
│   └── index.v2-[hash].js
```

## 📞 技术支持

### 开发环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **浏览器**: 支持ES2020的现代浏览器

### 调试工具

- **React DevTools**: 组件状态调试
- **Vite DevTools**: 构建过程调试
- **浏览器DevTools**: 网络请求、控制台日志

### 性能监控

- **连接状态**: 侧边栏实时显示
- **API响应**: 控制台网络面板
- **组件渲染**: React DevTools Profiler

---

**文档版本**: 1.0  
**维护者**: YACD V2 开发团队  
**最后更新**: 2024年12月 