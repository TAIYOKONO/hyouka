/**
 * evaluations.js - 評価関連ページ (イベントリスナー修正版)
 */
async function showEvaluations() {
    app.currentPage = 'evaluations';
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: '評価一覧' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価一覧を読み込み中...</p></div>`;

    try {
        const evaluations = await api.getEvaluations();
        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">評価一覧</h1>
                    <div>
                        <button id="btn-new-evaluation" class="btn btn-primary">新規評価</button>
                    </div>
                </div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>評価対象者</th><th>評価者</th><th>評価期間</th><th>総合評価</th><th>ステータス</th><th>更新日</th><th>操作</th></tr></thead>
                            <tbody id="evaluations-table-body">
                                ${evaluations.length === 0 ? `<tr><td colspan="7" style="text-align: center;">データがありません</td></tr>` : ''}
                                ${evaluations.map(e => `
                                    <tr data-id="${e.id}">
                                        <td>${e.subordinate||''}</td><td>${e.evaluator||''}</td><td>${e.period||''}</td><td>${e.overallRating||'N/A'}/5 ⭐</td>
                                        <td>${e.status||''}</td><td>${e.updatedAt ? new Date(e.updatedAt.seconds * 1000).toLocaleDateString() : ''}</td>
                                        <td><button class="btn btn-secondary btn-view-detail" data-id="${e.id}">詳細</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

        // ★★★ ここからイベントリスナーの登録処理を追加 ★★★
        
        // 「新規評価」ボタンにイベントリスナーを追加
        document.getElementById('btn-new-evaluation').addEventListener('click', () => {
            router.navigate('/evaluations/new');
        });

        // 各「詳細」ボタンにイベントリスナーを追加
        document.querySelectorAll('.btn-view-detail').forEach(button => {
            button.addEventListener('click', (e) => {
                const evaluationId = e.currentTarget.dataset.id;
                router.navigate(`/evaluations/${evaluationId}`);
            });
        });
        
    } catch (error) {
        console.error("Failed to show evaluations:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価一覧の読み込みに失敗しました。</p></div>`;
    }
}

// showNewEvaluationForm と viewEvaluation 関数は変更ありません
async function showNewEvaluationForm() {
    // ... (既存のコード) ...
}

async function viewEvaluation(id) {
    // ... (既存のコード) ...
}
