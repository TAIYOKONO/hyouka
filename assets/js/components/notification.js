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
            .notification-close { cursor: pointer; opacity: 0.5; }
            .notification-close:hover { opacity: 1; }
            .notification-success { border-left: 4px solid #4CAF50; }
            .notification-error { border-left: 4px solid #F44336; }
            .notification-info { border-left: 4px solid #2196F3; }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', options = {}) {
        if (!this.container) this.createContainer();
        
        const config = { duration: 5000, closeButton: true, ...options };
        const id = `notification-${Date.now()}-${Math.random()}`;
        
        const notification = this.createNotification(id, message, type, config);
        this.notifications.set(id, notification);
        this.container.appendChild(notification.element);

        setTimeout(() => notification.element.classList.add('show'), 50);

        if (config.duration) {
            notification.timer = setTimeout(() => this.hide(id), config.duration);
        }
        console.log(`🔔 Notification shown: ${type} - ${message}`);
    }

    createNotification(id, message, type, config) {
        const element = document.createElement('div');
        element.className = `notification-item notification-${type}`;
        
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const titles = { success: '成功', error: 'エラー', info: '情報' };
        
        element.innerHTML = `
            <div class="notification-icon">${icons[type] || 'ℹ️'}</div>
            <div class="notification-content">
                <div class="notification-title">${titles[type] || '通知'}</div>
                <div class="notification-message">${message}</div>
            </div>
            ${config.closeButton ? '<div class="notification-close">&times;</div>' : ''}
        `;
        
        if (config.closeButton) {
            element.querySelector('.notification-close').addEventListener('click', () => this.hide(id));
        }
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

const notificationManager = new NotificationManager();
function showNotification(message, type = 'info', options = {}) {
    notificationManager.show(message, type, options);
}
