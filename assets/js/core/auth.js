/**
 * auth.js - 建設業評価システム認証管理
 * ログイン・ログアウト・権限管理 (Firebase連携版)
 */

class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        
        this.currentUser = null;
        this.userRole = null;
        
        // ★★★ このpermissionsオブジェクトを更新 ★★★
        this.permissions = {
            admin: [
                'view_dashboard',
                'view_all_evaluations',
                'create_evaluation',
                'manage_users',
                'manage_settings'
            ],
            evaluator: [
                'view_dashboard',
                'view_subordinate_evaluations',
                'create_evaluation'
            ],
            worker: [
                'view_dashboard',
                'view_own_evaluations'
            ]
        };
    }

    /**
     * 認証状態の監視を初期化
     * @param {Function} onAuthStateChangedCallback - 状態変更をapp.jsに通知するコールバック
     */
    init(onAuthStateChangedCallback) {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await this.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    this.currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                    this.userRole = this.currentUser.role;
                } else {
                    console.warn(`User data not found in Firestore for UID: ${user.uid}. Logging out.`);
                    this.logout();
                    return;
                }
            } else {
                this.currentUser = null;
                this.userRole = null;
            }
            
            console.log('Auth state changed. Current user:', this.currentUser);
            if (typeof onAuthStateChangedCallback === 'function') {
                onAuthStateChangedCallback(this.currentUser);
            }
        });
        console.log('🔐 Auth Manager initialized and listening for auth state changes.');
    }

    /**
     * ログイン処理 (Firebase版)
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ログイン結果
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                throw new Error('メールアドレスとパスワードは必須です');
            }
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            return {
                success: true,
                message: `ようこそ！`
            };
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            let message = 'ログインに失敗しました。';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'メールアドレスまたはパスワードが間違っています。';
            } else if (error.code === 'auth/invalid-email') {
                message = 'メールアドレスの形式が正しくありません。';
            }
            return {
                success: false,
                error: error.message,
                message: message
            };
        }
    }

    /**
     * ログアウト処理 (Firebase版)
     */
    logout() {
        if (this.currentUser) {
            console.log(`🚪 User logged out: ${this.currentUser.name}`);
        }
        this.auth.signOut().then(() => {
            if (typeof window !== 'undefined') {
                window.location.replace('/');
            }
        });
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
     * 安全なユーザーデータ取得
     * @returns {Object|null} 安全なユーザー情報
     */
    getSafeUserData() {
        if (!this.currentUser) return null;
        const { password, ...safeData } = this.currentUser;
        return safeData;
    }

    /**
     * 権限チェック
     * @param {string} requiredPermission - 確認する権限
     * @returns {boolean} 権限があるかどうか
     */
    hasPermission(requiredPermission) {
        if (!this.userRole) return false;
        const userPermissions = this.permissions[this.userRole] || [];
        return userPermissions.includes(requiredPermission);
    }

    /**
     * ユーザーロール確認
     * @param {string} role - 確認するロール
     * @returns {boolean} 指定ロールかどうか
     */
    hasRole(role) {
        return this.userRole === role;
    }
}

// グローバルインスタンス作成
const authManager = new AuthManager();

// グローバルに公開
if (typeof window !== 'undefined') {
    window.authManager = authManager;
    window.logout = () => authManager.logout();
}

console.log('🔐 auth.js loaded - Authentication system ready (Firebase Mode)');
