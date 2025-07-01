/**
 * app.js - 建設業評価システム メインアプリケーション
 * 全体の初期化・状態管理・グローバル機能統合
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
        this.i18n = null;
        this.auth = null;
        this.router = null;
        this.notifications = null;
        this.charts = new Map();
        
        // データキャッシュ
        this.dataCache = {
            evaluations: null,
            users: null,
            categories: null,
            lastUpdate: null
        };
    }
    
    /**
     * アプリケーション初期化
     */
    async init() {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }
        
        console.log('🚀 Initializing Construction Evaluation System v' + this.version);
        
        try {
            // 1. 基本システム初期化
            this.setupGlobalErrorHandler();
            this.setupActivityMonitoring();
            this.setupOnlineStatusMonitoring();
            
            // 2. モジュール初期化
            await this.initializeModules();
            
            // 3. イベントリスナー設定
            this.setupEventListeners();
            
            // 4. 初期データ読み込み
            this.loadInitialData();
            
            // 5. セッション復元チェック
            this.checkSessionRestoration();
            
            // 6. 初期ページ表示
            this.showInitialPage();
            
            this.initialized = true;
            console.log('✅ Construction Evaluation System initialized successfully');
            
            // 初期化完了通知（安全な呼び出し）
            if (this.notifications && typeof this.notifications.show === 'function') {
                this.notifications.show('システムが正常に起動しました', 'info', { duration: 2000 });
            } else if (typeof showNotification === 'function') {
                showNotification('システムが正常に起動しました', 'info');
            }
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showInitializationError(error);
        }
    }
    
    /**
     * モジュール初期化
     */
    async initializeModules() {
        console.log('📦 Initializing modules...');
        
        // 多言語システム
        if (typeof i18n !== 'undefined') {
            this.i18n = i18n.init ? i18n.init() : i18n;
            console.log('✅ i18n module loaded');
        }
        
        // 認証システム
        if (typeof authManager !== 'undefined') {
            this.auth = authManager;
            console.log('✅ Auth module loaded');
        }
        
        // ルーターシステム
        if (typeof router !== 'undefined') {
            this.router = router;
            this.setupRouterHooks();
            console.log('✅ Router module loaded');
        }
        
        // 通知システム
        if (typeof notificationManager !== 'undefined') {
            this.notifications = notificationManager;
            console.log('✅ Notification module loaded');
        } else if (typeof showNotification !== 'undefined') {
            // フォールバック：グローバル関数を使用
            this.notifications = {
                show: showNotification,
                success: (msg, opt) => showNotification(msg, 'success'),
                error: (msg, opt) => showNotification(msg, 'error'),
                warning: (msg, opt) => showNotification(msg, 'warning'),
                info: (msg, opt) => showNotification(msg, 'info'),
                confirm: (msg, opt) => confirm(msg)
            };
            console.log('✅ Notification fallback loaded');
        }
        
        // チャート管理システム
        if (typeof pentagonChartManager !== 'undefined') {
            this.chartManager = pentagonChartManager;
            console.log('✅ Chart module loaded');
        }
        
        // Google Apps Script翻訳API設定
        await this.setupTranslationAPI();
    }
    
    /**
     * ルーターフック設定
     */
    setupRouterHooks() {
        // ページ遷移前の処理
        this.router.addHook('before', async (route, currentRoute) => {
            console.log(`🗺️ Navigating from ${currentRoute} to ${route.path}`);
            
            // ローディング状態表示
            this.setLoading('navigation', true);
            
            // 未保存データのチェック
            if (this.hasUnsavedData()) {
                const confirmed = await this.notifications.confirm(
                    '未保存のデータがあります。ページを離れますか？',
                    { type: 'warning' }
                );
                if (!confirmed) {
                    this.setLoading('navigation', false);
                    return false;
                }
            }
            
            return true;
        });
        
        // ページ遷移後の処理
        this.router.addHook('after', async (route, currentRoute) => {
            this.currentPage = route.name;
            
            // ページ固有の初期化
            await this.initializePage(route);
            
            // ローディング状態解除
            this.setLoading('navigation', false);
            
            // アクティビティ記録
            this.recordActivity('page_view', { page: route.name });
            
            console.log(`✅ Page loaded: ${route.name}`);
        });
    }
    
    /**
     * 翻訳API設定
     */
    async setupTranslationAPI() {
        // 環境変数または設定ファイルからAPI URLを取得
        const gasApiUrl = this.getConfig('GAS_TRANSLATION_API_URL');
        
        if (gasApiUrl && this.i18n && this.i18n.translator) {
            this.i18n.translator.setGASApiUrl(gasApiUrl);
            console.log('🌐 Translation API configured');
        } else {
            console.warn('⚠️ Translation API URL not configured');
        }
    }
    
    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // 言語切り替えイベント
        document.addEventListener('change', (event) => {
            if (event.target.matches('#login-language-select, #header-language-select')) {
                this.changeLanguage(event.target.value);
            }
        });
        
        // フォーム送信イベント
        document.addEventListener('submit', (event) => {
            if (event.target.id === 'login-form') {
                event.preventDefault();
                this.handleLogin(event);
            } else if (event.target.id === 'new-evaluation-form') {
                event.preventDefault();
                this.handleSaveEvaluation(event);
            }
        });
        
        // 評価入力リアルタイム更新
        document.addEventListener('input', (event) => {
            if (event.target.matches('.rating-input')) {
                this.handleRatingInput(event);
            }
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // ページ離脱前の確認
        window.addEventListener('beforeunload', (event) => {
            if (this.hasUnsavedData()) {
                event.preventDefault();
                event.returnValue = '';
                return '';
            }
        });
    }
    
    /**
     * 初期データ読み込み
     */
    loadInitialData() {
        console.log('📊 Loading initial data...');
        
        // モックデータを初期キャッシュとして設定
        if (typeof mockData !== 'undefined') {
            this.dataCache.evaluations = mockData.evaluations;
            this.dataCache.users = mockData.users;
            this.dataCache.categories = mockData.evaluationCategories;
            this.dataCache.lastUpdate = Date.now();
            console.log('✅ Initial data loaded from mock');
        }
    }
    
    /**
     * セッション復元チェック
     */
    checkSessionRestoration() {
        if (this.auth && this.auth.isAuthenticated()) {
            this.currentUser = this.auth.getCurrentUser();
            console.log(`🔄 Session restored for: ${this.currentUser.name}`);
        }
    }
    
    /**
     * 初期ページ表示
     */
    showInitialPage() {
        if (this.auth && this.auth.isAuthenticated()) {
            // 認証済みの場合はダッシュボードへ
            document.body.classList.remove('login-mode');
            document.body.classList.add('authenticated');
            this.router.navigate('/dashboard', false);
        } else {
            // 未認証の場合はログインページ
            document.body.classList.add('login-mode');
            document.body.classList.remove('authenticated');
            this.router.navigate('/', false);
        }
    }
    
    /**
     * 言語変更処理
     * @param {string} lang - 言語コード
     */
    async changeLanguage(lang) {
        console.log(`🌐 Changing language to: ${lang}`);
        
        this.globalState.language = lang;
        
        if (this.i18n) {
            this.i18n.setLanguage(lang);
        }
        
        // 言語選択の状態を同期
        const selects = document.querySelectorAll('#login-language-select, #header-language-select');
        selects.forEach(select => {
            if (select.value !== lang) {
                select.value = lang;
            }
        });
        
        // 現在のページを再描画
        if (this.router && this.currentUser) {
            const currentRoute = this.router.getCurrentRoute();
            await this.initializePage(currentRoute.route);
        }
    }
    
    /**
     * ログイン処理
     * @param {Event} event - フォームイベント
     */
    async handleLogin(event) {
        if (typeof authHelpers !== 'undefined' && authHelpers.handleLogin) {
            await authHelpers.handleLogin(event);
            
            // ログイン成功時の追加処理
            if (this.auth && this.auth.isAuthenticated()) {
                this.currentUser = this.auth.getCurrentUser();
                this.recordActivity('login', { userId: this.currentUser.id });
                
                // ログイン状態のボディクラス更新
                document.body.classList.remove('login-mode');
                document.body.classList.add('authenticated');
            }
        }
    }
    
    /**
     * 評価保存処理
     * @param {Event} event - フォームイベント
     */
    async handleSaveEvaluation(event) {
        this.setLoading('save_evaluation', true);
        
        try {
            // フォームデータ収集
            const formData = this.collectEvaluationFormData(event.target);
            
            // バリデーション
            const validation = this.validateEvaluationData(formData);
            if (!validation.isValid) {
                if (this.notifications && typeof this.notifications.show === 'function') {
                    this.notifications.show(validation.message, 'error');
                } else if (typeof showNotification === 'function') {
                    showNotification(validation.message, 'error');
                }
                return;
            }
            
            // 保存処理
            const savedEvaluation = mockDataService.saveEvaluation(formData);
            
            // キャッシュ更新
            this.updateDataCache('evaluations');
            
            // 成功通知
            if (this.notifications && typeof this.notifications.show === 'function') {
                this.notifications.show('評価を保存しました', 'success');
            } else if (typeof showNotification === 'function') {
                showNotification('評価を保存しました', 'success');
            }
            
            // 評価一覧に戻る
            setTimeout(() => {
                this.router.navigate('/evaluations');
            }, 1500);
            
        } catch (error) {
            console.error('Evaluation save failed:', error);
            if (this.notifications && typeof this.notifications.show === 'function') {
                this.notifications.show('評価の保存に失敗しました', 'error');
            } else if (typeof showNotification === 'function') {
                showNotification('評価の保存に失敗しました', 'error');
            }
        } finally {
            this.setLoading('save_evaluation', false);
        }
    }
    
    /**
     * 評価入力処理
     * @param {Event} event - 入力イベント
     */
    handleRatingInput(event) {
        const categoryId = event.target.id.replace('rating-', '');
        this.updateRatingDisplay(categoryId);
        this.updateRadarChart();
        
        // 未保存データフラグ設定
        this.setUnsavedData(true);
    }
    
    /**
     * 評価表示更新
     * @param {string} categoryId - カテゴリID
     */
    updateRatingDisplay(categoryId) {
        if (typeof updateRatingDisplay === 'function') {
            updateRatingDisplay(categoryId);
        }
    }
    
    /**
     * レーダーチャート更新
     */
    updateRadarChart() {
        if (typeof updateRadarChart === 'function') {
            updateRadarChart();
        }
    }
    
    /**
     * ページ固有の初期化
     * @param {Object} route - ルート情報
     */
    async initializePage(route) {
        if (!route) return;
        
        switch (route.name) {
            case 'dashboard':
                await this.initializeDashboard();
                break;
            case 'evaluations':
                await this.initializeEvaluations();
                break;
            case 'new-evaluation':
                await this.initializeNewEvaluation();
                break;
            case 'evaluation-detail':
                await this.initializeEvaluationDetail();
                break;
            default:
                console.log(`No specific initialization for page: ${route.name}`);
        }
    }
    
    /**
     * ダッシュボード初期化
     */
    async initializeDashboard() {
        // 統計データ更新
        if (typeof mockDataService !== 'undefined') {
            mockDataService.updateStatistics();
        }
    }
    
    /**
     * 評価一覧初期化
     */
    async initializeEvaluations() {
        // データ更新チェック
        this.checkDataUpdate('evaluations');
    }
    
    /**
     * 新規評価初期化
     */
    async initializeNewEvaluation() {
        // チャート初期化を遅延実行
        setTimeout(() => {
            this.initializeRadarChart();
        }, 100);
    }
    
    /**
     * 評価詳細初期化
     */
    async initializeEvaluationDetail() {
        // 詳細チャート初期化を遅延実行
        setTimeout(() => {
            if (typeof initializeDetailRadarChart === 'function') {
                // 現在表示中の評価データを取得して初期化
                const evaluationId = this.router.currentRoute.split('/').pop();
                const evaluation = this.dataCache.evaluations?.find(e => e.id === evaluationId);
                if (evaluation) {
                    initializeDetailRadarChart(evaluation);
                }
            }
        }, 200);
    }
    
    /**
     * レーダーチャート初期化
     */
    initializeRadarChart() {
        if (typeof initializeRadarChart === 'function') {
            initializeRadarChart();
        } else if (this.chartManager) {
            // 新しいチャートマネージャーを使用
            const categories = this.dataCache.categories || [];
            this.chartManager.createChart(
                'evaluation-chart',
                'evaluation-radar-chart',
                categories,
                []
            );
        }
    }
    
    /**
     * キーボードショートカット処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S: 保存
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.quickSave();
        }
        
        // Ctrl/Cmd + D: ダッシュボード
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            this.router.navigate('/dashboard');
        }
        
        // Ctrl/Cmd + E: 評価一覧
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            this.router.navigate('/evaluations');
        }
        
        // Esc: モーダル/ダイアログを閉じる
        if (event.key === 'Escape') {
            this.closeActiveModal();
        }
    }
    
    /**
     * クイック保存
     */
    quickSave() {
        const activeForm = document.querySelector('form:not([hidden])');
        if (activeForm) {
            const submitButton = activeForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        }
    }
    
    /**
     * アクティブなモーダルを閉じる
     */
    closeActiveModal() {
        const activeModal = document.querySelector('.modal.show');
        if (activeModal) {
            const closeButton = activeModal.querySelector('.modal-close, .confirm-cancel');
            if (closeButton) {
                closeButton.click();
            }
        }
    }
    
    /**
     * ローディング状態管理
     * @param {string} key - ローディングキー
     * @param {boolean} isLoading - ローディング状態
     */
    setLoading(key, isLoading) {
        if (isLoading) {
            this.loadingStates.set(key, Date.now());
        } else {
            this.loadingStates.delete(key);
        }
        
        // グローバルローディング状態更新
        this.updateGlobalLoadingState();
    }
    
    /**
     * グローバルローディング状態更新
     */
    updateGlobalLoadingState() {
        const isLoading = this.loadingStates.size > 0;
        document.body.classList.toggle('app-loading', isLoading);
        
        // ローディング表示要素があれば更新
        const loader = document.querySelector('.global-loader');
        if (loader) {
            loader.style.display = isLoading ? 'flex' : 'none';
        }
    }
    
    /**
     * 未保存データ状態管理
     * @param {boolean} hasUnsaved - 未保存データがあるか
     */
    setUnsavedData(hasUnsaved) {
        this.globalState.hasUnsavedData = hasUnsaved;
        
        // 視覚的インジケーター更新
        document.body.classList.toggle('has-unsaved-data', hasUnsaved);
    }
    
    /**
     * 未保存データチェック
     * @returns {boolean} 未保存データがあるか
     */
    hasUnsavedData() {
        return this.globalState.hasUnsavedData === true;
    }
    
    /**
     * アクティビティ記録
     * @param {string} action - アクション
     * @param {Object} data - データ
     */
    recordActivity(action, data = {}) {
        const activity = {
            action,
            data,
            timestamp: Date.now(),
            user: this.currentUser?.id,
            page: this.currentPage
        };
        
        console.log('📊 Activity recorded:', activity);
        
        // ローカルストレージに保存（最新100件）
        try {
            const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
            activities.unshift(activity);
            activities.splice(100); // 最新100件のみ保持
            localStorage.setItem('user_activities', JSON.stringify(activities));
        } catch (error) {
            console.warn('Failed to save activity:', error);
        }
        
        // 最終アクティビティ時刻更新
        this.globalState.lastActivity = Date.now();
    }
    
    /**
     * データキャッシュ更新
     * @param {string} type - データタイプ
     */
    updateDataCache(type) {
        switch (type) {
            case 'evaluations':
                this.dataCache.evaluations = mockData.evaluations;
                break;
            case 'users':
                this.dataCache.users = mockData.users;
                break;
            case 'categories':
                this.dataCache.categories = mockData.evaluationCategories;
                break;
        }
        
        this.dataCache.lastUpdate = Date.now();
    }
    
    /**
     * データ更新チェック
     * @param {string} type - データタイプ
     */
    checkDataUpdate(type) {
        const lastUpdate = this.dataCache.lastUpdate;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (!lastUpdate || Date.now() - lastUpdate > fiveMinutes) {
            console.log(`🔄 Updating ${type} cache...`);
            this.updateDataCache(type);
        }
    }
    
    /**
     * グローバルエラーハンドラー設定
     */
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.notifications?.error('予期しないエラーが発生しました');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.notifications?.error('処理中にエラーが発生しました');
        });
    }
    
    /**
     * アクティビティ監視設定
     */
    setupActivityMonitoring() {
        // 30分間非アクティブの場合の警告
        const inactivityTime = 30 * 60 * 1000;
        
        setInterval(() => {
            if (Date.now() - this.globalState.lastActivity > inactivityTime) {
                if (this.auth && this.auth.isAuthenticated()) {
                    this.notifications?.warning(
                        '長時間非アクティブです。セキュリティのため再ログインを検討してください。',
                        { duration: 10000 }
                    );
                }
            }
        }, 5 * 60 * 1000); // 5分ごとにチェック
    }
    
    /**
     * オンライン状態監視設定
     */
    setupOnlineStatusMonitoring() {
        window.addEventListener('online', () => {
            this.globalState.isOnline = true;
            this.notifications?.success('インターネット接続が復旧しました');
        });
        
        window.addEventListener('offline', () => {
            this.globalState.isOnline = false;
            this.notifications?.warning('インターネット接続が切断されました');
        });
    }
    
    /**
     * 初期化エラー表示
     * @param {Error} error - エラー
     */
    showInitializationError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: var(--color-danger);
                    color: white;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <h1>⚠️ システム初期化エラー</h1>
                        <p>システムの初期化中にエラーが発生しました。</p>
                        <p><strong>エラー内容:</strong> ${error.message}</p>
                        <button onclick="location.reload()" style="
                            margin-top: 20px;
                            padding: 10px 20px;
                            background: white;
                            color: var(--color-danger);
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">
                            ページを再読み込み
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * 設定値取得
     * @param {string} key - 設定キー
     * @returns {any} 設定値
     */
    getConfig(key) {
        // ブラウザ環境用の設定管理
        const configs = {
            'GAS_TRANSLATION_API_URL': window.APP_CONFIG?.GAS_TRANSLATION_API_URL || null,
            'FIREBASE_CONFIG': window.APP_CONFIG?.FIREBASE_CONFIG || null,
            'DEBUG_MODE': window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        };
        
        return configs[key];
    }
    
    /**
     * アプリケーション情報取得
     * @returns {Object} アプリケーション情報
     */
    getAppInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            currentUser: this.currentUser,
            currentPage: this.currentPage,
            globalState: this.globalState,
            loadingStates: Array.from(this.loadingStates.keys()),
            cacheInfo: {
                evaluations: this.dataCache.evaluations?.length || 0,
                users: this.dataCache.users?.length || 0,
                categories: this.dataCache.categories?.length || 0,
                lastUpdate: this.dataCache.lastUpdate
            }
        };
    }
    
    /**
     * 評価フォームデータ収集
     * @param {HTMLFormElement} form - フォーム要素
     * @returns {Object} フォームデータ
     */
    collectEvaluationFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        // 基本情報
        data.period = document.getElementById('evaluation-period')?.value;
        data.subordinate = document.getElementById('subordinate-select')?.value;
        data.overallComment = document.getElementById('overall-comment')?.value;
        data.evaluator = this.currentUser?.name;
        data.evaluatorId = this.currentUser?.id;
        
        // 評価項目
        data.ratings = {};
        if (this.dataCache.categories) {
            this.dataCache.categories.forEach(category => {
                const input = document.getElementById(`rating-${category.id}`);
                if (input && input.value) {
                    data.ratings[category.id] = parseFloat(input.value);
                }
            });
        }
        
        // 総合評価計算
        const ratingValues = Object.values(data.ratings);
        data.overallRating = ratingValues.length > 0 
            ? Math.round((ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length) * 10) / 10
            : 0;
        
        return data;
    }
    
    /**
     * 評価データバリデーション
     * @param {Object} data - 評価データ
     * @returns {Object} バリデーション結果
     */
    validateEvaluationData(data) {
        const result = { isValid: true, message: '' };
        
        if (!data.period) {
            result.isValid = false;
            result.message = '評価期間を選択してください';
            return result;
        }
        
        if (!data.subordinate) {
            result.isValid = false;
            result.message = '評価対象者を選択してください';
            return result;
        }
        
        const ratingCount = Object.keys(data.ratings).length;
        if (ratingCount === 0) {
            result.isValid = false;
            result.message = '少なくとも1つの評価項目を入力してください';
            return result;
        }
        
        // 評価値の範囲チェック
        for (const [category, rating] of Object.entries(data.ratings)) {
            if (rating < 1 || rating > 5) {
                result.isValid = false;
                result.message = `${category}の評価値が正しくありません（1-5の範囲で入力）`;
                return result;
            }
        }
        
        return result;
    }
}

// グローバルインスタンス作成
const app = new ConstructionEvaluationApp();

// グローバルに公開
if (typeof window !== 'undefined') {
    window.app = app;
    
    // 後方互換性のための関数エイリアス
    window.changeLanguage = app.changeLanguage.bind(app);
    window.handleLogin = app.handleLogin.bind(app);
    window.handleSaveEvaluation = app.handleSaveEvaluation.bind(app);
    window.updateRatingDisplay = app.updateRatingDisplay.bind(app);
    window.updateRadarChart = app.updateRadarChart.bind(app);
    window.initializeRadarChart = app.initializeRadarChart.bind(app);
}

console.log('🏗️ app.js loaded - Main application ready');
