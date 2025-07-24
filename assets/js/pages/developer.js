/**
 * developer.js - 開発者向け管理ページ
 */
async function showDeveloperPage() {
    // 開発者ロールでなければダッシュボードにリダイレクト
    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'developer') {
        console.warn('Developer page access denied.');
        return router.navigate('/dashboard');
    }

    if (window.navigation) window.navigation.render();
    // パンくずリストは、このページが最上位なのでラベルのみ
    updateBreadcrumbs([{ label: '開発者ページ' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page"><div class="page-content"><p>開発者データを読み込み中...</p></div></div>`;

    try {
        // APIから並行してデータを取得
        const [pendingAdmins, tenants] = await Promise.all([
            api.getPendingAdmins(),
            api.getAllTenants()
        ]);

        // ページ全体のHTMLを生成
        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">🛠️ 開発者管理ページ</h1>
                </div>
                <div class="page-content">
                    
                    <h3 class="section-title">承認待ちの管理者アカウント</h3>
                    <div class="table-container" style="margin-bottom: 2rem;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>企業名</th>
                                    <th>申請者名</th>
                                    <th>メールアドレス</th>
                                    <th>申請日</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderPendingAdmins(pendingAdmins)}
                            </tbody>
                        </table>
                    </div>

                    <h3 class="section-title">登録済みテナント（企業）一覧</h3>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>企業名</th>
                                    <th>管理者名</th>
                                    <th>管理者メールアドレス</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderTenants(tenants)}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>`;
        
        // イベントリスナーを一度クリアしてから再設定
        mainContent.removeEventListener('click', handleDeveloperPageClicks);
        mainContent.addEventListener('click', handleDeveloperPageClicks);

    } catch (error) {
        console.error("Failed to show developer page:", error);
        mainContent.innerHTML = `<div class="page-content"><p class="error-message">開発者ページの読み込みに失敗しました。</p></div>`;
    }
}

/**
 * 承認待ち管理者リストのHTML行を生成する
 * @param {Array} users - 承認待ちユーザーの配列
 * @returns {string} HTML文字列
 */
function renderPendingAdmins(users) {
    if (users.length === 0) {
        return `<tr><td colspan="5" style="text-align: center;">承認待ちの管理者はいません。</td></tr>`;
    }
    return users.map(user => `
        <tr>
            <td>${user.company || 'N/A'}</td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-success btn-sm btn-approve-admin" data-id="${user.id}" data-name="${user.name}">承認</button>
            </td>
        </tr>
    `).join('');
}

/**
 * 登録済みテナントリストのHTML行を生成する
 * @param {Array} tenants - テナント（管理者）の配列
 * @returns {string} HTML文字列
 */
function renderTenants(tenants) {
     if (tenants.length === 0) {
        return `<tr><td colspan="4" style="text-align: center;">登録済みのテナントはありません。</td></tr>`;
     }
    return tenants.map(tenant => `
        <tr>
            <td>${tenant.company || 'N/A'}</td>
            <td>${tenant.name || 'N/A'}</td>
            <td>${tenant.email || 'N/A'}</td>
            <td>
                <button class="btn btn-secondary btn-sm btn-reset-password" data-email="${tenant.email}">パスワードリセット</button>
            </td>
        </tr>
    `).join('');
}

/**
 * 開発者ページのクリックイベントを処理するハンドラ
 * @param {Event} e - クリックイベントオブジェクト
 */
async function handleDeveloperPageClicks(e) {
    const target = e.target;

    // 管理者承認ボタンがクリックされた場合
    if (target.classList.contains('btn-approve-admin')) {
        const userId = target.dataset.id;
        const userName = target.dataset.name;
        if (confirm(`「${userName}」の管理者アカウントを承認しますか？`)) {
            try {
                await api.approveAdmin(userId);
                showNotification('管理者アカウントを承認しました。', 'success');
                showDeveloperPage(); // 承認後にページを再読み込みして表示を更新
            } catch (error) {
                console.error('Admin approval failed:', error);
                showNotification(`承認に失敗しました: ${error.message}`, 'error');
            }
        }
    }

    // パスワードリセットボタンがクリックされた場合
    if (target.classList.contains('btn-reset-password')) {
        const email = target.dataset.email;
        if (confirm(`「${email}」にパスワードリセットメールを送信しますか？`)) {
            try {
                await api.sendPasswordReset(email);
                showNotification('パスワードリセットメールを送信しました。', 'success');
            } catch (error) {
                console.error('Password reset failed:', error);
                showNotification(`メール送信に失敗しました: ${error.message}`, 'error');
            }
        }
    }
}
