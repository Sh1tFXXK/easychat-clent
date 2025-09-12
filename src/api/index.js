import axios from "./request";
import mockAxios from "./mockAxios";

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

export const reqGetHistory = (params) => axios.get('/chat/chats/chatHistory', { params: params });

export const reqSavePictureMsg = (data) => axios.post('/chat/chats/savePictureMsg', data);

export const reqSaveFileMsg = (data) => axios.post('/chat/chats/saveFileMsg', data);

// 群聊相关 API
export const reqCreateGroup = (data) => axios.post('/group/groups', data);
export const reqGetUserGroups = (userId) => axios.get(`/group/users/${encodeURIComponent(userId)}/groups`);
export const reqGetGroupDetail = (groupId) => axios.get(`/group/groups/${encodeURIComponent(groupId)}`);
export const reqUpdateGroup = (groupId, data) => axios.put(`/group/groups/${encodeURIComponent(groupId)}`, data);
export const reqInviteGroupMembers = (groupId, members) => axios.post(`/group/groups/${encodeURIComponent(groupId)}/members`, members);
export const reqRemoveGroupMember = (groupId, userId) => axios.delete(`/group/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`);
export const reqGetGroupMessages = (groupId, params) => axios.get(`/group/groups/${encodeURIComponent(groupId)}/messages`, { params });
export const reqSendGroupImage = (groupId, formData) => axios.post(`/group/messages/image`, formData, { params: { groupId }, headers: { 'Content-Type': 'multipart/form-data' } });
export const reqSendGroupFile = (groupId, formData) => axios.post(`/group/messages/file`, formData, { params: { groupId }, headers: { 'Content-Type': 'multipart/form-data' } });
export const reqSendGroupText = (data) => axios.post('/group/messages/text', data);
export const reqDeleteGroup = (groupId) => axios.delete(`/group/groups/${encodeURIComponent(groupId)}`);