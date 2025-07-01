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

    // ★★★ ここから評価項目管理の関数を追加 ★★★

    /**
     * Firestoreから評価項目一覧を取得する
     * @returns {Promise<Array>} 評価項目の配列
     */
    async getEvaluationItems() {
        try {
            const snapshot = await this.db.collection('evaluationItems').orderBy('order', 'asc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching evaluation items:", error);
            throw error;
        }
    }

    /**
     * Firestoreに新しい評価項目を作成する
     * @param {Object} itemData - { name: string, description: string, weight: number, order: number }
     */
    async createEvaluationItem(itemData) {
        try {
            await this.db.collection('evaluationItems').add(itemData);
        } catch (error) {
            console.error("Error creating evaluation item:", error);
            throw error;
        }
    }

    /**
     * Firestoreの評価項目を更新する
     * @param {string} id - ドキュメントID
     * @param {Object} itemData - 更新データ
     */
    async updateEvaluationItem(id, itemData) {
        try {
            await this.db.collection('evaluationItems').doc(id).update(itemData);
        } catch (error) {
            console.error("Error updating evaluation item:", error);
            throw error;
        }
    }

    /**
     * Firestoreから評価項目を削除する
     * @param {string} id - ドキュメントID
     */
    async deleteEvaluationItem(id) {
        try {
            await this.db.collection('evaluationItems').doc(id).delete();
        } catch (error) {
            console.error("Error deleting evaluation item:", error);
            throw error;
        }
    }

    // ★★★ ここまで追加 ★★★


    /**
     * getEvaluationCategoriesはgetEvaluationItemsに置き換えるため、
     * getEvaluationItemsを呼び出すように変更します。
     */
    async getEvaluationCategories() {
        console.log("Redirecting getEvaluationCategories to getEvaluationItems.");
        return this.getEvaluationItems();
    }
}

window.api = new ApiClient();
