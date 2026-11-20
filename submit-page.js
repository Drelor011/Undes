/**
 * Ündes — Submit page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var esc = window.UNDES.escapeHtml;

  populateCategories();
  document.getElementById('submitForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('submitBtn');
    var title = document.getElementById('titleInput').value.trim();
    var authorName = document.getElementById('authorInput').value.trim();
    var lang = document.getElementById('langInput').value;
    var cat = document.getElementById('catInput').value;
    var content = document.getElementById('contentInput').value.trim();

    if (!title || !authorName || !content) {
      window.UNDES.toast.error(i18n.t('toast.error'));
      return;
    }
    btn.disabled = true; btn.textContent = i18n.t('misc.loading');

    // Create a synthetic author id (or map to existing)
    var slug = authorName.toLowerCase().replace(/[^\w\u0400-\u04ff]+/g, '-').replace(/^-|-$/g, '') || 'anon';
    var authorId = 'user-' + slug;

    api.submitPoem({
      title: title,
      authorId: authorId,
      authorName: authorName,
      language: lang,
      categories: cat ? [cat] : [],
      content: content,
      year: null
    }).then(function (sub) {
      window.UNDES.toast.success(i18n.t('submit.success'));
      // attach authorName so poem view can render
      try {
        var subs = JSON.parse(localStorage.getItem('undes:submissions') || '[]');
        var idx = subs.findIndex(function (s) { return s.id === sub.id; });
        if (idx !== -1) { subs[idx].authorName = authorName; localStorage.setItem('undes:submissions', JSON.stringify(subs)); }
      } catch (e) {}
      setTimeout(function () { location.href = 'poem.html?id=' + encodeURIComponent(sub.id); }, 900);
    }).catch(function () {
      window.UNDES.toast.error(i18n.t('toast.error'));
      btn.disabled = false; btn.textContent = i18n.t('submit.send');
    });
  });

  function populateCategories() {
    api.listCategories().then(function (cats) {
      var sel = document.getElementById('catInput');
      cats.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id; o.textContent = i18n.label(c);
        sel.appendChild(o);
      });
    });
  }

  window.addEventListener('languagechange', function () {
    var sel = document.getElementById('catInput');
    var cur = sel.value;
    api.listCategories().then(function (cats) {
      sel.innerHTML = '<option value="">' + i18n.t('explore.allCategories') + '</option>';
      cats.forEach(function (c) { var o = document.createElement('option'); o.value = c.id; o.textContent = i18n.label(c); sel.appendChild(o); });
      sel.value = cur;
    });
    i18n.apply();
  });
});
