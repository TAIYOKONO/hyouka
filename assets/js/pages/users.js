/**
 * users.js - ユーザー管理ページ (招待・承認機能付き)
 */
async function showUsers() {
    app.currentPage = 'users';
    if (!authManager.hasPermission('manage_users')) {
        showNotification('ユーザー管理の権限がありません', 'error');
        return router.navigate('/dashboard');
    }
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: 'ユーザー管理' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>ユーザー情報を読み込み中...</p></div>`;

    try {
        const activeUsers = await api.getUsers(); // statusがactiveのユーザー
        const pendingUsers = await api.getPendingUsers(); // statusがpending_approvalのユーザー

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
            </div>`;
    } catch (error) {
        console.error("Failed to show users:", error);
        mainContent.innerHTML = `<div class="page-content"><p>ユーザー一覧の読み込みに失敗しました。</p></div>`;
    }
}

// 承認待ちユーザーのセクションを描画する
function renderPendingUsersSection(pendingUsers) {
    const currentUser = authManager.getCurrentUser();
    // 承認権限のあるユーザー（評価者 or 管理者）のみ表示
    if (!['admin', 'evaluator'].includes(currentUser.role)) return '';

    // 承認対象をフィルタリング
    const usersToApprove = pendingUsers.filter(pendingUser => {
        if (currentUser.role === 'admin') return true; // 管理者は全員承認可能
        if (currentUser.role === 'evaluator' && pendingUser.role === 'worker') return true; // 評価者は作業員のみ承認可能
        return false;
    });

    if (usersToApprove.length === 0) return '';

    return `
        <h3>承認待ちのユーザー</h3>
        <div class="table-container mb-5">
            <table class="table">
                <thead><tr><th>名前</th><th>メールアドレス</th><th>希望役職</th><th>操作</th></tr></thead>
                <tbody>
                    ${usersToApprove.map(user => `
                        <tr>
                            <td>${user.name}</td><td>${user.email}</td>
                            <td>${user.role}</td>
                            <td><button class="btn btn-success" onclick="handleApproveUser('${user.id}')">承認</button></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ユーザー招待モーダルを表示する
function showInviteUserModal() {
    // シンプルなpromptで実装
    const role = prompt("招待するユーザーの役割を入力してください (evaluator または worker):", "worker");
    if (role && (role === 'evaluator' || role === 'worker')) {
        handleCreateInvitationLink(role);
    } else {
        alert("無効な役割です。");
    }
}

// 招待リンクを生成して表示する
async function handleCreateInvitationLink(role) {
    try {
        const invitationId = await api.createInvitation({ role });
        const registrationUrl = `${window.location.origin}${window.location.pathname}#/register?token=${invitationId}`;
        prompt(`以下の招待リンクをコピーして、新しいユーザーに送ってください。`, registrationUrl);
    } catch (error) {
        showNotification('招待リンクの作成に失敗しました', 'error');
    }
}

// ユーザーを承認する
async function handleApproveUser(userId) {
    const targetUser = (await api.getPendingUsers()).find(u => u.id === userId);
    if (!targetUser) return showNotification('対象ユーザーが見つかりません', 'error');

    // 管理者の承認ロジック
    if (targetUser.role === 'admin') {
        const currentUserEmail = authManager.getCurrentUser().email;
        if (currentUserEmail !== 't.kono@branu.jp') {
            return showNotification('管理者アカウントを承認する権限がありません。', 'error');
        }
    }

    if (confirm(`${targetUser.name}さんを承認しますか？`)) {
        try {
            await api.approveUser(userId);
            showNotification(`${targetUser.name}さんを承認しました`, 'success');
            showUsers(); // 画面を再読み込み
        } catch (error) {
            showNotification('承認処理に失敗しました', 'error');
        }
    }
}
