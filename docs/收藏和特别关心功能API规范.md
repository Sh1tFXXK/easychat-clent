# 收藏和特别关心功能 API 规范

## 概述

本文档定义了收藏和特别关心功能的完整后端API接口规范，包括数据库设计、接口定义和实现要求。

## 数据库设计

### 1. 收藏表 (favorites)

```sql
CREATE TABLE favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    item_type ENUM('message', 'user', 'group', 'file') NOT NULL COMMENT '收藏类型',
    item_id VARCHAR(100) NOT NULL COMMENT '收藏项目ID',
    title VARCHAR(500) NOT NULL COMMENT '收藏标题',
    content TEXT COMMENT '收藏内容',
    category_id BIGINT COMMENT '分类ID',
    tags JSON COMMENT '标签数组',
    notes TEXT COMMENT '用户备注',
    metadata JSON COMMENT '元数据',
    special_care BOOLEAN DEFAULT FALSE COMMENT '是否特别关心',
    special_care_priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '特别关心优先级',
    special_care_time DATETIME COMMENT '设置特别关心时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_item_type (item_type),
    INDEX idx_category_id (category_id),
    INDEX idx_special_care (special_care),
    INDEX idx_created_at (created_at),
    UNIQUE KEY uk_user_item (user_id, item_type, item_id)
);
```

### 2. 收藏分类表 (favorite_categories)

```sql
CREATE TABLE favorite_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    color VARCHAR(7) DEFAULT '#409EFF' COMMENT '分类颜色',
    icon VARCHAR(50) COMMENT '分类图标',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    UNIQUE KEY uk_user_name (user_id, name)
);
```

### 3. 收藏统计表 (favorite_stats)

```sql
CREATE TABLE favorite_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    total_count INT DEFAULT 0 COMMENT '总收藏数',
    message_count INT DEFAULT 0 COMMENT '消息收藏数',
    user_count INT DEFAULT 0 COMMENT '用户收藏数',
    group_count INT DEFAULT 0 COMMENT '群组收藏数',
    file_count INT DEFAULT 0 COMMENT '文件收藏数',
    special_care_count INT DEFAULT 0 COMMENT '特别关心数',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_id (user_id)
);
```

## API 接口定义

### 1. 收藏管理接口

#### 1.1 添加收藏
```
POST /api/favorites
Content-Type: application/json

Request Body:
{
    "item_type": "message",
    "item_id": "msg_123456",
    "title": "重要消息",
    "content": "消息内容",
    "category_id": 1,
    "tags": ["工作", "重要"],
    "notes": "用户备注",
    "metadata": {
        "sender": "张三",
        "chat_id": "chat_123"
    }
}

Response:
{
    "success": true,
    "message": "收藏成功",
    "data": {
        "id": 123,
        "created_at": "2024-01-01 12:00:00"
    }
}
```

#### 1.2 获取收藏列表
```
GET /api/favorites?page=1&page_size=20&category_id=1&item_type=message&keyword=搜索关键词&sort=created_at&order=desc

Response:
{
    "success": true,
    "data": {
        "list": [
            {
                "id": 123,
                "item_type": "message",
                "item_id": "msg_123456",
                "title": "重要消息",
                "content": "消息内容",
                "category": {
                    "id": 1,
                    "name": "工作",
                    "color": "#409EFF"
                },
                "tags": ["工作", "重要"],
                "notes": "用户备注",
                "special_care": false,
                "created_at": "2024-01-01 12:00:00",
                "updated_at": "2024-01-01 12:00:00"
            }
        ],
        "total": 100,
        "page": 1,
        "page_size": 20
    }
}
```

#### 1.3 更新收藏
```
PUT /api/favorites/{id}
Content-Type: application/json

Request Body:
{
    "title": "更新后的标题",
    "category_id": 2,
    "tags": ["更新", "标签"],
    "notes": "更新后的备注"
}

Response:
{
    "success": true,
    "message": "更新成功"
}
```

#### 1.4 删除收藏
```
DELETE /api/favorites/{id}

Response:
{
    "success": true,
    "message": "删除成功"
}
```

#### 1.5 批量操作收藏
```
POST /api/favorites/batch
Content-Type: application/json

Request Body:
{
    "action": "delete", // delete, update_category, add_tags, remove_tags
    "ids": [1, 2, 3],
    "data": {
        "category_id": 2, // 用于 update_category
        "tags": ["新标签"] // 用于 add_tags, remove_tags
    }
}

Response:
{
    "success": true,
    "message": "批量操作成功",
    "data": {
        "success_count": 3,
        "failed_count": 0
    }
}
```

### 2. 分类管理接口

#### 2.1 获取分类列表
```
GET /api/favorite-categories

Response:
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "工作",
            "color": "#409EFF",
            "icon": "work",
            "description": "工作相关收藏",
            "sort_order": 1,
            "count": 25
        }
    ]
}
```

#### 2.2 创建分类
```
POST /api/favorite-categories
Content-Type: application/json

Request Body:
{
    "name": "新分类",
    "color": "#67C23A",
    "icon": "folder",
    "description": "分类描述"
}

Response:
{
    "success": true,
    "message": "创建成功",
    "data": {
        "id": 2
    }
}
```

#### 2.3 更新分类
```
PUT /api/favorite-categories/{id}
Content-Type: application/json

Request Body:
{
    "name": "更新后的分类名",
    "color": "#E6A23C",
    "description": "更新后的描述"
}

Response:
{
    "success": true,
    "message": "更新成功"
}
```

#### 2.4 删除分类
```
DELETE /api/favorite-categories/{id}

Response:
{
    "success": true,
    "message": "删除成功"
}
```

#### 2.5 分类排序
```
POST /api/favorite-categories/sort
Content-Type: application/json

Request Body:
{
    "orders": [
        {"id": 1, "sort_order": 1},
        {"id": 2, "sort_order": 2}
    ]
}

Response:
{
    "success": true,
    "message": "排序成功"
}
```

### 3. 特别关心接口

#### 3.1 设置特别关心
```
POST /api/favorites/{id}/special-care
Content-Type: application/json

Request Body:
{
    "priority": "high", // high, medium, low
    "notes": "特别关心备注"
}

Response:
{
    "success": true,
    "message": "设置特别关心成功"
}
```

#### 3.2 取消特别关心
```
DELETE /api/favorites/{id}/special-care

Response:
{
    "success": true,
    "message": "取消特别关心成功"
}
```

#### 3.3 获取特别关心列表
```
GET /api/special-care?priority=high&page=1&page_size=20

Response:
{
    "success": true,
    "data": {
        "list": [
            {
                "id": 123,
                "item_type": "message",
                "title": "重要消息",
                "content": "消息内容",
                "priority": "high",
                "special_care_time": "2024-01-01 12:00:00",
                "notes": "特别关心备注"
            }
        ],
        "total": 50,
        "page": 1,
        "page_size": 20
    }
}
```

#### 3.4 更新特别关心
```
PUT /api/special-care/{id}
Content-Type: application/json

Request Body:
{
    "priority": "medium",
    "notes": "更新后的备注"
}

Response:
{
    "success": true,
    "message": "更新成功"
}
```

### 4. 搜索接口

#### 4.1 全文搜索
```
GET /api/favorites/search?q=搜索关键词&type=message&category_id=1&page=1&page_size=20

Response:
{
    "success": true,
    "data": {
        "list": [...],
        "total": 10,
        "page": 1,
        "page_size": 20,
        "suggestions": ["相关搜索建议"]
    }
}
```

#### 4.2 高级搜索
```
POST /api/favorites/advanced-search
Content-Type: application/json

Request Body:
{
    "keyword": "搜索关键词",
    "item_types": ["message", "user"],
    "category_ids": [1, 2],
    "tags": ["工作", "重要"],
    "date_range": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    },
    "special_care_only": false,
    "page": 1,
    "page_size": 20
}

Response:
{
    "success": true,
    "data": {
        "list": [...],
        "total": 25,
        "page": 1,
        "page_size": 20
    }
}
```

### 5. 统计接口

#### 5.1 获取收藏统计
```
GET /api/favorites/stats

Response:
{
    "success": true,
    "data": {
        "total_count": 100,
        "type_stats": {
            "message": 60,
            "user": 20,
            "group": 15,
            "file": 5
        },
        "category_stats": [
            {
                "category_id": 1,
                "category_name": "工作",
                "count": 40
            }
        ],
        "special_care_count": 15,
        "recent_activity": [
            {
                "date": "2024-01-01",
                "count": 5
            }
        ]
    }
}
```

### 6. 导入导出接口

#### 6.1 导出收藏
```
POST /api/favorites/export
Content-Type: application/json

Request Body:
{
    "format": "json", // json, csv, excel
    "scope": "all", // all, category, special, custom
    "category_ids": [1, 2],
    "fields": ["title", "content", "category", "tags", "created_at"],
    "options": {
        "include_metadata": true,
        "compress": false,
        "encrypt": false
    }
}

Response:
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="favorites_export.json"

[文件内容]
```

#### 6.2 导入收藏
```
POST /api/favorites/import
Content-Type: multipart/form-data

Form Data:
- file: [上传的文件]
- options: {
    "default_category": 1,
    "duplicate_handling": "skip", // skip, update, create
    "auto_tags": true,
    "batch_size": 100
  }

Response:
{
    "success": true,
    "message": "导入成功",
    "data": {
        "total": 100,
        "success": 95,
        "failed": 5,
        "errors": [
            {
                "line": 10,
                "error": "标题不能为空"
            }
        ]
    }
}
```

## 错误码定义

```javascript
const ERROR_CODES = {
    // 通用错误
    INVALID_PARAMS: 400001, // 参数错误
    UNAUTHORIZED: 401001,   // 未授权
    FORBIDDEN: 403001,      // 禁止访问
    NOT_FOUND: 404001,      // 资源不存在
    
    // 收藏相关错误
    FAVORITE_EXISTS: 409001,        // 收藏已存在
    FAVORITE_NOT_FOUND: 404002,     // 收藏不存在
    FAVORITE_LIMIT_EXCEEDED: 429001, // 收藏数量超限
    
    // 分类相关错误
    CATEGORY_EXISTS: 409002,        // 分类已存在
    CATEGORY_NOT_FOUND: 404003,     // 分类不存在
    CATEGORY_IN_USE: 409003,        // 分类正在使用中
    
    // 特别关心相关错误
    SPECIAL_CARE_LIMIT_EXCEEDED: 429002, // 特别关心数量超限
    
    // 导入导出错误
    IMPORT_FILE_INVALID: 400002,    // 导入文件格式错误
    EXPORT_FAILED: 500001,          // 导出失败
}
```

## 实现要求

### 1. 性能要求
- 收藏列表查询响应时间 < 200ms
- 搜索响应时间 < 500ms
- 支持分页，单页最大100条记录
- 实现适当的缓存策略

### 2. 安全要求
- 所有接口需要用户认证
- 用户只能操作自己的收藏数据
- 文件上传需要格式和大小限制
- 导出文件支持加密选项

### 3. 数据一致性
- 删除用户时级联删除相关收藏数据
- 删除分类时将收藏移至默认分类
- 统计数据实时更新或定时同步

### 4. 扩展性
- 支持插件化的收藏类型扩展
- 支持自定义字段和元数据
- 预留国际化接口

## 前端集成说明

### 1. 组件使用示例

```vue
<template>
  <div>
    <!-- 收藏按钮 -->
    <FavoriteButton
      :item-type="'message'"
      :item-id="messageId"
      :title="messageTitle"
      :content="messageContent"
      @favorited="handleFavorited"
    />
    
    <!-- 收藏管理器 -->
    <FavoriteManager
      v-model:visible="showManager"
      @item-selected="handleItemSelected"
    />
    
    <!-- 特别关心列表 -->
    <SpecialCareList
      :user-id="currentUserId"
      @item-click="handleSpecialCareClick"
    />
  </div>
</template>
```

### 2. API 调用示例

```javascript
import { 
  reqAddFavorite, 
  reqGetFavoritesList, 
  reqSetSpecialCare 
} from '@/api'

// 添加收藏
const addToFavorites = async (item) => {
  try {
    const result = await reqAddFavorite({
      item_type: 'message',
      item_id: item.id,
      title: item.title,
      content: item.content
    })
    
    if (result.success) {
      ElMessage.success('收藏成功')
    }
  } catch (error) {
    ElMessage.error('收藏失败')
  }
}

// 设置特别关心
const setSpecialCare = async (favoriteId, priority = 'high') => {
  try {
    const result = await reqSetSpecialCare(favoriteId, {
      priority,
      notes: '重要内容'
    })
    
    if (result.success) {
      ElMessage.success('设置特别关心成功')
    }
  } catch (error) {
    ElMessage.error('设置失败')
  }
}
```

## 总结

本API规范定义了完整的收藏和特别关心功能，包括：

1. **核心功能**：收藏管理、分类管理、特别关心
2. **高级功能**：搜索、统计、导入导出
3. **用户体验**：批量操作、拖拽排序、实时更新
4. **技术特性**：RESTful设计、错误处理、性能优化

前端已实现的组件可以直接与这些API接口对接，提供完整的用户体验。后端开发团队可以根据此规范实现相应的接口功能。