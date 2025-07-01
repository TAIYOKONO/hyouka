/**
 * pentagon-chart.js - 建設業評価システム専用五角形チャート
 * Chart.js不要の完全自作SVGチャート（新トンマナ対応）
 */

class PentagonChart {
    constructor(containerId, categories, data = [], options = {}) {
        this.container = document.getElementById(containerId);
        this.categories = categories || [];
        this.data = data.length ? data : categories.map(() => 0);
        
        // デフォルト設定
        this.options = {
            size: 280,
            maxValue: 5,
            strokeWidth: 2.5,
            pointRadius: 4,
            labelOffset: 25,
            gridLevels: 5,
            colors: {
                grid: 'var(--chart-grid-color)',
                data: 'var(--chart-primary-color)',
                dataFill: 'var(--chart-primary-fill)',
                points: 'var(--chart-point-color)',
                labels: 'var(--chart-text-color)',
                background: 'var(--chart-bg)'
            },
            animation: {
                enabled: true,
                duration: 800,
                easing: 'ease-out'
            },
            ...options
        };
        
        this.center = this.options.size / 2;
        this.maxRadius = this.options.size * 0.35;
        this.currentData = [...this.data];
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.warn('Pentagon chart container not found');
            return;
        }
        
        this.container.innerHTML = '';
        this.container.style.background = this.options.colors.background;
        this.container.style.borderRadius = 'var(--border-radius)';
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', this.options.size);
        this.svg.setAttribute('height', this.options.size);
        this.svg.setAttribute('viewBox', `0 0 ${this.options.size} ${this.options.size}`);
        this.svg.style.filter = 'drop-shadow(0 2px 4px rgba(36, 78, 255, 0.1))';
        
        this.drawGrid();
        this.drawData();
        this.drawLabels();
        this.addInteractivity();
        
        this.container.appendChild(this.svg);
        
        console.log('📊 Pentagon chart initialized');
    }
    
    /**
     * 五角形の頂点座標を計算
     * @param {number} radius - 半径
     * @returns {Array} 座標配列
     */
    getPoints(radius) {
        const points = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - (Math.PI / 2); // 上から開始
            const x = this.center + radius * Math.cos(angle);
            const y = this.center + radius * Math.sin(angle);
            points.push([x, y]);
        }
        return points;
    }
    
    /**
     * グリッド（背景の五角形）を描画
     */
    drawGrid() {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'pentagon-grid-group');
        
        // 同心円状の五角形を描画
        for (let i = 1; i <= this.options.gridLevels; i++) {
            const radius = (this.maxRadius * i) / this.options.gridLevels;
            const points = this.getPoints(radius);
            const path = this.createPathFromPoints(points, true);
            
            const gridPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            gridPath.setAttribute('d', path);
            gridPath.setAttribute('fill', 'none');
            gridPath.setAttribute('stroke', this.options.colors.grid);
            gridPath.setAttribute('stroke-width', '1');
            gridPath.setAttribute('opacity', '0.7');
            gridPath.setAttribute('class', 'pentagon-grid');
            
            gridGroup.appendChild(gridPath);
        }
        
        // 中心から各頂点への線を描画
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - (Math.PI / 2);
            const x = this.center + this.maxRadius * Math.cos(angle);
            const y = this.center + this.maxRadius * Math.sin(angle);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', this.center);
            line.setAttribute('y1', this.center);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', this.options.colors.grid);
            line.setAttribute('stroke-width', '1');
            line.setAttribute('opacity', '0.7');
            line.setAttribute('class', 'pentagon-grid-line');
            
            gridGroup.appendChild(line);
        }
        
        this.svg.appendChild(gridGroup);
    }
    
    /**
     * データ部分を描画
     */
    drawData() {
        this.dataGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.dataGroup.setAttribute('class', 'pentagon-data-group');
        
        // データエリア（塗りつぶし）
        this.dataPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.dataPath.setAttribute('fill', this.options.colors.dataFill);
        this.dataPath.setAttribute('stroke', this.options.colors.data);
        this.dataPath.setAttribute('stroke-width', this.options.strokeWidth);
        this.dataPath.setAttribute('class', 'pentagon-data');
        this.dataPath.style.filter = 'drop-shadow(0 2px 4px rgba(36, 78, 255, 0.15))';
        
        // データポイント
        this.dataPoints = [];
        for (let i = 0; i < 5; i++) {
            const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            point.setAttribute('r', this.options.pointRadius);
            point.setAttribute('fill', this.options.colors.points);
            point.setAttribute('stroke', '#ffffff');
            point.setAttribute('stroke-width', '2');
            point.setAttribute('class', `pentagon-point pentagon-point-${i}`);
            point.style.filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))';
            point.style.cursor = 'pointer';
            
            this.dataPoints.push(point);
            this.dataGroup.appendChild(point);
        }
        
        this.dataGroup.appendChild(this.dataPath);
        this.svg.appendChild(this.dataGroup);
        
        this.updateDataPath();
    }
    
    /**
     * ラベルを描画
     */
    drawLabels() {
        this.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.labelsGroup.setAttribute('class', 'pentagon-labels-group');
        
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - (Math.PI / 2);
            const labelRadius = this.maxRadius + this.options.labelOffset;
            const x = this.center + labelRadius * Math.cos(angle);
            const y = this.center + labelRadius * Math.sin(angle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', this.options.colors.labels);
            text.setAttribute('font-size', 'var(--font-size-xs)');
            text.setAttribute('font-weight', 'var(--font-weight-semibold)');
            text.setAttribute('class', 'pentagon-label');
            text.textContent = this.getCategoryName(i);
            
            this.labelsGroup.appendChild(text);
        }
        
        this.svg.appendChild(this.labelsGroup);
    }
    
    /**
     * データパスを更新
     */
    updateDataPath() {
        const dataPoints = [];
        
        for (let i = 0; i < 5; i++) {
            const value = this.currentData[i] || 0;
            const radius = (this.maxRadius * value) / this.options.maxValue;
            const angle = (i * 2 * Math.PI / 5) - (Math.PI / 2);
            const x = this.center + radius * Math.cos(angle);
            const y = this.center + radius * Math.sin(angle);
            dataPoints.push([x, y]);
            
            // ポイントの位置更新
            if (this.dataPoints[i]) {
                this.dataPoints[i].setAttribute('cx', x);
                this.dataPoints[i].setAttribute('cy', y);
            }
        }
        
        if (dataPoints.length > 0) {
            const path = this.createPathFromPoints(dataPoints, true);
            this.dataPath.setAttribute('d', path);
        }
    }
    
    /**
     * 座標配列からSVGパスを作成
     * @param {Array} points - 座標配列
     * @param {boolean} closePath - パスを閉じるか
     * @returns {string} SVGパス文字列
     */
    createPathFromPoints(points, closePath = false) {
        if (points.length === 0) return '';
        
        let path = `M ${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i][0]} ${points[i][1]}`;
        }
        
        if (closePath) {
            path += ' Z';
        }
        
        return path;
    }
    
    /**
     * カテゴリ名を取得（多言語対応）
     * @param {number} index - カテゴリインデックス
     * @returns {string} カテゴリ名
     */
    getCategoryName(index) {
        if (this.categories[index]) {
            return this.categories[index].name || this.categories[index];
        }
        
        // i18nが利用可能な場合
        if (typeof window !== 'undefined' && window.i18n) {
            const categoryKeys = [
                'category.safety',
                'category.quality', 
                'category.efficiency',
                'category.teamwork',
                'category.communication'
            ];
            return window.i18n.t(categoryKeys[index]);
        }
        
        // フォールバック
        const defaultNames = ['安全性', '品質', '効率性', 'チームワーク', 'コミュニケーション'];
        return defaultNames[index] || `項目${index + 1}`;
    }
    
    /**
     * インタラクティブ機能を追加
     */
    addInteractivity() {
        // ポイントのホバー効果
        this.dataPoints.forEach((point, index) => {
            point.addEventListener('mouseenter', () => {
                point.setAttribute('r', this.options.pointRadius + 2);
                point.style.filter = 'drop-shadow(0 2px 6px rgba(36, 78, 255, 0.3))';
                this.showTooltip(point, index);
            });
            
            point.addEventListener('mouseleave', () => {
                point.setAttribute('r', this.options.pointRadius);
                point.style.filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))';
                this.hideTooltip();
            });
        });
    }
    
    /**
     * ツールチップを表示
     * @param {SVGElement} point - ポイント要素
     * @param {number} index - インデックス
     */
    showTooltip(point, index) {
        this.hideTooltip(); // 既存のツールチップを削除
        
        const value = this.currentData[index] || 0;
        const categoryName = this.getCategoryName(index);
        
        // ツールチップ要素を作成
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'pentagon-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: var(--color-gray-800);
            color: var(--color-white);
            padding: 8px 12px;
            border-radius: var(--border-radius-sm);
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
            white-space: nowrap;
            z-index: var(--z-index-tooltip);
            pointer-events: none;
            box-shadow: var(--shadow-lg);
        `;
        
        this.tooltip.innerHTML = `
            <div style="margin-bottom: 2px; font-weight: var(--font-weight-semibold);">${categoryName}</div>
            <div style="color: var(--color-primary-light);">${value}/${this.options.maxValue} ${'⭐'.repeat(Math.floor(value))}</div>
        `;
        
        document.body.appendChild(this.tooltip);
        
        // 位置を計算
        const containerRect = this.container.getBoundingClientRect();
        const cx = parseFloat(point.getAttribute('cx'));
        const cy = parseFloat(point.getAttribute('cy'));
        
        // SVG座標を画面座標に変換
        const scale = containerRect.width / this.options.size;
        const screenX = containerRect.left + (cx * scale);
        const screenY = containerRect.top + (cy * scale);
        
        this.tooltip.style.left = `${screenX - this.tooltip.offsetWidth / 2}px`;
        this.tooltip.style.top = `${screenY - this.tooltip.offsetHeight - 10}px`;
    }
    
    /**
     * ツールチップを非表示
     */
    hideTooltip() {
        if (this.tooltip) {
            document.body.removeChild(this.tooltip);
            this.tooltip = null;
        }
    }
    
    /**
     * データを更新（アニメーション付き）
     * @param {Array} newData - 新しいデータ
     */
    updateData(newData) {
        if (!Array.isArray(newData) || newData.length !== 5) {
            console.warn('Invalid data provided to pentagon chart');
            return;
        }
        
        this.data = [...newData];
        
        if (this.options.animation.enabled) {
            this.animateToNewData(newData);
        } else {
            this.currentData = [...newData];
            this.updateDataPath();
        }
    }
    
    /**
     * アニメーション付きでデータを更新
     * @param {Array} targetData - 目標データ
     */
    animateToNewData(targetData) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const startData = [...this.currentData];
        const startTime = performance.now();
        const duration = this.options.animation.duration;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // イージング関数適用
            const easedProgress = this.easeOut(progress);
            
            // 各データポイントを補間
            for (let i = 0; i < 5; i++) {
                const start = startData[i] || 0;
                const target = targetData[i] || 0;
                this.currentData[i] = start + (target - start) * easedProgress;
            }
            
            this.updateDataPath();
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
                this.currentData = [...targetData];
                this.updateDataPath();
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    /**
     * イージング関数（ease-out）
     * @param {number} t - 進行度（0-1）
     * @returns {number} イージング適用後の値
     */
    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    /**
     * チャートをリサイズ
     * @param {number} newSize - 新しいサイズ
     */
    resize(newSize) {
        this.options.size = newSize;
        this.center = newSize / 2;
        this.maxRadius = newSize * 0.35;
        
        this.svg.setAttribute('width', newSize);
        this.svg.setAttribute('height', newSize);
        this.svg.setAttribute('viewBox', `0 0 ${newSize} ${newSize}`);
        
        this.redraw();
    }
    
    /**
     * チャートを再描画
     */
    redraw() {
        this.svg.innerHTML = '';
        this.drawGrid();
        this.drawData();
        this.drawLabels();
        this.addInteractivity();
    }
    
    /**
     * チャートデータをエクスポート
     * @returns {Object} チャートデータ
     */
    exportData() {
        return {
            categories: this.categories,
            data: this.data,
            currentData: this.currentData,
            options: this.options,
            stats: this.getStats()
        };
    }
    
    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        const values = this.data.filter(v => v > 0);
        const total = values.reduce((sum, v) => sum + v, 0);
        const average = values.length > 0 ? total / values.length : 0;
        const max = Math.max(...values);
        const min = Math.min(...values.filter(v => v > 0));
        
        return {
            total,
            average: Math.round(average * 10) / 10,
            max,
            min: values.length > 0 ? min : 0,
            completedItems: values.length,
            completionRate: Math.round((values.length / 5) * 100)
        };
    }
    
    /**
     * SVGを画像として出力
     * @param {string} format - 出力形式（'png', 'svg'）
     * @returns {Promise<string>} データURL
     */
    async exportAsImage(format = 'png') {
        if (format === 'svg') {
            const svgData = new XMLSerializer().serializeToString(this.svg);
            return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
        }
        
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            canvas.width = this.options.size * 2; // 高解像度
            canvas.height = this.options.size * 2;
            
            const svgData = new XMLSerializer().serializeToString(this.svg);
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = () => {
                ctx.scale(2, 2); // 高解像度描画
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL(`image/${format}`));
            };
            
            img.src = url;
        });
    }
    
    /**
     * チャートを破棄
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.hideTooltip();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // イベントリスナーを削除
        this.dataPoints.forEach(point => {
            point.removeEventListener('mouseenter', null);
            point.removeEventListener('mouseleave', null);
        });
        
        console.log('📊 Pentagon chart destroyed');
    }
}

/**
 * 複数チャート管理クラス
 */
class PentagonChartManager {
    constructor() {
        this.charts = new Map();
    }
    
    /**
     * チャートを作成・登録
     * @param {string} id - チャートID
     * @param {string} containerId - コンテナID
     * @param {Array} categories - カテゴリ
     * @param {Array} data - データ
     * @param {Object} options - オプション
     * @returns {PentagonChart} チャートインスタンス
     */
    createChart(id, containerId, categories, data, options) {
        if (this.charts.has(id)) {
            this.destroyChart(id);
        }
        
        const chart = new PentagonChart(containerId, categories, data, options);
        this.charts.set(id, chart);
        
        return chart;
    }
    
    /**
     * チャートを取得
     * @param {string} id - チャートID
     * @returns {PentagonChart|null} チャートインスタンス
     */
    getChart(id) {
        return this.charts.get(id) || null;
    }
    
    /**
     * チャートを更新
     * @param {string} id - チャートID
     * @param {Array} newData - 新しいデータ
     */
    updateChart(id, newData) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.updateData(newData);
        }
    }
    
    /**
     * チャートを破棄
     * @param {string} id - チャートID
     */
    destroyChart(id) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.destroy();
            this.charts.delete(id);
        }
    }
    
    /**
     * すべてのチャートを破棄
     */
    destroyAll() {
        this.charts.forEach((chart, id) => {
            chart.destroy();
        });
        this.charts.clear();
    }
    
    /**
     * 登録されているチャート一覧を取得
     * @returns {Array} チャートID一覧
     */
    getChartIds() {
        return Array.from(this.charts.keys());
    }
}

// グローバルインスタンスを作成
const pentagonChartManager = new PentagonChartManager();

// グローバルに公開
if (typeof window !== 'undefined') {
    window.PentagonChart = PentagonChart;
    window.PentagonChartManager = PentagonChartManager;
    window.pentagonChartManager = pentagonChartManager;
}

// 従来の関数との互換性保持
function getCategoryName(index) {
    if (typeof window !== 'undefined' && window.i18n) {
        const categoryKeys = [
            'category.safety',
            'category.quality', 
            'category.efficiency',
            'category.teamwork',
            'category.communication'
        ];
        return window.i18n.t(categoryKeys[index]);
    }
    
    const defaultNames = ['安全性', '品質', '効率性', 'チームワーク', 'コミュニケーション'];
    return defaultNames[index] || `項目${index + 1}`;
}

if (typeof window !== 'undefined') {
    window.getCategoryName = getCategoryName;
}

console.log('📊 pentagon-chart.js loaded - Advanced Pentagon Chart ready');
