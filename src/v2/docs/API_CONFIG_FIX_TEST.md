# API 配置修复测试指南

## 问题描述
之前在保存 API 配置后，点击其他菜单会出现 "Failed to fetch" 错误，这是因为 React Query 缓存没有正确清理导致的。

## 修复内容

### 1. 添加了 API 配置变更监听
- 在 `useAPI.ts` 中添加了 `useApiConfigEffect` Hook
- 当 API 配置（baseURL 或 secret）发生变化时，自动清理所有查询缓存

### 2. 改进了查询键策略
- 所有查询现在都包含 `apiConfig` 作为查询键的一部分
- 确保 API 配置变更时，相关查询会自动重新执行

### 3. 优化了缓存失效机制
- 使用 `queryClient.invalidateQueries()` 和 `queryClient.clear()` 清理缓存
- 在配置更新后立即刷新相关查询

## 测试步骤

### 测试环境
1. 确保 V2 开发服务器正在运行：
   ```bash
   npm run dev:v2
   ```
2. 访问：http://localhost:3002/index.v2.html

### 测试场景 1：API 配置变更
1. 打开浏览器开发者工具的 Console 标签
2. 访问 Config 页面 (`#configs`)
3. 修改 API 地址或密钥
4. 保存配置
5. 观察 Console 是否输出：`API config changed, invalidating all queries`
6. 点击其他菜单（如 Dashboard、Proxies 等）
7. 验证页面是否正常加载，没有 "Failed to fetch" 错误

### 测试场景 2：页面切换
1. 在 Dashboard 页面等待数据加载完成
2. 切换到 Config 页面
3. 修改任意配置项并保存
4. 立即切换到 Proxies 页面
5. 验证代理数据是否正常加载
6. 切换到 Connections 页面
7. 验证连接数据是否正常显示

### 测试场景 3：WebSocket 连接
1. 在 Dashboard 页面观察实时流量图表
2. 切换到 Config 页面修改配置
3. 保存后返回 Dashboard
4. 验证流量图表是否继续正常更新
5. 切换到 Logs 页面
6. 验证日志是否正常流式显示

## 预期结果

### ✅ 修复后的正常行为
- API 配置保存后，所有页面都能正常访问
- 页面切换流畅，无 "Failed to fetch" 错误
- WebSocket 连接在配置变更后能正确重连
- 数据缓存在配置变更时被正确清理
- Console 中有清晰的调试信息

### ❌ 修复前的问题行为
- 保存 API 配置后点击其他菜单出现 "Failed to fetch"
- 页面显示加载失败或空白内容
- WebSocket 连接断开且无法重连
- 缓存数据与新配置不匹配

## 技术细节

### 修改的文件
1. `src/v2/hooks/useAPI.ts`
   - 添加 `useApiConfigEffect` Hook
   - 改进所有 API hooks 的缓存管理
   - 优化查询键策略

2. `src/v2/App.tsx`
   - 在 `AppInitializer` 中添加全局 API 配置监听

### 关键代码
```typescript
// API 配置变更监听
export function useApiConfigEffect() {
  const queryClient = useQueryClient();
  const apiConfig = useApiConfig();
  const prevApiConfigRef = useRef<typeof apiConfig>();

  useEffect(() => {
    if (prevApiConfigRef.current && 
        (prevApiConfigRef.current.baseURL !== apiConfig.baseURL || 
         prevApiConfigRef.current.secret !== apiConfig.secret)) {
      
      console.log('API config changed, invalidating all queries');
      queryClient.invalidateQueries();
      queryClient.clear();
    }
    
    prevApiConfigRef.current = apiConfig;
  }, [apiConfig, queryClient]);
}
```

## 故障排除

### 如果仍然出现问题
1. 检查浏览器 Console 是否有错误信息
2. 确认 API 地址和端口是否正确
3. 验证 Clash 核心是否正在运行
4. 尝试刷新页面清除浏览器缓存
5. 检查网络连接是否正常

### 调试信息
- 打开浏览器开发者工具
- 查看 Network 标签中的 API 请求
- 观察 Console 中的日志输出
- 检查 Application 标签中的 LocalStorage

## 总结
此修复确保了 API 配置变更后，V2 应用能够正确处理缓存失效和重新连接，提供流畅的用户体验。 