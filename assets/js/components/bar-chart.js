/**
 * bar-chart.js - シンプルな横棒グラフコンポーネント
 */
class BarChart {
    constructor(containerId, data, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`BarChart container with id "${containerId}" not found.`);
            return;
        }
        
        // dataは { label: string, value: number } の配列を想定
        this.data = data; 
        
        this.options = {
            maxValue: 5,
            barColor: 'var(--color-primary)',
            labelColor: 'var(--color-text-secondary)',
            valueColor: 'var(--color-text-primary)',
            ...options
        };

        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '12px';
        this.container.style.fontFamily = 'system-ui, sans-serif';

        this.drawBars();
    }

    drawBars() {
        if (!this.data || this.data.length === 0) {
            this.container.innerHTML = '<p>表示するデータがありません。</p>';
            return;
        }
        
        this.data.forEach(item => {
            const percentage = (item.value / this.options.maxValue) * 100;

            const barWrapper = document.createElement('div');
            barWrapper.style.cssText = `display: grid; grid-template-columns: 120px 1fr 40px; align-items: center; gap: 8px;`;

            const label = document.createElement('div');
            label.textContent = item.label;
            label.style.cssText = `font-size: 13px; color: ${this.options.labelColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
            
            const barContainer = document.createElement('div');
            barContainer.style.cssText = `width: 100%; background-color: #f0f0f0; border-radius: 4px; overflow: hidden;`;
            
            const bar = document.createElement('div');
            bar.style.cssText = `width: ${percentage}%; height: 20px; background-color: ${this.options.barColor}; transition: width 0.5s ease-out;`;
            
            const value = document.createElement('div');
            value.textContent = item.value.toFixed(1);
            value.style.cssText = `font-size: 13px; font-weight: 600; color: ${this.options.valueColor}; text-align: right;`;
            
            barContainer.appendChild(bar);
            barWrapper.appendChild(label);
            barWrapper.appendChild(barContainer);
            barWrapper.appendChild(value);
            
            this.container.appendChild(barWrapper);
        });
    }
}
