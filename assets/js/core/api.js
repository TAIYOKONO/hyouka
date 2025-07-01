/**
 * API通信クライアント (通知機能対応版)
 */
class ApiClient {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    async getUsers() {
        const snapshot = await this.db.collection('users').where('status', '==', 'active').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    async getPendingUsers() {
        const snapshot = await this.db.collection('users').where('status', '==', 'pending_approval').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async approveUser(userId, approvedUserRole) {
        // ユーザーのステータスを有効にする
        await this.db.collection('users').doc(userId).update({ status: 'active' });

        // 通知を作成する
        let recipients = [];
        if (approvedUserRole === 'worker') {
            // 作業員が承認されたら、全ての評価者と管理者に通知
            const evaluators = await this.db.collection('users').where('role', 'in', ['evaluator', 'admin']).get();
            recipients = evaluators.docs.map(doc => doc.id);
        } else if (approvedUserRole === 'evaluator') {
            // 評価者が承認されたら、全ての管理者に通知
            const admins = await this.db.collection('users').where('role', '==', 'admin').get();
            recipients = admins.docs.map(doc => doc.id);
        }
        
        // 各受信者に対して通知ドキュメントを作成
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

    // --- 通知取得 ---
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
            return []; // エラーの場合は空配列を返す
        }
    }

    // --- 他の関数（変更なし） ---
    async createInvitation(invitationData) { /* ... */ }
    async getInvitationByToken(token) { /* ... */ }
    async createUserWithPendingApproval(userData) { /* ... */ }
    async getEvaluations() { /* ... */ }
    async createEvaluation(evaluationData) { /* ... */ }
    async getEvaluationById(id) { /* ... */ }
    async getEvaluationItems() { /* ... */ }
    async createEvaluationItem(itemData) { /* ... */ }
    async deleteEvaluationItem(id) { /* ... */ }
}
// クラス定義の外で、既存の関数を再定義
ApiClient.prototype.createInvitation = async function(invitationData) { const docRef = await this.db.collection('invitations').add({ ...invitationData, createdAt: firebase.firestore.FieldValue.serverTimestamp(), used: false }); return docRef.id; };
ApiClient.prototype.getInvitationByToken = async function(token) { const doc = await this.db.collection('invitations').doc(token).get(); return doc.exists ? { id: doc.id, ...doc.data() } : null; };
ApiClient.prototype.createUserWithPendingApproval = async function(userData) { const invitationRef = this.db.collection('invitations').doc(userData.token); const invitationDoc = await invitationRef.get(); if (!invitationDoc.exists || invitationDoc.data().used) { throw new Error("無効な招待です。"); } const userCredential = await this.auth.createUserWithEmailAndPassword(userData.email, userData.password); await this.db.collection('users').doc(userCredential.user.uid).set({ name: userData.name, email: userData.email, role: userData.role, status: 'pending_approval', createdAt: firebase.firestore.FieldValue.serverTimestamp(), }); await invitationRef.update({ used: true, usedBy: userCredential.user.uid }); await this.auth.signOut(); };
ApiClient.prototype.getEvaluations = async function() { const snapshot = await this.db.collection('evaluations').orderBy('updatedAt', 'desc').get(); return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); };
ApiClient.prototype.createEvaluation = async function(evaluationData) { const dataWithTimestamp = { ...evaluationData, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }; const docRef = await this.db.collection('evaluations').add(dataWithTimestamp); return { id: docRef.id, ...dataWithTimestamp }; };
ApiClient.prototype.getEvaluationById = async function(id) { const doc = await this.db.collection('evaluations').doc(id).get(); if (doc.exists) { return { id: doc.id, ...doc.data() }; } return null; };
ApiClient.prototype.getEvaluationItems = async function() { const snapshot = await this.db.collection('evaluationItems').orderBy('order', 'asc').get(); return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); };
ApiClient.prototype.createEvaluationItem = async function(itemData) { await this.db.collection('evaluationItems').add(itemData); };
ApiClient.prototype.deleteEvaluationItem = async function(id) { await this.db.collection('evaluationItems').doc(id).delete(); };

window.api = new ApiClient();
