/**
 * polygon-chart.js - 動的多角形チャート
 * 項目数に応じてN角形を動的に描画する
 */
class PolygonChart {
    constructor(containerId, categories = [], data = [], options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.categories = categories;
        this.numVertices = this.categories.length; // ★ 頂点数を動的に設定
        this.data = data.length ? data : this.categories.map(() => 0);
        
        this.options = {
            size: 280,
            maxValue: 5,
            levels: 5,
            labelOffset: 30,
            ...options
        };
        
        this.center = this.options.size / 2;
        this.radius = this.options.size * 0.35;
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = '';
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', this.options.size);
        this.svg.setAttribute('height', this.options.size);
        this.svg.setAttribute('viewBox', `0 0 ${this.options.size} ${this.options.size}`);
        
        if (this.numVertices < 3) return; // 3頂点未満は描画しない

        this.drawGrid();
        this.drawDataPath();
        this.drawLabels();
        
        this.container.appendChild(this.svg);
    }

    // ★ 頂点数を元に座標を計算するよう修正
    getPoint(value, index) {
        const angle = (Math.PI * 2 * index / this.numVertices) - (Math.PI / 2);
        const radius = (this.radius * value) / this.options.maxValue;
        const x = this.center + radius * Math.cos(angle);
        const y = this.center + radius * Math.sin(angle);
        return { x, y };
    }
    
    drawGrid() {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (let level = 1; level <= this.options.levels; level++) {
            const pathData = this.categories.map((_, i) => {
                const point = this.getPoint(this.options.maxValue * (level / this.options.levels), i);
                return `${point.x},${point.y}`;
            }).join(' ');
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', pathData);
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', '#E0E0E0');
            gridGroup.appendChild(polygon);
        }
        this.svg.appendChild(gridGroup);
    }

    drawDataPath() {
        const pathData = this.data.map((value, i) => {
            const point = this.getPoint(value, i);
            return `${point.x},${point.y}`;
        }).join(' ');
        
        const dataPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        dataPolygon.setAttribute('points', pathData);
        dataPolygon.setAttribute('fill', 'rgba(36, 78, 255, 0.2)');
        dataPolygon.setAttribute('stroke', 'rgba(36, 78, 255, 1)');
        dataPolygon.setAttribute('stroke-width', '2');
        this.svg.appendChild(dataPolygon);
    }

    drawLabels() {
        this.categories.forEach((category, i) => {
            const point = this.getPoint(this.options.maxValue, i);
            const labelPoint = {
                x: this.center + (point.x - this.center) * 1.2,
                y: this.center + (point.y - this.center) * 1.1
            };
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelPoint.x);
            text.setAttribute('y', labelPoint.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.style.fontSize = '12px';
            text.textContent = category.name;
            this.svg.appendChild(text);
        });
    }

    updateData(newData) {
        this.data = newData;
        this.svg.innerHTML = ''; // 簡単のため再描画
        this.init();
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
