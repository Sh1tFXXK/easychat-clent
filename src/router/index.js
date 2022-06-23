import { createRouter, createWebHashHistory } from 'vue-router'
import { getCookie } from '@/utils/cookie';

const routes = [
    {
        path: '/login',
        component: () => import('@/pages/login'),
        name: 'login'
    },
    {
        path: '/register',
        component: () => import('@/pages/register'),
        name: 'register'
    },
    {
        path: '/home',
        component: () => import('@/pages/home'),
        name: 'home'
    },
    {
        path: '/password',
        component: () => import('@/pages/password-reset'),
        name: 'passwordReset'
    },
    {
        path: '/',
        redirect: "/home"
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    if (to.path === "/login" || to.path === "/register") {
        return next();
    }
    const uid = getCookie("uid");
    if (uid === null) {
        return next("/login");
    }
    return next();
})

export default router