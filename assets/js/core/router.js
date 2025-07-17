// router.js の全コード（デバッグ情報表示版）
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
        console.log('--- Router Debug Start ---');
        
        const hash = window.location.hash.slice(1);
        console.log('Router Debug: window.location.hash is', window.location.hash);

        let path = '/';
        if (hash) {
            path = '/' + hash.split('?')[0];
        }
        this.currentPath = path;
        console.log('Router Debug: Calculated currentPath is', this.currentPath);
        
        const routeKey = this.findRouteKey(this.currentPath);
        console.log('Router Debug: Found routeKey is', routeKey);

        let component = this.routes[routeKey];
        console.log('Router Debug: Initial component is', component ? component.name : 'null');

        const isAuthenticated = authManager.isAuthenticated();
        console.log('Router Debug: isAuthenticated?', isAuthenticated);

        if (isAuthenticated) {
            console.log('Router Debug: Handling as AUTHENTICATED user.');
            if (this.currentPath === '/') {
                console.log('Router Debug: Path is "/", navigating to /dashboard');
                return this.navigate('/dashboard');
            }
            if (!component) {
                console.log('Router Debug: No component found, defaulting to dashboard.');
                component = this.routes['/dashboard'];
            }
        } else {
            console.log('Router Debug: Handling as GUEST user.');
            const allowedGuestRoutes = ['/', '/register-admin', '/register'];
            console.log('Router Debug: Allowed guest routes are', allowedGuestRoutes);
            
            if (!allowedGuestRoutes.includes(this.currentPath)) {
                console.log('Router Debug: Path not in allowed guest routes, navigating to login page.');
                component = this.routes['/'];
            } else {
                console.log('Router Debug: Path IS in allowed guest routes.');
            }
        }

        console.log('Router Debug: Final component to render is', component ? component.name : 'null');
        this.render(component);
        console.log('--- Router Debug End ---');
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
    }

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
            console.log('Router Debug: Render failed because component is not a function.');
            mainContent.innerHTML = `<h2>ページが見つかりません</h2>`;
        }
    }
}
