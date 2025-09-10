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
        path: '/findPassword',
        component: () => import('@/pages/password'),
        name: 'findPassword'
    },
    {
        path: '/about',
        component: () => import('@/pages/about'),
        name: 'about'
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

function readToken() {
    try {
        let t = localStorage.getItem('token');
        if (!t) {
            const m = document.cookie.match(new RegExp('(^| )' + 'token' + '=([^;]+)'));
            t = m ? decodeURIComponent(m[2]) : null;
        }
        if (t && t.startsWith('Bearer ')) t = t.substring(7);
        return t;
    } catch (e) { return null; }
}

function isJwtExpired(token) {
    if (!token) return true;
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const now = Math.floor(Date.now() / 1000);
        return typeof payload.exp === 'number' ? (payload.exp - 30) <= now : true;
    } catch { return true; }
}

router.beforeEach((to, from, next) => {
    if (to.path === "/login" || to.path === "/register" || to.path === "/findPassword" || to.path === "/about") {
        return next();
    }
    const uid = getCookie("uid");
    const token = readToken();
    if (uid !== null && new RegExp(/\d{19}/).test(uid) && token && !isJwtExpired(token)) {
        return next();
    }
    return next("/login");
})

export default router
