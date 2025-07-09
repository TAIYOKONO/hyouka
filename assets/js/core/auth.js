/**
 * auth.js - 認証管理 (最終確定版)
 */
class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
    }

    init(onStateChangeCallback) {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await this.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    this.currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                } else {
                    await this.auth.signOut(); // データなければログアウト
                    this.currentUser = null;
                }
            } else {
                this.currentUser = null;
            }
            // 認証状態の変更をapp.jsに通知する
            if (typeof onStateChangeCallback === 'function') {
                onStateChangeCallback(this.currentUser);
            }
        });
    }

    async login(email, password) {
        try {
            await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, message: 'メールアドレスまたはパスワードが間違っています。' };
        }
    }

    logout() {
        this.auth.signOut();
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
    
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.role) return false;
        const permissions = {
            admin: ['manage_users', 'manage_settings', 'create_evaluation'],
            evaluator: ['create_evaluation']
        };
        return (permissions[this.currentUser.role] || []).includes(permission);
    }
}

window.authManager = new AuthManager();
