// evaluations.js の全コード（一次承認ボタン実装版）
/**
 * evaluations.js - 評価関連ページ
 */
async function showEvaluations() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価一覧' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価一覧を読み込み中...</p></div>`;

    try {
        const evaluations = await api.getEvaluations();
        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">評価一覧</h1>
                    <div><button id="btn-new-evaluation" class="btn btn-primary">新規評価</button></div>
                </div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>評価対象者</th><th>評価者</th><th>評価期間</th><th>総合評価</th><th>ステータス</th><th>更新日</th><th>操作</th></tr></thead>
                            <tbody>
                                ${evaluations.length === 0 ? `<tr><td colspan="7" style="text-align: center;">データがありません</td></tr>` : ''}
                                ${evaluations.map(e => `
                                    <tr>
                                        <td>${e.subordinateName || ''}</td><td>${e.evaluatorName || ''}</td><td>${e.period || ''}</td><td>${e.overallRating || 'N/A'}/5 ⭐</td>
                                        <td>${e.status || ''}</td><td>${e.updatedAt ? new Date(e.updatedAt.seconds * 1000).toLocaleDateString() : ''}</td>
                                        <td><button class="btn btn-secondary btn-view-detail" data-id="${e.id}">詳細</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

        document.getElementById('btn-new-evaluation')?.addEventListener('click', () => router.navigate('/evaluations/new'));
        document.querySelectorAll('.btn-view-detail').forEach(button => {
            button.addEventListener('click', (e) => router.navigate(`/evaluations/${e.currentTarget.dataset.id}`));
        });

    } catch (error) {
        console.error("Failed to show evaluations:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価一覧の読み込みに失敗しました。</p></div>`;
    }
}

async function showNewEvaluationForm() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価一覧', path: '#/evaluations' }, { label: '新規評価作成' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div id="evaluation-form-container"></div>`;

    if (window.evaluationForm) {
        window.evaluationForm.openNewEvaluation();
    }
}

async function viewEvaluation(id) {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価一覧', path: '#/evaluations' }, { label: '評価詳細' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価詳細を読み込み中...</p></div>`;

    try {
        const evaluation = await api.getEvaluationById(id);
        if (!evaluation) throw new Error("評価データが見つかりません。");

        const structure = await api.getEvaluationStructure(evaluation.jobTypeId);
        if (!structure) throw new Error("評価構造データが見つかりません。");

        // --- 描画用のデータ準備 ---
        const quantitativeItems = [];
        const qualitativeItems = [];
        structure.categories.forEach(category => {
            (category.items || []).forEach(item => {
                const key = `${category.categoryName}_${item.itemName}`;
                const ratingData = evaluation.ratings[key] || { score: 0, comment: '' };
                const fullItem = { ...item, categoryName: category.categoryName, ...ratingData };

                if (item.itemType === 'quantitative') {
                    quantitativeItems.push(fullItem);
                } else {
                    qualitativeItems.push(fullItem);
                }
            });
        });

        // --- 承認ボタンの表示ロジック ---
        const currentUser = window.authManager.getCurrentUser();
        let actionButtonsHTML = '';
        if (currentUser.role === 'evaluator' && evaluation.status === 'submitted') {
            actionButtonsHTML = `<button id="btn-approve-primary" class="btn btn-success">一次承認する</button>`;
        }
        // 今後のステップで管理者用の最終承認ボタンもここに追加

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">👁️ 評価レポート</h1>
                    <div>
                        ${actionButtonsHTML}
                        <button id="btn-back-to-list-detail" class="btn">一覧に戻る</button>
                    </div>
                </div>
                <div class="page-content">
                    <div class="evaluation-summary-header">
                        <div><strong>評価対象者:</strong> ${evaluation.subordinateName}</div>
                        <div><strong>評価者:</strong> ${evaluation.evaluatorName}</div>
                        <div><strong>評価期間:</strong> ${evaluation.period}</div>
                        <div><strong>総合評価:</strong> ${evaluation.overallRating}/5 ⭐</div>
                        <div><strong>ステータス:</strong> ${evaluation.status}</div>
                    </div>
                    </div>
            </div>`;
        
        // イベントリスナーとチャート描画
        document.getElementById('btn-back-to-list-detail').addEventListener('click', () => router.navigate('/evaluations'));
        
        const approveBtn = document.getElementById('btn-approve-primary');
        if (approveBtn) {
            approveBtn.addEventListener('click', async () => {
                if (confirm('この評価を一次承認しますか？')) {
                    try {
                        await api.updateEvaluationStatus(id, 'approved_by_evaluator');
                        showNotification('評価を一次承認しました', 'success');
                        router.navigate('/evaluations');
                    } catch (error) {
                        showNotification('承認処理に失敗しました', 'error');
                        console.error('Approval failed:', error);
                    }
                }
            });
        }
        // ...チャート描画のロジックは前回と同じ...

    } catch (error) {
        console.error("Failed to show evaluation detail:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価詳細の読み込みに失敗しました: ${error.message}</p></div>`;
    }
}
