// api.js の全コード（目標承認メソッド追加・開発者メソッド追加版）
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
            // 開発者ロールの場合はtenantIdがなくても警告しない
            if (!currentUser || currentUser.role !== 'developer') {
                console.warn("Tenant ID is not available.");
            }
            return null;
        }
        return currentUser.tenantId;
    }

    // ===================================
    // === 開発者専用メソッド (Developer Methods)
    // ===================================

    // 承認待ちの管理者を取得
    async getPendingAdmins() {
        const snapshot = await this.db.collection('users').where('status', '==', 'developer_approval_pending').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 登録済みの全テナント（管理者）を取得
    async getAllTenants() {
        const snapshot = await this.db.collection('users').where('role', '==', 'admin').where('status', '==', 'active').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 管理者を承認する
    async approveAdmin(userId) {
        // 新しいテナントIDを生成
        const tenantId = this.db.collection('tenants').doc().id; 
        
        // ユーザーのステータスを'active'にし、テナントIDを割り当てる
        await this.db.collection('users').doc(userId).update({
            status: 'active',
            tenantId: tenantId
        });

        // テナント管理用のコレクションにも情報を保存（後々の管理のため）
        await this.db.collection('tenants').doc(tenantId).set({
            adminId: userId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });
    }

    // パスワードリセットメールを送信
    async sendPasswordReset(email) {
        await this.auth.sendPasswordResetEmail(email);
    }


    // ===================================
    // === テナント内メソッド (Tenant-Specific Methods)
    // ===================================
    
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
        // このメソッドはサインアウトを伴うため、呼び出し元でUI制御が必要
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
        const tenantId = this._getTena
