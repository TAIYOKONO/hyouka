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
        const path = window.location.hash.slice(1) || '/';
        this.currentPath = path.split('?')[0];
        
        const routeComponent = this.routes[this.currentPath];

        if (authManager.isAuthenticated()) {
            // ログイン済みの場合
            if (this.currentPath === '/') {
                this.navigate('/dashboard'); // ログインページならダッシュボードへ
            } else if (routeComponent) {
                this.render(routeComponent);
            }
        } else {
            // 未ログインの場合
            if (this.currentPath.startsWith('/register')) {
                this.render(this.routes['/register']); // 登録ページは表示
            } else {
                this.render(this.routes['/']); // それ以外はログインページへ
            }
        }
    }
    
    // 指定したパスに移動する
    navigate(path) {
        window.location.hash = path;
    }
    
    // ページを描画する
    render(component) {
        if (typeof component === 'function') {
            document.body.className = authManager.isAuthenticated() ? 'authenticated' : 'login-mode';
            component();
        } else {
            console.error(`Component for path "${this.currentPath}" is not a function.`);
            document.getElementById('main-content').innerHTML = `<h2>ページが見つかりません</h2>`;
        }
    }
}
