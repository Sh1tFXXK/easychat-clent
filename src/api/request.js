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

requests.interceptors.request.use((config) => {
    console.log('🌐 [API] 发送请求:', config.url, config.params || config.data);
    if (config.url.includes("/auth/")
        || config.url.includes("/register")
        || config.url.includes("/verifyCode/")
        || config.url.includes("/validate")
        || config.url.includes("/changePassword")) {
        return config;
    }
    nprogress.start();
    return config;
}, (error) => {
    console.error('❌ [API] 请求错误:', error);
    return Promise.reject(error);
})

requests.interceptors.response.use((response) => {
    console.log('✅ [API] 响应成功:', response.config.url, response.data);
    if (response.status === 200) {
        nprogress.done();
        return response.data;
    }
    nprogress.done();
}, (error) => {
    console.error('❌ [API] 响应错误:', error.config?.url, error.message);
    nprogress.done();
    return Promise.reject(error);
})

export default requests;
