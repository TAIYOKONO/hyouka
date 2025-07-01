/**
 * API通信クライアント (Firebase Firestore連携版)
 * バックエンドAPIとの通信とモックデータの管理
 */
class ApiClient {
    constructor() {
        // ★ Firestoreのデータベースインスタンスを取得
        this.db = firebase.firestore();
        console.log(`API Client initialized - Using Firestore`);
    }

    /**
     * ★ Firestoreからユーザー一覧を取得する
     * @returns {Promise<Array>} ユーザーの配列
     */
    async getUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            const users = snapshot.docs.map(doc => ({
                id: doc.id, // ドキュメントIDをオブジェクトのIDとして使用
                ...doc.data()
            }));
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    }

    /**
     * ★ Firestoreから評価一覧を取得する
     * @returns {Promise<Array>} 評価の配列
     */
    async getEvaluations() {
        try {
            const snapshot = await this.db.collection('evaluations').orderBy('updatedAt', 'desc').get();
            const evaluations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return evaluations;
        } catch (error) {
            console.error("Error fetching evaluations:", error);
            throw error;
        }
    }
    
    /**
     * ★ Firestoreに新しい評価を作成する
     * @param {Object} evaluationData - 作成する評価データ
     * @returns {Promise<Object>} 作成された評価データ
     */
    async createEvaluation(evaluationData) {
        try {
            // タイムスタンプを追加
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

    /**
     * ★ Firestoreの評価を更新する
     * @param {string} id - 更新する評価のドキュメントID
     * @param {Object} evaluationData - 更新データ
     * @returns {Promise<void>}
     */
    async updateEvaluation(id, evaluationData) {
        try {
            const dataWithTimestamp = {
                ...evaluationData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await this.db.collection('evaluations').doc(id).update(dataWithTimestamp);
        } catch (error) {
            console.error("Error updating evaluation:", error);
            throw error;
        }
    }

    /**
     * ★ Firestoreから評価カテゴリを取得する
     * フェーズ4の「目標・ウエイト設定」で実装します
     */
    async getEvaluationCategories() {
        // 現時点では、以前のモックデータを返す形にしておきます
        console.warn("getEvaluationCategories is using mock data. This will be updated in Phase 4.");
        return [
            { id: 'safety', name: '安全性' },
            { id: 'quality', name: '品質' },
            { id: 'efficiency', name: '効率性' },
            { id: 'teamwork', name: 'チームワーク' },
            { id: 'communication', name: 'コミュニケーション' },
        ];
    }
    
    // 他にも必要なAPIメソッドがあればここに追加していきます
}

// グローバルインスタンスを作成
window.api = new ApiClient();
