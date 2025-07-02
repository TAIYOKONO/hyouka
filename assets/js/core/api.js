/**
 * API通信クライアント (通知機能対応版)
 */
class ApiClient {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // statusが'active'のユーザーのみ取得するように変更
    async getUsers() {
        try {
            const snapshot = await this.db.collection('users').where('status', '==', 'active').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    }
    
    async getPendingUsers() {
        try {
            const snapshot = await this.db.collection('users').where('status', '==', 'pending_approval').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching pending users:", error);
            throw error;
        }
    }

    async approveUser(userId, approvedUserRole) {
        await this.db.collection('users').doc(userId).update({ status: 'active' });

        let recipients = [];
        if (approvedUserRole === 'worker') {
            const evaluators = await this.db.collection('users').where('role', 'in', ['evaluator', 'admin']).get();
            recipients = evaluators.docs.map(doc => doc.id);
        } else if (approvedUserRole === 'evaluator') {
            const admins = await this.db.collection('users').where('role', '==', 'admin').get();
            recipients = admins.docs.map(doc => doc.id);
        }
        
        const notificationPromises = recipients.map(recipientUid => {
            return this.db.collection('user_notifications').add({
                recipientUid: recipientUid,
                message: `新しいユーザー（役割: ${approvedUserRole}）が承認されました。`,
                type: 'user_approved',
                isRead: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await Promise.all(notificationPromises);
    }

    async getNotificationsForUser(userId) {
        try {
            const snapshot = await this.db.collection('user_notifications')
                .where('recipientUid', '==', userId)
                .where('isRead', '==', false)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching notifications:", error);
            throw error;
        }
    }
    
    // --- 評価関連の関数 ---
    async getEvaluations() {
        try {
            const snapshot = await this.db.collection('evaluations').orderBy('updatedAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch(error) {
            console.error("Error fetching evaluations:", error);
            throw error;
        }
    }

    async createEvaluation(evaluationData) {
        const dataWithTimestamp = { ...evaluationData, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        const docRef = await this.db.collection('evaluations').add(dataWithTimestamp);
        return { id: docRef.id, ...dataWithTimestamp };
    }

    async getEvaluationById(id) {
        const doc = await this.db.collection('evaluations').doc(id).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    }

    // --- 評価項目関連の関数 ---
    async getEvaluationItems() {
        const snapshot = await this.db.collection('evaluationItems').orderBy('order', 'asc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // dashboard.jsが呼び出す古い名前の関数
    // 実態は新しいgetEvaluationItemsを呼び出す
    async getEvaluationCategories() {
        return this.getEvaluationItems();
    }
}
// ApiClientクラスの外で、他のファイルから呼び出される可能性のある関数を定義
// これらはApiClientのインスタンス`api`を通じて呼び出される
window.api = new ApiClient();
