# YACD V2 快速开始指南

## 🚀 快速启动 (5分钟上手)

### 1. 环境准备
```bash
# 确保Node.js >= 16.0.0
node --version

# 克隆项目
git clone <your-repository-url>
cd clash-yacd-ui

# 安装依赖
npm install
```

### 2. 启动开发服务器
```bash
# 启动V2开发服务器 (端口3001)
npm run dev:v2

# 或同时启动V1和V2
npm run dev:both
```

### 3. 访问应用
- **V2主页**: http://localhost:3001
- **V2测试页**: http://localhost:3001/#test (包含API配置)
- **V1版本**: http://localhost:3000

## ⚙️ API配置 (必须步骤)

### 配置Clash API
1. 访问 http://localhost:3001/#test
2. 在"API配置"区域设置：
   - **API地址**: `http://127.0.0.1:9090` (默认)
   - **Secret**: 如果Clash设置了密钥则填入
3. 点击"测试连接"验证
4. 点击"保存配置"保存设置

### Clash配置示例
```yaml
# 在Clash配置文件中添加
external-controller: 127.0.0.1:9090
secret: "your-secret-here"  # 可选
```

## 📁 关键文件位置

```
src/v2/
├── components/
│   ├── ui/              # 基础组件 (Button, Card, StatusIndicator)
│   ├── layout/          # 布局组件 (Sidebar, AppLayout)
│   └── APIConfig.tsx    # API配置组件
├── pages/
│   ├── Dashboard.tsx    # 概览页面
│   └── TestPage.tsx     # 测试页面
├── docs/                # 项目文档
│   ├── TECHNICAL_SPECIFICATION.md  # 技术规范文档
│   ├── QUICK_START.md              # 快速开始指南
│   ├── DEVELOPMENT_PROGRESS.md     # 开发进度跟踪
│   └── GIT_COMMIT_GUIDE.md         # Git提交指南
├── store/index.tsx      # 全局状态管理
├── hooks/useAPI.ts      # API数据管理
├── utils/api.ts         # API请求工具
└── styles/globals.css   # 全局样式
```

## 🔧 常用命令

```bash
# 开发
npm run dev:v2          # 启动V2开发服务器
npm run build:v2        # 构建V2版本

# 调试
npm run dev:both        # 同时运行V1和V2
npm run build:all       # 构建所有版本
```

## 🎯 当前开发状态

### ✅ 已完成功能
- 基础组件库 (Button, Card, StatusIndicator)
- 布局系统 (Sidebar, AppLayout)
- API配置界面
- 实时连接状态监控
- 主题切换 (light/dark/auto)
- 状态持久化 (localStorage)

### 🔄 下一步开发
- Proxies 页面 (代理管理)
- Connections 页面 (连接监控)
- Rules 页面 (规则管理)
- Logs 页面 (日志查看)
- Config 页面 (配置管理)

## 🐛 常见问题

### 端口被占用
```bash
# Windows: 杀死Node进程
taskkill /F /IM node.exe

# 重新启动
npm run dev:v2
```

### API连接失败
1. 确保Clash正在运行
2. 检查Clash配置中的`external-controller`
3. 在测试页面重新配置API地址
4. 查看浏览器控制台错误信息

### 组件样式问题
- 确保Tailwind CSS正常加载
- 检查主题切换是否正常
- 查看CSS变量是否正确应用

## 📝 开发提示

### 添加新组件
1. 在`src/v2/components/ui/`创建组件文件
2. 使用TypeScript定义Props接口
3. 支持暗色模式 (使用CSS变量)
4. 在TestPage中添加测试用例

### 添加新页面
1. 在`src/v2/pages/`创建页面文件
2. 在`App.tsx`中添加路由
3. 在`Sidebar.tsx`中添加导航项
4. 使用AppLayout包装页面内容

### 状态管理
- 全局状态: 使用`useAppState()` Hook
- API数据: 使用`src/v2/hooks/useAPI.ts`中的Hooks
- 本地状态: 使用`useState`

---

**快速参考**: 详细文档请查看 `src/v2/docs/TECHNICAL_SPECIFICATION.md` 