/**
 * router.js - 建設業評価システム ルーティング管理 (GitHub Pages対応版)
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = '/';
        // ★ アプリケーションのベースパスを自動的に判定
        this.basePath = window.location.pathname.replace(/(\/index\.html|\/404\.html|\/)$/, '');
        this.setupRoutes();

        // 初回読み込み時に現在のパスを処理
        this.handleLocationChange();

        // ブラウザの戻る/進むボタン対応
        window.addEventListener('popstate', () => this.handleLocationChange());
    }

    // ★ 現在のURLからパスを解決する関数を追加
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

        if (route.permission && !authManager.hasPermission(route.permission)) {
            showNotification('このページにアクセスする権限がありません', 'error');
            return this.navigate('/dashboard', false);
        }

        // ★ history.pushStateでURLを更新する際にベースパスを考慮
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

// ★ Routerの初期化をapp.jsに移動するため、ここではインスタンスを作成しない
// const router = new Router();
// window.router = router;

// ★ app.jsでRouterインスタンスを作成するように変更
if (typeof window !== 'undefined') {
    window.AppRouter = Router;
}
