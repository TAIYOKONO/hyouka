/**
 * API通信クライアント
 * バックエンドAPIとの通信とモックデータの管理
 */
class ApiClient {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.useRealAPI = this.shouldUseRealAPI();
        this.mockData = window.mockData || {};
        
        console.log(`API Client initialized - Using ${this.useRealAPI ? 'real' : 'mock'} API`);
    }

    getBaseURL() {
        // 環境に応じてAPIエンドポイントを決定
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        } else if (hostname.includes('staging')) {
            return 'https://api-staging.example.com';
        } else {
            return 'https://api.example.com';
        }
    }

    shouldUseRealAPI() {
        // 本番APIを使用するかの判定
        return window.location.search.includes('api=real') ||
               (window.location.hostname !== 'localhost' && 
                window.location.hostname !== '127.0.0.1' && 
                window.location.hostname !== '');
    }

    async request(endpoint, options = {}) {
        if (!this.useRealAPI) {
            return this.mockRequest(endpoint, options);
        }

        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            // 認証トークンの追加
            const token = window.auth?.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            
            // 認証エラーの場合はログアウト
            if (error.message.includes('401') || error.message.includes('403')) {
                window.auth?.logout();
            }
            
            throw error;
        }
    }

    async mockRequest(endpoint, options = {}) {
        // モックAPIのシミュレーション
        await this.delay(100, 500); // ネットワーク遅延をシミュレート

        const method = options.method || 'GET';
        const data = options.body ? JSON.parse(options.body) : null;

        console.log(`Mock API: ${method} ${endpoint}`, data);

        // エンドポイントに応じてモックレスポンスを返す
        return this.handleMockEndpoint(endpoint, method, data);
    }

    handleMockEndpoint(endpoint, method, data) {
        // 認証関連
        if (endpoint === '/auth/login') {
            return this.mockLogin(data);
        }

        // 評価関連
        if (endpoint === '/evaluations') {
            if (method === 'GET') return this.mockData.evaluations || [];
            if (method === 'POST') return this.mockCreateEvaluation(data);
        }

        if (endpoint.startsWith('/evaluations/')) {
            const id = endpoint.split('/')[2];
            if (method === 'GET') return this.mockGetEvaluation(id);
            if (method === 'PUT') return this.mockUpdateEvaluation(id, data);
            if (method === 'DELETE') return this.mockDeleteEvaluation(id);
        }

        // ユーザー関連
        if (endpoint === '/users') {
            if (method === 'GET') return this.mockData.users || [];
            if (method === 'POST') return this.mockCreateUser(data);
        }

        if (endpoint.startsWith('/users/')) {
            const id = endpoint.split('/')[2];
            if (method === 'GET') return this.mockGetUser(id);
            if (method === 'PUT') return this.mockUpdateUser(id, data);
            if (method === 'DELETE') return this.mockDeleteUser(id);
        }

        // 評価対象者関連
        if (endpoint === '/subordinates') {
            return this.mockData.subordinates || [];
        }

        // 評価期間関連
        if (endpoint === '/periods') {
            return this.mockData.evaluationPeriods || [];
        }

        // 評価カテゴリ関連
        if (endpoint === '/evaluation-categories') {
            return this.mockData.evaluationCategories || [];
        }

        // デフォルトレスポンス
        throw new Error(`Mock endpoint not implemented: ${endpoint}`);
    }

    mockLogin(credentials) {
        // 認証はAuthManagerで処理されるので、ここでは成功レスポンスを返す
        return {
            success: true,
            user: credentials.user || { id: 'demo', name: 'Demo User' },
            token: 'demo-token'
        };
    }

    mockCreateEvaluation(data) {
        const newEvaluation = {
            id: this.generateId(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: data.status || 'draft'
        };

        if (!this.mockData.evaluations) {
            this.mockData.evaluations = [];
        }
        this.mockData.evaluations.push(newEvaluation);

        return newEvaluation;
    }

    mockGetEvaluation(id) {
        const evaluation = this.mockData.evaluations?.find(e => e.id === id);
        if (!evaluation) {
            throw new Error('Evaluation not found');
        }
        return evaluation;
    }

    mockUpdateEvaluation(id, data) {
        const index = this.mockData.evaluations?.findIndex(e => e.id === id);
        if (index === -1) {
            throw new Error('Evaluation not found');
        }

        this.mockData.evaluations[index] = {
            ...this.mockData.evaluations[index],
            ...data,
            updatedAt: new Date().toISOString()
        };

        return this.mockData.evaluations[index];
    }

    mockDeleteEvaluation(id) {
        const index = this.mockData.evaluations?.findIndex(e => e.id === id);
        if (index === -1) {
            throw new Error('Evaluation not found');
        }

        this.mockData.evaluations.splice(index, 1);
        return { success: true };
    }

    mockCreateUser(data) {
        const newUser = {
            id: this.generateId(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!this.mockData.users) {
            this.mockData.users = [];
        }
        this.mockData.users.push(newUser);

        return newUser;
    }

    mockGetUser(id) {
        const user = this.mockData.users?.find(u => u.id === id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    mockUpdateUser(id, data) {
        const index = this.mockData.users?.findIndex(u => u.id === id);
        if (index === -1) {
            throw new Error('User not found');
        }

        this.mockData.users[index] = {
            ...this.mockData.users[index],
            ...data,
            updatedAt: new Date().toISOString()
        };

        return this.mockData.users[index];
    }

    mockDeleteUser(id) {
        const index = this.mockData.users?.findIndex(u => u.id === id);
        if (index === -1) {
            throw new Error('User not found');
        }

        this.mockData.users.splice(index, 1);
        return { success: true };
    }

    // 公開メソッド群

    // 認証
    async authenticate(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async changePassword(data) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // 評価関連
    async getEvaluations(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = queryString ? `/evaluations?${queryString}` : '/evaluations';
        return this.request(endpoint);
    }

    async getEvaluationById(id) {
        return this.request(`/evaluations/${id}`);
    }

    async createEvaluation(data) {
        return this.request('/evaluations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateEvaluation(id, data) {
        return this.request(`/evaluations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteEvaluation(id) {
        return this.request(`/evaluations/${id}`, {
            method: 'DELETE'
        });
    }

    async bulkUpdateEvaluations(ids, data) {
        return this.request('/evaluations/bulk-update', {
            method: 'POST',
            body: JSON.stringify({ ids, data })
        });
    }

    // ユーザー関連
    async getUsers(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = queryString ? `/users?${queryString}` : '/users';
        return this.request(endpoint);
    }

    async getUserById(id) {
        return this.request(`/users/${id}`);
    }

    async createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    async updateUserProfile(id, data) {
        return this.request(`/users/${id}/profile`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // 評価対象者関連
    async getSubordinates(managerId = null) {
        const endpoint = managerId ? `/subordinates?manager=${managerId}` : '/subordinates';
        return this.request(endpoint);
    }

    // 評価期間関連
    async getEvaluationPeriods() {
        return this.request('/periods');
    }

    async createEvaluationPeriod(data) {
        return this.request('/periods', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateEvaluationPeriod(id, data) {
        return this.request(`/periods/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // 評価カテゴリ関連
    async getEvaluationCategories() {
        return this.request('/evaluation-categories');
    }

    // レポート関連
    async getReports(type, filters = {}) {
        const queryString = new URLSearchParams({ type, ...filters }).toString();
        return this.request(`/reports?${queryString}`);
    }

    async generateReport(type, options = {}) {
        return this.request('/reports/generate', {
            method: 'POST',
            body: JSON.stringify({ type, options })
        });
    }

    // ダッシュボード関連
    async getDashboardData(userId = null) {
        const endpoint = userId ? `/dashboard?user=${userId}` : '/dashboard';
        return this.request(endpoint);
    }

    async getDashboardStats(period = 'current') {
        return this.request(`/dashboard/stats?period=${period}`);
    }

    // 通知関連
    async getNotifications(userId) {
        return this.request(`/notifications?user=${userId}`);
    }

    async markNotificationAsRead(id) {
        return this.request(`/notifications/${id}/read`, {
            method: 'POST'
        });
    }

    // ファイルアップロード
    async uploadFile(file, type = 'evaluation') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.request('/upload', {
            method: 'POST',
            body: formData,
            headers: {} // Content-Typeを自動設定させる
        });
    }

    // ユーティリティメソッド
    async delay(min = 100, max = 500) {
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    generateId() {
        return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    }

    // 接続テスト
    async testConnection() {
        try {
            await this.request('/health');
            return { success: true, message: 'API接続成功' };
        } catch (error) {
            console.error('API connection test failed:', error);
            return { 
                success: false, 
                message: 'API接続に失敗しました',
                error: error.message 
            };
        }
    }

    // 設定取得
    getApiInfo() {
        return {
            baseURL: this.baseURL,
            useRealAPI: this.useRealAPI,
            mockDataAvailable: Object.keys(this.mockData).length > 0
        };
    }

    // キャッシュ管理
    clearCache() {
        // 将来的にキャッシュ機能を追加した場合のメソッド
        console.log('Cache cleared');
    }

    // エラーハンドリング用
    formatError(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'ネットワーク接続を確認してください';
        } else if (error.message.includes('401')) {
            return '認証が必要です';
        } else if (error.message.includes('403')) {
            return 'アクセス権限がありません';
        } else if (error.message.includes('404')) {
            return 'データが見つかりません';
        } else if (error.message.includes('500')) {
            return 'サーバーエラーが発生しました';
        } else {
            return error.message || '不明なエラーが発生しました';
        }
    }
}

// グローバルインスタンス（両方の名前で利用可能）
window.ApiClient = ApiClient;
window.api = new ApiClient();
