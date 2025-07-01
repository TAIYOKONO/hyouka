/**
 * utils/helpers.js - ヘルパー関数
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

// buildNavigation() は削除されました

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

// 評価入力表示更新
function updateRatingDisplay(categoryId) {
    const input = document.getElementById(`rating-${categoryId}`);
    const display = document.getElementById(`display-${categoryId}`);
    const value = parseFloat(input.value);
    
    if (isNaN(value) || value < 1 || value > 5) {
        display.textContent = i18n.t('form.not_entered');
        display.style.color = '#666';
    } else {
        display.textContent = `${value}/5`;
        display.style.color = '#1976d2';
        
        const stars = '⭐'.repeat(Math.floor(value));
        const halfStar = (value % 1 >= 0.5) ? '⭐' : '';
        display.innerHTML = `${value}/5<br><small>${stars}${halfStar}</small>`;
    }
    
    updateRadarChart();
}

// レーダーチャート更新
function updateRadarChart() {
    if (!window.pentagonChart) return;
    
    const newData = mockData.evaluationCategories.map(category => {
        const input = document.getElementById(`rating-${category.id}`);
        const value = parseFloat(input.value);
        return isNaN(value) ? 0 : Math.max(0, Math.min(5, value));
    });
    
    window.pentagonChart.updateData(newData);
}

// レーダーチャート初期化
function initializeRadarChart() {
    setTimeout(() => {
        try {
            window.pentagonChart = new PentagonChart('evaluation-radar-chart', mockData.evaluationCategories);
        } catch (error) {
            console.error('Error creating pentagon chart:', error);
        }
    }, 100);
}

// 評価保存処理
function handleSaveEvaluation(e) {
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
    mockData.evaluationCategories.forEach(category => {
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
    
    const totalRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
    const avgRating = totalRating / Object.keys(ratings).length || 0;
    
    const newEvaluation = {
        id: (mockData.evaluations.length + 1).toString(),
        subordinate: subordinate,
        evaluator: app.currentUser.name,
        status: 'completed',
        overallRating: Math.round(avgRating * 10) / 10,
        ratings: ratings,
        overallComment: overallComment,
        period: '2025年第1四半期',
        updatedAt: new Date().toISOString().split('T')[0]
    };
    
    mockData.evaluations.push(newEvaluation);
    
    showNotification(i18n.t('message.saved'), 'success');
    
    setTimeout(() => {
        showEvaluations();
    }, 1500);
}
