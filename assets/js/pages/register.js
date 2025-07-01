/**
 * register.js - 新規ユーザー登録ページ
 */
async function showRegistrationPage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>招待情報を確認中...</p></div>`;

    try {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const token = params.get('token');

        if (!token) throw new Error("招待トークンが見つかりません。");

        const invitation = await api.getInvitationByToken(token);
        if (!invitation || invitation.used) {
            throw new Error("この招待リンクは無効か、既に使用されています。");
        }

        mainContent.innerHTML = `
            <div class="login-page">
                <div class="login-container">
                    <div class="login-header"><h1>ユーザー登録</h1><p>ようこそ！情報を入力してください。</p></div>
                    <form id="registration-form">
                        <input type="hidden" id="reg-role" value="${invitation.role}">
                        <input type="hidden" id="reg-token" value="${token}">
                        <div class="form-group"><label>名前</label><input type="text" id="reg-name" required></div>
                        <div class="form-group"><label>メールアドレス</label><input type="email" id="reg-email" required></div>
                        <div class="form-group"><label>パスワード</label><input type="password" id="reg-password" required></div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">登録</button>
                    </form>
                </div>
            </div>`;
        
        document.getElementById('registration-form').addEventListener('submit', handleRegistration);

    } catch (error) {
        mainContent.innerHTML = `<div class="page-content"><p>エラー: ${error.message}</p><a href="#">ログインページへ</a></div>`;
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const token = document.getElementById('reg-token').value;

    if (!name || !email || !password || !role || !token) {
        return showNotification("すべての項目を入力してください。", "error");
    }

    try {
        await api.createUserWithPendingApproval({name, email, password, role, token});
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
