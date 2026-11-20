/**
 * Ündes — Bootstrap
 *
 * Loaded on every page. Mounts navbar/footer, applies theme + language,
 * wires global interactions (theme toggle, language menu, mobile nav,
 * favorite buttons, auth state), and exposes `UNDES.page(fn)` for pages
 * to register init code that runs after the layout is mounted.
 */

window.UNDES = window.UNDES || {};

(function () {
  var pending = [];
  var ready = false;

  window.UNDES.page = function (fn) {
    if (ready) { try { fn(); } catch (e) { console.error(e); } return; }
    pending.push(fn);
  };

  function fireReady() {
    ready = true;
    while (pending.length) {
      try { pending.shift()(); } catch (e) { console.error(e); }
    }
  }

  function mountLayout() {
    var navSlot = document.querySelector('[data-navbar]');
    var footSlot = document.querySelector('[data-footer]');
    if (navSlot) navSlot.innerHTML = window.UNDES.components.navbar();
    if (footSlot) footSlot.innerHTML = window.UNDES.components.footer();
  }

  function wireInteractions() {
    var svc = window.UNDES.i18nService;
    var theme = window.UNDES.themeService;

    // theme toggle
    document.addEventListener('click', function (e) {
      var t = e.target.closest('#themeToggle');
      if (t) {
        theme.toggle();
        refreshThemeIcon();
      }
    });
    function refreshThemeIcon() {
      var btn = document.getElementById('themeToggle');
      if (!btn) return;
      btn.innerHTML = '<span data-lucide="' + (theme.current() === 'dark' ? 'sun' : 'moon') + '"></span>';
      if (window.lucide) window.lucide.createIcons();
    }
    refreshThemeIcon();

    // language menu
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('#langToggle');
      var item = e.target.closest('[data-lang]');
      var menu = document.getElementById('langMenu');
      if (toggle) { menu.classList.toggle('is-open'); e.stopPropagation(); return; }
      if (item) {
        svc.set(item.getAttribute('data-lang'));
        if (menu) menu.classList.remove('is-open');
        remountForLang();
        return;
      }
      if (menu && !e.target.closest('.lang-switcher')) menu.classList.remove('is-open');
    });

    // mobile nav toggle
    document.addEventListener('click', function (e) {
      var t = e.target.closest('#navToggle');
      if (t) { document.getElementById('navLinks').classList.toggle('is-open'); }
    });

    // nav scroll style
    var nav = document.getElementById('nav');
    if (nav) {
      var onScroll = function () {
        nav.classList.toggle('nav--scrolled', window.scrollY > 8);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // global favorite handler (works on any card with [data-fav])
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fav]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var id = btn.getAttribute('data-fav');
      var wasFav = window.UNDES.api.isFavorite(id);
      window.UNDES.api.toggleFavorite(id).then(function (nowFav) {
        btn.classList.toggle('is-active', nowFav);
        // also update any other instances on the page
        document.querySelectorAll('[data-fav="' + CSS.escape(id) + '"]').forEach(function (b) {
          b.classList.toggle('is-active', nowFav);
        });
        var msg = nowFav ? 'toast.favAdded' : 'toast.favRemoved';
        window.UNDES.toast.success(svc.t(msg));
        window.dispatchEvent(new CustomEvent('favoriteschange', { detail: { id: id, fav: nowFav } }));
      });
    });

    // auth state: update nav when user changes
    if (window.UNDES.auth) {
      window.UNDES.auth.onAuthChange(function () {
        // Only re-render the actions block to avoid losing page state
        var navSlot = document.querySelector('[data-navbar]');
        if (navSlot) {
          navSlot.innerHTML = window.UNDES.components.navbar();
          if (window.lucide) window.lucide.createIcons();
          wireGlobalIcons();
          refreshThemeIcon();
        }
      });
    }
  }

  function remountForLang() {
    // Re-render navbar + footer so their text updates
    var navSlot = document.querySelector('[data-navbar]');
    var footSlot = document.querySelector('[data-footer]');
    if (navSlot) navSlot.innerHTML = window.UNDES.components.navbar();
    if (footSlot) footSlot.innerHTML = window.UNDES.components.footer();
    wireGlobalIcons();
    svcApply();
    // notify pages
    window.dispatchEvent(new CustomEvent('languagechange'));
  }

  function svcApply() { window.UNDES.i18nService.apply(); }

  function wireGlobalIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  // On DOMContentLoaded: mount layout, apply i18n/theme, wire, fire ready
  function init() {
    // ensure data files are loaded (authors/poems/categories/i18n)
    if (!window.UNDES.i18n || !window.UNDES.i18n.ru) {
      // data files are loaded via <script> tags; if not yet, retry shortly
      setTimeout(init, 30);
      return;
    }
    document.documentElement.setAttribute('data-theme', window.UNDES.themeService.current());
    document.documentElement.setAttribute('lang', window.UNDES.i18nService.current());
    mountLayout();
    svcApply();
    wireGlobalIcons();
    wireInteractions();
    fireReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
