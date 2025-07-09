/**
 * register.js - 新規ユーザー登録ページ (最終版)
 */
async function showRegistrationPage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>招待情報を確認中...</p></div>`;

    try {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const token = params.get('token');
        if (!token) throw new Error("招待トークンが見つかりません。");

        const invitation = await api.getInvitationByToken(token);
        if (!invitation || invitation.used) {
            throw new Error("この招待リンクは無効か、既に使用されています。");
        }

        mainContent.innerHTML = `
            <div class="login-page">
                <div class="login-container" style="max-width: 550px;">
                    <div class="login-header"><h1>ユーザー登録</h1><p>ようこそ！情報を入力して登録を申請してください。</p></div>
                    <form id="registration-form">
                        <input type="hidden" id="reg-role" value="${invitation.role}">
                        <input type="hidden" id="reg-token" value="${token}">
                        
                        <div class="form-group"><label for="reg-name">氏名</label><input type="text" id="reg-name" required></div>
                        <div class="form-group"><label for="reg-email">メールアドレス</label><input type="email" id="reg-email" required></div>
                        <div class="form-group"><label for="reg-password">パスワード</label><input type="password" id="reg-password" required></div>
                        
                        <hr style="margin: 2rem 0;">

                        <div class="form-group"><label for="reg-department">部署</label><input type="text" id="reg-department"></div>
                        <div class="form-group"><label for="reg-position">役職 / 職種</label><input type="text" id="reg-position"></div>
                        <div class="form-group"><label for="reg-employee-id">社員番号</label><input type="text" id="reg-employee-id"></div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%;">登録申請</button>
                    </form>
                </div>
            </div>`;
        document.getElementById('registration-form').addEventListener('submit', handleRegistration);
    } catch (error) {
        mainContent.innerHTML = `<div class="page-content"><p>エラー: ${error.message}</p><a href="#" onclick="router.navigate('/')">ログインページへ</a></div>`;
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const token = document.getElementById('reg-token').value;

    const department = document.getElementById('reg-department').value;
    const position = document.getElementById('reg-position').value;
    const employeeId = document.getElementById('reg-employee-id').value;

    if (!name || !email || !password) {
        return showNotification("氏名、メールアドレス、パスワードは必須です。", "error");
    }

    try {
        const userData = {
            name, email, password, role, token,
            department, position, employeeId
        };
        await api.createUserWithPendingApproval(userData);
        document.getElementById('main-content').innerHTML = `
            <div class="login-page">
                <div class="login-container text-center">
                    <h2>登録申請が完了しました</h2>
                    <p>アカウントが管理者に承認されるまで、しばらくお待ちください。</p>
                    <a href="#" onclick="router.navigate('/')">ログインページに戻る</a>
                </div>
            </div>`;
    } catch (error) {
        showNotification(`登録に失敗しました: ${error.message}`, 'error');
    }
}
