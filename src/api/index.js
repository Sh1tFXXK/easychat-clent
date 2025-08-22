import axios from "./request";
import mockAxios from "./mockAxios";
import store from '@/store'
import { getCookie } from '@/utils/cookie';

export const mockGetUserInfo = () => mockAxios.get('/user');
export const mockGetChatList = () => mockAxios.get('/chats');
export const mockGetFriendList = () => mockAxios.get('/friends');
export const mockGetFriendVerify = () => mockAxios.get('/friends/verify');
export const mockGetHistory = () => mockAxios.get('/chats/chat/history');


export const reqLogin = (data) => axios.post('/auth/login', data);

export const reqLogout = () => axios.post('/auth/logout');

export const reqRegister = (data) => axios.post('/user/register', data);

export const reqSendCode = (data) => axios.post('/user/verifyCode/send', data);

export const reqValidateCode = (data) => axios.post('/user/verifyCode/validate', data);

export const reqValidateUsername = (data) => axios.post('/user/username/validate', data);

export const reqValidatePassword = (data) => axios.post('/user/password/validate', data);

export const reqSearchUsers = (params) => axios.get('/user/search', { params: params });

export const reqGetUserInfo = (params) => axios.get('/user/user', { params: params });

export const reqEditUserInfo = (data) => axios.post('/user/user/edit', data);

export const reqChangeAvatar = (data) => axios.post('/user/user/changeAvatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });

export const reqChangePassword = (data) => axios.post('/user/user/changePassword', data);

export const reqAddTag = (data) => axios.post('/user/user/addTag', data);

export const reqRemoveTag = (data) => axios.post('/user/user/removeTag', data);

export const reqGetChatList = (params) => axios.get('/chat/chats', { params: params });

export const reqGetFriendList = (params) => axios.get('/user/friends', { params: params });

export const reqGetFriendVerify = (params) => axios.get('/user/friendVerify', { params: params });

export const reqGetHistory = (params) => {
    // 确保所有参数在传递给axios之前都是原始类型（字符串），以避免json-bigint对象序列化问题
    const queryParams = {
        id: String(params.id),
        session: String(params.session),
        page: params.page,
        size: params.size,
    };
    console.log("[API] reqGetHistory sending queryParams:", queryParams);
    return axios.get('/chat/chats/chatHistory', { params: queryParams });
};

export const reqSavePictureMsg = (data) => axios.post('/chat/chats/savePictureMsg', data);

export const reqSaveFileMsg = (data) => axios.post('/chat/chats/saveFileMsg', data);

// =================================================================
// 群聊 API
// =================================================================

// 获取当前用户加入的所有群组
export const reqGetGroupList = () => {
  // 从cookie中获取userId，而不是从store中获取
  const userId = getCookie("uid")
  return axios.get(`/group/users/${userId}/groups`)
}

// 获取特定群组的详细信息 (包括成员列表)
export const reqGetGroupInfo = (groupId) => {
  return axios.get(`/group/groups/${groupId}`)
}

// 分页获取群聊历史消息
export const reqGetGroupMessages = (groupId, params) => axios.get(`/group/groups/${groupId}/messages`, { params });

export const reqCreateGroup = (groupData) => {
  return axios.post('/group/groups', groupData)
}

// 发送群聊图片消息
export const reqSendGroupImage = (data) => axios.post('/group/messages/image', data, { headers: { 'Content-Type': 'multipart/form-data' } });

// 发送群聊文件消息
export const reqSendGroupFile = (data) => axios.post('/group/messages/file', data, { headers: { 'Content-Type': 'multipart/form-data' } });

// 发送群聊文本消息
export const reqSendGroupTextMessage = (data) => axios.post('/group/messages/text', data);
