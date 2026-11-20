/**
 * Ündes — Mood page
 * Shows the 8 mood cards. If `?mood=` is set, also shows poems for it.
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var comp = window.UNDES.components;

  renderMoods();
  renderFromUrl();

  function renderMoods() {
    api.listMoods().then(function (moods) {
      var grid = document.getElementById('moodGrid');
      grid.innerHTML = moods.map(comp.moodCard).join('');
      if (window.lucide) window.lucide.createIcons();
    });
  }

  function renderFromUrl() {
    var mood = new URLSearchParams(location.search).get('mood');
    if (mood) showMoodPoems(mood);
    else document.getElementById('moodResults').innerHTML = '';
  }

  function showMoodPoems(moodId) {
    var box = document.getElementById('moodResults');
    var cat = api.categoryById(moodId);
    if (!cat) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="section-head"><span class="eyebrow">' + i18n.t('mood.title') + '</span><h2 class="section-title" style="font-size:1.8rem;">' + window.UNDES.escapeHtml(i18n.label(cat)) + '</h2></div><div class="grid grid--poems" id="moodPoemsGrid"></div>';
    api.getPoemsByCategory(moodId).then(function (poems) {
      var grid = document.getElementById('moodPoemsGrid');
      if (!poems.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + comp.emptyState('cloud-rain', i18n.t('mood.empty'), '') + '</div>';
      } else {
        grid.innerHTML = poems.map(comp.poemCard).join('');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  window.addEventListener('languagechange', function () { renderMoods(); renderFromUrl(); });
  window.addEventListener('popstate', renderFromUrl);
});
