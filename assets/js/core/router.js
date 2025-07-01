/**
 * router.js - 建設業評価システム ルーティング管理
 * SPA用のページ遷移・ナビゲーション・ブレッドクラム管理
 */

class Router {
    constructor() {
        this.currentPage = 'login';
        this.currentRoute = '/';
        this.routes = new Map();
        this.history = [];
        this.beforeRouteHooks = [];
        this.afterRouteHooks = [];
        
        this.setupRoutes();
        this.init();
    }
    
    init() {
        // ブラウザの戻る/進むボタン対応
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.route) {
                this.navigate(event.state.route, false);
            }
        });
        
        console.log('🗺️ Router initialized');
    }
    
    /**
     * ルート定義を設定
     */
    setupRoutes() {
        this.addRoute('/', {
            name: 'login',
            component: 'login',
            requireAuth: false,
            title: 'ログイン',
            titleVi: 'Đăng nhập'
        });
        
        this.addRoute('/dashboard', {
            name: 'dashboard',
            component: 'dashboard',
            requireAuth: true,
            permission: 'view_all',
            title: 'ダッシュボード',
            titleVi: 'Bảng điều khiển',
            breadcrumbs: [
                { label: 'dashboard.title', path: '/dashboard' }
            ]
        });
        
        this.addRoute('/evaluations', {
            name: 'evaluations',
            component: 'evaluations',
            requireAuth: true,
            permission: 'view_team',
            title: '評価一覧',
            titleVi: 'Danh sách đánh giá',
            breadcrumbs: [
                { label: 'nav.dashboard', path: '/dashboard' },
                { label: 'nav.evaluations', path: '/evaluations' }
            ]
        });
        
        this.addRoute('/evaluations/new', {
            name: 'new-evaluation',
            component: 'newEvaluation',
            requireAuth: true,
            permission: 'create',
            title: '新規評価作成',
            titleVi: 'Tạo đánh giá mới',
            breadcrumbs: [
                { label: 'nav.dashboard', path: '/dashboard' },
                { label: 'nav.evaluations', path: '/evaluations' },
                { label: 'evaluation.new', path: '/evaluations/new' }
            ]
        });
        
        this.addRoute('/evaluations/:id', {
            name: 'evaluation-detail',
            component: 'evaluationDetail',
            requireAuth: true,
            permission: 'view_team',
            title: '評価詳細',
            titleVi: 'Chi tiết đánh giá',
            breadcrumbs: [
                { label: 'nav.dashboard', path: '/dashboard' },
                { label: 'nav.evaluations', path: '/evaluations' },
                { label: '評価詳細', path: null }
            ]
        });
        
        this.addRoute('/users', {
            name: 'users',
            component: 'users',
            requireAuth: true,
            permission: 'manage_users',
            title: 'ユーザー管理',
            titleVi: 'Quản lý người dùng',
            breadcrumbs: [
                { label: 'nav.dashboard', path: '/dashboard' },
                { label: 'ユーザー管理', path: '/users' }
            ]
        });
        
        this.addRoute('/profile', {
            name: 'profile',
            component: 'profile',
            requireAuth: true,
            title: 'プロフィール',
            titleVi: 'Hồ sơ',
            breadcrumbs: [
                { label: 'nav.dashboard', path: '/dashboard' },
                { label: 'プロフィール', path: '/profile' }
            ]
        });
    }
    
    /**
     * ルートを追加
     * @param {string} path - パス
     * @param {Object} config - ルート設定
     */
    addRoute(path, config) {
        this.routes.set(path, {
            path,
            ...config
        });
    }
    
    /**
     * ページ遷移
     * @param {string} path - 遷移先パス
     * @param {boolean} pushState - ブラウザ履歴に追加するか
     * @param {Object} params - パラメータ
     */
    async navigate(path, pushState = true, params = {}) {
        const route = this.findRoute(path);
        
        if (!route) {
            console.warn(`Route not found: ${path}`);
            this.navigate('/dashboard');
            return;
        }
        
        // 遷移前フック実行
        for (const hook of this.beforeRouteHooks) {
            const result = await hook(route, this.currentRoute);
            if (result === false) {
                console.log('Navigation cancelled by before hook');
                return;
            }
        }
        
        // 認証チェック
        if (route.requireAuth && !authManager.isAuthenticated()) {
            if (typeof showNotification === 'function') {
                showNotification('ログインが必要です', 'error');
            }
            this.navigate('/', false);
            return;
        }
        
        // 権限チェック
        if (route.permission && !authManager.hasPermission(route.permission)) {
            if (typeof showNotification === 'function') {
                showNotification('この操作を実行する権限がありません', 'error');
            }
            this.navigate('/dashboard', false);
            return;
        }
        
        // パラメータ解析
        const routeParams = this.extractParams(path, route.path);
        const mergedParams = { ...routeParams, ...params };
        
        // 履歴に追加
        if (pushState) {
            this.history.push({
                path: this.currentRoute,
                page: this.currentPage,
                timestamp: Date.now()
            });
            
            window.history.pushState(
                { route: path },
                route.title,
                path
            );
        }
        
        // 現在の状態を更新
        this.currentRoute = path;
        this.currentPage = route.name;
        
        // ページタイトル更新
        this.updatePageTitle(route);
        
        // コンポーネント表示
        await this.renderComponent(route, mergedParams);
        
        // ナビゲーション更新
        this.updateNavigation();
        
        // ブレッドクラム更新
        this.updateBreadcrumbs(route, mergedParams);
        
        // 遷移後フック実行
        for (const hook of this.afterRouteHooks) {
            await hook(route, this.currentRoute);
        }
        
        console.log(`🗺️ Navigated to: ${path} (${route.name})`);
    }
    
    /**
     * ルートを検索
     * @param {string} path - パス
     * @returns {Object|null} ルート設定
     */
    findRoute(path) {
        // 完全一致チェック
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }
        
        // パラメータ付きルートチェック
        for (const [routePath, route] of this.routes) {
            if (this.matchPath(path, routePath)) {
                return route;
            }
        }
        
        return null;
    }
    
    /**
     * パスマッチング
     * @param {string} path - 実際のパス
     * @param {string} routePath - ルートパス
     * @returns {boolean} マッチするかどうか
     */
    matchPath(path, routePath) {
        const pathSegments = path.split('/');
        const routeSegments = routePath.split('/');
        
        if (pathSegments.length !== routeSegments.length) {
            return false;
        }
        
        return routeSegments.every((segment, index) => {
            return segment.startsWith(':') || segment === pathSegments[index];
        });
    }
    
    /**
     * パラメータ抽出
     * @param {string} path - 実際のパス
     * @param {string} routePath - ルートパス
     * @returns {Object} パラメータオブジェクト
     */
    extractParams(path, routePath) {
        const params = {};
        const pathSegments = path.split('/');
        const routeSegments = routePath.split('/');
        
        routeSegments.forEach((segment, index) => {
            if (segment.startsWith(':')) {
                const paramName = segment.slice(1);
                params[paramName] = pathSegments[index];
            }
        });
        
        return params;
    }
    
    /**
     * コンポーネント描画
     * @param {Object} route - ルート設定
     * @param {Object} params - パラメータ
     */
    async renderComponent(route, params) {
        const componentName = route.component;
        
        // ログイン画面の場合は特別処理
        if (componentName === 'login') {
            this.showLoginPage();
            return;
        }
        
        // ヘッダーとブレッドクラムを表示
        document.getElementById('app-header').style.display = 'block';
        document.getElementById('breadcrumbs').style.display = 'block';
        
        // ボディクラス更新
        document.body.classList.remove('login-mode');
        document.body.classList.add('authenticated');
        
        // 対応する関数を呼び出し
        const functionMap = {
            dashboard: showDashboard,
            evaluations: showEvaluations, 
            newEvaluation: showNewEvaluationForm,
            evaluationDetail: viewEvaluation,
            users: showUsers,
            profile: showProfile
        };
        
        const pageFunction = functionMap[componentName];
        
        if (typeof pageFunction === 'function') {
            try {
                if (componentName === 'evaluationDetail' && params.id) {
                    pageFunction(params.id);
                } else {
                    pageFunction();
                }
            } catch (error) {
                console.error(`Error rendering ${componentName}:`, error);
                this.show404();
            }
        } else {
            console.warn(`Page function not found: ${componentName}`);
            this.show404();
        }
    }
    
    /**
     * ログインページ表示
     */
    showLoginPage() {
        document.getElementById('app-header').style.display = 'none';
        document.getElementById('breadcrumbs').style.display = 'none';
        
        // ボディクラス更新
        document.body.classList.add('login-mode');
        document.body.classList.remove('authenticated');
        
        if (typeof window.showLoginPage === 'function') {
            window.showLoginPage();
        } else {
            // デフォルトのログインページは既に表示されている
            console.log('Login page displayed');
        }
    }
    
    /**
     * 404ページ表示
     */
    show404() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="page">
                    <div class="page-content text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <h2 class="empty-state-title">ページが見つかりません</h2>
                            <p class="empty-state-description">
                                お探しのページは存在しないか、移動された可能性があります。
                            </p>
                            <button class="btn btn-primary" onclick="router.navigate('/dashboard')">
                                🏠 ダッシュボードに戻る
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * ページタイトル更新
     * @param {Object} route - ルート設定
     */
    updatePageTitle(route) {
        const currentLang = i18n?.currentLanguage || 'ja';
        const title = currentLang === 'vi' && route.titleVi ? route.titleVi : route.title;
        document.title = `${title} - 建設業評価システム`;
    }
    
    /**
     * ナビゲーション更新
     */
    updateNavigation() {
        if (typeof buildNavigation === 'function') {
            buildNavigation();
        }
        
        // アクティブなナビゲーションリンクを更新
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (href && this.currentRoute.startsWith(href)) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * ブレッドクラム更新
     * @param {Object} route - ルート設定
     * @param {Object} params - パラメータ
     */
    updateBreadcrumbs(route, params = {}) {
        if (!route.breadcrumbs) return;
        
        const breadcrumbs = route.breadcrumbs.map(crumb => ({
            label: i18n?.t ? i18n.t(crumb.label) : crumb.label,
            path: crumb.path
        }));
        
        // パラメータ置換
        if (params.id) {
            const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
            if (lastCrumb.label.includes('詳細')) {
                lastCrumb.label = `${lastCrumb.label} (ID: ${params.id})`;
            }
        }
        
        if (typeof updateBreadcrumbs === 'function') {
            updateBreadcrumbs(breadcrumbs);
        }
    }
    
    /**
     * 戻る
     */
    back() {
        if (this.history.length > 0) {
            const previous = this.history.pop();
            this.navigate(previous.path, false);
        } else {
            window.history.back();
        }
    }
    
    /**
     * リダイレクト
     * @param {string} path - リダイレクト先
     */
    redirect(path) {
        this.navigate(path, true);
    }
    
    /**
     * 現在のルート情報取得
     * @returns {Object} ルート情報
     */
    getCurrentRoute() {
        return {
            path: this.currentRoute,
            page: this.currentPage,
            route: this.findRoute(this.currentRoute)
        };
    }
    
    /**
     * ルートフック追加
     * @param {string} type - フックタイプ ('before' | 'after')
     * @param {Function} hook - フック関数
     */
    addHook(type, hook) {
        if (type === 'before') {
            this.beforeRouteHooks.push(hook);
        } else if (type === 'after') {
            this.afterRouteHooks.push(hook);
        }
    }
    
    /**
     * URLからパスを生成
     * @param {string} name - ルート名
     * @param {Object} params - パラメータ
     * @returns {string} パス
     */
    generatePath(name, params = {}) {
        for (const [path, route] of this.routes) {
            if (route.name === name) {
                let generatedPath = path;
                
                // パラメータ置換
                Object.entries(params).forEach(([key, value]) => {
                    generatedPath = generatedPath.replace(`:${key}`, value);
                });
                
                return generatedPath;
            }
        }
        
        return '/';
    }
}

// ルーターヘルパー関数
const routerHelpers = {
    /**
     * ダッシュボードに遷移
     */
    toDashboard() {
        router.navigate('/dashboard');
    },
    
    /**
     * 評価一覧に遷移
     */
    toEvaluations() {
        router.navigate('/evaluations');
    },
    
    /**
     * 新規評価作成に遷移
     */
    toNewEvaluation() {
        router.navigate('/evaluations/new');
    },
    
    /**
     * 評価詳細に遷移
     * @param {string} id - 評価ID
     */
    toEvaluationDetail(id) {
        router.navigate(`/evaluations/${id}`);
    },
    
    /**
     * ログアウト後にログイン画面に遷移
     */
    toLogin() {
        router.navigate('/', false);
    },
    
    /**
     * ブレッドクラムナビゲーション
     * @param {string} path - パス
     */
    navigateFromBreadcrumb(path) {
        if (path) {
            router.navigate(path);
        }
    }
};

// グローバルインスタンス作成
const router = new Router();

// グローバルに公開
if (typeof window !== 'undefined') {
    window.router = router;
    window.navigateFromBreadcrumb = routerHelpers.navigateFromBreadcrumb;
    
    // ページ表示関数も公開
    Object.assign(window, routerHelpers);
    
    // 既存の関数名との互換性維持
    window.showDashboard = routerHelpers.toDashboard;
    window.showEvaluations = routerHelpers.toEvaluations;
    window.showNewEvaluationForm = routerHelpers.toNewEvaluation;
    window.viewEvaluation = routerHelpers.toEvaluationDetail;
}

console.log('🗺️ router.js loaded - Routing system ready');
