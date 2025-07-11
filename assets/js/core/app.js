// app.js の全コード
/**
 * app.js - 建設業評価システム メインアプリケーション (最終確定版)
 */
class ConstructionEvaluationApp {
    constructor() {
        this.version = '1.0.0';
        this.auth = null;
        this.router = null;
    }
    
    init() {
        console.log('🚀 Initializing...');
        this.auth = window.authManager;
        this.router = new Router();
        window.router = this.router;

        // ルート定義
        this.router.addRoute('/', showLoginPage);
        this.router.addRoute('/dashboard', showDashboard);
        this.router.addRoute('/evaluations', showEvaluations);
        this.router.addRoute('/evaluations/new', showNewEvaluationForm);
        this.router.addRoute('/users', showUsers);
        this.router.addRoute('/settings', showSettingsPage);
        this.router.addRoute('/register', showRegistrationPage);
        this.router.addRoute('/evaluations/:id', viewEvaluation);
        this.router.addRoute('/register-admin', showAdminRegistrationForm); // --- 追加 ---

        // ログインフォームのイベントリスナー
        document.addEventListener('submit', (event) => {
            if (event.target.id === 'login-form') {
                event.preventDefault();
                this.handleLogin();
            }
        });
        
        // 認証状態の監視を開始
        this.auth.init(() => {
            this.router.handleRouteChange(); // ログイン状態が変わったら、再度ページを判定させる
        });
        
        console.log('✅ Initialized successfully');
    }
    
    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (!email || !password) return alert('メールアドレスとパスワードを入力してください');

        const result = await this.auth.login(email, password);
        if (!result.success) {
            alert('ログインに失敗しました: ' + result.message);
        }
        // 成功時の画面遷移はinit内の認証状態監視が自動で行う
    }
}

const app = new ConstructionEvaluationApp();
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    window.app.init();
});
