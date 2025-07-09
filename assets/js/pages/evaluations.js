/**
 * evaluations.js - 評価関連ページ (定性評価グラフ追加版)
 */
async function showEvaluations() {
    // ... (この関数は変更なし)
}

async function showNewEvaluationForm() {
    // ... (この関数は変更なし)
}

async function viewEvaluation(id) {
    app.currentPage = 'evaluation-detail';
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '/dashboard' }, { label: '評価一覧', path: '/evaluations' }, { label: '評価詳細' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価詳細を読み込み中...</p></div>`;

    try {
        const evaluation = await api.getEvaluationById(id);
        if (!evaluation) throw new Error("評価データが見つかりません。");
        
        const evaluationItems = await api.getEvaluationItems();
        
        // 項目をタイプ別に分類
        const quantitativeItems = evaluationItems.filter(item => item.type === 'quantitative');
        const qualitativeItems = evaluationItems.filter(item => item.type === 'qualitative');

        // チャート用のデータを準備
        const polygonChartData = quantitativeItems.map(item => 
            (evaluation.ratings && evaluation.ratings[item.id]) ? evaluation.ratings[item.id] : 0
        );
        const barChartData = qualitativeItems.map(item => ({
            label: item.name,
            value: (evaluation.ratings && evaluation.ratings[item.id]) ? evaluation.ratings[item.id] : 0
        })).filter(item => item.value > 0); // 評価が0の項目はグラフに表示しない

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">👁️ 評価詳細</h1><button class="btn" onclick="router.navigate('/evaluations')">戻る</button></div>
                <div class="page-content">
                    <div class="evaluation-summary" style="grid-template-columns: 1fr 1fr; gap: 2rem;">
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
                            <div class="chart-container"><div id="detail-polygon-chart" class="polygon-chart"></div></div>
                        </div>
                        <div class="evaluation-chart">
                            <h4>定性的評価グラフ</h4>
                            <div id="detail-bar-chart"></div>
                        </div>
                    </div>
                </div>
            </div>`;

        // 両方のグラフを初期化
        new PolygonChart('detail-polygon-chart', quantitativeItems, polygonChartData);
        new BarChart('detail-bar-chart', barChartData);

    } catch (error) {
        console.error("Failed to show evaluation detail:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価詳細の読み込みに失敗しました。</p></div>`;
    }
}
