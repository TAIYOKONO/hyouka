// polygon-chart.js の全コード（比較機能対応版）
/**
 * polygon-chart.js - 動的多角形チャート (比較機能対応)
 */
class PolygonChart {
    constructor(containerId, categories = [], data1 = [], data2 = [], options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.categories = categories;
        this.numVertices = this.categories.length;
        this.data1 = data1.length ? data1 : this.categories.map(() => 0);
        this.data2 = data2.length ? data2 : []; // 2つ目のデータセット

        this.options = {
            size: 280,
            maxValue: 5,
            levels: 5,
            labelOffset: 30,
            color1: 'rgba(36, 78, 255, 0.2)',  // データ1の色
            stroke1: 'rgba(36, 78, 255, 1)',
            color2: 'rgba(220, 53, 69, 0.2)',   // データ2の色
            stroke2: 'rgba(220, 53, 69, 1)',
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
        
        if (this.numVertices < 3) return;

        this.drawGrid();
        this.drawDataPath(this.data1, this.options.color1, this.options.stroke1);
        if (this.data2.length > 0) {
            this.drawDataPath(this.data2, this.options.color2, this.options.stroke2);
        }
        this.drawLabels();
        
        this.container.appendChild(this.svg);
    }

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

    drawDataPath(data, fillColor, strokeColor) {
        const pathData = data.map((value, i) => {
            const point = this.getPoint(value, i);
            return `${point.x},${point.y}`;
        }).join(' ');
        
        const dataPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        dataPolygon.setAttribute('points', pathData);
        dataPolygon.setAttribute('fill', fillColor);
        dataPolygon.setAttribute('stroke', strokeColor);
        dataPolygon.setAttribute('stroke-width', '2');
        this.svg.appendChild(dataPolygon);
    }

    drawLabels() {
        this.categories.forEach((category, i) => {
            const point = this.getPoint(this.options.maxValue, i);
            const labelPoint = {
                x: this.center + (point.x - this.center) * 1.25,
                y: this.center + (point.y - this.center) * 1.15
            };
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelPoint.x);
            text.setAttribute('y', labelPoint.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.style.fontSize = '12px';
            text.textContent = category.name || category.itemName;
            this.svg.appendChild(text);
        });
    }
}
