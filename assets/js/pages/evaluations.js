// evaluations.js の全コード（構文エラー最終修正版）
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
                <div class="page-header"><h1 class="page-title">評価一覧</h1><div><button id="btn-new-evaluation" class="btn btn-primary">新規評価</button></div></div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>評価対象者</th><th>評価者</th><th>評価期間</th><th>総合評価</th><th>ステータス</th><th>更新日</th><th>操作</th></tr></thead>
                            <tbody>
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
        
        const pastEvaluations = await api.getPastEvaluationsForUser(evaluation.subordinateId);
        
        const { quantitativeItems, qualitativeItems } = prepareItemsForDisplay(structure, evaluation);

        mainContent.innerHTML = getEvaluationDetailHTML(evaluation, pastEvaluations.filter(e => e.id !== id), quantitativeItems, qualitativeItems);
        
        renderEvaluationDetails(quantitativeItems, qualitativeItems);
        attachEventListeners(id, evaluation, { quantitativeItems, qualitativeItems }, pastEvaluations);
        
    } catch (error) {
        console.error("Failed to show evaluation detail:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価詳細の読み込みに失敗しました: ${error.message}</p></div>`;
    }
}

function prepareItemsForDisplay(structure, evaluation) {
    if (!structure || !evaluation) return { quantitativeItems: [], qualitativeItems: [] };
    const quantitativeItems = [];
    const qualitativeItems = [];
    structure.categories.forEach(category => {
        (category.items || []).forEach(item => {
            const key = `${category.categoryName}_${item.itemName}`;
            const ratingData = evaluation.ratings[key] || { score: 0, comment: '' };
            const fullItem = { ...item, categoryName: category.categoryName, ...ratingData };
            if (item.itemType === 'quantitative') quantitativeItems.push(fullItem);
            else qualitativeItems.push(fullItem);
        });
    });
    return { quantitativeItems, qualitativeItems };
}

function getEvaluationDetailHTML(evaluation, otherPastEvaluations, quantitativeItems, qualitativeItems) {
    const currentUser = window.authManager.getCurrentUser();
    let actionButtonsHTML = '';
    if (currentUser.role === 'evaluator' && evaluation.status === 'submitted') {
        actionButtonsHTML = `<button id="btn-approve-primary" class="btn btn-success">一次承認</button>`;
    } else if (currentUser.role === 'admin' && evaluation.status === 'approved_by_evaluator') {
        actionButtonsHTML = `<button id="btn-approve-final" class="btn btn-primary">最終承認</button>`;
    }

    let comparisonHTML = '';
    if (otherPastEvaluations && otherPastEvaluations.length > 0) {
        comparisonHTML = `
            <div class="form-section">
                <h3>過去の評価と比較（定量的評価）</h3>
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
                    <select id="past-evaluation-select">
                        <option value="">比較する評価を選択...</option>
                        ${otherPastEvaluations.map(pe => `<option value="${pe.id}">${pe.period}</option>`).join('')}
                    </select>
                    <div class="view-switcher">
                        <button class="btn btn-secondary btn-sm" data-view-mode="side">並べて表示</button>
                        <button class="btn btn-secondary btn-sm" data-view-mode="overlay">重ねて表示</button>
                    </div>
                </div>
                <div id="comparison-charts-container" class="evaluation-graphs"></div>
            </div>`;
    }

    const allItems = [...quantitativeItems, ...qualitativeItems];
    return `
        <div class="page">
            <div class="page-header"><h1 class="page-title">👁️ 評価レポート</h1><div>${actionButtonsHTML}<button id="btn-back-to-list-detail" class="btn">戻る</button></div></div>
            <div class="page-content">
                <div class="evaluation-summary-header">
                    <div><strong>評価対象者:</strong> ${evaluation.subordinateName}</div><div><strong>評価者:</strong> ${evaluation.evaluatorName}</div>
                    <div><strong>評価期間:</strong> ${evaluation.period}</div><div><strong>総合評価:</strong> ${evaluation.overallRating}/5 ⭐</div>
                    <div><strong>ステータス:</strong> ${evaluation.status}</div>
                </div>
                <div class="evaluation-graphs"><div class="evaluation-chart"><h4>定量的評価チャート</h4><div class="chart-container" id="detail-quantitative-chart"></div></div></div>
                ${comparisonHTML}
                <div class="evaluation-details-section"><h3>詳細評価</h3><div class="table-container"><table class="table"><thead><tr><th>カテゴリ</th><th>評価項目</th><th>スコア</th><th>コメント</th></tr></thead><tbody>
                    ${allItems.length > 0 ? allItems.map(item => `
                        <tr><td>${item.categoryName}</td><td>${item.itemName}</td><td>${item.score.toFixed(1)}</td><td>${item.comment || ''}</td></tr>`).join('') : `<tr><td colspan="4" style="text-align: center;">評価項目への入力がありません。</td></tr>`}
                </tbody></table></div></div>
                <div class="form-section"><h3>総合コメント</h3><p class="comment-box">${evaluation.overallComment || 'コメントはありません。'}</p></div>
            </div>
        </div>`;
}

function renderEvaluationDetails(quantitativeItems, qualitativeItems) {
    if (quantitativeItems.length > 0) {
        new PolygonChart('detail-quantitative-chart', quantitativeItems, quantitativeItems.map(i => i.score));
    }
}

function attachEventListeners(id, currentEvaluation, currentItems, pastEvaluations) {
    document.getElementById('btn-back-to-list-detail').addEventListener('click', () => router.navigate('/evaluations'));
    
    document.getElementById('btn-approve-primary')?.addEventListener('click', async () => { if(confirm('この評価を一次承認しますか？')) await api.updateEvaluationStatus(id, 'approved_by_evaluator').then(()=>router.navigate('/evaluations')).catch(e=>showNotification('承認失敗','error'))});
    document.getElementById('btn-approve-final')?.addEventListener('click', async () => { if(confirm('この評価を最終承認しますか？')) await api.updateEvaluationStatus(id, 'completed').then(()=>router.navigate('/evaluations')).catch(e=>showNotification('承認失敗','error'))});

    const comparisonContainer = document.getElementById('comparison-charts-container');
    const pastEvalSelect = document.getElementById('past-evaluation-select');
    let selectedPastEval = null;

    const renderComparison = async () => {
        if (!selectedPastEval || !comparisonContainer) return;
        
        const viewMode = document.querySelector('.view-switcher .btn.active')?.dataset.viewMode || 'side';
        const pastStructure = await api.getEvaluationStructure(selectedPastEval.jobTypeId);
        const { quantitativeItems: pastQuantItems } = prepareItemsForDisplay(pastStructure, selectedPastEval);

        if (viewMode === 'overlay') {
            comparisonContainer.innerHTML = `<div class="evaluation-chart"><div id="compare-overlay-chart"></div></div>`;
            new PolygonChart('compare-overlay-chart', currentItems.quantitativeItems, currentItems.quantitativeItems.map(i => i.score), pastQuantItems.map(i => i.score));
        } else {
            comparisonContainer.innerHTML = `
                <div class="evaluation-chart"><h4>今回の評価</h4><div id="compare-current-chart"></div></div>
                <div class="evaluation-chart"><h4>過去の評価 (${selectedPastEval.period})</h4><div id="compare-past-chart"></div></div>
            `;
            new PolygonChart('compare-current-chart', currentItems.quantitativeItems, currentItems.quantitativeItems.map(i => i.score));
            new PolygonChart('compare-past-chart', pastQuantItems, pastQuantItems.map(i => i.score));
        }
    };

    pastEvalSelect?.addEventListener('change', async (e) => {
        const pastEvalId = e.target.value;
        if (!pastEvalId) {
            comparisonContainer.innerHTML = '';
            selectedPastEval = null;
            return;
        }
        comparisonContainer.innerHTML = `<p>過去の評価を読み込み中...</p>`;
        selectedPastEval = await api.getEvaluationById(pastEvalId);
        renderComparison();
    });

    document.querySelector('.view-switcher')?.addEventListener('click', (e) => {
        if (e.target.matches('.btn-sm')) {
            document.querySelectorAll('.view-switcher .btn-sm').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderComparison();
        }
    });
}
