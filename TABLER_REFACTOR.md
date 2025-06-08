# YACD UI 重构 - Tabler 1.3.2 集成

## 概述

本次重构将 YACD (Yet Another Clash Dashboard) 的用户界面升级为使用 Tabler 1.3.2 UI 框架，提供更现代化、美观的用户体验，同时保持所有原有功能不变。

## 主要改进

### 1. 现代化设计系统
- **Tabler UI 框架**: 集成了 Tabler 1.3.2，提供一致的设计语言
- **图标系统**: 使用 Tabler Icons 2.47.0，提供丰富的矢量图标
- **响应式设计**: 完全响应式布局，适配各种屏幕尺寸
- **主题系统**: 保持原有的深色/浅色/自动主题切换功能

### 2. 组件重构

#### 侧边栏 (SideBar)
- 使用 Tabler 的导航组件
- 现代化的图标和布局
- 改进的品牌展示区域
- 更好的视觉层次

#### 主页 (Home)
- 卡片式布局设计
- 实时系统状态概览卡片
  - 连接状态监控
  - 活跃连接数统计
  - 代理状态统计（活跃/总数）
  - 规则总数统计
- 流量统计卡片
  - 总上传流量
  - 总下载流量
- 流量图表的独立卡片
- 渐入动画效果

#### 按钮组件 (Button)
- 映射到 Tabler 按钮样式
- 保持原有的 kind 属性 (primary, minimal, circular)
- 改进的加载状态显示
- 更好的视觉反馈

#### 连接表格 (ConnectionTable)
- 现代化的表格设计
- 改进的数据展示（徽章、图标、颜色编码）
- 更好的排序指示器
- 响应式表格布局

#### 主题切换器 (ThemeSwitcher)
- 使用 Tabler 下拉菜单
- 清晰的主题选项展示
- 改进的用户交互

### 3. 样式系统

#### 主题变量
```scss
// Tabler 主题定制
:root {
  --tblr-primary: #387cec;
  --tblr-border-radius: 0.375rem;
  --tblr-font-family-sans-serif: var(--font-normal);
  // ... 更多变量
}
```

#### 组件样式类
- `.tabler-card`: 现代化卡片样式
- `.tabler-btn`: 按钮样式增强
- `.tabler-table`: 表格样式改进
- `.tabler-sidebar`: 侧边栏样式

#### 动画效果
- `.fade-in`: 渐入动画
- `.slide-in`: 滑入动画
- 平滑的过渡效果

### 4. 布局改进

#### 页面结构
```html
<div class="page">
  <aside class="navbar navbar-vertical navbar-expand-lg tabler-sidebar">
    <!-- 侧边栏 -->
  </aside>
  <div class="page-wrapper">
    <main class="page-content">
      <!-- 主要内容 -->
    </main>
  </div>
</div>
```

#### 网格系统
- 使用 Bootstrap 网格系统
- 响应式列布局
- 灵活的卡片排列

### 5. 用户体验改进

#### 视觉改进
- 更好的颜色对比度
- 一致的间距和排版
- 改进的图标使用
- 现代化的阴影和边框

#### 交互改进
- 更好的悬停效果
- 清晰的状态指示
- 改进的加载状态
- 平滑的动画过渡

#### 可访问性
- 更好的键盘导航
- 改进的屏幕阅读器支持
- 清晰的焦点指示器

## 技术实现

### 依赖集成
```bash
# 安装 Tabler 依赖
pnpm add @tabler/core@1.3.2 @tabler/icons-webfont@3.34.0
```

```scss
// 在 src/styles/tabler-theme.scss 中导入
@import '@tabler/core/dist/css/tabler.min.css';
@import '@tabler/icons-webfont/dist/tabler-icons.min.css';
```

### 主题集成
- 保持原有的 CSS 变量系统
- Tabler 变量与现有主题系统的映射
- 深色/浅色模式的完整支持

### 组件兼容性
- 保持所有原有的 props 和 API
- 向后兼容的组件接口
- 渐进式升级策略

### System Status 功能实现

#### 数据源
- **连接数据**: 通过 WebSocket 实时获取连接信息
- **代理数据**: 通过 React Query 定期获取代理状态
- **规则数据**: 通过 React Query 获取规则配置

#### 实时更新机制
```typescript
// 连接数据实时更新
useEffect(() => {
  const unsubscribe = connAPI.fetchData(apiConfig, readConnectionData);
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [apiConfig, readConnectionData]);

// 代理数据定期刷新（30秒）
const { data: proxiesData } = useQuery({
  queryKey: ['proxies', apiConfig],
  queryFn: () => fetchProxies(apiConfig),
  refetchInterval: 30000,
});
```

#### 状态计算
- **连接状态**: 基于 WebSocket 连接状态
- **活跃连接数**: 当前连接数组长度
- **代理统计**: 过滤非 Direct 且可用的代理
- **流量统计**: 格式化字节数显示

## 文件变更

### 新增文件
- `src/styles/tabler-theme.scss` - Tabler 主题定制
- `src/hooks/useSystemStatus.ts` - 系统状态数据Hook
- `TABLER_REFACTOR.md` - 本说明文档

### 修改文件
- `index.html` - 移除 CDN 链接（改为本地安装）
- `src/components/Root.scss` - 引入 Tabler 主题
- `src/components/Root.tsx` - 更新页面布局结构
- `src/components/SideBar.tsx` - 重构侧边栏组件
- `src/components/Home.tsx` - 重构主页布局
- `src/components/Button.tsx` - 重构按钮组件
- `src/components/ConnectionTable.tsx` - 重构表格组件
- `src/components/shared/ThemeSwitcher.tsx` - 重构主题切换器
- `src/i18n/en.ts` - 添加新的翻译键
- `src/i18n/zh.ts` - 添加新的翻译键

## 兼容性

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 功能兼容性
- ✅ 所有原有功能保持不变
- ✅ 主题切换功能完整保留
- ✅ 响应式设计改进
- ✅ 国际化支持保持

## 未来改进

### 短期计划
- 完善所有页面的 Tabler 样式集成
- 添加更多动画效果
- 优化移动端体验

### 长期计划
- 考虑使用 Tabler React 组件
- 进一步的性能优化
- 更多的自定义主题选项

## 总结

本次重构成功将 YACD 升级为使用 Tabler UI 框架，提供了更现代化、美观的用户界面，同时保持了所有原有功能的完整性。新的设计系统提供了更好的用户体验、更强的可维护性和更好的扩展性。 