/**
 * app.js - 建設業評価システム メインアプリケーション
 */
class ConstructionEvaluationApp {
    constructor() {
        this.auth = null;
        this.router = null;
    }

    init() {
        console.log('🚀 Initializing...');
        this.auth = window.authManager;
        this.router = new Router();
        window.router = this.router; // routerをグローバルで利用可能に
        this.defineRoutes();

        // ログインフォームの送信イベントを一元管理
        document.addEventListener('submit', e => {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                this.handleLogin();
            }
        });

        // 認証状態の変更を監視し、変更があればルーティングを再処理
        this.auth.init(() => {
            // ナビゲーションを再描画してからルーティング処理
            window.navigation.render().then(() => {
                this.router.handleRouteChange();
            });
        });

        // 初期ロード時のルーティング
        this.router.handleRouteChange();
        console.log('✅ Initialized successfully');
    }

    defineRoutes() {
        this.router.addRoute('/', showLoginPage);
        this.router.addRoute('/dashboard', showDashboard);
        this.router.addRoute('/evaluations', showEvaluations);
        this.router.addRoute('/evaluations/new', showNewEvaluationForm);
        this.router.addRoute('/evaluations/:id', viewEvaluation);
        this.router.addRoute('/users', showUsers);
        this.router.addRoute('/settings', showSettingsPage);
        this.router.addRoute('/goal-setting', showGoalSettingPage);
        this.router.addRoute('/goal-approvals', showGoalApprovalsPage);
        this.router.addRoute('/register-admin', showAdminRegistrationForm);
        this.router.addRoute('/register', showRegistrationPage);
        
        // ▼▼▼ 開発者ページ用のルートを追加 ▼▼▼
        this.router.addRoute('/developer', showDeveloperPage);
    }

    async handleLogin() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            return showNotification('メールアドレスとパスワードを入力してください', 'error');
        }
        
        const result = await this.auth.login(email, password);

        if (!result.success) {
            showNotification('ログインに失敗しました: ' + result.message, 'error');
        }
        // 成功時の処理は onAuthStateChanged が自動的に行う
    }
}

// アプリケーションインスタンスの生成と初期化
const app = new ConstructionEvaluationApp();
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    window.app.init();
});
