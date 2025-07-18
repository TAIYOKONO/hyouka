/**
 * app.js - 建設業評価システム メインアプリケーション
 */
class ConstructionEvaluationApp {
    constructor() { this.auth = null; this.router = null; }
    init() {
        console.log('🚀 Initializing...');
        this.auth = window.authManager;
        this.router = new Router();
        window.router = this.router;
        this.defineRoutes();
        document.addEventListener('submit', e => { if (e.target.id === 'login-form') { e.preventDefault(); this.handleLogin(); }});
        this.auth.init(() => this.router.handleRouteChange());
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
    }
    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (!email || !password) return alert('メールアドレスとパスワードを入力してください');
        const result = await this.auth.login(email, password);
        if (!result.success) alert('ログインに失敗しました: ' + result.message);
    }
}
const app = new ConstructionEvaluationApp();
document.addEventListener('DOMContentLoaded', () => { window.app = app; window.app.init(); });
