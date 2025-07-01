/**
 * users.js - ユーザー管理ページ (Firestore連携版)
 */

// ★ 関数を非同期(async)に変更
async function showUsers() {
    app.currentPage = 'users';
    
    if (!authManager.hasPermission('manage_users')) {
        showNotification('ユーザー管理の権限がありません', 'error');
        router.navigate('/dashboard');
        return;
    }
    
    updateBreadcrumbs([
        { label: i18n.t('nav.dashboard'), path: '/dashboard' },
        { label: 'ユーザー管理', path: '/users' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    // ★ データ読み込み中の表示
    mainContent.innerHTML = `<div class="page-content"><p>ユーザー情報を読み込み中...</p></div>`;

    try {
        // ★ API経由でユーザー一覧を取得
        const users = await api.getUsers();

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">👥 ユーザー管理</h1>
                    <div>
                        <button class="btn btn-primary" onclick="showAddUserForm()">
                            ➕ ユーザー追加
                        </button>
                    </div>
                </div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>名前</th>
                                    <th>メールアドレス</th>
                                    <th>役職</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(user => `
                                    <tr>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">
                                                    ${(user.name || 'U').charAt(0)}
                                                </span>
                                                ${user.name || '名前なし'}
                                            </div>
                                        </td>
                                        <td>${user.email}</td>
                                        <td>
                                            <span class="badge badge-primary">${user.role || '不明'}</span>
                                        </td>
                                        <td>
                                            <button class="btn btn-secondary" onclick="editUser('${user.id}')" style="margin-right: 4px;">
                                                ✏️ 編集
                                            </button>
                                            ${user.role !== 'admin' ? `
                                                <button class="btn btn-danger" onclick="deleteUser('${user.id}')">
                                                    🗑️ 削除
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Failed to show users:", error);
        mainContent.innerHTML = `<div class="page-content"><p>ユーザー一覧の読み込みに失敗しました。</p></div>`;
    }
}


// ★ 以下の関数は現時点では変更なし（将来的に実装）
function showProfile() {
    // 省略 (変更なし)
}

function showAddUserForm() {
    if (typeof showNotification === 'function') {
        showNotification('ユーザー追加機能は開発中です', 'info');
    }
}

function editUser(userId) {
    if (typeof showNotification === 'function') {
        showNotification('ユーザー編集機能は開発中です', 'info');
    }
}

function deleteUser(userId) {
    if (confirm('このユーザーを削除しますか？')) {
        if (typeof showNotification === 'function') {
            showNotification('ユーザー削除機能は開発中です', 'info');
        }
    }
}

function handleUpdateProfile(e) {
    // 省略 (変更なし)
}
