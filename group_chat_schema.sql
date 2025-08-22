-- 群组表 (groups)
CREATE TABLE `groups` (
  `group_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '群唯一标识',
  `group_name` VARCHAR(255) NOT NULL COMMENT '群名称',
  `owner_id` BIGINT NOT NULL COMMENT '群主的用户ID',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '群头像的URL',
  `announcement` TEXT DEFAULT NULL COMMENT '群公告',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`group_id`),
  KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组表';

-- 群组成员表 (group_members)
CREATE TABLE `group_members` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '唯一标识',
  `group_id` BIGINT NOT NULL COMMENT '群ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role` ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member' COMMENT '成员角色',
  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组成员表';

-- 群聊消息表 (group_messages)
CREATE TABLE `group_messages` (
  `message_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '消息唯一标识',
  `group_id` BIGINT NOT NULL COMMENT '接收消息的群ID',
  `sender_id` BIGINT NOT NULL COMMENT '发送消息的用户ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `message_type` ENUM('text', 'image', 'file') NOT NULL DEFAULT 'text' COMMENT '消息类型',
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`message_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_sender_id` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群聊消息表';
