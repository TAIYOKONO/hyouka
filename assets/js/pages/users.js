/**
 * users.js - ユーザー管理ページ (招待・承認機能付き)
 */
async function showUsers() {
    app.currentPage = 'users';
    if (!authManager.hasPermission('manage_users') && !authManager.hasPermission('view_subordinate_evaluations')) {
        showNotification('このページにアクセスする権限がありません', 'error');
        return router.navigate('/dashboard');
    }
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: 'ユーザー管理' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>ユーザー情報を読み込み中...</p></div>`;

    try {
        const activeUsers = await api.getUsers();
        const pendingUsers = await api.getPendingUsers();

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">👥 ユーザー管理</h1>
                    <div><button class="btn btn-primary" onclick="showInviteUserModal()">➕ ユーザー招待</button></div>
                </div>
                <div class="page-content">
                    ${renderPendingUsersSection(pendingUsers)}
                    <h3>有効なユーザー一覧</h3>
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>名前</th><th>メールアドレス</th><th>役職</th><th>操作</th></tr></thead>
                            <tbody>
                                ${activeUsers.map(user => `
                                    <tr>
                                        <td>${user.name}</td><td>${user.email}</td>
                                        <td><span class="badge badge-primary">${user.role}</span></td>
                                        <td><button class="btn btn-secondary" disabled>編集</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div id="invite-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">ユーザーを招待</h3>
                        <button class="modal-close" onclick="closeInviteModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="invite-role">招待する役割を選択</label>
                            <select id="invite-role" class="form-control">
                                <option value="worker">作業員</option>
                                <option value="evaluator">評価者</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="handleCreateInvitationLink()">招待リンクを作成</button>
                        <div id="invite-link-area" style="display:none; margin-top: 1rem;">
                            <p>以下のリンクをコピーして、招待したい方に送ってください。</p>
                            <input type="text" id="invite-link-input" readonly style="width: 100%; padding: 0.5rem; background: #eee;">
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("Failed to show users:", error);
        mainContent.innerHTML = `<div class="page-content"><p>ユーザー一覧の読み込みに失敗しました。</p></div>`;
    }
}

function renderPendingUsersSection(pendingUsers) {
    const currentUser = authManager.getCurrentUser();
    if (!['admin', 'evaluator'].includes(currentUser.role)) return '';
    const usersToApprove = pendingUsers.filter(pendingUser => {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'evaluator' && pendingUser.role === 'worker') return true;
        return false;
    });

    if (usersToApprove.length === 0) return '<h3>承認待ちのユーザーはいません</h3>';

    return `
        <h3>承認待ちのユーザー</h3>
        <div class="table-container" style="margin-bottom: 2rem;">
            <table class="table">
                <thead><tr><th>名前</th><th>メールアドレス</th><th>希望役職</th><th>操作</th></tr></thead>
                <tbody>
                    ${usersToApprove.map(user => `
                        <tr>
                            <td>${user.name}</td><td>${user.email}</td><td>${user.role}</td>
                            <td><button class="btn btn-success" onclick="handleApproveUser('${user.id}', '${user.name}')">承認</button></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function showInviteUserModal() { document.getElementById('invite-modal')?.classList.add('show'); }
function closeInviteModal() { document.getElementById('invite-modal')?.classList.remove('show'); }

async function handleCreateInvitationLink() {
    const role = document.getElementById('invite-role').value;
    try {
        const invitationId = await api.createInvitation({ role });
        // ★★★ 正しいハッシュ形式のURLを生成するよう修正 ★★★
        const registrationUrl = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, '')}#/register?token=${invitationId}`;
        document.getElementById('invite-link-input').value = registrationUrl;
        document.getElementById('invite-link-area').style.display = 'block';
    } catch (error) {
        showNotification('招待リンクの作成に失敗しました', 'error');
    }
}

async function handleApproveUser(userId, userName) {
    const currentUser = authManager.getCurrentUser();
    const pendingUsers = await api.getPendingUsers();
    const targetUser = pendingUsers.find(u => u.id === userId);
    if (!targetUser) return showNotification('対象ユーザーが見つかりません', 'error');

    if (targetUser.role === 'admin' && currentUser.email !== 't.kono@branu.jp') {
        return showNotification('管理者アカウントを承認する権限がありません。', 'error');
    }

    if (confirm(`${userName}さんを承認しますか？`)) {
        try {
            await api.approveUser(userId, targetUser.role);
            showNotification(`${userName}さんを承認しました`, 'success');
            showUsers();
        } catch (error) {
            showNotification('承認処理に失敗しました', 'error');
        }
    }
}
