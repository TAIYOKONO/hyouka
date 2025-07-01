/**
 * API通信クライアント (Firebase Firestore連携版)
 */
class ApiClient {
    constructor() {
        this.db = firebase.firestore();
        console.log(`API Client initialized - Using Firestore`);
    }

    async getUsers() {
        try {
            const snapshot = await this.db.collection('users').where('status', '==', 'active').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    }

    async getEvaluations() {
        try {
            const snapshot = await this.db.collection('evaluations').orderBy('updatedAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error)
        {
            console.error("Error fetching evaluations:", error);
            throw error;
        }
    }
    
    async createEvaluation(evaluationData) {
        try {
            const dataWithTimestamp = {
                ...evaluationData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            const docRef = await this.db.collection('evaluations').add(dataWithTimestamp);
            return { id: docRef.id, ...dataWithTimestamp };
        } catch (error) {
            console.error("Error creating evaluation:", error);
            throw error;
        }
    }

    async getEvaluationItems() {
        try {
            const snapshot = await this.db.collection('evaluationItems').orderBy('order', 'asc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching evaluation items:", error);
            throw error;
        }
    }

    async createEvaluationItem(itemData) {
        try {
            await this.db.collection('evaluationItems').add(itemData);
        } catch (error) {
            console.error("Error creating evaluation item:", error);
            throw error;
        }
    }

    async deleteEvaluationItem(id) {
        try {
            await this.db.collection('evaluationItems').doc(id).delete();
        } catch (error) {
            console.error("Error deleting evaluation item:", error);
            throw error;
        }
    }

    /**
     * 招待データを作成する
     * @param {{role: string}} invitationData - 招待する役割
     * @returns {Promise<string>} 招待ID
     */
    async createInvitation(invitationData) {
        try {
            const docRef = await this.db.collection('invitations').add({
                ...invitationData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                used: false,
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating invitation:", error);
            throw error;
        }
    }

    /**
     * 承認待ちのユーザー一覧を取得する
     * @returns {Promise<Array>} 承認待ちユーザーの配列
     */
    async getPendingUsers() {
        try {
            const snapshot = await this.db.collection('users').where('status', '==', 'pending_approval').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching pending users:", error);
            throw error;
        }
    }

    /**
     * ユーザーを承認する
     * @param {string} userId - 承認するユーザーのID
     */
    async approveUser(userId) {
        try {
            await this.db.collection('users').doc(userId).update({
                status: 'active'
            });
        } catch (error) {
            console.error("Error approving user:", error);
            throw error;
        }
    }
}

window.api = new ApiClient();
