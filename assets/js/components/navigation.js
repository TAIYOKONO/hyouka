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
        if (!header || !this.currentUser) {
            if(header) header.style.display = 'none';
            return;
        }
        header.style.display = 'block';

        this.setupMenuItems();
        
        header.innerHTML = `
            <div class="header-content">
                <div class="pc-nav-elements">
                    <div class="logo"><a href="#/dashboard"><h1>評価システム</h1></a></div>
                    <nav class="main-navigation">
                        <ul class="nav-menu">${this.renderMenuItems()}</ul>
                    </nav>
                    <div class="user-menu">
                        ${this.renderUserInfo()}
                        <button id="logout-button" class="btn btn-secondary btn-sm">ログアウト</button>
                    </div>
                </div>
                <button class="mobile-menu-toggle" id="mobile-menu-toggle">☰</button>
            </div>
            <ul class="mobile-nav-menu" id="mobile-nav-menu">
                ${this.renderMenuItems(true)}
                <li><a href="#" id="mobile-logout-button">ログアウト</a></li>
            </ul>
        `;
        this.attachEventListeners();
    }

    setupMenuItems() {
        this.menuItems = [
            { id: 'dashboard', label: 'ダッシュボード', path: '#/dashboard', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'evaluations', label: '評価一覧', path: '#/evaluations', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'goal-setting', label: '個人目標設定', path: '#/goal-setting', roles: ['evaluator', 'worker'] },
            { id: 'users', label: 'ユーザー管理', path: '#/users', roles: ['admin', 'evaluator'] },
            { id: 'settings', label: '評価項目設定', path: '#/settings', roles: ['admin'] },
        ];
    }
    
    renderMenuItems() {
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
            </div>`;
    }

    attachEventListeners() {
        document.getElementById('logout-button')?.addEventListener('click', () => authManager.logout());
        document.getElementById('mobile-logout-button')?.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.logout();
        });

        const toggleButton = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-nav-menu');
        const header = document.getElementById('app-header');
        if(toggleButton && mobileMenu && header) {
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenu.style.display = mobileMenu.style.display === 'block' ? 'none' : 'block';
            });
        }
        document.addEventListener('click', (e) => {
            if (mobileMenu && mobileMenu.style.display === 'block' && !header.contains(e.target)) {
                mobileMenu.style.display = 'none';
            }
        });
    }
}
window.navigation = new NavigationManager();
