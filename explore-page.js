/**
 * Ündes — Explore page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var comp = window.UNDES.components;
  var cfg = window.UNDES.config;

  var state = { query: '', language: '', category: '', sort: 'popular', page: 1 };
  var pageSize = cfg.pageSize;
  var debounceT = null;

  // populate category filter from data
  api.listCategories().then(function (cats) {
    var sel = document.getElementById('catFilter');
    cats.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = i18n.label(c);
      sel.appendChild(o);
    });
  });

  // init from URL params
  var params = new URLSearchParams(location.search);
  if (params.get('q')) { state.query = params.get('q'); document.getElementById('searchInput').value = state.query; }
  if (params.get('lang')) { state.language = params.get('lang'); document.getElementById('langFilter').value = state.language; }
  if (params.get('cat')) { state.category = params.get('cat'); /* may need to wait; set after options load */ setTimeout(function(){ document.getElementById('catFilter').value = state.category; }, 50); }
  if (params.get('sort')) { state.sort = params.get('sort'); document.getElementById('sortFilter').value = state.sort; }
  if (params.get('page')) state.page = parseInt(params.get('page'), 10) || 1;

  document.getElementById('searchInput').addEventListener('input', function (e) {
    state.query = e.target.value;
    state.page = 1;
    clearTimeout(debounceT);
    debounceT = setTimeout(render, 220);
  });
  document.getElementById('langFilter').addEventListener('change', function (e) { state.language = e.target.value; state.page = 1; render(); });
  document.getElementById('catFilter').addEventListener('change', function (e) { state.category = e.target.value; state.page = 1; render(); });
  document.getElementById('sortFilter').addEventListener('change', function (e) { state.sort = e.target.value; state.page = 1; render(); });
  document.getElementById('clearFilters').addEventListener('click', function () {
    state = { query: '', language: '', category: '', sort: 'popular', page: 1 };
    document.getElementById('searchInput').value = '';
    document.getElementById('langFilter').value = '';
    document.getElementById('catFilter').value = '';
    document.getElementById('sortFilter').value = 'popular';
    render();
  });

  // show skeletons immediately
  showSkeletons();
  render();

  function showSkeletons() {
    var grid = document.getElementById('poemsGrid');
    grid.innerHTML = Array.from({ length: 6 }).map(function () { return comp.poemCardSkeleton(); }).join('');
  }

  function render() {
    var grid = document.getElementById('poemsGrid');
    showSkeletons();
    api.listPoems({ query: state.query, language: state.language, category: state.category, sort: state.sort }).then(function (items) {
      var total = items.length;
      var pages = Math.max(1, Math.ceil(total / pageSize));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * pageSize;
      var slice = items.slice(start, start + pageSize);

      // results count + clear button
      document.getElementById('resultsCount').textContent = total + ' ' + i18n.t('explore.results');
      var hasFilters = state.query || state.language || state.category || state.sort !== 'popular';
      document.getElementById('clearFilters').classList.toggle('hidden', !hasFilters);

      if (!slice.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + comp.emptyState('search', i18n.t('explore.empty.title'), i18n.t('explore.empty.text'), '<button class="btn btn--ghost" id="emptyClear">' + i18n.t('explore.clear') + '</button>') + '</div>';
        var ec = document.getElementById('emptyClear'); if (ec) ec.addEventListener('click', function () { document.getElementById('clearFilters').click(); });
      } else {
        grid.innerHTML = slice.map(comp.poemCard).join('');
      }

      // pagination
      renderPagination(pages);
      if (window.lucide) window.lucide.createIcons();
      updateUrl();
    });
  }

  function renderPagination(pages) {
    var box = document.getElementById('pagination');
    if (pages <= 1) { box.innerHTML = ''; return; }
    var html = '';
    html += '<button class="pagination__btn"' + (state.page === 1 ? ' disabled' : '') + ' data-page="' + (state.page - 1) + '"><span data-lucide="chevron-left"></span></button>';
    var from = Math.max(1, state.page - 2), to = Math.min(pages, state.page + 2);
    if (from > 1) html += '<button class="pagination__btn" data-page="1">1</button>' + (from > 2 ? '<span class="pagination__btn" style="border:none;background:none;">…</span>' : '');
    for (var p = from; p <= to; p++) {
      html += '<button class="pagination__btn' + (p === state.page ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>';
    }
    if (to < pages) html += (to < pages - 1 ? '<span class="pagination__btn" style="border:none;background:none;">…</span>' : '') + '<button class="pagination__btn" data-page="' + pages + '">' + pages + '</button>';
    html += '<button class="pagination__btn"' + (state.page === pages ? ' disabled' : '') + ' data-page="' + (state.page + 1) + '"><span data-lucide="chevron-right"></span></button>';
    box.innerHTML = html;
    box.querySelectorAll('[data-page]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = parseInt(b.getAttribute('data-page'), 10);
        if (!isNaN(p) && p !== state.page) { state.page = p; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      });
    });
  }

  function updateUrl() {
    var u = new URL(location.href);
    ['q','lang','cat','sort','page'].forEach(function (k) {
      var v = ({ q: state.query, lang: state.language, cat: state.category, sort: state.sort, page: state.page })[k];
      if (v && v !== 'popular' && v !== 1) u.searchParams.set(k, v); else u.searchParams.delete(k);
    });
    history.replaceState(null, '', u);
  }

  // re-render on language change so labels update
  window.addEventListener('languagechange', function () {
    api.listCategories().then(function (cats) {
      var sel = document.getElementById('catFilter');
      var cur = state.category;
      sel.innerHTML = '<option value="">' + i18n.t('explore.allCategories') + '</option>';
      cats.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id; o.textContent = i18n.label(c);
        sel.appendChild(o);
      });
      if (cur) sel.value = cur;
      render();
    });
  });
});
