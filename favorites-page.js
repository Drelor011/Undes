/**
 * Ündes — Favorites page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var comp = window.UNDES.components;

  render();

  function render() {
    api.getFavoritePoems().then(function (poems) {
      var grid = document.getElementById('favGrid');
      if (!poems.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' +
          comp.emptyState('heart', i18n.t('favorites.empty.title'), i18n.t('favorites.empty.text'),
            '<a href="explore.html" class="btn">' + i18n.t('favorites.empty.cta') + '</a>') +
        '</div>';
      } else {
        grid.innerHTML = poems.map(comp.poemCard).join('');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  window.addEventListener('favoriteschange', render);
  window.addEventListener('languagechange', render);
});
