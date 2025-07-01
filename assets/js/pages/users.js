/**
 * users.js - ユーザー管理ページ
 */

function showUsers() {
    app.currentPage = 'users';
    
    // 権限チェック
    if (!authManager.hasPermission('manage_users')) {
        if (typeof showNotification === 'function') {
            showNotification('ユーザー管理の権限がありません', 'error');
        }
        showDashboard();
        return;
    }
    
    updateBreadcrumbs([
        { label: i18n.t('nav.dashboard'), path: '/dashboard' },
        { label: 'ユーザー管理', path: '/users' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">👥 ユーザー管理</h1>
                <div>
                    <button class="btn btn-secondary" onclick="showDashboard()">
                        ${i18n.t('action.dashboard')}
                    </button>
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
                                <th>ID</th>
                                <th>名前</th>
                                <th>メールアドレス</th>
                                <th>役職</th>
                                <th>部署</th>
                                <th>入社日</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mockData.users.map(user => `
                                <tr>
                                    <td>${user.id}</td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="
                                                width: 32px; height: 32px; border-radius: 50%;
                                                background: var(--color-primary); color: white;
                                                display: flex; align-items: center; justify-content: center;
                                                font-weight: bold; font-size: 12px;
                                            ">${user.name.charAt(0)}</span>
                                            ${user.name}
                                        </div>
                                    </td>
                                    <td>${user.email}</td>
                                    <td>
                                        <span class="badge badge-${user.role === 'admin' ? 'primary' : user.role === 'manager' ? 'success' : 'secondary'}">
                                            ${user.roleJa || user.role}
                                        </span>
                                    </td>
                                    <td>${user.department || '-'}</td>
                                    <td>${user.joinDate || '-'}</td>
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
}

function showProfile() {
    app.currentPage = 'profile';
    
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
        showDashboard();
        return;
    }
    
    updateBreadcrumbs([
        { label: i18n.t('nav.dashboard'), path: '/dashboard' },
        { label: 'プロフィール', path: '/profile' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">👤 プロフィール</h1>
                <button class="btn btn-secondary" onclick="showDashboard()">
                    ${i18n.t('action.dashboard')}
                </button>
            </div>
            <div class="page-content">
                <div class="form-section">
                    <h3>基本情報</h3>
                    <form id="profile-form">
                        <div class="form-group">
                            <label for="profile-name">名前</label>
                            <input type="text" id="profile-name" value="${currentUser.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="profile-email">メールアドレス</label>
                            <input type="email" id="profile-email" value="${currentUser.email}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="profile-role">役職</label>
                            <input type="text" id="profile-role" value="${currentUser.roleJa || currentUser.role}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="profile-department">部署</label>
                            <input type="text" id="profile-department" value="${currentUser.department || ''}" required>
                        </div>
                        <div style="text-align: center; margin-top: 32px;">
                            <button type="submit" class="btn btn-primary">
                                💾 プロフィール更新
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('profile-form').addEventListener('submit', handleUpdateProfile);
}

function showAddUserForm() {
    // 新しいユーザー追加フォーム（簡易実装）
    if (typeof showNotification === 'function') {
        showNotification('ユーザー追加機能は開発中です', 'info');
    }
}

function editUser(userId) {
    // ユーザー編集（簡易実装）
    if (typeof showNotification === 'function') {
        showNotification('ユーザー編集機能は開発中です', 'info');
    }
}

function deleteUser(userId) {
    // ユーザー削除確認
    if (confirm('このユーザーを削除しますか？')) {
        if (typeof showNotification === 'function') {
            showNotification('ユーザー削除機能は開発中です', 'info');
        }
    }
}

function handleUpdateProfile(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('profile-name').value,
        department: document.getElementById('profile-department').value
    };
    
    // プロフィール更新
    if (authManager.updateCurrentUser(formData)) {
        if (typeof showNotification === 'function') {
            showNotification('プロフィールを更新しました', 'success');
        }
        
        // ヘッダーの表示も更新
        setTimeout(() => {
            buildNavigation();
        }, 500);
    } else {
        if (typeof showNotification === 'function') {
            showNotification('プロフィールの更新に失敗しました', 'error');
        }
    }
}
