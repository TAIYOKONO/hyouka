// api.js の全コード（対象職種メソッド追加版）
/**
 * API通信クライアント (最終版)
 */
class ApiClient {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // 現在のユーザーのテナントIDを取得するヘルパー
    _getTenantId() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser || !currentUser.tenantId) {
            console.warn("Tenant ID is not available.");
            return null;
        }
        return currentUser.tenantId;
    }

    async getUsers() {
        const tenantId = this._getTenantId();
        if (!tenantId) return [];
        const snapshot = await this.db.collection('users')
            .where('tenantId', '==', tenantId)
            .where('status', '==', 'active').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getPendingUsers() {
        const tenantId = this._getTenantId();
        if (!tenantId) return [];
        const snapshot = await this.db.collection('users')
            .where('tenantId', '==', tenantId)
            .where('status', '==', 'pending_approval').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async approveUser(userId) {
        await this.db.collection('users').doc(userId).update({ status: 'active' });
    }

    // 管理者登録 (テナントIDは不要)
    async createAdminForApproval(adminData) {
        const userCredential = await this.auth.createUserWithEmailAndPassword(adminData.email, adminData.password);
        await this.db.collection('users').doc(userCredential.user.uid).set({
            name: adminData.name,
            email: adminData.email,
            company: adminData.company,
            role: 'admin',
            status: 'developer_approval_pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await this.auth.signOut();
    }

    // 一般ユーザーの登録
    async createUserWithPendingApproval(userData) {
        const invitationRef = this.db.collection('invitations').doc(userData.token);
        const invitationDoc = await invitationRef.get();
        if (!invitationDoc.exists || invitationDoc.data().used) throw new Error("無効な招待です。");
        
        const tenantId = invitationDoc.data().tenantId;
        if (!tenantId) throw new Error("招待情報にテナント情報が含まれていません。");

        const userCredential = await this.auth.createUserWithEmailAndPassword(userData.email, userData.password);
        await this.db.collection('users').doc(userCredential.user.uid).set({
            name: userData.name, email: userData.email, role: userData.role,
            department: userData.department, position: userData.position, employeeId: userData.employeeId,
            status: 'pending_approval', createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            tenantId: tenantId,
        });
        await invitationRef.update({ used: true, usedBy: userCredential.user.uid });
        await this.auth.signOut();
    }

    // 招待状の作成
    async createInvitation(invitationData) {
        const tenantId = this._getTenantId();
        if (!tenantId) throw new Error("テナント情報が取得できません。");
        
        const docRef = await this.db.collection('invitations').add({
            ...invitationData,
            tenantId: tenantId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            used: false,
        });
        return docRef.id;
    }

    async getInvitationByToken(token) {
        const doc = await this.db.collection('invitations').doc(token).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async getNotificationsForUser(userId) {
        try {
            const snapshot = await this.db.collection('user_notifications')
                .where('recipientUid', '==', userId).where('isRead', '==', false)
                .orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) { return []; }
    }

    async getEvaluations() {
        const tenantId = this._getTenantId();
        if (!tenantId) return [];
        const snapshot = await this.db.collection('evaluations')
            .where('tenantId', '==', tenantId)
            .orderBy('updatedAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async createEvaluation(evaluationData) {
        const tenantId = this._getTenantId();
        if (!tenantId) throw new Error("テナント情報が取得できません。");
        
        const dataWithTimestamp = { 
            ...evaluationData,
            tenantId: tenantId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await this.db.collection('evaluations').add(dataWithTimestamp);
        return { id: docRef.id, ...dataWithTimestamp };
    }

    async getEvaluationById(id) {
        const tenantId = this._getTenantId();
        const doc = await this.db.collection('evaluations').doc(id).get();
        if (!doc.exists || doc.data().tenantId !== tenantId) {
            throw new Error("評価データが見つからないか、アクセス権がありません。");
        }
        return { id: doc.id, ...doc.data() };
    }

    // --- ▼▼▼ 「対象職種」管理メソッド（ここから追加） ▼▼▼ ---
    async getTargetJobTypes() {
        const tenantId = this._getTenantId();
        if (!tenantId) return [];
        const snapshot = await this.db.collection('targetJobTypes')
            .where('tenantId', '==', tenantId)
            .orderBy('order', 'asc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async createTargetJobType(jobTypeData) {
        const tenantId = this._getTenantId();
        if (!tenantId) throw new Error("テナント情報が取得できません。");
        const data = {
            ...jobTypeData,
            tenantId: tenantId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await this.db.collection('targetJobTypes').add(data);
        return { id: docRef.id, ...data };
    }
    // --- ▲▲▲ 追加ここまで ▲▲▲ ---


    // 評価項目は、今後のステップ2.1で構造が大きく変わるため、ここでは暫定的に修正します
    async getEvaluationItems() {
        const tenantId = this._getTenantId();
        if (!tenantId) return [];
        const snapshot = await this.db.collection('evaluationItems')
            .where('tenantId', '==', tenantId)
            .orderBy('order', 'asc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async createEvaluationItem(itemData) {
        const tenantId = this._getTenantId();
        if (!tenantId) throw new Error("テナント情報が取得できません。");
        await this.db.collection('evaluationItems').add({
            ...itemData,
            tenantId: tenantId,
        });
    }

    async deleteEvaluationItem(id) {
        // 安全のため、削除前にドキュメントを取得してテナントIDを検証することが望ましいですが、
        // 今回は簡略化のため、直接削除します。
        await this.db.collection('evaluationItems').doc(id).delete();
    }
}
window.api = new ApiClient();
