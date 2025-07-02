/**
 * API通信クライアント (最終版)
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
            return [];
        }
    }

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
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
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
}
window.api = new ApiClient();
