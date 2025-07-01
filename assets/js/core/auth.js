/**
 * auth.js - 建設業評価システム認証管理
 * ログイン・ログアウト・権限管理 (Firebase連携版)
 */

class AuthManager {
    constructor() {
        // ★ Firebaseのインスタンスを保持
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        
        this.currentUser = null;
        this.userRole = null; // ★ 権限ロールを保持
        
        // ★ このpermissionsはフェーズ3でFirestoreから動的に取得するように変更予定
        this.permissions = {
            admin: ['view_all', 'create', 'edit', 'delete', 'manage_users', 'view_analytics', 'manage_settings'],
            evaluator: ['view_team', 'create', 'edit'],
            worker: ['view_own']
        };
    }

    /**
     * ★ 認証状態の監視を初期化
     * onAuthStateChangedは認証状態（ログイン、ログアウト）が変わるたびに呼び出される
     * @param {Function} onAuthStateChangedCallback - 状態変更をapp.jsに通知するコールバック
     */
    init(onAuthStateChangedCallback) {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                // ユーザーがログインしている場合、Firestoreから詳細情報を取得
                const userDoc = await this.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    this.currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                    this.userRole = this.currentUser.role;
                } else {
                    // Firestoreにユーザーデータがない場合（本来はエラーだが、フォールバック）
                    console.warn(`User data not found in Firestore for UID: ${user.uid}. Logging out.`);
                    this.logout(); // データ不整合なのでログアウトさせる
                    return;
                }
            } else {
                // ユーザーがログアウトしている場合
                this.currentUser = null;
                this.userRole = null;
            }
            
            console.log('Auth state changed. Current user:', this.currentUser);
            // アプリ本体に状態の変更を通知
            if (typeof onAuthStateChangedCallback === 'function') {
                onAuthStateChangedCallback(this.currentUser);
            }
        });
        console.log('🔐 Auth Manager initialized and listening for auth state changes.');
    }

    /**
     * ★ ログイン処理 (Firebase版)
     * @param {string} email - メールアドレス
     * @param {string} password - パスワード
     * @returns {Promise<Object>} ログイン結果
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                throw new Error('メールアドレスとパスワードは必須です');
            }
            
            // Firebase Authenticationでログイン
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            // ログイン成功後、onAuthStateChangedが自動で発火し、currentUserが設定されるのを待つ
            // ここでは成功したことだけを返す
            return {
                success: true,
                message: `ようこそ！` // メッセージはonAuthStateChanged後にapp側で表示
            };
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            let message = 'ログインに失敗しました。';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
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
     * ★ ログアウト処理 (Firebase版)
     */
    logout() {
        if (this.currentUser) {
            console.log(`🚪 User logged out: ${this.currentUser.name}`);
        }
        this.auth.signOut().then(() => {
            // onAuthStateChangedが自動的に発火し、各種状態がリセットされる
            // UIの更新はapp.js側でハンドリングする
            if (typeof window !== 'undefined') {
                // ログインページにリダイレクトするためにリロード
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
     * 安全なユーザーデータ取得（パスワードなどは含まれない）
     * @returns {Object|null} 安全なユーザー情報
     */
    getSafeUserData() {
        if (!this.currentUser) return null;
        const { password, ...safeData } = this.currentUser; // 元々passwordは無いが念の為
        return safeData;
    }

    /**
     * ★ 権限チェック (ロールベースに変更)
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

// ★ handleLoginはapp.jsに移動するため、ここではヘルパーは定義しない

// グローバルに公開
if (typeof window !== 'undefined') {
    window.authManager = authManager;
    // logout関数をグローバルに公開して、UIから直接呼べるようにする
    window.logout = () => authManager.logout();
}

console.log('🔐 auth.js loaded - Authentication system ready (Firebase Mode)');
