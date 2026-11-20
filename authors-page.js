/**
 * Ündes — Authors page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var comp = window.UNDES.components;
  var query = '';
  var debounceT = null;

  showSkeletons();
  render();

  document.getElementById('authorSearch').addEventListener('input', function (e) {
    query = e.target.value;
    clearTimeout(debounceT);
    debounceT = setTimeout(render, 200);
  });

  function showSkeletons() {
    var grid = document.getElementById('authorsGrid');
    grid.innerHTML = Array.from({ length: 8 }).map(function () { return comp.authorCardSkeleton(); }).join('');
  }

  function render() {
    api.listAuthors({ query: query }).then(function (authors) {
      var grid = document.getElementById('authorsGrid');
      if (!authors.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + comp.emptyState('search', window.UNDES.i18nService.t('explore.empty.title'), window.UNDES.i18nService.t('explore.empty.text')) + '</div>';
      } else {
        grid.innerHTML = authors.map(comp.authorCard).join('');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }
});
