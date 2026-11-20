/**
 * Ündes — i18n & theme services
 *
 * i18n:    reads `UNDES.i18n` dictionary, applies to document via
 *          data-i18n attributes ("text") and data-i18n-html,
 *          data-i18n-placeholder. Listens to `languagechange` events.
 *
 * theme:   light/dark, persisted; respects prefers-color-scheme on
 *          first visit; toggles `data-theme` on <html>.
 */

window.UNDES = window.UNDES || {};

window.UNDES.i18n = Object.assign(window.UNDES.i18n || {}, {}); // data file sets the real dict

window.UNDES.i18nService = (function () {
  var cfg = window.UNDES.config;
  var storage = window.UNDES.storage;

  function current() {
    var saved = storage.get('language', null);
    if (saved && cfg.languages.indexOf(saved) !== -1) return saved;
    // detect from navigator
    var nav = (navigator.language || '').toLowerCase();
    if (nav.indexOf('kk') === 0) return 'kz';
    if (nav.indexOf('ru') === 0) return 'ru';
    return cfg.defaultLanguage;
  }

  function set(lang) {
    if (cfg.languages.indexOf(lang) === -1) return;
    storage.set('language', lang);
    document.documentElement.setAttribute('lang', lang);
    apply();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
  }

  function t(key, fallback) {
    var lang = current();
    var dict = (window.UNDES.i18n && window.UNDES.i18n[lang]) || {};
    return dict[key] || fallback || key;
  }

  function apply(root) {
    root = root || document;
    var lang = current();
    document.documentElement.setAttribute('lang', lang);
    var dict = (window.UNDES.i18n && window.UNDES.i18n[lang]) || {};
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k]) el.textContent = dict[k];
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (dict[k]) el.innerHTML = dict[k];
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-placeholder');
      if (dict[k]) el.setAttribute('placeholder', dict[k]);
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (dict[k]) el.setAttribute('aria-label', dict[k]);
    });
    // active state on language switcher
    root.querySelectorAll('[data-lang]').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-lang') === lang);
    });
    // localized author bio etc.
    root.querySelectorAll('[data-i18n-field]').forEach(function (el) {
      var field = el.getAttribute('data-i18n-field');
      var data = el.__i18nData;
      if (data && data[field] && typeof data[field] === 'object' && data[field][lang]) {
        el.textContent = data[field][lang];
      }
    });
  }

  // Localized category/mood label
  function label(category, lang) {
    lang = lang || current();
    return category && category.label ? (category.label[lang] || category.label.en) : '';
  }
  function tagline(mood, lang) {
    lang = lang || current();
    return mood && mood.tagline ? (mood.tagline[lang] || mood.tagline.en) : '';
  }

  return { current: current, set: set, t: t, apply: apply, label: label, tagline: tagline };
})();

window.UNDES.themeService = (function () {
  var storage = window.UNDES.storage;
  function current() {
    var saved = storage.get('theme', null);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function apply() {
    document.documentElement.setAttribute('data-theme', current());
  }
  function set(theme) {
    storage.set('theme', theme);
    apply();
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }
  function toggle() {
    set(current() === 'dark' ? 'light' : 'dark');
  }
  apply();
  return { current: current, set: set, toggle: toggle, apply: apply };
})();

/* ---------- Toast ---------- */
window.UNDES.toast = (function () {
  function ensureStack() {
    var s = document.querySelector('.toast-stack');
    if (!s) { s = document.createElement('div'); s.className = 'toast-stack'; document.body.appendChild(s); }
    return s;
  }
  function icons() {
    if (window.lucide) window.lucide.createIcons();
  }
  function show(opts) {
    opts = opts || {};
    var stack = ensureStack();
    var el = document.createElement('div');
    el.className = 'toast' + (opts.type ? ' toast--' + opts.type : '');
    var icon = { success: 'check-circle-2', error: 'alert-circle', info: 'info' }[opts.type || 'info'] || 'info';
    el.innerHTML =
      '<span class="toast__icon" data-lucide="' + icon + '"></span>' +
      '<div class="toast__body">' +
        (opts.title ? '<div class="toast__title"></div>' : '') +
        (opts.message ? '<div class="toast__msg"></div>' : '') +
      '</div>';
    if (opts.title) el.querySelector('.toast__title').textContent = opts.title;
    if (opts.message) el.querySelector('.toast__msg').textContent = opts.message;
    stack.appendChild(el);
    icons();
    var ttl = opts.duration || 3200;
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 240);
    }, ttl);
  }
  return {
    show: show,
    success: function (title, message) { show({ type: 'success', title: title, message: message }); },
    error: function (title, message) { show({ type: 'error', title: title, message: message }); },
    info: function (title, message) { show({ type: 'info', title: title, message: message }); }
  };
})();

/* ---------- Modal ---------- */
window.UNDES.modal = (function () {
  function open(opts) {
    opts = opts || {};
    close();
    var back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML =
      '<div class="modal' + (opts.size === 'lg' ? ' modal--lg' : '') + '" role="dialog" aria-modal="true">' +
        '<div class="modal__head">' +
          '<h3 class="modal__title"></h3>' +
          '<button class="btn btn--icon btn--ghost modal__close" aria-label="' + (window.UNDES.i18nService ? window.UNDES.i18nService.t('misc.close') : 'Close') + '"><span data-lucide="x"></span></button>' +
        '</div>' +
        '<div class="modal__body"></div>' +
      '</div>';
    back.querySelector('.modal__title').textContent = opts.title || '';
    var body = back.querySelector('.modal__body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body instanceof Node) body.appendChild(opts.body);
    back.querySelector('.modal__close').addEventListener('click', close);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', onEsc);
    document.body.appendChild(back);
    if (window.lucide) window.lucide.createIcons();
    if (opts.onMount) opts.onMount(back);
    return back;
  }
  function onEsc(e) { if (e.key === 'Escape') close(); }
  function close() {
    document.removeEventListener('keydown', onEsc);
    document.querySelectorAll('.modal-backdrop').forEach(function (m) { m.remove(); });
  }
  return { open: open, close: close };
})();
