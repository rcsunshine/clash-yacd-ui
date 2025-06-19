# Git 提交指南

## 📝 当前状态提交建议

### 提交信息模板
```
feat(v2): 完成Phase 2数据层集成和API配置系统

- 实现完整的API配置界面和连接状态监控
- 添加全局状态管理和localStorage持久化
- 完成基础组件库和布局系统
- 修复Sidebar组件className引用错误
- 添加实时连接状态检查和WebSocket支持
- 重新组织文档结构到src/v2/docs/目录

Phase 2 (数据层集成) 100% 完成
下一步: 开始Phase 3核心页面开发
```

### 推荐的提交步骤

#### 1. 检查文件状态
```bash
git status
git diff
```

#### 2. 添加所有V2相关文件
```bash
# 添加V2源代码
git add src/v2/

# 添加配置文件
git add vite.v2.config.ts
git add index.v2.html

# 添加package.json (如果有脚本更新)
git add package.json
```

#### 3. 提交更改
```bash
git commit -m "feat(v2): 完成Phase 2数据层集成和API配置系统

- 实现完整的API配置界面和连接状态监控
- 添加全局状态管理和localStorage持久化  
- 完成基础组件库和布局系统
- 修复Sidebar组件className引用错误
- 添加实时连接状态检查和WebSocket支持
- 重新组织文档结构到src/v2/docs/目录

Phase 2 (数据层集成) 100% 完成
下一步: 开始Phase 3核心页面开发"
```

#### 4. 推送到远程仓库
```bash
git push origin main
# 或推送到开发分支
git push origin develop
```

## 📁 重要文件清单

### 必须包含的文件
```
src/v2/                                    # V2完整源代码
├── components/
│   ├── ui/
│   │   ├── Button.tsx                     # 按钮组件
│   │   ├── Card.tsx                       # 卡片组件
│   │   └── StatusIndicator.tsx            # 状态指示器
│   ├── layout/
│   │   ├── AppLayout.tsx                  # 主布局
│   │   └── Sidebar.tsx                    # 侧边栏 (已修复)
│   └── APIConfig.tsx                      # API配置组件
├── pages/
│   ├── Dashboard.tsx                      # 概览
│   └── TestPage.tsx                       # 测试页面
├── hooks/
│   └── useAPI.ts                          # API数据管理
├── store/
│   └── index.tsx                          # 全局状态管理
├── types/
│   └── api.ts                             # API类型定义
├── utils/
│   ├── api.ts                             # API工具函数
│   └── cn.ts                              # 样式工具
├── styles/
│   └── globals.css                        # 全局样式
├── docs/                                  # 项目文档
│   ├── TECHNICAL_SPECIFICATION.md        # 技术规范文档
│   ├── QUICK_START.md                     # 快速开始指南
│   ├── DEVELOPMENT_PROGRESS.md            # 开发进度跟踪
│   └── GIT_COMMIT_GUIDE.md                # 本文件
├── App.tsx                                # 主应用组件
└── dev.tsx                                # 开发入口

vite.v2.config.ts                          # V2构建配置
index.v2.html                              # V2入口文件
```

### 可选包含的文件
```
package.json                               # 如果添加了新的脚本
README.md                                  # 如果更新了说明
.gitignore                                 # 如果有新的忽略规则
```

## 🔄 分支管理建议

### 当前推荐策略
```bash
# 如果在main分支开发
git add .
git commit -m "feat(v2): 完成Phase 2数据层集成"
git push origin main

# 如果使用功能分支
git checkout -b feature/v2-phase2-complete
git add .
git commit -m "feat(v2): 完成Phase 2数据层集成"
git push origin feature/v2-phase2-complete
# 然后创建Pull Request
```

### 下一步开发分支
```bash
# 为Phase 3创建新分支
git checkout -b feature/v2-proxies-page
# 开始Proxies页面开发
```

## 📋 提交前检查清单

### ✅ 代码质量检查
- [ ] 所有TypeScript错误已修复
- [ ] 所有组件正常渲染
- [ ] API配置功能正常工作
- [ ] 主题切换功能正常
- [ ] 连接状态监控正常

### ✅ 构建检查
```bash
# 确保V2版本可以正常构建
npm run build:v2

# 确保开发服务器可以正常启动
npm run dev:v2
```

### ✅ 功能验证
- [ ] 访问 http://localhost:3001 正常
- [ ] 访问 http://localhost:3001/#test 显示测试页面
- [ ] API配置界面功能完整
- [ ] 侧边栏连接状态显示正常
- [ ] 主题切换工作正常

### ✅ 文档完整性
- [ ] 技术规范文档完整
- [ ] 快速开始指南准确
- [ ] 开发进度记录最新
- [ ] 代码注释充分

## 🚀 换设备继续开发指南

### 在新设备上恢复开发环境
```bash
# 1. 克隆仓库
git clone <your-repository-url>
cd clash-yacd-ui

# 2. 安装依赖
npm install

# 3. 启动V2开发服务器
npm run dev:v2

# 4. 验证功能
# 访问 http://localhost:3001/#test
# 配置API连接并测试
```

### 继续开发的下一步
1. **查看开发进度**: 阅读 `src/v2/docs/DEVELOPMENT_PROGRESS.md`
2. **了解架构**: 阅读 `src/v2/docs/TECHNICAL_SPECIFICATION.md`
3. **快速上手**: 按照 `src/v2/docs/QUICK_START.md` 操作
4. **开始Phase 3**: 创建Proxies页面

## 📞 问题排查

### 常见问题及解决方案
```bash
# 端口被占用
taskkill /F /IM node.exe  # Windows
# 或
lsof -ti:3001 | xargs kill  # macOS/Linux

# 依赖问题
rm -rf node_modules package-lock.json
npm install

# 构建问题
npm run build:v2
# 查看错误信息并修复
```

---

**提交建议**: 建议在完成当前状态提交后，立即开始Phase 3的Proxies页面开发。 