import { createRouter, createWebHashHistory } from 'vue-router'
import routerManager from '@/utils/router'

const routes = [
    {
        path: '/login',
        component: () => import('@/pages/login'),
        name: 'login',
        meta: {
            title: '登录',
            requiresAuth: false,
            keepAlive: false
        }
    },
    {
        path: '/register',
        component: () => import('@/pages/register'),
        name: 'register',
        meta: {
            title: '注册',
            requiresAuth: false,
            keepAlive: false
        }
    },
    {
        path: '/home',
        component: () => import('@/pages/home'),
        name: 'home',
        meta: {
            title: '首页',
            requiresAuth: true,
            keepAlive: true
        }
    },
    {
        path: '/findPassword',
        component: () => import('@/pages/password'),
        name: 'findPassword',
        meta: {
            title: '找回密码',
            requiresAuth: false,
            keepAlive: false
        }
    },
    {
        path: '/about',
        component: () => import('@/pages/about'),
        name: 'about',
        meta: {
            title: '关于我们',
            requiresAuth: false,
            keepAlive: false
        }
    },
    {
        path: '/navigation-demo',
        component: () => import('@/pages/navigation-demo'),
        name: 'navigationDemo',
        meta: {
            title: '导航系统演示',
            requiresAuth: false,
            keepAlive: false
        }
    },
    {
        path: '/redirect/:path(.*)',
        component: () => import('@/pages/redirect'),
        name: 'redirect',
        meta: {
            title: '重定向',
            requiresAuth: false,
            keepAlive: false
        }
    },
    {
        path: '/',
        redirect: "/home"
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/pages/404'),
        meta: {
            title: '页面未找到',
            requiresAuth: false,
            keepAlive: false
        }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // 页面跳转时的滚动行为
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

export default router
