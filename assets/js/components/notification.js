/**
 * notification.js - 通知管理 (最終版)
 */
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createContainer());
        } else {
            this.createContainer();
        }
        console.log('🔔 Notification Manager initialized');
    }

    createContainer() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.setupStyles();
        document.body.appendChild(this.container);
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #notification-container {
                position: fixed; top: 20px; right: 20px; z-index: 9999;
                display: flex; flex-direction: column; gap: 10px;
            }
            .notification-item {
                background: #fff; color: #333; border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 16px; display: flex; align-items: center;
                gap: 12px; min-width: 300px;
                transform: translateX(120%); opacity: 0;
                transition: transform 0.4s ease, opacity 0.4s ease;
            }
            .notification-item.show { transform: translateX(0); opacity: 1; }
            .notification-icon { font-size: 20px; }
            .notification-content { flex-grow: 1; }
            .notification-title { font-weight: 600; margin-bottom: 4px; }
            .notification-message { font-size: 14px; }
            .notification-close { cursor: pointer; opacity: 0.5; font-size: 20px; background: none; border: none; }
            .notification-close:hover { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', options = {}) {
        if (!this.container) this.createContainer();
        
        const config = { duration: 5000, ...options };
        const id = `notification-${Date.now()}`;
        
        const notification = this.createNotification(id, message, type, config);
        this.notifications.set(id, notification);
        this.container.appendChild(notification.element);

        setTimeout(() => notification.element.classList.add('show'), 50);

        if (config.duration) {
            notification.timer = setTimeout(() => this.hide(id), config.duration);
        }
    }

    createNotification(id, message, type, config) {
        const element = document.createElement('div');
        element.className = `notification-item`;
        element.style.borderLeft = `4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'}`;
        
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const titles = { success: '成功', error: 'エラー', info: '情報' };
        
        element.innerHTML = `
            <div class="notification-icon">${icons[type] || 'ℹ️'}</div>
            <div class="notification-content">
                <div class="notification-title">${titles[type] || '通知'}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        element.querySelector('.notification-close').addEventListener('click', () => this.hide(id));
        return { id, element, timer: null };
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        clearTimeout(notification.timer);
        notification.element.classList.remove('show');
        
        notification.element.addEventListener('transitionend', () => {
            notification.element.remove();
            this.notifications.delete(id);
        }, { once: true });
    }
}

window.notificationManager = new NotificationManager();
function showNotification(message, type = 'info', options = {}) {
    // グローバルインスタンスが利用可能か確認
    if (window.notificationManager) {
        window.notificationManager.show(message, type, options);
    } else {
        console.error("NotificationManager is not initialized.");
    }
}
