/**
 * Ündes — Profile page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var comp = window.UNDES.components;
  var auth = window.UNDES.auth;
  var theme = window.UNDES.themeService;
  var esc = window.UNDES.escapeHtml;
  var root = document.getElementById('profileRoot');

  var user = auth.currentUser();
  if (!user) {
    // guests: still allow viewing favorites/history saved locally, but suggest login
    user = { name: i18n.t('auth.continueGuest'), initials: '?', email: '—', provider: 'guest' };
  }

  render();

  function render() {
    api.getFavoritePoems().then(function (favPoems) {
      api.getHistoryPoems().then(function (histPoems) {
        api.listMySubmissions().then(function (subs) {
          renderAll(user, favPoems, histPoems, subs);
        });
      });
    });
  }

  function renderAll(user, favPoems, histPoems, subs) {
    var favList = favPoems.length
      ? '<div class="grid grid--poems">' + favPoems.map(comp.poemCard).join('') + '</div>'
      : comp.emptyState('heart', i18n.t('favorites.empty.title'), i18n.t('favorites.empty.text'), '<a href="explore.html" class="btn">' + i18n.t('favorites.empty.cta') + '</a>');

    var histList = histPoems.length
      ? '<div class="grid grid--poems">' + histPoems.map(comp.poemCard).join('') + '</div>' +
        '<div style="margin-top:24px;text-align:center;"><button class="btn btn--ghost btn--sm" id="clearHist"><span data-lucide="trash-2"></span> ' + i18n.t('favorites.remove') + '</button></div>'
      : comp.emptyState('clock', i18n.t('profile.history.empty'), '');

    var langOpts = window.UNDES.config.languages.map(function (l) {
      return '<option value="' + l + '"' + (i18n.current() === l ? ' selected' : '') + '>' + i18n.t('misc.lang.' + l) + '</option>';
    }).join('');

    var subList = subs.length
      ? '<div class="grid grid--poems">' + subs.map(function (s) {
          return '<div class="poem-card"><div class="poem-card__top"><span class="chip chip--lang-' + s.language + '">' + i18n.t('misc.lang.' + s.language) + '</span><span class="chip" style="text-transform:capitalize;">' + esc(s.status) + '</span></div><a href="poem.html?id=' + encodeURIComponent(s.id) + '"><h3 class="poem-card__title">' + esc(s.title) + '</h3><p class="poem-card__excerpt">' + esc(window.UNDES.firstLines(s.content)) + '</p></a><div class="poem-card__foot"><span class="text-muted" style="font-size:12px;">' + new Date(s.submittedAt).toLocaleDateString() + '</span></div></div>';
        }).join('') + '</div>'
      : comp.emptyState('pen-tool', i18n.t('submit.title'), i18n.t('submit.sub'), '<a href="submit.html" class="btn">' + i18n.t('submit.send') + '</a>');

    root.innerHTML =
      '<div class="profile-head">' +
        '<div class="profile-head__avatar">' + esc(user.initials) + '</div>' +
        '<div>' +
          '<h1 class="profile-head__name">' + esc(user.name) + '</h1>' +
          '<div class="profile-head__meta">' + esc(user.email) + ' · ' + esc(i18n.t('profile.member')) + (user.provider === 'guest' ? ' (' + esc(i18n.t('auth.continueGuest')) + ')' : '') + '</div>' +
        '</div>' +
        '<div style="margin-left:auto;">' +
          (user.provider !== 'guest' ? '<button class="btn btn--ghost btn--sm" id="signOut"><span data-lucide="log-out"></span> ' + i18n.t('nav.logout') + '</button>' : '<a href="login.html" class="btn btn--sm">' + i18n.t('nav.login') + '</a>') +
        '</div>' +
      '</div>' +
      '<div class="tabs" role="tablist">' +
        '<button class="tab is-active" data-tab="favorites">' + i18n.t('profile.tabs.favorites') + ' (' + favPoems.length + ')</button>' +
        '<button class="tab" data-tab="history">' + i18n.t('profile.tabs.history') + ' (' + histPoems.length + ')</button>' +
        '<button class="tab" data-tab="submissions">' + i18n.t('nav.submit') + ' (' + subs.length + ')</button>' +
        '<button class="tab" data-tab="settings">' + i18n.t('profile.tabs.settings') + '</button>' +
      '</div>' +
      '<div class="tab-panel is-active" data-panel="favorites">' + favList + '</div>' +
      '<div class="tab-panel" data-panel="history">' + histList + '</div>' +
      '<div class="tab-panel" data-panel="submissions">' + subList + '</div>' +
      '<div class="tab-panel" data-panel="settings">' +
        '<div class="card" style="max-width:520px;">' +
          '<div class="field"><label class="field__label" data-i18n="profile.settings.theme">' + i18n.t('profile.settings.theme') + '</label>' +
            '<div class="flex gap-2">' +
              '<button class="btn ' + (theme.current() === 'light' ? '' : 'btn--ghost') + '" data-theme-set="light"><span data-lucide="sun"></span> ' + i18n.t('profile.settings.themeLight') + '</button>' +
              '<button class="btn ' + (theme.current() === 'dark' ? '' : 'btn--ghost') + '" data-theme-set="dark"><span data-lucide="moon"></span> ' + i18n.t('profile.settings.themeDark') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="field"><label class="field__label" data-i18n="profile.settings.language">' + i18n.t('profile.settings.language') + '</label>' +
            '<select class="select select--form" id="langSelect" style="max-width:240px;">' + langOpts + '</select>' +
          '</div>' +
        '</div>' +
      '</div>';

    i18n.apply(root);
    if (window.lucide) window.lucide.createIcons();

    // tabs
    root.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        var name = t.getAttribute('data-tab');
        root.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('is-active', x === t); });
        root.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === name); });
      });
    });

    var clearHist = document.getElementById('clearHist');
    if (clearHist) clearHist.addEventListener('click', function () {
      api.clearHistory().then(function () { render(); });
    });
    var signOut = document.getElementById('signOut');
    if (signOut) signOut.addEventListener('click', function () {
      auth.signOut().then(function () { window.UNDES.toast.success(i18n.t('toast.logoutSuccess')); setTimeout(function () { location.href = 'index.html'; }, 600); });
    });

    // settings
    root.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.addEventListener('click', function () {
        theme.set(b.getAttribute('data-theme-set'));
        render();
      });
    });
    var langSel = document.getElementById('langSelect');
    if (langSel) langSel.addEventListener('change', function () { i18n.set(langSel.value); });

    window.dispatchEvent(new CustomEvent('favoriteschange'));
  }

  window.addEventListener('languagechange', render);
  window.addEventListener('favoriteschange', function () {
    // only refresh the favorites count badge without full re-render to avoid losing tab state
    setTimeout(render, 0);
  });
});
