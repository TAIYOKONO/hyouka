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
            const snapshot = await this.db.collection('users').get();
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
        } catch (error) {
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

    async getEvaluationCategories() {
        console.warn("getEvaluationCategories is using mock data. This will be updated in Phase 4.");
        return [
            { id: 'safety', name: '安全性' },
            { id: 'quality', name: '品質' },
            { id: 'efficiency', name: '効率性' },
            { id: 'teamwork', name: 'チームワーク' },
            { id: 'communication', name: 'コミュニケーション' },
        ];
    }
}

window.api = new ApiClient();
