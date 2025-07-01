/**
 * auth.js - 建設業評価システム認証管理
 * ログイン・ログアウト・権限管理
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'construction_eval_session';
        this.permissions = {
            admin: ['view_all', 'create', 'edit', 'delete', 'manage_users', 'view_analytics'],
            manager: ['view_team', 'create', 'edit', 'view_reports'],
            supervisor: ['view_subordinates', 'create', 'edit'],
            worker: ['view_own', 'create_self_evaluation']
        };
        
        this.init();
    }
    
    init() {
        // セッション復元を試行
        this.restoreSession();
        console.log('🔐 Auth Manager initialized');
    }
    
    /**
     * ログイン処理
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ログイン結果
     */
    async login(email, password) {
        try {
            // 入力検証
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            
            // モックデータサービスで認証
            const user = mockDataService.authenticateUser(email, password);
            
            if (!user) {
                throw new Error('Invalid credentials');
            }
            
            // セッション開始
            this.currentUser = {
                ...user,
                loginTime: new Date().toISOString(),
                sessionId: this.generateSessionId()
            };
            
            // セッション保存
            this.saveSession();
            
            console.log(`✅ User logged in: ${user.name} (${user.role})`);
            
            return {
                success: true,
                user: this.getSafeUserData(),
                message: `${user.name}${i18n.t('login.welcome')}`
            };
            
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            return {
                success: false,
                error: error.message,
                message: i18n.t('login.failed')
            };
        }
    }
    
    /**
     * ログアウト処理
     */
    logout() {
        if (this.currentUser) {
            console.log(`🚪 User logged out: ${this.currentUser.name}`);
        }
        
        this.currentUser = null;
        this.clearSession();
        
        // UI状態をリセット
        document.body.classList.remove('authenticated');
        document.body.classList.add('login-mode');
        
        // ヘッダーとブレッドクラムを隠す
        document.getElementById('app-header').style.display = 'none';
        document.getElementById('breadcrumbs').style.display = 'none';
        
        // ページリロード
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }
    
    /**
     * 認証状態確認
     * @returns {boolean} 認証済みかどうか
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    /**
     * 現在のユーザー情報取得
     * @returns {Object|null} ユーザー情報
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * 安全なユーザーデータ取得（パスワード除外）
     * @returns {Object|null} 安全なユーザー情報
     */
    getSafeUserData() {
        if (!this.currentUser) return null;
        
        const { password, ...safeData } = this.currentUser;
        return safeData;
    }
    
    /**
     * 権限チェック
     * @param {string} permission - 確認する権限
     * @returns {boolean} 権限があるかどうか
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userPermissions = this.permissions[this.currentUser.role] || [];
        return userPermissions.includes(permission);
    }
    
    /**
     * 複数権限チェック
     * @param {Array} permissions - 確認する権限配列
     * @param {boolean} requireAll - すべての権限が必要かどうか
     * @returns {boolean} 権限があるかどうか
     */
    hasPermissions(permissions, requireAll = false) {
        if (!this.currentUser) return false;
        
        if (requireAll) {
            return permissions.every(permission => this.hasPermission(permission));
        } else {
            return permissions.some(permission => this.hasPermission(permission));
        }
    }
    
    /**
     * ユーザーロール確認
     * @param {string} role - 確認するロール
     * @returns {boolean} 指定ロールかどうか
     */
    hasRole(role) {
        return this.currentUser?.role === role;
    }
    
    /**
     * 管理者権限確認
     * @returns {boolean} 管理者かどうか
     */
    isAdmin() {
        return this.hasRole('admin');
    }
    
    /**
     * マネージャー権限確認
     * @returns {boolean} マネージャーかどうか
     */
    isManager() {
        return this.hasRole('manager') || this.isAdmin();
    }
    
    /**
     * 技能実習生確認
     * @returns {boolean} 技能実習生かどうか
     */
    isTrainee() {
        return this.currentUser?.isTrainee === true;
    }
    
    /**
     * データアクセス権限確認
     * @param {string} targetUserId - 対象ユーザーID
     * @returns {boolean} アクセス権限があるかどうか
     */
    canAccessUserData(targetUserId) {
        if (!this.currentUser) return false;
        
        // 管理者は全員のデータにアクセス可能
        if (this.isAdmin()) return true;
        
        // 自分のデータは常にアクセス可能
        if (this.currentUser.id === targetUserId) return true;
        
        // マネージャーは部下のデータにアクセス可能（簡易実装）
        if (this.isManager()) {
            const targetUser = mockDataService.getUserById(targetUserId);
            return targetUser && (targetUser.role === 'worker' || targetUser.role === 'supervisor');
        }
        
        // 現場監督は作業員のデータにアクセス可能
        if (this.hasRole('supervisor')) {
            const targetUser = mockDataService.getUserById(targetUserId);
            return targetUser && targetUser.role === 'worker';
        }
        
        return false;
    }
    
    /**
     * セッションID生成
     * @returns {string} セッションID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * セッション保存
     */
    saveSession() {
        if (!this.currentUser) return;
        
        try {
            const sessionData = {
                user: this.getSafeUserData(),
                timestamp: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24時間
            };
            
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        } catch (error) {
            console.warn('Failed to save session:', error);
        }
    }
    
    /**
     * セッション復元
     */
    restoreSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return false;
            
            const parsed = JSON.parse(sessionData);
            
            // セッション有効期限チェック
            if (Date.now() > parsed.expires) {
                this.clearSession();
                return false;
            }
            
            // ユーザーデータを復元
            this.currentUser = parsed.user;
            console.log(`🔄 Session restored: ${this.currentUser.name}`);
            
            return true;
        } catch (error) {
            console.warn('Failed to restore session:', error);
            this.clearSession();
            return false;
        }
    }
    
    /**
     * セッションクリア
     */
    clearSession() {
        try {
            localStorage.removeItem(this.sessionKey);
        } catch (error) {
            console.warn('Failed to clear session:', error);
        }
    }
    
    /**
     * セッション有効性確認
     * @returns {boolean} セッションが有効かどうか
     */
    isSessionValid() {
        if (!this.currentUser) return false;
        
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return false;
            
            const parsed = JSON.parse(sessionData);
            return Date.now() <= parsed.expires;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * パスワード強度チェック
     * @param {string} password - パスワード
     * @returns {Object} 強度チェック結果
     */
    checkPasswordStrength(password) {
        const result = {
            score: 0,
            feedback: [],
            isValid: false
        };
        
        if (!password) {
            result.feedback.push('パスワードを入力してください');
            return result;
        }
        
        // 長さチェック
        if (password.length >= 8) {
            result.score += 25;
        } else {
            result.feedback.push('8文字以上で入力してください');
        }
        
        // 大文字小文字チェック
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
            result.score += 25;
        } else {
            result.feedback.push('大文字と小文字を含めてください');
        }
        
        // 数字チェック
        if (/\d/.test(password)) {
            result.score += 25;
        } else {
            result.feedback.push('数字を含めてください');
        }
        
        // 特殊文字チェック
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            result.score += 25;
        } else {
            result.feedback.push('特殊文字を含めてください');
        }
        
        result.isValid = result.score >= 50;
        
        return result;
    }
    
    /**
     * ログイン試行回数制限
     * @param {string} email - メールアドレス
     * @returns {boolean} ログイン試行可能かどうか
     */
    canAttemptLogin(email) {
        const attemptsKey = `login_attempts_${email}`;
        const maxAttempts = 5;
        const lockoutDuration = 15 * 60 * 1000; // 15分
        
        try {
            const attemptData = localStorage.getItem(attemptsKey);
            if (!attemptData) return true;
            
            const parsed = JSON.parse(attemptData);
            
            // ロックアウト期間終了チェック
            if (Date.now() - parsed.lastAttempt > lockoutDuration) {
                localStorage.removeItem(attemptsKey);
                return true;
            }
            
            return parsed.count < maxAttempts;
        } catch (error) {
            return true;
        }
    }
    
    /**
     * ログイン失敗記録
     * @param {string} email - メールアドレス
     */
    recordFailedLogin(email) {
        const attemptsKey = `login_attempts_${email}`;
        
        try {
            const attemptData = localStorage.getItem(attemptsKey);
            let parsed = { count: 0, lastAttempt: 0 };
            
            if (attemptData) {
                parsed = JSON.parse(attemptData);
            }
            
            parsed.count += 1;
            parsed.lastAttempt = Date.now();
            
            localStorage.setItem(attemptsKey, JSON.stringify(parsed));
        } catch (error) {
            console.warn('Failed to record login attempt:', error);
        }
    }
    
    /**
     * ログイン成功記録
     * @param {string} email - メールアドレス
     */
    recordSuccessfulLogin(email) {
        const attemptsKey = `login_attempts_${email}`;
        
        try {
            localStorage.removeItem(attemptsKey);
        } catch (error) {
            console.warn('Failed to clear login attempts:', error);
        }
    }
    
    /**
     * ユーザー情報更新
     * @param {Object} updates - 更新データ
     * @returns {boolean} 更新成功かどうか
     */
    updateCurrentUser(updates) {
        if (!this.currentUser) return false;
        
        try {
            // 危険なフィールドの更新を防ぐ
            const allowedFields = ['name', 'nameVi', 'department', 'departmentVi'];
            const filteredUpdates = {};
            
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    filteredUpdates[field] = updates[field];
                }
            });
            
            // ユーザー情報更新
            Object.assign(this.currentUser, filteredUpdates);
            
            // セッション再保存
            this.saveSession();
            
            return true;
        } catch (error) {
            console.error('Failed to update user:', error);
            return false;
        }
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            isAuthenticated: this.isAuthenticated(),
            currentUser: this.getSafeUserData(),
            sessionValid: this.isSessionValid(),
            permissions: this.currentUser ? this.permissions[this.currentUser.role] : [],
            loginTime: this.currentUser?.loginTime,
            sessionId: this.currentUser?.sessionId
        };
    }
}

// 認証ヘルパー関数
const authHelpers = {
    /**
     * ログインフォーム処理
     * @param {Event} event - フォームイベント
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            if (typeof showNotification === 'function') {
                showNotification('メールアドレスとパスワードを入力してください', 'error');
            }
            return;
        }
        
        // ログイン試行回数チェック
        if (!authManager.canAttemptLogin(email)) {
            if (typeof showNotification === 'function') {
                showNotification('ログイン試行回数が上限に達しました。15分後に再試行してください。', 'error');
            }
            return;
        }
        
        // ローディング状態表示
        const submitButton = document.getElementById('login-submit');
        const originalText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = i18n.t('message.loading');
        }
        
        try {
            const result = await authManager.login(email, password);
            
            if (result.success) {
                authManager.recordSuccessfulLogin(email);
                if (typeof showNotification === 'function') {
                    showNotification(result.message, 'success');
                }
                
                // ダッシュボードに遷移
                setTimeout(() => {
                    // ログインページを完全に隠す
                    const loginPage = document.querySelector('.login-page');
                    if (loginPage) {
                        loginPage.style.display = 'none';
                    }
                    
                    if (typeof showDashboard === 'function') {
                        showDashboard();
                    } else if (typeof router !== 'undefined') {
                        router.navigate('/dashboard');
                    }
                }, 1000);
            } else {
                authManager.recordFailedLogin(email);
                if (typeof showNotification === 'function') {
                    showNotification(result.message, 'error');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            if (typeof showNotification === 'function') {
                showNotification('ログイン処理中にエラーが発生しました', 'error');
            }
        } finally {
            // ローディング状態解除
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    },
    
    /**
     * ログアウト処理
     */
    handleLogout() {
        if (confirm('ログアウトしますか？')) {
            authManager.logout();
        }
    },
    
    /**
     * 認証が必要なページの保護
     * @param {Function} callback - 認証後に実行する関数
     */
    requireAuth(callback) {
        if (!authManager.isAuthenticated()) {
            showNotification('ログインが必要です', 'error');
            return false;
        }
        
        if (typeof callback === 'function') {
            callback();
        }
        
        return true;
    },
    
    /**
     * 権限が必要な操作の保護
     * @param {string} permission - 必要な権限
     * @param {Function} callback - 認証後に実行する関数
     */
    requirePermission(permission, callback) {
        if (!this.requireAuth()) return false;
        
        if (!authManager.hasPermission(permission)) {
            showNotification('この操作を実行する権限がありません', 'error');
            return false;
        }
        
        if (typeof callback === 'function') {
            callback();
        }
        
        return true;
    }
};

// グローバルインスタンス作成
const authManager = new AuthManager();

// グローバルに公開
if (typeof window !== 'undefined') {
    window.authManager = authManager;
    window.authHelpers = authHelpers;
    window.handleLogin = authHelpers.handleLogin;
    window.logout = authHelpers.handleLogout;
}

console.log('🔐 auth.js loaded - Authentication system ready');
