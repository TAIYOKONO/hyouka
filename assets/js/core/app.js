/**
 * app.js - 建設業評価システム メインアプリケーション
 * 全体の初期化・状態管理・グローバル機能統合 (Firebase連携版)
 */

class ConstructionEvaluationApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.currentUser = null;
        this.currentPage = 'login';
        this.loadingStates = new Map();
        this.globalState = {
            language: 'ja',
            theme: 'light',
            isOnline: navigator.onLine,
            lastActivity: Date.now()
        };
        
        // モジュール参照
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
            this.setupOnlineStatusMonitoring();
            
            this.auth = window.authManager;
            await new Promise(resolve => {
                this.auth.init((user) => {
                    this.currentUser = user;
                    resolve(); 
                });
            });
            
            await this.initializeModules();
            this.setupEventListeners();
            this.showInitialPage();
            
            this.initialized = true;
            console.log('✅ Construction Evaluation System initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    async initializeModules() {
        if (typeof i18n !== 'undefined') this.i18n = i18n.init ? i18n.init() : i18n;
        if (typeof router !== 'undefined') this.router = router;
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
    
    showInitialPage() {
        if (this.auth.isAuthenticated()) {
            document.body.classList.remove('login-mode');
            document.body.classList.add('authenticated');
            this.navigation.render();
            if (this.router) this.router.navigate('/dashboard');
        } else {
            document.body.classList.add('login-mode');
            document.body.classList.remove('authenticated');
            if (this.router) this.router.navigate('/');
        }
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

    setupOnlineStatusMonitoring() {
        window.addEventListener('online', () => this.notifications?.success('オンラインに復帰しました'));
        window.addEventListener('offline', () => this.notifications?.warning('オフラインになりました'));
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
