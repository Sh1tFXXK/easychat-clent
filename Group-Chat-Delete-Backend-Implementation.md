# EasyChat 群聊删除功能后端实现

## 1. API 接口实现

### 1.1 删除群聊接口

**路径**: `DELETE /api/chat/groups/{groupId}`

**描述**: 解散群聊（仅群主可操作）

**Java Spring Boot 实现示例**:

```java
@RestController
@RequestMapping("/api/chat/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @DeleteMapping("/{groupId}")
    public ResponseEntity<ApiResponse> deleteGroup(
            @PathVariable String groupId,
            HttpServletRequest request) {
        try {
            // 从认证信息中获取当前用户ID
            String currentUserId = getUserIdFromAuth(request);
            
            // 验证用户是否是群主
            Group group = groupService.getGroupById(groupId);
            if (group == null) {
                return ResponseEntity.ok(ApiResponse.error("群聊不存在"));
            }
            
            if (!group.getOwnerId().equals(currentUserId)) {
                return ResponseEntity.ok(ApiResponse.error("只有群主可以解散群聊"));
            }
            
            // 执行删除操作
            groupService.deleteGroup(groupId);
            
            return ResponseEntity.ok(ApiResponse.success("群聊已解散"));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("解散群聊失败: " + e.getMessage()));
        }
    }
}
```

### 1.2 退出群聊接口

**路径**: `POST /api/chat/groups/{groupId}/leave`

**描述**: 用户退出群聊

```java
@PostMapping("/{groupId}/leave")
public ResponseEntity<ApiResponse> leaveGroup(
        @PathVariable String groupId,
        HttpServletRequest request) {
    try {
        String currentUserId = getUserIdFromAuth(request);
        
        // 验证群聊是否存在
        Group group = groupService.getGroupById(groupId);
        if (group == null) {
            return ResponseEntity.ok(ApiResponse.error("群聊不存在"));
        }
        
        // 群主不能退出群聊，只能解散
        if (group.getOwnerId().equals(currentUserId)) {
            return ResponseEntity.ok(ApiResponse.error("群主不能退出群聊，请使用解散功能"));
        }
        
        // 执行退出操作
        groupService.removeMemberFromGroup(groupId, currentUserId);
        
        return ResponseEntity.ok(ApiResponse.success("已退出群聊"));
    } catch (Exception e) {
        return ResponseEntity.ok(ApiResponse.error("退出群聊失败: " + e.getMessage()));
    }
}
```

## 2. Service 层实现

```java
@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private GroupMemberRepository groupMemberRepository;
    
    @Autowired
    private GroupMessageRepository groupMessageRepository;

    /**
     * 删除群聊
     */
    @Transactional
    public void deleteGroup(String groupId) {
        try {
            // 1. 删除群聊消息
            groupMessageRepository.deleteByGroupId(groupId);
            
            // 2. 删除群成员关系
            groupMemberRepository.deleteByGroupId(groupId);
            
            // 3. 删除群聊记录
            groupRepository.deleteById(groupId);
            
            // 4. 通知所有在线成员群聊已解散
            notifyGroupDissolved(groupId);
            
        } catch (Exception e) {
            throw new RuntimeException("删除群聊失败", e);
        }
    }

    /**
     * 用户退出群聊
     */
    @Transactional
    public void removeMemberFromGroup(String groupId, String userId) {
        try {
            // 删除成员关系
            groupMemberRepository.deleteByGroupIdAndUserId(groupId, userId);
            
            // 通知群内其他成员有用户退出
            notifyMemberLeft(groupId, userId);
            
        } catch (Exception e) {
            throw new RuntimeException("退出群聊失败", e);
        }
    }

    /**
     * 通知群聊解散
     */
    private void notifyGroupDissolved(String groupId) {
        // 使用WebSocket通知所有在线成员
        WebSocketNotification notification = new WebSocketNotification();
        notification.setType("group_dissolved");
        notification.setGroupId(groupId);
        notification.setMessage("群聊已被解散");
        
        webSocketService.broadcastToGroup(groupId, notification);
    }

    /**
     * 通知成员退出
     */
    private void notifyMemberLeft(String groupId, String userId) {
        // 使用WebSocket通知群内其他成员
        WebSocketNotification notification = new WebSocketNotification();
        notification.setType("member_left");
        notification.setGroupId(groupId);
        notification.setUserId(userId);
        notification.setMessage("用户已退出群聊");
        
        webSocketService.broadcastToGroup(groupId, notification);
    }
}
```

## 3. Repository 层实现

```java
@Repository
public interface GroupRepository extends JpaRepository<Group, String> {
    List<Group> findByOwnerId(String ownerId);
}

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, String> {
    List<GroupMember> findByGroupId(String groupId);
    List<GroupMember> findByUserId(String userId);
    void deleteByGroupId(String groupId);
    void deleteByGroupIdAndUserId(String groupId, String userId);
}

@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessage, String> {
    void deleteByGroupId(String groupId);
    List<GroupMessage> findByGroupIdOrderByCreatedAtDesc(String groupId, Pageable pageable);
}
```

## 4. 数据库操作

### 4.1 删除群聊的SQL语句

```sql
-- 删除群聊消息
DELETE FROM group_messages WHERE group_id = ?;

-- 删除群成员关系
DELETE FROM group_members WHERE group_id = ?;

-- 删除群聊
DELETE FROM groups WHERE group_id = ?;
```

### 4.2 退出群聊的SQL语句

```sql
-- 删除特定用户的群成员关系
DELETE FROM group_members WHERE group_id = ? AND user_id = ?;
```

## 5. WebSocket 事件定义

### 5.1 群聊解散事件

```javascript
// 客户端接收事件
{
  "type": "group_dissolved",
  "groupId": "string",
  "message": "群聊已被解散",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 5.2 成员退出事件

```javascript
// 客户端接收事件
{
  "type": "member_left",
  "groupId": "string",
  "userId": "string", 
  "username": "string",
  "message": "用户已退出群聊",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 6. 安全性考虑

1. **权限验证**: 确保只有群主能解散群聊
2. **数据完整性**: 使用事务确保删除操作的原子性
3. **软删除**: 考虑使用软删除保留历史数据
4. **审计日志**: 记录群聊解散和成员退出的操作日志

## 7. 性能优化

1. **批量删除**: 对于大量消息的群聊，考虑分批删除
2. **异步处理**: 将通知操作异步处理
3. **缓存更新**: 及时更新相关缓存数据

## 8. 错误处理

```java
public enum GroupErrorCode {
    GROUP_NOT_FOUND("GROUP_001", "群聊不存在"),
    NOT_GROUP_OWNER("GROUP_002", "只有群主可以执行此操作"),
    OPERATION_FAILED("GROUP_003", "操作失败"),
    MEMBER_NOT_FOUND("GROUP_004", "用户不在群聊中");
    
    private final String code;
    private final String message;
    
    // 构造函数和getter方法
}
```

这个实现提供了完整的群聊删除和退出功能，包括前端UI集成、后端API实现、数据库操作和实时通知机制。
