/**
 * ナビゲーションシステム
 * ヘッダーメニューとユーザー情報の表示管理
 */
class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.menuItems = [];
        this.isMenuOpen = false;
        
        console.log('Navigation manager initialized');
    }

    render() {
        this.currentUser = window.auth?.getCurrentUser();
        this.setupMenuItems();
        this.renderHeader();
        this.setupEventListeners();
    }

    setupMenuItems() {
        if (!this.currentUser) {
            this.menuItems = [];
            return;
        }

        // 基本メニューアイテム
        this.menuItems = [
            {
                id: 'dashboard',
                label: 'ダッシュボード',
                path: '/dashboard',
                icon: 'icon-home',
                roles: ['admin', 'manager', 'supervisor', 'employee']
            },
            {
                id: 'evaluations',
                label: '評価一覧',
                path: '/evaluations',
                icon: 'icon-clipboard',
                roles: ['admin', 'manager', 'supervisor', 'employee']
            }
        ];

        // 権限に応じてメニュー追加
        if (window.auth?.hasRole('admin') || window.auth?.hasRole('manager')) {
            this.menuItems.push({
                id: 'users',
                label: 'ユーザー管理',
                path: '/users',
                icon: 'icon-users',
                roles: ['admin', 'manager']
            });
        }

        if (window.auth?.hasRole('admin')) {
            this.menuItems.push({
                id: 'reports',
                label: 'レポート',
                path: '/reports',
                icon: 'icon-chart',
                roles: ['admin']
            });

            this.menuItems.push({
                id: 'settings',
                label: '設定',
                path: '/settings',
                icon: 'icon-settings',
                roles: ['admin']
            });
        }

        // 現在のユーザーの権限でフィルタリング
        this.menuItems = this.menuItems.filter(item => 
            item.roles.includes(this.currentUser?.role)
        );
    }

    renderHeader() {
        const header = document.getElementById('app-header');
        if (!header) return;

        if (!this.currentUser) {
            // ログインしていない場合は最小限のヘッダー
            header.innerHTML = `
                <div class="header-content">
                    <div class="logo">
                        <h1>建設業評価システム</h1>
                    </div>
                </div>
            `;
            return;
        }

        header.innerHTML = `
            <div class="header-content">
                <div class="logo">
                    <h1>建設業評価システム</h1>
                </div>
                
                <nav class="main-navigation">
                    <ul class="nav-menu" id="nav-menu">
                        ${this.renderMenuItems()}
                    </ul>
                    
                    <!-- モバイルメニューボタン -->
                    <button class="mobile-menu-toggle" id="mobile-menu-toggle">
                        <span class="hamburger"></span>
                        <span class="hamburger"></span>
                        <span class="hamburger"></span>
                    </button>
                </nav>
                
                <div class="user-menu">
                    <div class="user-info" id="user-info">
                        <div class="user-avatar">
                            ${this.currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-details">
                            <div class="user-name">${this.currentUser.name}</div>
                            <div class="user-role">${this.getRoleDisplayName(this.currentUser.role)}</div>
                        </div>
                        <button class="user-menu-toggle" id="user-menu-toggle">
                            <i class="icon-chevron-down"></i>
                        </button>
                    </div>
                    
                    <div class="user-dropdown" id="user-dropdown">
                        <div class="dropdown-header">
                            <div class="user-info-detail">
                                <div class="user-name">${this.currentUser.name}</div>
                                <div class="user-email">${this.currentUser.email || ''}</div>
                                <div class="user-department">${this.currentUser.department || ''}</div>
                            </div>
                        </div>
                        
                        <div class="dropdown-menu">
                            <a href="#" class="dropdown-item" id="profile-link">
                                <i class="icon-user"></i>
                                プロフィール
                            </a>
                            <a href="#" class="dropdown-item" id="preferences-link">
                                <i class="icon-settings"></i>
                                設定
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item" id="logout-link">
                                <i class="icon-logout"></i>
                                ログアウト
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // アクティブメニューの設定
        this.setActiveMenuItem();
    }

    renderMenuItems() {
        return this.menuItems.map(item => `
            <li class="nav-item">
                <a href="#" class="nav-link" data-path="${item.path}" data-menu-id="${item.id}">
                    <i class="${item.icon}"></i>
                    <span class="nav-label">${item.label}</span>
                </a>
            </li>
        `).join('');
    }

    setActiveMenuItem() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const path = link.dataset.path;
            if (currentPath === path || (path !== '/' && currentPath.startsWith(path))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        // ナビゲーションリンククリック
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const path = navLink.dataset.path;
                if (path && window.router) {
                    window.router.navigate(path);
                }
            }
        });

        // ユーザーメニュートグル
        const userMenuToggle = document.getElementById('user-menu-toggle');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuToggle && userDropdown) {
            userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // 外部クリックでメニューを閉じる
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.user-menu')) {
                    userDropdown.classList.remove('show');
                }
            });
        }

        // モバイルメニュートグル
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                this.isMenuOpen = !this.isMenuOpen;
                navMenu.classList.toggle('show', this.isMenuOpen);
                mobileMenuToggle.classList.toggle('active', this.isMenuOpen);
            });
        }

        // ユーザードロップダウンアイテム
        document.getElementById('profile-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfile();
        });

        document.getElementById('preferences-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPreferences();
        });

        document.getElementById('logout-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // ウィンドウリサイズでモバイルメニューを閉じる
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.isMenuOpen = false;
                navMenu?.classList.remove('show');
                mobileMenuToggle?.classList.remove('active');
            }
        });
    }

    showProfile() {
        if (window.notification) {
            window.notification.info('プロフィール画面は開発中です');
        }
    }

    showPreferences() {
        if (window.notification) {
            window.notification.info('設定画面は開発中です');
        }
    }

    handleLogout() {
        if (window.notification) {
            window.notification.confirm(
                'ログアウトしますか？',
                () => {
                    if (window.auth) {
                        window.auth.logout();
                    }
                }
            );
        } else {
            if (confirm('ログアウトしますか？')) {
                if (window.auth) {
                    window.auth.logout();
                }
            }
        }
    }

    getRoleDisplayName(role) {
        const roleNames = {
            admin: '管理者',
            manager: 'マネージャー',
            supervisor: '主任',
            employee: '従業員'
        };
        return roleNames[role] || role;
    }

    updateUserInfo() {
        this.currentUser = window.auth?.getCurrentUser();
        this.render();
    }

    hideNavigation() {
        const header = document.getElementById('app-header');
        if (header) {
            header.style.display = 'none';
        }
    }

    showNavigation() {
        const header = document.getElementById('app-header');
        if (header) {
            header.style.display = 'block';
        }
    }

    // 通知バッジの表示
    showNotificationBadge(count) {
        const userInfo = document.getElementById('user-info');
        if (!userInfo) return;

        let badge = userInfo.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'notification-badge';
            userInfo.appendChild(badge);
        }

        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count.toString();
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    // メニューアイテムの動的追加
    addMenuItem(item) {
        // 権限チェック
        if (!item.roles.includes(this.currentUser?.role)) {
            return;
        }

        this.menuItems.push(item);
        this.render();
    }

    // メニューアイテムの削除
    removeMenuItem(id) {
        this.menuItems = this.menuItems.filter(item => item.id !== id);
        this.render();
    }

    // デバッグ用
    debug() {
        return {
            currentUser: this.currentUser,
            menuItems: this.menuItems,
            isMenuOpen: this.isMenuOpen
        };
    }
}

// グローバルインスタンスの作成
window.navigation = new NavigationManager();
