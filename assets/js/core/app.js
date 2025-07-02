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
            this.setupGlobalErrorHandler();
            
            this.auth = window.authManager;
            await new Promise(resolve => {
                this.auth.init((user) => {
                    this.currentUser = user;
                    resolve(); 
                });
            });
            
            this.initializeModules();
            this.setupEventListeners();
            
            // ルーターを起動し、現在のURLに基づいて最初のページを表示
            if (this.router) {
                this.router.start();
            }
            
            this.initialized = true;
            console.log('✅ Construction Evaluation System initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    initializeModules() {
        if (typeof i18n !== 'undefined') this.i18n = i18n.init ? i18n.init() : i18n;
        
        // router.jsで定義されたAppRouterクラスからインスタンスを生成
        if (typeof AppRouter !== 'undefined') {
            this.router = new AppRouter();
            window.router = this.router;
        }

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
        // 成功時の処理はonAuthStateChangedが検知し、routerが自動でページ遷移を行う
    }

    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.notifications?.show('予期しないエラーが発生しました', 'error');
        });
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.notifications?.show('処理中にエラーが発生しました', 'error');
        });
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
