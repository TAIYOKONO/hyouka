// api.js の全コード（createEvaluation修正版）
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
        const currentUser = window.authManager.getCurrentUser();
        if (!tenantId || !currentUser) throw new Error("テナント情報またはユーザー情報が取得できません。");

        const dataWithTimestamp = { 
            ...evaluationData,
            tenantId: tenantId,
            evaluatorId: currentUser.uid,
            evaluatorName: currentUser.name,
            status: 'submitted', // ステータスを「提出済」に
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
    
    async deleteTargetJobType(jobTypeId) {
        const tenantId = this._getTenantId();
        if (!tenantId) throw new Error("テナント情報が取得できません。");
        const docRef = this.db.collection('targetJobTypes').doc(jobTypeId);
        const doc = await docRef.get();
        if (!doc.exists || doc.data().tenantId !== tenantId) {
            throw new Error("削除するドキュメントが見つからないか、権限がありません。");
        }
        await docRef.delete();
    }

    async getEvaluationStructure(jobTypeId) {
        const tenantId = this._getTenantId();
        if (!tenantId || !jobTypeId) return null;
        const snapshot = await this.db.collection('evaluationStructures')
            .where('tenantId', '==', tenantId)
            .where('jobTypeId', '==', jobTypeId)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    async saveEvaluationStructure(structureId, structureData) {
        const tenantId = this._getTenantId();
        if (!tenantId) throw new Error("テナント情報が取得できません。");
        const dataToSave = { ...structureData, tenantId: tenantId };
        if (structureId) {
            await this.db.collection('evaluationStructures').doc(structureId).set(dataToSave, { merge: true });
            return structureId;
        } else {
            const docRef = await this.db.collection('evaluationStructures').add(dataToSave);
            return docRef.id;
        }
    }
}
window.api = new ApiClient();
