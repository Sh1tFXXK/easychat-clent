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
      
      // 模拟 'sendMsg' 事件: 客户端发送消息
      // @param {object} message - 消息对象
      // @param {function} callback - 客户端回调函数，(response, msg) => {}
      if (event === 'sendMsg') {
        const message = args[0];
        const callback = args[1];
        
        // 为消息分配唯一ID
        const messageWithId = {
          ...message,
          id: uuidv4()
        };
        
        console.log('[MockSocket] 模拟发送消息:', messageWithId);
        
        // 模拟服务器延迟响应
        setTimeout(() => {
          if (callback && typeof callback === 'function') {
            // 模拟响应，如果接收者不在线，则附带 'offline' 消息
            callback(messageWithId, onlineUsers.includes(message.receiverId) ? 'offline' : '');
          }
          
          // 触发 'receiveMsg' 事件，模拟服务器向客户端推送消息
          if (this.eventHandlers['receiveMsg']) {
            console.log('[MockSocket] 触发receiveMsg事件:', messageWithId);
            this.eventHandlers['receiveMsg'](messageWithId);
          }
        }, 300);
        
        return;
      }
      
      // 模拟 'online' 事件: 用户上线
      // @param {string} userId - 上线用户的ID
      if (event === 'online') {
        const userId = args[0];
        if (!onlineUsers.includes(userId)) {
          onlineUsers.push(userId);
        }
        console.log('[MockSocket] 用户上线:', userId);
        console.log('[MockSocket] 当前在线用户:', onlineUsers);
        
        // 广播更新后的在线用户列表
        setTimeout(() => {
          if (this.eventHandlers['onlineUsers']) {
            this.eventHandlers['onlineUsers'](onlineUsers);
          }
        }, 300);
        
        return;
      }
      
      // 模拟 'offline' 事件: 用户下线
      // @param {string} userId - 下线用户的ID
      if (event === 'offline') {
        const userId = args[0];
        onlineUsers = onlineUsers.filter(id => id !== userId);
        console.log('[MockSocket] 用户下线:', userId);
        console.log('[MockSocket] 当前在线用户:', onlineUsers);
        
        // 广播更新后的在线用户列表
        setTimeout(() => {
          if (this.eventHandlers['onlineUsers']) {
            this.eventHandlers['onlineUsers'](onlineUsers);
          }
        }, 300);
        
        return;
      }
      
      // 模拟 'readMessages' 事件: 标记消息为已读
      // @param {string} sessionId - 会话ID
      // @param {string} userId - 用户ID
      if (event === 'readMessages') {
        const sessionId = args[0];
        const userId = args[1];
        console.log('[MockSocket] 标记消息已读:', { sessionId, userId });
        return;
      }
      
      // 模拟 'addSession' 事件: 添加新会话
      // @param {string} userId - 当前用户ID
      // @param {string} friendUserId - 好友用户ID
      // @param {function} callback - 客户端回调函数, (response) => {}
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
            callback('exist'); // 如果会话已存在，返回 'exist'
          }
        } else {
          // 创建新会话对象
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
            callback(newSession); // 返回新创建的会话对象
          }
        }
        
        return;
      }
      
      // 模拟 'removeSession' 事件: 删除聊天会话
      // @param {string} userId - 当前用户ID
      // @param {string} friendUserId - 好友ID
      // @param {function} callback - 客户端回调
      if (event === 'removeSession') {
        const userId = args[0];
        const friendUserId = args[1];
        const callback = args[2];
        
        console.log(`[MockSocket] 收到 removeSession 事件:`, { userId, friendUserId });
        
        // 在模拟的 chatList 中找到并移除会话
        const initialLength = chatList.length;
        chatList = chatList.filter(
          chat => !(chat.userId === userId && chat.friendUserId === friendUserId)
        );
        
        // 模拟成功并执行回调
        if (callback && typeof callback === 'function') {
          callback(true);
        }
        
        console.log(`[MockSocket] 会话已删除，chatList 长度从 ${initialLength} 变为 ${chatList.length}`);
        return;
      }

      // 处理其他事件
      if (this.eventHandlers[event]) {
        this.eventHandlers[event](...args);
      }

      // 模拟 'agreeApply' 事件: 同意好友申请
      // @param {object} friendInfo - 好友信息
      // @param {function} callback - 回调函数
      if (event === 'agreeApply') {
        const friendInfo = args[0];
        const callback = args[1];
        console.log('[MockSocket] 同意好友申请:', friendInfo);
        if (callback && typeof callback === 'function') {
          // 模拟成功响应
          callback({ success: true, message: '好友添加成功' });
        }
        return;
      }

      // 模拟 'rejectApply' 事件: 拒绝好友申请
      // @param {string} senderId - 发送方ID
      // @param {string} receiverId - 接收方ID
      if (event === 'rejectApply') {
        const senderId = args[0];
        const receiverId = args[1];
        console.log('[MockSocket] 拒绝好友申请:', { senderId, receiverId });
        // 此处可以添加更多逻辑，例如通知发送方其请求被拒绝
        return;
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
