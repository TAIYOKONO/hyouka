/**
 * app.js - 建設業評価システム メインアプリケーション (最終版)
 */
class ConstructionEvaluationApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.currentUser = null;
        this.currentPage = 'login';
        
        this.auth = null;
        this.router = null;
        this.notifications = null;
        this.navigation = null;
    }
    
    async init() {
        if (this.initialized) return;
        console.log('🚀 Initializing Construction Evaluation System v' + this.version);
        
        try {
            // 認証より先にモジュールを初期化
            this.initializeModules();
            this.setupEventListeners();

            // 認証状態の監視を開始し、完了を待つ
            this.auth = window.authManager;
            await new Promise(resolve => {
                this.auth.init((user) => {
                    this.currentUser = user;
                    resolve(); 
                });
            });
            
            // 認証状態が確定してから、ルーターが自身の力で最初のページを表示する
            // app.jsからの明示的な呼び出しは不要
            
            this.initialized = true;
            console.log('✅ Construction Evaluation System initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    initializeModules() {
        // routerのインスタンス化を先に行う
        if (typeof AppRouter !== 'undefined') {
            this.router = new AppRouter();
            window.router = this.router;
        }

        if (typeof i18n !== 'undefined') this.i18n = i18n.init ? i18n.init() : i18n;
        if (typeof notificationManager !== 'undefined') this.notifications = notificationManager;
        if (typeof navigation !== 'undefined') this.navigation = navigation;
    }

    setupEventListeners() {
        document.addEventListener('submit', (event) => {
            if (event.target.id === 'login-form') {
                event.preventDefault();
                this.handleLogin(event);
            }
        });
    }
    
    async handleLogin(event) {
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            this.notifications?.show('メールアドレスとパスワードを入力してください', 'error');
            return;
        }
        
        const submitButton = document.getElementById('login-submit');
        const originalText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'ログイン中...';
        }
        
        const result = await this.auth.login(email, password);
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }

        if (!result.success) {
            this.notifications?.show(result.message, 'error');
        }
        // 成功時のページ遷移はonAuthStateChangedとrouterが自動で行う
    }

    showInitializationError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `<div style="padding: 40px; text-align: center; color: #721c24; background: #f8d7da; border-radius: 8px;"><h2>システムエラー</h2><p>アプリケーションの起動に失敗しました。</p><p>エラー内容: ${error.message}</p></div>`;
        }
    }
}

const app = new ConstructionEvaluationApp();
if (typeof window !== 'undefined') {
    window.app = app;
}
