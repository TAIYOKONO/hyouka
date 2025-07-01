/**
 * router.js - 建設業評価システム ルーティング管理
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = '/';
        this.setupRoutes();
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.route) this.navigate(event.state.route, false);
        });
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
        // パスからハッシュとクエリパラメータを分離
        const mainPath = path.split('?')[0].split('#')[1] || '/';

        const route = this.findRoute(mainPath);
        if (!route) return this.navigate('/dashboard');

        if (route.requireAuth && !authManager.isAuthenticated()) {
            return this.navigate('/', false);
        }

        if (route.permission && !authManager.hasPermission(route.permission)) {
            showNotification('このページにアクセスする権限がありません', 'error');
            return this.navigate('/dashboard', false);
        }

        if (pushState) {
            window.history.pushState({ route: path }, '', path);
        }
        
        this.currentRoute = path;
        await this.renderComponent(route, this.extractParams(mainPath, route.path));
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
            login: () => {
                document.getElementById('app-header').style.display = 'none';
                document.getElementById('breadcrumbs').style.display = 'none';
            },
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
                document.getElementById('app-header').style.display = 'block';
                document.getElementById('breadcrumbs').style.display = 'block';
                if (navigation) navigation.render();
            } else {
                 document.getElementById('app-header').style.display = 'none';
                 document.getElementById('breadcrumbs').style.display = 'none';
            }
            if (route.component === 'evaluationDetail' && params.id) {
                pageFunction(params.id);
            } else {
                pageFunction();
            }
        } else {
            document.getElementById('main-content').innerHTML = `<h2>Page not found</h2>`;
        }
    }
}

const router = new Router();
window.router = router;
