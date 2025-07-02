/**
 * router.js - 建設業評価システム ルーティング管理 (最終版)
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.basePath = window.location.pathname.replace(/(\/index\.html|\/404\.html|\/)$/, '');
        this.setupRoutes();
        window.addEventListener('popstate', () => this.handleLocationChange());
    }

    start() {
        this.handleLocationChange();
    }

    handleLocationChange() {
        const path = window.location.pathname.substring(this.basePath.length) || '/';
        this.navigate(path, false);
    }
    
    setupRoutes() {
        this.addRoute('/', { name: 'login', component: 'login', requireAuth: false });
        this.addRoute('/dashboard', { name: 'dashboard', component: 'dashboard', requireAuth: true });
        this.addRoute('/evaluations', { name: 'evaluations', component: 'evaluations', requireAuth: true });
        this.addRoute('/evaluations/new', { name: 'new-evaluation', component: 'newEvaluation', requireAuth: true });
        this.addRoute('/evaluations/:id', { name: 'evaluation-detail', component: 'evaluationDetail', requireAuth: true });
        this.addRoute('/users', { name: 'users', component: 'users', requireAuth: true, permission: 'manage_users' });
        this.addRoute('/settings', { name: 'settings', component: 'settings', requireAuth: true, permission: 'manage_settings' });
        this.addRoute('/register', { name: 'register', component: 'register', requireAuth: false });
    }
    
    addRoute(path, config) {
        this.routes.set(path, { path, ...config });
    }
    
    async navigate(path, pushState = true) {
        const route = this.findRoute(path);
        if (!route) return this.navigate('/dashboard');

        if (route.requireAuth && !authManager.isAuthenticated()) {
            return this.navigate('/', false);
        }

        if (!route.requireAuth && authManager.isAuthenticated() && path !== '/dashboard') {
            return this.navigate('/dashboard', true);
        }

        if (route.permission && !authManager.hasPermission(route.permission)) {
            showNotification('このページにアクセスする権限がありません', 'error');
            return this.navigate('/dashboard', false);
        }
        
        if (pushState) {
            const newPath = path === '/' ? this.basePath + '/' : this.basePath + path;
            window.history.pushState({ route: path }, '', newPath);
        }
        
        this.currentRoute = path;
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
        const pathSegments = path.split('/');
        const routeSegments = routePath.split('/');
        routeSegments.forEach((seg, i) => {
            if (seg.startsWith(':')) params[seg.slice(1)] = pathSegments[i];
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
                document.getElementById('breadcrumbs').style.display = 'block';
                if (window.navigation) window.navigation.render();
            } else {
                document.body.classList.add('login-mode');
                document.body.classList.remove('authenticated');
                document.getElementById('app-header').style.display = 'none';
                document.getElementById('breadcrumbs').style.display = 'none';
            }

            if (route.component === 'evaluationDetail' && params.id) {
                pageFunction(params.id);
            } else {
                pageFunction();
            }
        } else {
            document.getElementById('main-content').innerHTML = `<h2>Component function not found: ${route.component}</h2>`;
        }
    }
}

if (typeof window !== 'undefined') {
    window.AppRouter = Router;
}
