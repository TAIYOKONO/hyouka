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
        // ... (他のプロパティは変更なし)
        
        // モジュール参照
        this.auth = null;
        this.router = null;
        // ...
    }
    
    /**
     * ★ アプリケーション初期化 (Firebase認証対応)
     */
    async init() {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }
        
        console.log('🚀 Initializing Construction Evaluation System v' + this.version);
        
        try {
            this.setupGlobalErrorHandler();
            
            // ★ 認証モジュールを初期化し、初回認証状態が確定するのを待つ
            this.auth = window.authManager;
            await new Promise(resolve => {
                this.auth.init((user) => {
                    this.currentUser = user;
                    // 初回の認証状態が確定したら次に進む
                    resolve(); 
                });
            });
            
            // ★ 認証状態が確定してから、他のモジュールを初期化
            await this.initializeModules();
            
            this.setupEventListeners();
            
            // ★ 認証状態に基づいて最初のページを表示
            this.showInitialPage();
            
            this.initialized = true;
            console.log('✅ Construction Evaluation System initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    /**
     * モジュール初期化 (authを除く)
     */
    async initializeModules() {
        console.log('📦 Initializing modules...');
        
        if (typeof i18n !== 'undefined') {
            this.i18n = i18n.init ? i18n.init() : i18n;
        }
        if (typeof router !== 'undefined') {
            this.router = router;
            this.setupRouterHooks();
        }
        if (typeof notificationManager !== 'undefined') {
            this.notifications = notificationManager;
        }
        if (typeof pentagonChartManager !== 'undefined') {
            this.chartManager = pentagonChartManager;
        }
    }

    /**
     * ★ 初期ページ表示 (認証状態に基づく)
     */
    showInitialPage() {
        if (this.auth.isAuthenticated()) {
            document.body.classList.remove('login-mode');
            document.body.classList.add('authenticated');
            this.router.navigate('/dashboard');
        } else {this.Initialized = false;
            document.body.classList.add('login-mode');
            document.body.classList.remove('authenticated');
            this.router.navigate('/');
        }
    }

    /**
     * ★ ログイン処理 (authManagerを呼び出す)
     * @param {Event} event - フォームイベント
     */
    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            this.notifications.show('メールアドレスとパスワードを入力してください', 'error');
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
            this.notifications.show(result.message, 'error');
        }
        // ログイン成功時の処理はonAuthStateChangedが検知して自動で行うため、
        // ここでは失敗時の通知のみでOK
    }
    
    // ★ checkSessionRestorationメソッドは不要なので削除する

    // ... その他のメソッドは変更なし ...
}

// グローバルインスタンス作成
const app = new ConstructionEvaluationApp();

// グローバルに公開
if (typeof window !== 'undefined') {
    window.app = app;
}

console.log('🏗️ app.js loaded - Main application ready');
