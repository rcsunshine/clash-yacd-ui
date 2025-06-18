# Clash YACD UI - V2 Development Progress

## 🎯 最新重大更新 (2024-06-19)

### ✅ 修复日志刷新时多个重复WebSocket连接问题
**问题**: 刷新日志功能会创建多个重复的WebSocket连接，导致网络请求冗余和潜在的性能问题

**解决方案**: 
- **🔄 彻底重构WebSocket管理器** - 全面优化`forceReconnect`方法，确保完全清理旧连接
- **🛠️ 改进连接生命周期** - 实现完整的连接状态管理，包括新增`reconnecting`状态
- **📊 优化刷新机制** - 使用延迟重连策略，确保旧连接完全关闭后再创建新连接
- **🎨 增强异常处理** - 添加错误捕获和恢复机制，提高连接稳定性

**技术实现**:
```typescript
// 扩展WebSocket连接状态类型
interface WebSocketConnection {
  ws: WebSocket | null;
  endpoint: string;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  // ...其他属性
}

// 优化订阅逻辑，自动修复问题连接
public subscribe(endpoint: string, callback: (data: any) => void, apiConfig: any): () => void {
  // ...
  // 如果连接状态异常，先强制关闭并重置
  const existingConnection = this.connections.get(connectionKey);
  if (existingConnection && (existingConnection.status === 'error' || existingConnection.status === 'disconnected')) {
    console.log(`🔄 Resetting problematic connection: ${connectionKey}`);
    
    // 清理连接资源
    if (existingConnection.ws) {
      try {
        existingConnection.ws.onopen = null;
        existingConnection.ws.onmessage = null;
        existingConnection.ws.onerror = null;
        existingConnection.ws.onclose = null;
        existingConnection.ws.close(1000, 'Reset before subscribe');
      } catch (err) {
        console.error('Error closing problematic WebSocket:', err);
      }
      existingConnection.ws = null;
    }
    
    // 重置连接状态
    existingConnection.status = 'idle';
  }
  // ...
}

// 彻底重构的强制重连逻辑
public forceReconnect(endpoint: string): void {
  const connectionKey = this.getConnectionKey(endpoint);
  const connection = this.connections.get(connectionKey);
  
  if (connection) {
    // 设置重连锁，防止在清理过程中创建新连接
    connection.status = 'reconnecting';
    
    // 彻底清理现有WebSocket连接
    if (connection.ws) {
      try {
        // 先移除所有事件监听器，防止旧连接的事件触发
        connection.ws.onopen = null;
        connection.ws.onmessage = null;
        connection.ws.onerror = null;
        connection.ws.onclose = null;
        connection.ws.close(1000, 'Force reconnect');
      } catch (err) {
        console.error('Error closing WebSocket during force reconnect:', err);
      }
      connection.ws = null;
    }
    
    // 清除所有重连定时器
    this.clearReconnectTimer(connectionKey);
    
    // 从连接映射中删除当前连接
    this.connections.delete(connectionKey);
    
    // 延迟创建新连接，确保旧连接完全关闭
    setTimeout(() => {
      // 创建全新的连接对象
      const newConnection: WebSocketConnection = {
        ws: null,
        endpoint: connection.endpoint,
        status: 'idle',
        lastError: null,
        subscribers: connection.subscribers,
        lastActivity: Date.now()
      };
      
      // 添加到连接映射
      this.connections.set(connectionKey, newConnection);
      
      // 确保创建新连接
      if (this.currentApiConfig) {
        this.ensureConnection(connectionKey, connection.endpoint, this.currentApiConfig);
      }
    }, 300); // 延迟300ms确保旧连接完全关闭
  }
}

// 优化日志刷新流程
const refreshLogs = useCallback(() => {
  if (wsEndpointRef.current) {
    console.log('🔄 Logs: Starting refresh process');
    
    // 先清空当前日志，给用户一个明确的刷新反馈
    setLogs([]);
    
    // 使用延迟确保UI更新后再重连WebSocket
    setTimeout(() => {
      // 强制重连WebSocket
      globalWsManager.forceReconnect(wsEndpointRef.current!);
    }, 100);
  }
}, []);
```

**优化成果**:
- ✅ **彻底解决重复连接** - 完全重构的WebSocket管理器确保每个端点只有一个活跃连接
- ✅ **连接状态可靠性** - 新增`reconnecting`状态和延迟重连机制，避免连接冲突
- ✅ **资源利用优化** - 通过彻底清理旧连接和事件监听器，减少内存泄漏风险
- ✅ **代码质量提升** - 完善的错误处理和类型安全，符合TypeScript严格模式
- ✅ **用户体验改进** - 刷新操作反馈更加明确，连接管理更加稳定可靠

### ✅ 日志页面刷新功能
**问题**: 日志页面的刷新按钮存在但无实际功能，用户无法手动刷新日志数据

**解决方案**: 
- **🔄 添加WebSocket重连机制** - 实现`refreshLogs`方法强制重新连接WebSocket
- **🛠️ 优化日志Hook** - 在useLogs中保存endpoint引用，支持手动刷新
- **📊 添加UI反馈** - 实现刷新按钮加载状态和动画效果
- **🎨 改善用户体验** - 刷新时清空旧日志，提供明确的视觉反馈

**技术实现**:
```typescript
// Hook实现
const refreshLogs = useCallback(() => {
  if (wsEndpointRef.current) {
    // 使用全局WebSocket管理器强制重连
    const globalWsManager = GlobalWebSocketManager.getInstance();
    globalWsManager.forceReconnect(wsEndpointRef.current);
    
    // 清空当前日志，给用户一个明确的刷新反馈
    setLogs([]);
  }
}, []);

// UI实现
<Button 
  variant="outline" 
  size="sm"
  onClick={handleRefresh}
  disabled={isRefreshing}
>
  <svg className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}>
    {/* 刷新图标 */}
  </svg>
  {isRefreshing ? '刷新中...' : '刷新'}
</Button>
```

**优化成果**:
- ✅ **功能完善** - 用户可以手动刷新日志，确保显示最新数据
- ✅ **交互友好** - 按钮状态、加载动画和文本变化提供清晰反馈
- ✅ **技术优化** - 使用WebSocket重连而非重新加载页面，更高效
- ✅ **用户体验** - 刷新时清空旧日志，避免混淆新旧数据

### ✅ 规则提供者更新功能
**问题**: 规则提供者(Rule Provider)虽然显示在界面上，但缺乏更新按钮功能，无法手动刷新规则

**解决方案**: 
- **🔄 添加规则提供者API** - 实现`updateRuleProvider`方法更新单个规则提供者
- **🛠️ 扩展规则Hook** - 在useRules中添加更新功能，并使用typescript扩展类型确保类型安全
- **📊 添加UI交互** - 实现更新按钮，包括加载状态和成功提示
- **🎨 完善用户体验** - 加入动画和反馈消息，操作过程清晰可见

**技术实现**:
```typescript
// 类型定义
export interface RulesQueryResult extends UseQueryResult<RulesResponse> {
  updateRuleProvider: (providerName: string) => Promise<any>;
}

// API实现
const updateRuleProvider = async (providerName: string) => {
  if (!apiConfig?.baseURL) throw new Error('API配置未设置');
  
  const client = createAPIClient(apiConfig);
  const response = await client.put(`/providers/rules/${providerName}`);
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  // 更新缓存
  queryClient.invalidateQueries(['rules']);
  
  return response.data;
};

// UI实现
<Button 
  variant="outline" 
  size="sm"
  disabled={updatingProvider === provider.name}
  onClick={() => handleUpdateProvider(provider.name)}
>
  {updatingProvider === provider.name ? "更新中..." : "更新"}
</Button>
```

**优化成果**:
- ✅ **功能完善** - 用户可以手动刷新规则提供者，确保规则最新
- ✅ **交互友好** - 按钮状态、加载动画和反馈提示清晰明了
- ✅ **错误处理** - 完善的错误捕获和展示机制
- ✅ **类型安全** - 使用TypeScript扩展类型，确保API类型安全

### ✅ 修复连接时长排序逻辑
**问题**: 连接时长排序与其他字段的升序/降序行为不一致，导致用户困惑

**解决方案**: 
- **🔄 重构时间排序逻辑** - 根据连接开始时间正确计算排序顺序
- **🛠️ 调整升序降序行为** - 确保升序显示短时长连接，降序显示长时长连接
- **📊 统一排序规则** - 与其他字段保持一致的排序行为
- **🎨 添加详细注释** - 清晰说明排序逻辑，便于后续维护

**技术实现**:
```typescript
// 修复前 - 时长排序逻辑与其他字段不一致
case 'time':
  comparison = new Date(b.start).getTime() - new Date(a.start).getTime();
  break;
// ...
return sortOrder === 'asc' ? comparison : -comparison;

// 修复后 - 统一排序逻辑
case 'time':
  // 时间排序：
  // - 对于显示来说，时长越长的连接start时间越早（时间戳越小）
  // - 升序(asc)：短时长在前（新连接，大时间戳）
  // - 降序(desc)：长时长在前（旧连接，小时间戳）
  const timeA = new Date(a.start).getTime();
  const timeB = new Date(b.start).getTime();
  comparison = timeA - timeB; // 小时间戳(早，长时长) - 大时间戳(晚，短时长)
  break;
// ...
// 升序(asc)：短时长在前，降序(desc)：长时长在前
return sortOrder === 'asc' ? comparison : -comparison;
```

**优化成果**:
- ✅ **排序行为一致** - 时长排序与其他字段保持一致的升序/降序行为
- ✅ **用户体验提升** - 直观的排序结果，符合用户预期
- ✅ **代码可维护性** - 详细注释解释排序逻辑，便于后续维护
- ✅ **视觉反馈准确** - 排序图标与实际排序方向完全匹配

### ✅ 修复连接列表所有字段排序问题
**问题**: 连接列表的排序逻辑与实际显示不一致，升序降序图标也与实际排序顺序相反

**解决方案**: 
- **🔄 修复所有字段排序逻辑** - 统一排序规则，确保所有字段排序行为一致
- **🛠️ 优化流量字段排序** - 修复上传、下载和总流量的排序逻辑，大值优先
- **📊 修正排序图标** - 调整升序降序图标，与实际排序方向保持一致
- **🎨 统一排序行为** - 确保升序(asc)显示小值，降序(desc)显示大值

**技术实现**:
```typescript
// 修复前 - 排序逻辑不一致
case 'time':
  comparison = new Date(b.start).getTime() - new Date(a.start).getTime();
  break;
case 'upload':
  comparison = a.upload - b.upload; // 错误：小值优先
  break;
// ...
return sortOrder === 'asc' ? -comparison : comparison; // 错误：返回值计算不一致

// 修复后 - 统一排序逻辑
case 'time':
  comparison = new Date(b.start).getTime() - new Date(a.start).getTime();
  break;
case 'upload':
  comparison = b.upload - a.upload; // 修复：大值优先
  break;
// ...
return sortOrder === 'asc' ? comparison : -comparison; // 修复：统一返回值计算
```

**优化成果**:
- ✅ **排序行为一致** - 所有字段排序逻辑统一，符合用户预期
- ✅ **视觉反馈准确** - 升序降序图标与实际排序方向一致
- ✅ **排序规则合理** - 时间、流量默认大值优先，主机名按字母顺序
- ✅ **用户体验提升** - 直观的排序行为，减少用户困惑

### ✅ 修复连接列表排序顺序
**问题**: 连接列表的排序顺序与预期相反，最新的连接没有显示在最上面

**解决方案**: 
- **🔄 修复时间排序逻辑** - 调整比较函数，正确处理时间戳大小关系
- **🛠️ 优化排序方向** - 确保降序(desc)显示最新连接，升序(asc)显示最旧连接
- **📊 修复排序顺序** - 修改返回值计算方式，确保正确的排序方向

**技术实现**:
```typescript
// 修复前
case 'time':
  comparison = new Date(a.start).getTime() - new Date(b.start).getTime();
  break;
// ...
return sortOrder === 'asc' ? comparison : -comparison;

// 修复后
case 'time':
  comparison = new Date(b.start).getTime() - new Date(a.start).getTime();
  break;
// ...
return sortOrder === 'asc' ? -comparison : comparison;
```

**优化成果**:
- ✅ **正确的时间排序** - 最新的连接默认显示在最上面
- ✅ **符合用户预期** - 与V1版本保持一致的排序行为
- ✅ **排序方向一致** - 降序(desc)显示最大值在前，升序(asc)显示最小值在前
- ✅ **用户体验提升** - 更容易找到最近建立的连接

### ✅ 优化连接暂停按钮颜色
**问题**: 连接页面的暂停按钮颜色与整体主题不协调，使用了默认的primary/danger颜色

**解决方案**: 
- **🎨 使用轮廓按钮样式** - 将按钮类型从实心改为轮廓型(outline)，视觉上更轻量
- **🔄 状态颜色优化** - 暂停状态使用琥珀色(amber)，恢复状态使用蓝色(blue)
- **📊 深色模式适配** - 添加dark:前缀类名，确保深色模式下显示正常
- **🛠️ 边框颜色调整** - 为按钮添加与状态匹配的边框颜色

**技术实现**:
```typescript
<Button 
  variant="outline"
  size="sm" 
  onClick={togglePause}
  className={cn(
    "text-sm",
    isPaused 
      ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800" 
      : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
  )}
>
  {/* 按钮内容 */}
</Button>
```

**优化成果**:
- ✅ **视觉协调性** - 按钮样式与页面中其他按钮保持一致
- ✅ **状态区分明确** - 暂停/恢复状态使用不同颜色明确区分
- ✅ **主题适配** - 完美支持浅色/深色主题
- ✅ **视觉层次优化** - 轮廓型按钮不会抢占视觉焦点，整体页面更加平衡 

### ✅ 规则提供者API不可用处理优化
**问题**: 某些Clash核心版本不支持规则提供者API，导致页面加载失败或显示错误

**解决方案**: 
- **🔄 优化API错误处理** - 捕获规则提供者API 404错误，不影响主要功能
- **🛠️ 降级显示策略** - 在API不可用时提供友好的用户提示和解释
- **📊 区分规则类型** - 区分HTTP和本地文件规则提供者，提供不同的更新选项
- **🎨 增强用户体验** - 添加提示信息，解释可能的原因和解决方案

**技术实现**:
```typescript
// 尝试获取规则提供者，但如果失败不影响整体功能
let providers = {};
try {
  const providersResponse = await client.get('/providers/rules');
  if (!providersResponse.error && providersResponse.data?.providers) {
    providers = providersResponse.data.providers;
  }
} catch (error) {
  console.warn('规则提供者API不可用:', error);
  // 不抛出错误，继续使用空的providers对象
}

// UI中显示友好提示
{error && String(error).includes('404') && (
  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg">
    <p className="text-sm">
      <strong>提示：</strong> 规则提供者API不可用。这可能是因为：
    </p>
    <ul className="list-disc pl-5 mt-2 text-sm">
      <li>您使用的Clash核心版本不支持此功能</li>
      <li>API路径已更改或被禁用</li>
    </ul>
  </div>
)}
```

**优化成果**:
- ✅ **容错性提升** - 即使规则提供者API不可用，页面仍能正常显示规则列表
- ✅ **用户友好** - 提供清晰的错误提示和可能的原因解释
- ✅ **降级体验** - 在功能不可用时提供备选UI和操作指导
- ✅ **兼容性增强** - 支持不同版本的Clash核心和API实现

## 2023年核心功能优化记录

### 流量监控与图表优化

- [x] **流量图表初始化优化** - 2023.xx.xx
  - 修复流量图表首次加载时显示空白或占位内容的问题
  - 优化TrafficChart组件，使用默认值为0的数据点进行初始化
  - 统一首次渲染行为，确保图表初始状态一致
  - 解决用户反馈的"首次加载图表闪烁"问题

- [x] **流量图表性能优化** - 2023.xx.xx
  - 使用React.memo优化组件重渲染
  - 实现条件渲染，只在有流量时显示工具提示和交互效果
  - 添加平滑过渡动画，改善用户体验
  - 增加性能监控功能，便于开发环境调试
  - 添加零流量状态的友好提示 