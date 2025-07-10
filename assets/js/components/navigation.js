/**
 * navigation.js - グローバルナビゲーション管理 (最終版)
 */
class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.menuItems = [];
    }

    async render() {
        this.currentUser = authManager.getCurrentUser();
        
        const header = document.getElementById('app-header');
        if (!header) return;

        if (!this.currentUser) {
            header.style.display = 'none';
            return;
        }

        header.style.display = 'block';

        const notifications = await api.getNotificationsForUser(this.currentUser.uid);
        this.setupMenuItems(notifications.length);
        
        header.innerHTML = `
            <div class="header-content">
                <div class="logo"><a href="#/dashboard" class="nav-link-logo">🏗️ 建設業評価システム</a></div>
                <nav class="main-navigation">
                    <ul class="nav-menu" id="nav-menu">${this.renderMenuItems()}</ul>
                </nav>
                <div class="user-menu">
                    ${this.renderUserInfo()}
                    <div class="language-selector">
                        <select id="language-select" onchange="i18n.setLanguage(this.value)">
                            <option value="ja">🇯🇵 日本語</option>
                            <option value="en">🇬🇧 English</option>
                            <option value="id">🇮🇩 Indonesia</option>
                            <option value="vi">🇻🇳 Tiếng Việt</option>
                        </select>
                    </div>
                    <button id="logout-button" class="btn btn-secondary">ログアウト</button>
                </div>
                <button class="mobile-menu-toggle" id="mobile-menu-toggle">☰</button>
            </div>
            <div class="mobile-nav-menu" id="mobile-nav-menu">
                <ul>${this.renderMenuItems(true)}</ul>
            </div>
        `;
        this.attachEventListeners();
    }

    setupMenuItems(notificationCount = 0) {
        const userManagementLabel = `ユーザー管理 ${notificationCount > 0 ? `<span class="notification-badge">${notificationCount}</span>` : ''}`;
        this.menuItems = [
            { id: 'dashboard', label: 'ダッシュボード', path: '#/dashboard', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'evaluations', label: '評価一覧', path: '#/evaluations', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'users', label: userManagementLabel, path: '#/users', roles: ['admin', 'evaluator'] },
            { id: 'settings', label: '評価項目設定', path: '#/settings', roles: ['admin'] },
        ];
    }
    
    renderMenuItems(isMobile = false) {
        if (!this.currentUser) return '';
        return this.menuItems
            .filter(item => item.roles.includes(this.currentUser.role))
            .map(item => `<li><a href="${item.path}" class="nav-link">${item.label}</a></li>`)
            .join('');
    }

    renderUserInfo() {
        const roleDisplayNames = { admin: '管理者', evaluator: '評価者', worker: '作業員' };
        const roleName = roleDisplayNames[this.currentUser.role] || this.currentUser.role;
        return `
            <div class="user-info">
                <div class="user-avatar">${(this.currentUser.name || 'U').charAt(0)}</div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.name}</div>
                    <div class="user-role">${roleName}</div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.getElementById('logout-button')?.addEventListener('click', () => {
            authManager.logout();
        });

        const toggleButton = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-nav-menu');
        if(toggleButton && mobileMenu) {
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenu.classList.toggle('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (mobileMenu && mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !toggleButton.contains(e.target)) {
                mobileMenu.classList.remove('open');
            }
        });
        
        const langSelect = document.getElementById('language-select');
        if (langSelect && window.i18n) {
            langSelect.value = window.i18n.currentLanguage;
        }
    }
} // ★★★ 抜けていたクラスの閉じ括弧

window.navigation = new NavigationManager();
