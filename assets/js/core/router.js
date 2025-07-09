/**
 * router.js - 建設業評価システム ルーティング管理 (ハッシュモード・URL解析強化版)
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.setupRoutes();
        
        window.addEventListener('hashchange', () => this.handleLocationChange());
        window.addEventListener('load', () => this.handleLocationChange());
    }

    handleLocationChange() {
        // ★ URLのハッシュ部分からパスとクエリを正しく分離するよう修正
        const hash = window.location.hash.slice(1) || '/';
        const [path, queryString] = hash.split('?');
        this.navigate(path, false);
    }
    
    setupRoutes() {
        this.addRoute('/', { name: 'login', component: 'login', requireAuth: false });
        this.addRoute('/dashboard', { name: 'dashboard', component: 'dashboard', requireAuth: true });
        this.addRoute('/evaluations', { name: 'evaluations', component: 'evaluations', requireAuth: true });
        this.addRoute('/evaluations/new', { name: 'new-evaluation', component: 'newEvaluation', requireAuth: true, permission: 'create_evaluation' });
        this.addRoute('/evaluations/:id', { name: 'evaluation-detail', component: 'evaluationDetail', requireAuth: true });
        this.addRoute('/users', { name: 'users', component: 'users', requireAuth: true, permission: 'manage_users' });
        this.addRoute('/settings', { name: 'settings', component: 'settings', requireAuth: true, permission: 'manage_settings' });
        this.addRoute('/register', { name: 'register', component: 'register', requireAuth: false });
    }
    
    addRoute(path, config) { this.routes.set(path, { path, ...config }); }
    
    async navigate(path, pushToHistory = true) {
        const route = this.findRoute(path);
        if (!route) {
            console.error(`Route not found for path: ${path}`);
            return this.navigate('/dashboard');
        }

        if (route.requireAuth && !authManager.isAuthenticated()) return this.navigate('/');
        if (!route.requireAuth && authManager.isAuthenticated()) return this.navigate('/dashboard');
        
        if (route.permission && !authManager.hasPermission(route.permission)) {
            showNotification('このページにアクセスする権限がありません', 'error');
            return this.navigate('/dashboard');
        }
        
        if (pushToHistory) {
            // クエリパラメータを維持しつつハッシュを更新
            const currentQuery = window.location.hash.split('?')[1];
            const newHash = currentQuery ? `${path}?${currentQuery}` : path;
            window.location.hash = newHash;
        }
        
        await this.renderComponent(route, this.extractParams(path, route.path));
    }
    
    findRoute(path) {
        if (this.routes.has(path)) return this.routes.get(path);
        for (const [routePath, route] of this.routes) {
            const pathSegments = path.split('/');
            const routeSegments = routePath.split('/');
            if (pathSegments.length !== routeSegments.length) continue;
            const match = routeSegments.every((seg, i) => seg.startsWith(':') || seg === pathSegments[i]);
            if (match) return route;
        }
        return null;
    }

    extractParams(path, routePath) {
        const params = {};
        routePath.split('/').forEach((seg, i) => {
            if (seg.startsWith(':')) params[seg.slice(1)] = path.split('/')[i];if（seg.startswith（ '：'））params [seg.slice（1）] = path.split（ '/'）[i];
        });
        return params;
    }

    async renderComponent(route, params) {
        const functionMap = {
            login: () => {},
            dashboard: showDashboard,
            evaluations: showEvaluations, 
            newEvaluation: showNewEvaluationForm,
            evaluationDetail: viewEvaluation,
            users: showUsers,
            settings: showSettingsPage,
            register: showRegistrationPage
        };
        const pageFunction = functionMap[route.component];

        if (typeof pageFunction === 'function') {
            if (route.component !== 'login' && route.component !== 'register') {
                document.body.classList.remove('login-mode');
                document.body.classList.add('authenticated');
                document.getElementById('app-header').style.display = 'block';
                if (window.navigation) window.navigation.render();
            } else {
                document.body.classList.add('login-mode');
                document.body.classList.remove('authenticated');
                document.getElementById('app-header').style.display = 'none';
            }

            if (route.name === 'evaluation-detail' && params.id) pageFunction(params.id);
            else pageFunction();
        } else {
            document.getElementById('main-content').innerHTML = `<h2>Component not found: ${route.component}</h2>`;
        }
    }
}

if (typeof window !== 'undefined') {
    window.AppRouter = Router;
}
