/**
 * settings.js - 管理者向け設定ページ (評価項目タイプ分離版)
 */

async function showSettingsPage() {
    app.currentPage = 'settings';
    if (!authManager.hasPermission('manage_settings')) {
        showNotification('このページにアクセスする権限がありません', 'error');
        return router.navigate('/dashboard');
    }
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: '評価項目設定' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>設定項目を読み込み中...</p></div>`;

    try {
        const items = await api.getEvaluationItems();

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">評価項目・ウエイト設定</h1></div>
                <div class="page-content">
                    <div class="form-section">
                        <h3>新規項目追加</h3>
                        <form id="add-item-form" style="display: flex; gap: 1rem; align-items: flex-end;">
                            <div class="form-group" style="flex: 2;"><label>項目名</label><input type="text" id="item-name" required></div>
                            <div class="form-group" style="flex: 1;"><label>タイプ</label>
                                <select id="item-type">
                                    <option value="quantitative">定量的</option>
                                    <option value="qualitative">定性的</option>
                                </select>
                            </div>
                            <div class="form-group" style="flex: 3;"><label>説明</label><input type="text" id="item-description"></div>
                            <div class="form-group" style="flex: 1;"><label>ウエイト(%)</label><input type="number" id="item-weight" required min="0" max="100"></div>
                            <div class="form-group" style="flex: 1;"><label>表示順</label><input type="number" id="item-order" required min="1"></div>
                            <div class="form-group"><button type="submit" class="btn btn-primary">追加</button></div>
                        </form>
                    </div>

                    <h3>登録済み項目一覧</h3>
                    <p>合計ウエイト: ${items.reduce((sum, item) => sum + (item.weight || 0), 0)}%</p>
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>表示順</th><th>項目名</th><th>タイプ</th><th>説明</th><th>ウエイト(%)</th><th>操作</th></tr></thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr>
                                        <td>${item.order}</td>
                                        <td>${item.name}</td>
                                        <td>${item.type === 'qualitative' ? '定性的' : '定量的'}</td>
                                        <td>${item.description || ''}</td>
                                        <td>${item.weight || 0}%</td>
                                        <td><button class="btn btn-danger" onclick="handleDeleteItem('${item.id}')">削除</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('add-item-form').addEventListener('submit', handleCreateItem);

    } catch (error) {
        console.error("Failed to show settings page:", error);
        mainContent.innerHTML = `<div class="page-content"><p>設定ページの読み込みに失敗しました。</p></div>`;
    }
}

async function handleCreateItem(e) {
    e.preventDefault();
    const name = document.getElementById('item-name').value;
    const type = document.getElementById('item-type').value;
    const description = document.getElementById('item-description').value;
    const weight = parseInt(document.getElementById('item-weight').value, 10);
    const order = parseInt(document.getElementById('item-order').value, 10);

    if (!name || !type || isNaN(weight) || isNaN(order)) {
        return showNotification('項目名、タイプ、ウエイト、表示順は必須です', 'error');
    }

    try {
        await api.createEvaluationItem({ name, type, description, weight, order });
        showNotification('項目を追加しました', 'success');
        showSettingsPage(); // 画面を再読み込み
    } catch (error) {
        showNotification('項目の追加に失敗しました', 'error');
    }
}

async function handleDeleteItem(id) {
    if (confirm('この項目を削除しますか？')) {
        try {
            await api.deleteEvaluationItem(id);
            showNotification('項目を削除しました', 'success');
            showSettingsPage(); // 画面を再読み込み
        } catch (error) {
            showNotification('項目の削除に失敗しました', 'error');
        }
    }
}
