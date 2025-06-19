# API 配置持久化测试指南

## 问题描述
之前在 V2 中添加的 API 配置在页面刷新后会丢失，这是因为缺少状态持久化机制。

## 修复内容
添加了 `AppConfigSideEffect` 组件到 V2 应用中，确保 API 配置变更能够自动保存到 localStorage。

## 测试步骤

### 测试 1：添加新配置并验证持久化

1. **访问 API 配置页面**
   ```
   http://localhost:3002/index.v2.html#api-config
   ```

2. **添加新的 API 配置**
   - 点击 "添加新配置" 按钮
   - 填写配置信息：
     ```
     显示名称: 测试配置
     API 地址: http://127.0.0.1:8080
     密钥: test-secret
     ```
   - 点击 "添加配置"

3. **验证配置已添加**
   - 确认新配置出现在配置列表中
   - 检查配置显示正确的信息

4. **测试持久化**
   - 刷新页面 (F5 或 Ctrl+R)
   - 重新访问 API 配置页面
   - **预期结果**: 新添加的配置仍然存在

### 测试 2：切换配置并验证持久化

1. **切换到新配置**
   - 在配置列表中选择刚添加的配置
   - 点击对应的单选按钮

2. **验证切换成功**
   - 确认选中状态已更新
   - 检查页面顶部的状态指示器

3. **测试持久化**
   - 刷新页面
   - 重新访问 API 配置页面
   - **预期结果**: 选中的配置保持不变

## 验证方法

### 浏览器开发者工具验证

1. **打开开发者工具**
   - 按 F12 或右键选择 "检查"

2. **查看 Application 标签**
   - 点击 Application 标签
   - 在左侧找到 Local Storage
   - 展开 `http://localhost:3002`

3. **检查存储的数据**
   - 查找 `yacd.haishan.me` 键
   - 点击查看其值
   - 确认 `clashAPIConfigs` 数组包含您添加的配置

## 预期结果

### ✅ 修复后的正常行为
- 添加的 API 配置在页面刷新后仍然存在
- 配置切换状态能够正确保存和恢复
- 删除的配置不会在刷新后重新出现
- 所有配置变更都会自动保存到 localStorage

### ❌ 修复前的问题行为
- 页面刷新后新添加的配置消失
- 配置切换状态丢失，总是回到默认配置
- 需要重新配置 API 连接信息

## 技术实现

### 修改的文件
- `src/v2/App.tsx`: 添加 `AppConfigSideEffect` 组件

### 关键代码
```tsx
import { AppConfigSideEffect } from '../components/fn/AppConfigSideEffect';

export const AppV2: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        <AppConfigSideEffect />
        <AppLayout>
          <PageRenderer currentPage={currentPage} />
        </AppLayout>
      </AppInitializer>
    </QueryClientProvider>
  );
};
```

## 总结
通过添加 `AppConfigSideEffect` 组件，V2 现在具备了与 V1 相同的状态持久化能力，确保用户的 API 配置在页面刷新后不会丢失。 