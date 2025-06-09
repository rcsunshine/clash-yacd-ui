# YACD V1 到 V2 迁移指南

## 概述

本指南将帮助您逐步从 V1 版本迁移到 V2 版本，确保平滑过渡和功能完整性。

## 迁移策略

### 1. 并行开发阶段 (已完成)

- ✅ V2 架构已建立
- ✅ 基础组件库已创建
- ✅ 示例页面已实现
- ✅ 开发环境已配置
- ✅ 集成现有 V1 API 和状态管理
- ✅ Dashboard 页面已完成
- ✅ Proxies 页面基础版本已完成
- ✅ Connections 页面基础版本已完成

**当前可以做的：**
```bash
# 启动 V2 开发预览 (端口 3002)
npm run dev:v2

# 同时运行两个版本进行对比
npm run dev:both
```

### 2. 数据层集成阶段 (已完成)

**目标：** 让 V2 使用现有的 API 和数据层

**已完成的步骤：**
1. ✅ 复用现有的 API 层 (`src/api/`)
2. ✅ 复用现有的状态管理 (`src/store/`)
3. ✅ 复用现有的 hooks (`src/hooks/`)
4. ✅ 集成 React Query 进行数据管理
5. ✅ 集成 Jotai 状态管理

**实施结果：**
```typescript
// V2 hooks 已集成现有 API
import { useSystemInfo, useClashConfig, useProxies, useConnections } from '../hooks/useAPI';

// V2 页面中使用真实数据
export const Dashboard: React.FC = () => {
  const { data: systemInfo } = useSystemInfo();
  const { data: config } = useClashConfig();
  const { data: proxiesData } = useProxies();
  const { data: connectionsData } = useConnections();
  
  // 渲染真实数据，不再使用模拟数据
  return (
    <div>
      {/* 显示真实的系统信息、配置、代理和连接数据 */}
    </div>
  );
};
```

### 3. 页面逐步迁移阶段 (进行中)

**迁移顺序：**
1. **首页 (Dashboard)** - ✅ 已完成，集成真实数据
2. **代理页面 (Proxies)** - ✅ 基础版本已完成
3. **连接页面 (Connections)** - ✅ 基础版本已完成
4. **规则页面 (Rules)** - ⏳ 待开发
5. **日志页面 (Logs)** - ⏳ 待开发
6. **配置页面 (Config)** - ⏳ 待开发

**每个页面的迁移步骤：**
1. 创建 V2 版本的页面组件
2. 集成现有的数据 hooks
3. 实现所有原有功能
4. 添加新的 UI 改进
5. 测试功能完整性

### 4. 路由集成阶段

**目标：** 在同一个应用中支持 V1 和 V2 页面切换

```typescript
// 在主应用中添加版本切换
const App = () => {
  const [useV2, setUseV2] = useState(false);
  
  return (
    <Router>
      {useV2 ? <AppV2 /> : <AppV1 />}
    </Router>
  );
};
```

### 5. 完全替换阶段

**目标：** V2 完全替换 V1

**步骤：**
1. 确保所有功能已迁移
2. 进行全面测试
3. 更新构建配置
4. 移除 V1 代码

## 技术细节

### 组件映射

| V1 组件 | V2 组件 | 状态 |
|---------|---------|------|
| `Button` | `@v2/ui/Button` | ✅ 已完成 |
| `Card` | `@v2/ui/Card` | ✅ 已完成 |
| `SideBar` | `@v2/layout/Sidebar` | ✅ 已完成 |
| `Home` | `@v2/pages/Dashboard` | ✅ 已完成 |
| `Connections` | `@v2/pages/Connections` | ⏳ 待开发 |
| `Proxies` | `@v2/pages/Proxies` | ⏳ 待开发 |

### 样式系统迁移

**V1 样式系统：**
- SCSS + CSS 变量
- 自定义主题系统
- 手写响应式样式

**V2 样式系统：**
- Tailwind CSS + CSS 变量
- 统一的设计系统
- 响应式优先

**迁移策略：**
1. 保持相同的 CSS 变量名
2. 使用 Tailwind 重写样式
3. 保持主题切换功能

### 状态管理迁移

**保持兼容：**
- 继续使用现有的 Jotai atoms
- 继续使用现有的 React Query
- 继续使用现有的 API 层

**示例：**
```typescript
// V2 组件中使用现有状态
import { useAtom } from 'jotai';
import { darkModePureBlackToggleAtom } from '../../store/app';

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useAtom(darkModePureBlackToggleAtom);
  // ...
};
```

## 开发工作流

### 日常开发

1. **开发新功能时：** 优先在 V2 中实现
2. **修复 bug 时：** 在 V1 中修复，然后同步到 V2
3. **测试时：** 同时测试两个版本

### 代码组织

```
src/
├── v2/                 # V2 新架构
│   ├── components/     # V2 组件
│   ├── pages/         # V2 页面
│   └── styles/        # V2 样式
├── components/        # V1 组件 (保持不变)
├── api/              # 共享 API 层
├── hooks/            # 共享 Hooks
└── store/            # 共享状态管理
```

### 测试策略

1. **功能测试：** 确保 V2 功能与 V1 一致
2. **性能测试：** 确保 V2 性能不低于 V1
3. **兼容性测试：** 确保在不同设备和浏览器上正常工作
4. **用户体验测试：** 确保 V2 提供更好的用户体验

## 风险控制

### 回退策略

1. **功能级回退：** 单个页面可以回退到 V1 版本
2. **完全回退：** 可以完全禁用 V2，回到 V1
3. **渐进启用：** 可以为不同用户启用不同版本

### 质量保证

1. **代码审查：** 所有 V2 代码都需要审查
2. **自动化测试：** 建立 V2 的测试套件
3. **用户反馈：** 收集用户对 V2 的反馈

## 时间计划

### 第一阶段 (1-2 周)
- [ ] 集成现有数据层
- [ ] 完善 Dashboard 页面
- [ ] 开始 Proxies 页面开发

### 第二阶段 (2-3 周)
- [ ] 完成 Proxies 页面
- [ ] 完成 Connections 页面
- [ ] 添加路由支持

### 第三阶段 (2-3 周)
- [ ] 完成剩余页面
- [ ] 全面测试
- [ ] 性能优化

### 第四阶段 (1 周)
- [ ] 完全替换 V1
- [ ] 清理旧代码
- [ ] 文档更新

## 注意事项

1. **保持向后兼容：** 确保现有用户的使用不受影响
2. **渐进增强：** 新功能优先在 V2 中实现
3. **性能优先：** V2 应该比 V1 更快更流畅
4. **用户体验：** V2 应该提供更好的用户体验

## 获取帮助

如果在迁移过程中遇到问题：

1. 查看现有的 V1 代码实现
2. 参考 V2 的示例组件
3. 查看本迁移指南
4. 在开发过程中记录问题和解决方案 