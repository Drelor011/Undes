/**
 * Ündes — Author page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var comp = window.UNDES.components;
  var esc = window.UNDES.escapeHtml;
  var root = document.getElementById('authorRoot');

  var id = new URLSearchParams(location.search).get('id');
  if (!id) { notFound(); return; }

  api.getAuthor(id).then(function (author) {
    if (!author) { notFound(); return; }
    api.listPoems({ authorId: id, sort: 'popular' }).then(function (poems) {
      render(author, poems);
    });
  });

  function render(author, poems) {
    var lang = i18n.current();
    var bioKey = { kz: 'bioKz', ru: 'bioRu', en: 'bioEn' }[lang] || 'bioRu';
    var langs = author.languages.map(function (l) { return '<span class="chip chip--lang-' + l + '">' + i18n.t('misc.lang.' + l) + '</span>'; }).join('');

    var notable = (author.notable || []).slice(0, 3).map(function (pid) {
      var p = poems.find(function (x) { return x.id === pid; });
      return p ? comp.poemCard(p) : '';
    }).join('');

    root.innerHTML =
      '<div class="author-hero">' +
        '<div class="author-hero__photo">' + esc(author.initials) + '</div>' +
        '<div>' +
          '<h1 class="author-hero__name">' + esc(author.name) + '</h1>' +
          '<div class="author-hero__meta">' +
            '<span class="chip">' + esc(i18n.t('author.born')) + ': ' + esc(author.birthYear) + '</span>' +
            '<span class="chip">' + esc(i18n.t('author.died')) + ': ' + esc(author.deathYear) + '</span>' +
            '<span class="chip">' + esc(author.country) + '</span>' +
            langs +
          '</div>' +
          '<p class="author-hero__bio">' + esc(author[bioKey] || author.bioRu || '') + '</p>' +
        '</div>' +
      '</div>' +
      (notable ? '<section class="section--tight"><div class="section-head"><span class="eyebrow">Notable</span><h2 class="section-title" style="font-size:1.6rem;" data-i18n="author.notable">' + i18n.t('author.notable') + '</h2></div><div class="grid grid--poems">' + notable + '</div></section>' : '') +
      '<section class="section--tight"><div class="section-head"><span class="eyebrow">All works</span><h2 class="section-title" style="font-size:1.6rem;" data-i18n="author.allPoems">' + i18n.t('author.allPoems') + ' <span class="text-muted" style="font-size:1rem;font-family:var(--font-sans);">(' + poems.length + ')</span></h2></div>' +
        (poems.length ? '<div class="grid grid--poems" id="allPoems">' + poems.map(comp.poemCard).join('') + '</div>'
                     : '<div>' + comp.emptyState('book-open', i18n.t('explore.empty.title'), i18n.t('explore.empty.text')) + '</div>') +
      '</section>';

    i18n.apply(root);
    if (window.lucide) window.lucide.createIcons();
  }

  function notFound() {
    root.innerHTML = comp.emptyState('frown', i18n.t('misc.notFound'), i18n.t('misc.notFound.text'), '<a href="authors.html" class="btn">' + i18n.t('misc.goHome') + '</a>');
    if (window.lucide) window.lucide.createIcons();
  }

  window.addEventListener('languagechange', function () {
    if (!id) return;
    api.getAuthor(id).then(function (author) {
      if (!author) return;
      api.listPoems({ authorId: id, sort: 'popular' }).then(function (poems) { render(author, poems); });
    });
  });
});
