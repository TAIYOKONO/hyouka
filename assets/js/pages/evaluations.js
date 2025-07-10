/**
 * evaluations.js - 評価関連ページ (最終版)
 */
async function showEvaluations() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: '評価一覧' }]);
    
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
                                        <td>${e.subordinate||''}</td><td>${e.evaluator||''}</td><td>${e.period||''}</td><td>${e.overallRating||'N/A'}/5 ⭐</td>
                                        <td>${e.status||''}</td><td>${e.updatedAt ? new Date(e.updatedAt.seconds * 1000).toLocaleDateString() : ''}</td>
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
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: '評価一覧', path: '/evaluations' }, { label: '新規評価作成' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>フォームを準備中...</p></div>`;

    try {
        const evaluationItems = await api.getEvaluationItems();
        const users = await api.getUsers();
        const workers = users.filter(u => u.role === 'worker');
        
        const quantitativeItems = evaluationItems.filter(item => item.type === 'quantitative');
        const qualitativeItems = evaluationItems.filter(item => item.type === 'qualitative');

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">新規評価作成</h1><button class="btn" onclick="router.navigate('/evaluations')">一覧に戻る</button></div>
                <div class="page-content">
                    <form class="evaluation-form" id="new-evaluation-form">
                        <div class="form-section"><h3>基本情報</h3>
                            <div class="form-group"><label for="evaluation-period">評価期間</label><select id="evaluation-period" required><option value="">選択</option><option value="2025年上期">2025年上期</option><option value="2025年下期">2025年下期</option></select></div>
                            <div class="form-group"><label for="subordinate-select">評価対象者</label><select id="subordinate-select" required><option value="">選択</option>${workers.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}</select></div>
                        </div>
                        <div class="form-section">
                            <h3>定量的評価</h3>
                            <div class="rating-input-group">${quantitativeItems.map(item => `<div class="rating-input-item"><div class="rating-input-label"><strong>${item.name}</strong><small>${item.description||''}</small></div><div class="rating-input-controls"><input type="number" class="rating-input" name="rating-${item.id}" min="1" max="5" step="0.1" placeholder="1-5" oninput="updatePolygonChart()"></div></div>`).join('')}</div>
                            <div class="evaluation-chart" style="margin-top: 24px;"><div class="chart-container"><div id="evaluation-polygon-chart"></div></div></div>
                        </div>
                        <div class="form-section">
                            <h3>定性的評価</h3>
                            <div class="rating-input-group">${qualitativeItems.map(item => `<div class="rating-input-item"><div class="rating-input-label"><strong>${item.name}</strong><small>${item.description||''}</small></div><div class="rating-input-controls"><input type="number" class="rating-input" name="rating-${item.id}" min="1" max="5" step="0.1" placeholder="1-5"></div></div>`).join('')}</div>
                        </div>
                        <div class="form-section"><h3>総合コメント</h3><div class="form-group"><textarea id="overall-comment" placeholder="コメント" rows="4"></textarea></div></div>
                        <div style="text-align: center; margin-top: 32px;"><button type="submit" class="btn btn-success">評価を保存</button></div>
                    </form>
                </div>
            </div>`;
        document.getElementById('new-evaluation-form').addEventListener('submit', handleSaveEvaluation);
        initializePolygonChart(quantitativeItems);
    } catch (error) {
        console.error("Failed to show new evaluation form:", error);
        mainContent.innerHTML = `<div class="page-content"><p>フォームの表示に失敗しました。</p></div>`;
    }
}

async function viewEvaluation(params) {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: '評価一覧', path: '/evaluations' }, { label: '評価詳細' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価詳細を読み込み中...</p></div>`;

    try {
        const evaluation = await api.getEvaluationById(params.id);
        if (!evaluation) throw new Error("評価データが見つかりません。");
        
        const evaluationItems = await api.getEvaluationItems();
        const quantitativeItems = evaluationItems.filter(item => item.type === 'quantitative');
        const qualitativeItems = evaluationItems.filter(item => item.type === 'qualitative');

        const quantitativeChartData = quantitativeItems.map(item => (evaluation.ratings && evaluation.ratings[item.id]) ? evaluation.ratings[item.id] : 0);
        const qualitativeChartData = qualitativeItems.map(item => (evaluation.ratings && evaluation.ratings[item.id]) ? evaluation.ratings[item.id] : 0);

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">👁️ 評価詳細</h1><button class="btn" onclick="router.navigate('/evaluations')">戻る</button></div>
                <div class="page-content">
                    <div class="evaluation-summary" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div class="evaluation-details">
                            <h3>基本情報</h3>
                            <div class="detail-row"><span class="label">期間:</span><span>${evaluation.period}</span></div>
                            <div class="detail-row"><span class="label">対象者:</span><span>${evaluation.subordinate}</span></div>
                            <div class="detail-row"><span class="label">評価者:</span><span>${evaluation.evaluator}</span></div>
                            <div class="detail-row"><span class="label">総合評価:</span><span>${evaluation.overallRating}/5 ⭐</span></div>
                            <div class="detail-row"><span class="label">更新日:</span><span>${new Date(evaluation.updatedAt.seconds * 1000).toLocaleDateString()}</span></div>
                        </div>
                        <div class="form-section">
                            <h3>総合コメント</h3>
                            <p>${evaluation.overallComment || 'コメントはありません。'}</p>
                        </div>
                    </div>
                    <div class="evaluation-graphs" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem;">
                        <div class="evaluation-chart">
                            <h4>定量的評価チャート</h4>
                            <div class="chart-container"><div id="detail-quantitative-chart"></div></div>
                        </div>
                        <div class="evaluation-chart">
                            <h4>定性的評価チャート</h4>
                            <div class="chart-container"><div id="detail-qualitative-chart"></div></div>
                        </div>
                    </div>
                </div>
            </div>`;
        
        if (quantitativeItems.length > 0) new PolygonChart('detail-quantitative-chart', quantitativeItems, quantitativeChartData);
        if (qualitativeItems.length > 0) new PolygonChart('detail-qualitative-chart', qualitativeItems, qualitativeChartData);

    } catch (error) {
        console.error("Failed to show evaluation detail:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価詳細の読み込みに失敗しました。</p></div>`;
    }
}
