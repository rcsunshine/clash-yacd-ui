# YACD V2 快速开始指南

## 🎉 恭喜！V2 已成功启动

V2 版本现在已经可以正常运行了。以下是一些快速开始的指南：

## 🚀 如何访问

### 启动 V2 开发服务器
```bash
npm run dev:v2
```

访问地址：`http://localhost:3001`

### 同时运行 V1 和 V2 进行对比
```bash
npm run dev:both
```

- V1 版本：`http://localhost:5173`
- V2 版本：`http://localhost:3001`

## 📱 功能特性

### ✅ 已实现的功能

1. **现代化 UI 组件库**
   - Button 组件（多种变体和状态）
   - Card 组件（灵活的卡片系统）
   - StatusIndicator 组件（状态指示器）

2. **响应式布局**
   - 侧边栏导航
   - 主内容区域
   - 移动端适配

3. **主题系统**
   - 浅色主题
   - 深色主题
   - 自动主题（跟随系统）
   - 点击侧边栏底部的太阳图标切换主题

4. **页面导航**
   - 仪表板页面（模拟数据展示）
   - 组件测试页面（验证所有组件功能）

## 🧭 页面导航

### 仪表板 (`#dashboard`)
- 系统状态概览
- 流量统计
- 最近连接
- 快速操作

### 组件测试 (`#test`)
- 按钮组件测试
- 交互功能测试
- 状态展示测试
- 响应式布局测试
- 主题切换测试

## 🎨 主题切换

有三种方式切换主题：

1. **侧边栏底部按钮**：点击太阳图标
2. **测试页面按钮**：页面右上角的主题按钮
3. **手动设置**：
   ```javascript
   // 设置浅色主题
   document.documentElement.setAttribute('data-theme', 'light');
   
   // 设置深色主题
   document.documentElement.setAttribute('data-theme', 'dark');
   
   // 设置自动主题
   document.documentElement.setAttribute('data-theme', 'auto');
   ```

## 🔧 开发指南

### 添加新页面

1. 在 `src/v2/pages/` 创建新的页面组件
2. 在 `src/v2/App.tsx` 的 `renderPage` 函数中添加路由
3. 在 `src/v2/components/layout/Sidebar.tsx` 中添加导航项

### 添加新组件

1. 在 `src/v2/components/ui/` 创建新组件
2. 在 `src/v2/components/ui/index.ts` 中导出
3. 使用 TypeScript 定义完整的类型

### 样式系统

- 使用 Tailwind CSS 进行样式开发
- CSS 变量定义在 `src/v2/styles/globals.css`
- 支持深色/浅色主题自动切换

## 🐛 故障排除

### 如果页面无法加载
1. 确保端口 3001 没有被占用
2. 检查控制台是否有错误信息
3. 尝试重新启动开发服务器

### 如果样式显示异常
1. 检查 Tailwind CSS 是否正确加载
2. 确认主题设置是否正确
3. 清除浏览器缓存

### 如果组件无法正常工作
1. 检查浏览器控制台的错误信息
2. 访问组件测试页面 (`#test`) 验证功能
3. 确认所有依赖都已正确安装

## 📈 下一步计划

1. **集成现有数据层**
   - 连接 V1 的 API 层
   - 使用真实数据替换模拟数据

2. **完善页面功能**
   - 代理页面
   - 连接页面
   - 规则页面
   - 日志页面
   - 配置页面

3. **性能优化**
   - 代码分割
   - 懒加载
   - 缓存优化

## 💡 提示

- V2 与 V1 完全独立，不会影响现有功能
- 可以随时在两个版本之间切换
- 所有新功能都会优先在 V2 中实现
- 欢迎反馈和建议！ 