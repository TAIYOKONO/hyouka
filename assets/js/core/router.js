/**
 * router.js - 建設業評価システム ルーティング管理 (最終確定版)
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentPath = '/';
        
        // ページが読み込まれた時とハッシュが変わった時に処理を実行
        window.addEventListener('load', this.handleRouteChange.bind(this));
        window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    }

    // ルートを定義する
    addRoute(path, component) {
        this.routes[path] = component;
    }

    // URLのハッシュを元に、表示するページを決定する
    handleRouteChange() {
        const pathWithQuery = window.location.hash.slice(1) || '/';
        this.currentPath = pathWithQuery.split('?')[0];
        
        const routeKey = this.findRouteKey(this.currentPath);
        const component = this.routes[routeKey];

        if (authManager.isAuthenticated()) {
            if (this.currentPath === '/') {
                return this.navigate('/dashboard');
            }
            if (component) {
                this.render(component);
            } else {
                this.render(this.routes['/dashboard']);
            }
        } else {
            if (this.currentPath.startsWith('/register')) {
                this.render(this.routes['/register']);
            } else {
                this.render(this.routes['/']);
            }
        }
    }
    
    // 指定したパスに移動する
    navigate(path) {
        window.location.hash = path;
    }
    
    // パラメータ付きのルート（例: /evaluations/:id）を見つける
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

    // パスからパラメータを抽出する
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

    // ページを描画する
    render(component) {
        const mainContent = document.getElementById('main-content');
        if (typeof component === 'function') {
            document.body.className = authManager.isAuthenticated() ? 'authenticated' : 'login-mode';
            
            const routeKey = this.findRouteKey(this.currentPath);
            if (routeKey && routeKey.includes(':')) {
                const params = this.extractParams(this.currentPath, routeKey);
                component(params.id); // :id パラメータを渡す
            } else {
                component();
            }
        } else {
            mainContent.innerHTML = `<h2>ページが見つかりません</h2>`;
        }
    }
}
