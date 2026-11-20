/**
 * Ündes — Login / Register page
 */
window.UNDES.page(function () {
  var auth = window.UNDES.auth;
  var i18n = window.UNDES.i18nService;
  var esc = window.UNDES.escapeHtml;
  var root = document.getElementById('authRoot');

  var mode = (new URLSearchParams(location.search).get('mode') === 'register') ? 'register' : 'login';
  var next = new URLSearchParams(location.search).get('next') || 'index.html';

  // already signed in?
  if (auth.currentUser()) { location.href = next; return; }

  render();

  function render() {
    var isReg = mode === 'register';
    root.innerHTML =
      '<h1 class="auth-card__title" data-i18n="' + (isReg ? 'auth.register.title' : 'auth.login.title') + '">' + i18n.t(isReg ? 'auth.register.title' : 'auth.login.title') + '</h1>' +
      '<p class="auth-card__sub" data-i18n="' + (isReg ? 'auth.register.sub' : 'auth.login.sub') + '">' + i18n.t(isReg ? 'auth.register.sub' : 'auth.login.sub') + '</p>' +
      (window.UNDES.config.isDemo ? '<div class="demo-banner" style="border-radius:8px;margin-bottom:20px;" data-i18n="auth.demoNote">' + i18n.t('auth.demoNote') + '</div>' : '') +
      '<form id="authForm">' +
        (isReg ? '<div class="field"><label class="field__label" data-i18n="auth.name">' + i18n.t('auth.name') + '</label><input class="input" type="text" id="nameInput" required /></div>' : '') +
        '<div class="field"><label class="field__label" data-i18n="auth.email">' + i18n.t('auth.email') + '</label><input class="input" type="email" id="emailInput" required placeholder="reader@undes.app" /></div>' +
        '<div class="field"><label class="field__label" data-i18n="auth.password">' + i18n.t('auth.password') + '</label><input class="input" type="password" id="passwordInput" required placeholder="••••••••" /></div>' +
        '<button class="btn btn--block btn--lg" type="submit" id="authSubmit" data-i18n="' + (isReg ? 'auth.registerBtn' : 'auth.loginBtn') + '">' + i18n.t(isReg ? 'auth.registerBtn' : 'auth.loginBtn') + '</button>' +
      '</form>' +
      '<div class="auth-divider"></div>' +
      '<a href="' + next + '" class="btn btn--ghost btn--block" data-i18n="auth.continueGuest">' + i18n.t('auth.continueGuest') + '</a>' +
      '<p class="auth-card__foot"><a href="?mode=' + (isReg ? 'login' : 'register') + (next !== 'index.html' ? '&next=' + encodeURIComponent(next) : '') + '">' + i18n.t(isReg ? 'auth.toLogin' : 'auth.toRegister') + '</a></p>';
    i18n.apply(root);
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('authForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('authSubmit');
      var email = document.getElementById('emailInput').value;
      var pwd = document.getElementById('passwordInput').value;
      var name = isReg ? document.getElementById('nameInput').value : null;
      btn.disabled = true; btn.textContent = i18n.t('misc.loading');
      var p = isReg ? auth.signUp(name, email, pwd) : auth.signIn(email, pwd);
      p.then(function () {
        window.UNDES.toast.success(i18n.t('toast.loginSuccess'));
        setTimeout(function () { location.href = next; }, 500);
      }).catch(function (err) {
        window.UNDES.toast.error(i18n.t('toast.error'), err.message || '');
        btn.disabled = false; btn.textContent = i18n.t(isReg ? 'auth.registerBtn' : 'auth.loginBtn');
      });
    });
  }

  window.addEventListener('languagechange', render);
});
