/**
 * utils/helpers.js - ヘルパー関数 (Firestore連携版)
 */

// カテゴリ名取得（多言語対応）
function getCategoryName(index) {
    const categoryKeys = ['category.safety', 'category.quality', 'category.efficiency', 'category.teamwork', 'category.communication'];
    return i18n.t(categoryKeys[index]);
}

function getCategoryDesc(index) {
    const descKeys = ['category.safety_desc', 'category.quality_desc', 'category.efficiency_desc', 'category.teamwork_desc', 'category.communication_desc'];
    return i18n.t(descKeys[index]);
}

// ブレッドクラム更新
function updateBreadcrumbs(items) {
    const breadcrumbs = document.getElementById('breadcrumbs');
    if (!breadcrumbs || !items.length) return;
    
    breadcrumbs.innerHTML = items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast) {
            return `<span class="current">${item.label}</span>`;
        } else {
            return `<a href="#" onclick="router.navigate('${item.path || ''}')">${item.label}</a>`;
        }
    }).join(' <span class="separator">></span> ');
}

// ★ updateRatingDisplayはチャート更新のみに専念
function updateRadarChart() {
    if (!window.pentagonChart) return;
    
    // 現在表示されているフォームからカテゴリ情報を取得
    const categories = window.pentagonChart.categories || [];

    const newData = categories.map(category => {
        const input = document.getElementById(`rating-${category.id}`);
        const value = parseFloat(input?.value);
        return isNaN(value) ? 0 : Math.max(0, Math.min(5, value));
    });
    
    window.pentagonChart.updateData(newData);
}

// ★ レーダーチャート初期化 (カテゴリデータを引数で受け取る)
function initializeRadarChart(categories = []) {
    setTimeout(() => {
        try {
            window.pentagonChart = new PentagonChart('evaluation-radar-chart', categories);
        } catch (error) {
            console.error('Error creating pentagon chart:', error);
        }
    }, 100);
}

// ★ 評価保存処理 (Firestore連携)
async function handleSaveEvaluation(e) {
    e.preventDefault();
    
    const period = document.getElementById('evaluation-period').value;
    const subordinate = document.getElementById('subordinate-select').value;
    const overallComment = document.getElementById('overall-comment').value;
    
    if (!period || !subordinate) {
        showNotification('評価期間と対象者を選択してください', 'error');
        return;
    }
    
    const ratings = {};
    let hasRatings = false;
    const categories = window.pentagonChart.categories || [];
    categories.forEach(category => {
        const input = document.getElementById(`rating-${category.id}`);
        const value = parseFloat(input.value);
        if (!isNaN(value) && value >= 1 && value <= 5) {
            ratings[category.id] = value;
            hasRatings = true;
        }
    });
    
    if (!hasRatings) {
        showNotification('少なくとも1つの評価項目を入力してください', 'error');
        return;
    }
    
    const ratingValues = Object.values(ratings);
    const avgRating = ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length || 0;
    
    const newEvaluationData = {
        subordinate: subordinate,
        evaluator: app.currentUser.name,
        evaluatorId: app.currentUser.uid,
        status: 'completed', // 仮
        overallRating: parseFloat(avgRating.toFixed(1)),
        ratings: ratings,
        overallComment: overallComment,
        period: period,
    };
    
    try {
        await api.createEvaluation(newEvaluationData);
        showNotification('評価を保存しました！', 'success');
        setTimeout(() => {
            router.navigate('/evaluations');
        }, 1500);
    } catch (error) {
        showNotification('評価の保存に失敗しました', 'error');
        console.error("Failed to save evaluation:", error);
    }
}
