/**
 * API通信クライアント (ユーザー追加機能対応版)
 */
class ApiClient {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // statusが'active'のユーザーのみ取得するように変更
    async getUsers() {
        const snapshot = await this.db.collection('users').where('status', '==', 'active').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // --- 招待・承認関連の関数 ---
    async createInvitation(invitationData) {
        const docRef = await this.db.collection('invitations').add({
            ...invitationData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            used: false,
        });
        return docRef.id;
    }

    async getInvitationByToken(token) {
        const doc = await this.db.collection('invitations').doc(token).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    
    async getPendingUsers() {
        const snapshot = await this.db.collection('users').where('status', '==', 'pending_approval').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async approveUser(userId) {
        await this.db.collection('users').doc(userId).update({ status: 'active' });
    }

    // --- 新規ユーザー登録処理 ---
    async createUserWithPendingApproval(userData) {
        const invitationRef = this.db.collection('invitations').doc(userData.token);
        const invitationDoc = await invitationRef.get();
        if (!invitationDoc.exists || invitationDoc.data().used) {
            throw new Error("無効な招待です。");
        }

        const userCredential = await this.auth.createUserWithEmailAndPassword(userData.email, userData.password);
        
        await this.db.collection('users').doc(userCredential.user.uid).set({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: 'pending_approval',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        await invitationRef.update({ used: true, usedBy: userCredential.user.uid });
        await this.auth.signOut();
    }

    // --- 評価関連の関数 ---
    async getEvaluations() {
        const snapshot = await this.db.collection('evaluations').orderBy('updatedAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    async createEvaluationItem(itemData) {
        await this.db.collection('evaluationItems').add(itemData);
    }
    async deleteEvaluationItem(id) {
        await this.db.collection('evaluationItems').doc(id).delete();
    }

    // ★ dashboard.jsが呼び出す関数
    async getEvaluationCategories() {
        return this.getEvaluationItems();
    }
}
window.api = new ApiClient();
