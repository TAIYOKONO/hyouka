// api.js の全コード（個人目標設定メソッド追加版）
/**
 * API通信クライアント (最終版)
 */
class ApiClient {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

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
            name: adminData.name, email: adminData.email, company: adminData.company,
            role: 'admin', status: 'developer_approval_pending',
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
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(userData.email, userData.password);
            await this.db.collection('users').doc(userCredential.user.uid).set({
                name: userData.name, email: userData.email, role: userData.role,
                department: userData.department, position: userData.position, employeeId: userData.employeeId,
                status: 'pending_approval', createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                tenantId: tenantId,
            });
            await invitationRef.update({ used: true, usedBy: userCredential.user.uid });
        } finally {
            await this.auth.signOut();
        }
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
        const dataToSave = { 
            ...evaluationData,
            tenantId: tenantId,
            submittedById: currentUser.uid, 
            submittedByName: currentUser.name,
            status: 'self_assessed',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await this.db.collection('evaluations').add(dataToSave);
        return { id: docRef.id, ...dataToSave };
    }

    async getEvaluationById(id) {
        const tenantId = this._getTenantId();
        const doc = await this.db.collection('evaluations').doc(id).get();
        if (!doc.exists || doc.data().tenantId !== tenantId) {
            throw new Error("評価データが見つからないか、アクセス権がありません。");
        }
        return { id: doc.id, ...doc.data() };
    }
    
    async updateEvaluationStatus(evaluationId, status) {
        const tenantId = this._getTenantId();
        const docRef = this.db.collection('evaluations').doc(evaluationId);
        const doc = await docRef.get();
        if (!doc.exists || doc.data().tenantId !== tenantId) {
            throw new Error("対象の評価が見つからないか、権限がありません。");
        }
        await docRef.update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async getPastEvaluationsForUser(subordinateId) {
        const tenantId = this._getTenantId();
        if (!tenantId || !subordinateId) return [];
        const snapshot = await this.db.collection('evaluations')
            .where('tenantId', '==', tenantId)
            .where('subordinateId', '==', subordinateId)
            .where('status', '==', 'completed')
            .orderBy('updatedAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    // ▼▼▼ ここから追加 ▼▼▼
    async getQualitativeGoals(userId, period) {
        const tenantId = this._getTenantId();
        if (!tenantId || !userId || !period) return null;
    
        const snapshot = await this.db.collection('qualitativeGoals')
            .where('tenantId', '==', tenantId)
            .where('userId', '==', userId)
            .where('period', '==', period)
            .limit(1)
            .get();
    
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    
    async saveQualitativeGoals(goalData) {
        const tenantId = this._getTenantId();
        const currentUser = window.authManager.getCurrentUser();
        if (!tenantId || !currentUser) throw new Error("ユーザー情報が取得できません。");
    
        const dataToSave = {
            ...goalData,
            tenantId: tenantId,
            userId: currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (goalData.id) {
            await this.db.collection('qualitativeGoals').doc(goalData.id).set(dataToSave, { merge: true });
            return goalData.id;
        } else {
            dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await this.db.collection('qualitativeGoals').add(dataToSave);
            return docRef.id;
        }
    }
    // ▲▲▲ 追加ここまで ▲▲▲
}
window.api = new ApiClient();
