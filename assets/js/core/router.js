// router.js の全コード（修正版）
/**
 * router.js - 建設業評価システム ルーティング管理 (最終確定版)
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentPath = '/';
        
        window.addEventListener('load', this.handleRouteChange.bind(this));
        window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    }

    addRoute(path, component) {
        this.routes[path] = component;
    }

    handleRouteChange() {
        const pathWithQuery = window.location.hash.slice(1) || '/';
        this.currentPath = pathWithQuery.split('?')[0];
        
        const routeKey = this.findRouteKey(this.currentPath);
        let component = this.routes[routeKey];

        if (authManager.isAuthenticated()) {
            if (this.currentPath === '/') {
                return this.navigate('/dashboard');
            }
            if (!component) {
                component = this.routes['/dashboard'];
            }
        } else {
            // ▼▼▼ この配列に /register を追加 ▼▼▼
            const allowedGuestRoutes = ['/', '/register-admin', '/register'];
            
            if (!allowedGuestRoutes.includes(this.currentPath)) {
                component = this.routes['/'];
            }
        }

        this.render(component);
    }
    
    navigate(path) {
        window.location.hash = path;
    }
    
    findRouteKey(path) {
        if (this.routes[path]) return path;
        for (const routeKey in this.routes) {
            if (routeKey.includes(':')) {
                const routeSegments = routeKey.split('/');
                const pathSegments = path.split('/');
                if (routeSegments.length === pathSegments.length) {
                    const match = routeSegments.every((seg, i) => seg.startsWith(':') || seg === pathSegments[i]);
                    if (match) return routeKey;
                }
            }
        }
        return null;
    }

    extractParams(path, routeKey) {
        const params = {};
        const routeSegments = routeKey.split('/');
        const pathSegments = path.split('/');
        routeSegments.forEach((seg, i) => {
            if (seg.startsWith(':')) {
                params[seg.slice(1)] = pathSegments[i];
            }
        });
        return params;
    }}

    render(component) {
        const mainContent = document.getElementById('main-content');
        if (typeof component === 'function') {
            document.body.className = authManager.isAuthenticated() ? 'authenticated' : 'login-mode';
            
            const routeKey = this.findRouteKey(this.currentPath);
            if (routeKey && routeKey.includes(':')) {
                const params = this.extractParams(this.currentPath, routeKey);
                component(params.id);
            } else {
                component();
            }
        } else {
            mainContent.innerHTML = `<h2>ページが見つかりません</h2>`;
        }
    }
}
