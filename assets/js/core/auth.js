/**
 * auth.js - 建設業評価システム認証管理 (最終版)
 */
class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.userRole = null;
        this.permissions = {
            admin: ['view_dashboard', 'view_all_evaluations', 'create_evaluation', 'manage_users', 'manage_settings'],
            evaluator: ['view_dashboard', 'view_subordinate_evaluations', 'create_evaluation'],
            worker: ['view_dashboard', 'view_own_evaluations']
        };
    }

    init(onAuthStateChangedCallback) {
        this.auth.onAuthStateChanged(async (user) => {
            const wasAuthenticated = this.isAuthenticated();

            if (user) {
                const userDoc = await this.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    this.currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                    this.userRole = this.currentUser.role;
                } else {
                    this.logout();
                    return;
                }
            } else {
                this.currentUser = null;
                this.userRole = null;
            }

            // ★★★ ここからページ遷移のロジックを追加 ★★★
            // 状態が「未ログイン」→「ログイン」に変わった瞬間
            if (!wasAuthenticated && this.isAuthenticated()) {
                if(window.router) router.navigate('/dashboard');
            }
            // ★★★ ここまで追加 ★★★

            if (typeof onAuthStateChangedCallback === 'function') {
                onAuthStateChangedCallback(this.currentUser);
            }
        });
    }

    async login(email, password) {
        try {
            if (!email || !password) throw new Error('メールアドレスとパスワードは必須です');
            await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, message: `ようこそ！` };
        } catch (error) {
            console.error('❌ Login failed:', error);
            let message = 'ログインに失敗しました。';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'メールアドレスまたはパスワードが間違っています。';
            }
            return { success: false, error: error.message, message: message };
        }
    }

    logout() {
        this.auth.signOut().then(() => {
            if(window.router) {
                router.navigate('/');
            } else {
                window.location.replace('/');
            }
        });
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasPermission(requiredPermission) {
        if (!this.userRole) return false;
        return (this.permissions[this.userRole] || []).includes(requiredPermission);
    }
}

const authManager = new AuthManager();
if (typeof window !== 'undefined') {
    window.authManager = authManager;
    window.logout = () => authManager.logout();
}
