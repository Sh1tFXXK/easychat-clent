// 不需要导入socket.io，我们只需要模拟客户端行为
import { v4 as uuidv4 } from 'uuid';
import chatList from './chatList.json';
import chatHistoryList from './chatHistoryList.json';

// 模拟的在线用户列表
let onlineUsers = [];

// 创建一个模拟的Socket.io服务器
const createMockSocketServer = () => {
  console.log('[MockSocket] 正在创建模拟Socket.io服务器...');
  
  // 检查是否在浏览器环境中
  if (typeof window === 'undefined') return;
  
  // 创建一个模拟的Socket.io服务器
  const mockSocketServer = {
    // 存储所有注册的事件处理函数
    eventHandlers: {},
    
    // 注册事件处理函数
    on(event, handler) {
      this.eventHandlers[event] = handler;
      return this;
    },
    
    // 触发事件
    emit(event, ...args) {
      console.log(`[MockSocket] 客户端发送事件: ${event}`, args);
      
      // 特殊处理sendMsg事件
      if (event === 'sendMsg') {
        const message = args[0];
        const callback = args[1];
        
        // 生成消息ID
        const messageWithId = {
          ...message,
          id: uuidv4()
        };
        
        console.log('[MockSocket] 模拟发送消息:', messageWithId);
        
        // 模拟服务器响应
        setTimeout(() => {
          if (callback && typeof callback === 'function') {
            callback(messageWithId, onlineUsers.includes(message.receiverId) ? 'offline' : '');
          }
          
          // 触发receiveMsg事件，模拟接收消息
          if (this.eventHandlers['receiveMsg']) {
            console.log('[MockSocket] 触发receiveMsg事件:', messageWithId);
            this.eventHandlers['receiveMsg'](messageWithId);
          }
        }, 300);
        
        return;
      }
      
      // 特殊处理online事件
      if (event === 'online') {
        const userId = args[0];
        if (!onlineUsers.includes(userId)) {
          onlineUsers.push(userId);
        }
        console.log('[MockSocket] 用户上线:', userId);
        console.log('[MockSocket] 当前在线用户:', onlineUsers);
        
        // 广播在线用户列表
        setTimeout(() => {
          if (this.eventHandlers['onlineUsers']) {
            this.eventHandlers['onlineUsers'](onlineUsers);
          }
        }, 300);
        
        return;
      }
      
      // 特殊处理offline事件
      if (event === 'offline') {
        const userId = args[0];
        onlineUsers = onlineUsers.filter(id => id !== userId);
        console.log('[MockSocket] 用户下线:', userId);
        console.log('[MockSocket] 当前在线用户:', onlineUsers);
        
        // 广播在线用户列表
        setTimeout(() => {
          if (this.eventHandlers['onlineUsers']) {
            this.eventHandlers['onlineUsers'](onlineUsers);
          }
        }, 300);
        
        return;
      }
      
      // 特殊处理readMessages事件
      if (event === 'readMessages') {
        const sessionId = args[0];
        const userId = args[1];
        console.log('[MockSocket] 标记消息已读:', { sessionId, userId });
        return;
      }
      
      // 特殊处理addSession事件
      if (event === 'addSession') {
        const userId = args[0];
        const friendUserId = args[1];
        const callback = args[2];
        
        console.log('[MockSocket] 创建会话:', { userId, friendUserId });
        
        // 检查会话是否已存在
        const existingSession = chatList.find(
          chat => chat.userId === userId && chat.friendUserId === friendUserId
        );
        
        if (existingSession) {
          if (callback && typeof callback === 'function') {
            callback('exist');
          }
        } else {
          // 创建新会话
          const newSession = {
            sessionId: uuidv4(),
            userId,
            friendUserId,
            friendRemark: '新好友',
            friendNickName: '新好友',
            friendAvatar: '/images/avatar1.jpeg',
            createTime: new Date().toISOString(),
            latestChatHistory: null
          };
          
          if (callback && typeof callback === 'function') {
            callback(newSession);
          }
        }
        
        return;
      }
      
      // 处理其他事件
      if (this.eventHandlers[event]) {
        this.eventHandlers[event](...args);
      }
    },
    
    // 模拟to方法
    to() {
      return {
        emit: (event, ...args) => {
          console.log(`[MockSocket] 服务器发送事件: ${event}`, args);
        }
      };
    },
    
    // 模拟broadcast
    get broadcast() {
      return {
        emit: (event, ...args) => {
          console.log(`[MockSocket] 服务器广播事件: ${event}`, args);
          
          // 特殊处理onlineUsers事件
          if (event === 'onlineUsers' && this.eventHandlers['onlineUsers']) {
            this.eventHandlers['onlineUsers'](args[0]);
          }
        }
      };
    }
  };
  
  // 模拟连接成功事件
  setTimeout(() => {
    if (mockSocketServer.eventHandlers['connect']) {
      mockSocketServer.eventHandlers['connect']();
    }
  }, 500);
  
  return mockSocketServer;
};

export default createMockSocketServer;