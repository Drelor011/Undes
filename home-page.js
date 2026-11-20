/**
 * Ündes — Home page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var comp = window.UNDES.components;

  // Stats
  api.getStats().then(function (s) {
    document.getElementById('statPoems').textContent = s.poems;
    document.getElementById('statAuthors').textContent = s.authors;
    document.getElementById('statLangs').textContent = s.languages;
  });

  // Poem of the day
  api.getPoemOfTheDay().then(function (poem) {
    var root = document.getElementById('potdRoot');
    var author = api.authorById(poem.authorId);
    var svc = i18n;
    var lines = poem.content.split('\n').filter(Boolean).slice(0, 6).join('\n');
    var bioKey = { kz: 'bioKz', ru: 'bioRu', en: 'bioEn' }[svc.current()] || 'bioRu';

    root.innerHTML =
      '<div class="potd">' +
        '<div>' +
          '<span class="eyebrow" data-i18n="potd.eyebrow">' + svc.t('potd.eyebrow') + '</span>' +
          '<h3 style="font-size:clamp(1.5rem,3vw,2rem);margin-top:12px;margin-bottom:16px;">' + window.UNDES.escapeHtml(poem.title) + '</h3>' +
          '<p class="potd__quote">' + window.UNDES.escapeHtml(poem.excerpt) + '</p>' +
          '<div class="potd__attr">' +
            '<span class="potd__avatar">' + window.UNDES.escapeHtml(author ? author.initials : '?') + '</span>' +
            '<div>' +
              '<div class="potd__author-name">' + window.UNDES.escapeHtml(author ? author.name : '') + '</div>' +
              '<div class="potd__author-meta">' + window.UNDES.escapeHtml(author ? (author.country + ' · ' + author.birthYear + '–' + author.deathYear) : '') + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:24px;"><a class="btn btn--soft" href="poem.html?id=' + encodeURIComponent(poem.id) + '" data-i18n="potd.read">' + svc.t('potd.read') + '</a></div>' +
        '</div>' +
        '<div class="poem-preview">' +
          '<span class="chip chip--lang-' + poem.language + '">' + svc.t('misc.lang.' + poem.language) + '</span>' +
          '<div class="poem-preview__text" style="margin-top:18px;">' + window.UNDES.escapeHtml(lines) + '</div>' +
          '<div class="poem-preview__fade"></div>' +
        '</div>' +
      '</div>';
    i18n.apply(root);
    if (window.lucide) window.lucide.createIcons();
  });

  // Moods
  api.listMoods().then(function (moods) {
    renderGrid('moodGrid', moods, comp.moodCard, comp.poemCardSkeleton);
  });

  // Authors (top 6 by poem count)
  api.listAuthors().then(function (authors) {
    authors.sort(function (a, b) { return (b.poemCount || 0) - (a.poemCount || 0); });
    renderGrid('authorsGrid', authors.slice(0, 8), comp.authorCard, comp.authorCardSkeleton);
  });

  // Popular poems
  api.getPopularPoems(6).then(function (poems) {
    renderGrid('popularGrid', poems, comp.poemCard, comp.poemCardSkeleton);
  });

  // Recent poems
  api.getRecentPoems(6).then(function (poems) {
    renderGrid('recentGrid', poems, comp.poemCard, comp.poemCardSkeleton);
  });

  function renderGrid(id, items, renderer, skeleton) {
    var grid = document.getElementById(id);
    if (!grid) return;
    if (!items.length) {
      var svc = i18n;
      grid.innerHTML = '<div style="grid-column:1/-1;">' + comp.emptyState('book-open', svc.t('explore.empty.title'), svc.t('explore.empty.text')) + '</div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    grid.innerHTML = items.map(renderer).join('');
    if (window.lucide) window.lucide.createIcons();
  }
});
