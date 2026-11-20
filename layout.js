/**
 * Ündes — Components: navbar + footer
 * Rendered into every page's [data-navbar] / [data-footer] slots.
 */

window.UNDES = window.UNDES || {};

window.UNDES.components = window.UNDES.components || {};

window.UNDES.components.navbar = function () {
  var i18n = window.UNDES.i18nService;
  var auth = window.UNDES.auth;
  var user = auth.currentUser();

  var links = [
    { href: 'index.html',         key: 'nav.home',     match: 'index' },
    { href: 'explore.html',      key: 'nav.explore',  match: 'explore' },
    { href: 'authors.html',      key: 'nav.authors',  match: 'authors' },
    { href: 'mood.html',          key: 'nav.mood',     match: 'mood' },
    { href: 'favorites.html',    key: 'nav.favorites', match: 'favorites' }
  ];
  var current = (document.body.getAttribute('data-page') || '').toLowerCase();

  var linksHtml = links.map(function (l) {
    var isActive = current === l.match;
    return '<a class="nav__link' + (isActive ? ' nav__link--active' : '') + '" href="' + l.href + '" data-i18n="' + l.key + '">' + i18n.t(l.key) + '</a>';
  }).join('');

  var langCurrent = i18n.current();
  var langItems = window.UNDES.config.languages.map(function (code) {
    return '<button data-lang="' + code + '" class="lang-item' + (code === langCurrent ? ' is-active' : '') + '">' +
      i18n.t('misc.lang.' + code) + '</button>';
  }).join('');

  var userActions = user
    ? '<a href="profile.html" class="nav__avatar" title="' + escapeAttr(user.name) + '">' + escapeHtml(user.initials) + '</a>'
    : '<a href="login.html" class="btn btn--sm" data-i18n="nav.login">' + i18n.t('nav.login') + '</a>';

  var submitBtn = '<a href="submit.html" class="btn btn--soft btn--sm" data-i18n="nav.submit">' + i18n.t('nav.submit') + '</a>';

  return (
    '<header class="nav" id="nav">' +
      '<div class="container nav__inner">' +
        '<a class="nav__brand" href="index.html">' +
          '<span class="nav__brand-mark">Ü</span>' +
          '<span>ndes</span>' +
        '</a>' +
        '<nav class="nav__links" id="navLinks">' + linksHtml + '</nav>' +
        '<div class="nav__spacer"></div>' +
        '<div class="nav__actions">' +
          '<div class="lang-switcher">' +
            '<button class="lang-toggle" id="langToggle" aria-label="Language">' +
              '<span data-lucide="globe"></span>' +
              '<span>' + langCurrent.toUpperCase() + '</span>' +
            '</button>' +
            '<div class="lang-menu" id="langMenu">' + langItems + '</div>' +
          '</div>' +
          '<button class="btn btn--icon btn--ghost" id="themeToggle" aria-label="' + escapeAttr(i18n.t('misc.themeToggle')) + '">' +
            '<span data-lucide="sun"></span>' +
          '</button>' +
          submitBtn +
          userActions +
        '</div>' +
        '<button class="btn btn--icon btn--ghost nav__toggle" id="navToggle" aria-label="' + escapeAttr(i18n.t('misc.menu')) + '">' +
          '<span data-lucide="menu"></span>' +
        '</button>' +
      '</div>' +
    '</header>'
  );
};

window.UNDES.components.footer = function () {
  var i18n = window.UNDES.i18nService;
  var year = new Date().getFullYear();
  return (
    '<footer class="footer">' +
      '<div class="container">' +
        '<div class="footer__grid">' +
          '<div class="footer__brand-col">' +
            '<div class="footer__brand">Ündes</div>' +
            '<p class="footer__tag" data-i18n="brand.tagline">' + i18n.t('brand.tagline') + '</p>' +
            '<p class="footer__about" data-i18n="footer.aboutText" style="margin-top:16px;color:var(--text-muted);font-size:14px;max-width:42ch;">' + i18n.t('footer.aboutText') + '</p>' +
          '</div>' +
          '<div>' +
            '<div class="footer__head" data-i18n="footer.library">' + i18n.t('footer.library') + '</div>' +
            '<a class="footer__link" href="explore.html" data-i18n="nav.explore">' + i18n.t('nav.explore') + '</a>' +
            '<a class="footer__link" href="authors.html" data-i18n="nav.authors">' + i18n.t('nav.authors') + '</a>' +
            '<a class="footer__link" href="mood.html" data-i18n="nav.mood">' + i18n.t('nav.mood') + '</a>' +
          '</div>' +
          '<div>' +
            '<div class="footer__head" data-i18n="footer.account">' + i18n.t('footer.account') + '</div>' +
            '<a class="footer__link" href="favorites.html" data-i18n="nav.favorites">' + i18n.t('nav.favorites') + '</a>' +
            '<a class="footer__link" href="profile.html" data-i18n="nav.profile">' + i18n.t('nav.profile') + '</a>' +
            '<a class="footer__link" href="submit.html" data-i18n="nav.submit">' + i18n.t('nav.submit') + '</a>' +
          '</div>' +
          '<div>' +
            '<div class="footer__head" data-i18n="footer.about">' + i18n.t('footer.about') + '</div>' +
            '<a class="footer__link" href="index.html">Ündes</a>' +
            '<a class="footer__link" href="login.html" data-i18n="nav.login">' + i18n.t('nav.login') + '</a>' +
          '</div>' +
        '</div>' +
        '<div class="footer__bottom">' +
          '<span>© ' + year + ' Ündes. <span data-i18n="footer.rights">' + i18n.t('footer.rights') + '</span></span>' +
          '<span data-i18n="footer.madeWith">' + i18n.t('footer.madeWith') + '</span>' +
        '</div>' +
      '</div>' +
    '</footer>'
  );
};

/* ---------- helpers ---------- */
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function escapeAttr(s) { return escapeHtml(s); }
window.UNDES.escapeHtml = escapeHtml;
window.UNDES.escapeAttr = escapeAttr;
