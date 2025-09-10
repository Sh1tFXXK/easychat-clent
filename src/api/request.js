import axios from "axios";
import nprogress from "nprogress";
import JSONBig from 'json-bigint';

import "nprogress/nprogress.css";

const requests = axios.create({
    baseURL: '/api',
    timeout: 60000,
    transformResponse: [function (data) {
        try {
            return JSONBig.parse(data);
        } catch (err) {
            return data;
        }
    }]
})

// 读取 token（与 main.js 逻辑保持一致）
function readToken() {
    try {
        let t = localStorage.getItem('token');
        if (!t) {
            const m = document.cookie.match(new RegExp('(^| )' + 'token' + '=([^;]+)'));
            t = m ? decodeURIComponent(m[2]) : null;
        }
        if (t && t.startsWith('Bearer ')) {
            t = t.substring(7);
        }
        return t;
    } catch (e) {
        return null;
    }
}

requests.interceptors.request.use((config) => {
    console.log('🌐 [API] 发送请求:', config.url, config.params || config.data);
    // 给除登录/注册/验证码等外的大部分接口自动携带 Authorization
    const isAuthFree = (
        config.url.includes("/auth/")
        || config.url.includes("/register")
        || config.url.includes("/verifyCode/")
        || config.url.includes("/validate")
        || config.url.includes("/changePassword")
    );

    if (!isAuthFree) {
        const token = readToken();
        console.log('🔑 [API] 当前 token:', token ? token.substring(0, 20) + '...' : '(空)');
        if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('🔑 [API] 已添加 Authorization 头');
        } else {
            console.warn('⚠️ [API] 未找到有效 token，请求可能失败');
        }
    } else {
        console.log('🔓 [API] 免认证接口，跳过 token 添加');
    }

    nprogress.start();
    return config;
}, (error) => {
    console.error('❌ [API] 请求错误:', error);
    return Promise.reject(error);
})

requests.interceptors.response.use((response) => {
    console.log('✅ [API] 响应成功:', response.config.url, response.data);
    // 若服务端通过响应头返回了 Authorization/Bearer，自动保存并触发 socket 重连
    try {
        const auth = response.headers?.authorization || response.headers?.Authorization;
        if (auth && /^Bearer\s+/.test(auth)) {
            const newToken = auth.replace(/^Bearer\s+/i, '').trim();
            if (newToken) {
                localStorage.setItem('token', newToken);
                document.cookie = `token=${encodeURIComponent(newToken)}; path=/`;
                if (typeof window !== 'undefined' && typeof window.updateSocketToken === 'function') {
                    window.updateSocketToken(newToken);
                }
            }
        }
    } catch (e) {}
    if (response.status === 200) {
        nprogress.done();
        return response.data;
    }
    nprogress.done();
}, (error) => {
    console.error('❌ [API] 响应错误:', error.config?.url, error.message);
    // 统一处理 401 以及 JWT 过期
    const status = error.response?.status;
    const message = (error.response?.data && (error.response.data.message || error.response.data.error)) || '';
    if (status === 401 || status === 403 || /JWT expired/i.test(String(message))) {
        try {
            localStorage.removeItem('token');
            document.cookie = 'token=; Max-Age=0; path=/';
        } catch (e) {}
        // 避免循环重试，直接引导登录
        if (typeof window !== 'undefined') {
            // 检查是否已经在登录页面，避免重定向循环
            if (window.location.pathname === '/login') {
                console.warn('⚠️ [API] 已在登录页面，避免重定向循环');
                return Promise.reject(error);
            }
            // 保留当前路径以便登录后返回
            const current = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
            console.log('🔄 [API] 重定向到登录页面，当前路径:', current);
            window.location.href = `/login?redirect=${current}`;
        }
    }
    nprogress.done();
    return Promise.reject(error);
})

export default requests;
