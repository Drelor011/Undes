/**
 * Ündes — Poem reading page
 */
window.UNDES.page(function () {
  var api = window.UNDES.api;
  var i18n = window.UNDES.i18nService;
  var comp = window.UNDES.components;
  var tts = window.UNDES.tts;
  var esc = window.UNDES.escapeHtml;

  var id = new URLSearchParams(location.search).get('id');
  var view = document.getElementById('poemView');
  var main = document.getElementById('poemMain');

  if (!id) { renderNotFound(); return; }

  api.getPoem(id).then(function (poem) {
    if (!poem) { renderNotFound(); return; }
    render(poem);
    // record reading history
    api.recordReading(poem.id);
  });

  function render(poem) {
    var author = poem.author;
    var cats = (poem.categories || []).map(function (cId) {
      var c = api.categoryById(cId);
      return c ? '<span class="chip">' + esc(i18n.label(c)) + '</span>' : '';
    }).join('');
    var fav = api.isFavorite(poem.id);

    var translationsHtml = poem.translations && poem.translations.length
      ? poem.translations.map(function (tr) {
          return '<div class="translation-block">' +
                   '<div class="translation-block__head"><span class="translation-block__lang">' + esc(i18n.t('misc.lang.' + tr.language)) + '</span> · ' + esc(i18n.t('poem.translation')) + '</div>' +
                   (tr.title ? '<h4 style="font-family:var(--font-serif);font-size:1.2rem;margin-bottom:12px;">' + esc(tr.title) + '</h4>' : '') +
                   '<div class="translation-block__text">' + esc(tr.content) + '</div>' +
                 '</div>';
        }).join('')
      : '';

    view.innerHTML =
      '<a href="explore.html" class="poem-view__back"><span data-lucide="arrow-left"></span> <span data-i18n="poem.back">' + i18n.t('poem.back') + '</span></a>' +
      '<button class="btn btn--ghost btn--sm reading-toggle" id="readingToggle" style="position:absolute;top:0;right:0;"><span data-lucide="book-open"></span> <span data-i18n="poem.readingMode">' + i18n.t('poem.readingMode') + '</span></button>' +
      '<div class="poem-view__head">' +
        '<h1 class="poem-view__title">' + esc(poem.title) + '</h1>' +
        '<div class="poem-view__author">' +
          (author ? '<a href="author.html?id=' + encodeURIComponent(author.id) + '">' + esc(author.name) + '</a>' : '') +
        '</div>' +
        '<div class="poem-view__author-meta">' +
          (author ? esc(author.country + ' · ' + author.birthYear + '–' + author.deathYear) : '') +
        '</div>' +
        '<div class="poem-view__chips">' +
          '<span class="chip chip--lang-' + poem.language + '">' + i18n.t('misc.lang.' + poem.language) + '</span>' +
          (poem.year ? '<span class="chip">' + esc(i18n.t('poem.year')) + ': ' + esc(poem.year) + '</span>' : '') +
          cats +
        '</div>' +
      '</div>' +
      '<div class="poem-view__body" id="poemBody">' + esc(poem.content) + '</div>' +
      (translationsHtml ? '<div class="poem-view__lang-note">↓ ' + esc(i18n.t('poem.translation')) + '</div>' + translationsHtml : '') +
      '<div class="poem-view__actions">' +
        '<button class="btn ' + (fav ? '' : 'btn--soft') + '" id="favBtn"><span data-lucide="heart"></span> <span id="favText">' + (fav ? i18n.t('poem.inFav') : i18n.t('poem.addToFav')) + '</span></button>' +
        '<button class="btn btn--ghost" id="copyBtn"><span data-lucide="copy"></span> <span data-i18n="poem.copy">' + i18n.t('poem.copy') + '</span></button>' +
        '<button class="btn btn--ghost" id="shareBtn"><span data-lucide="share-2"></span> <span data-i18n="poem.share">' + i18n.t('poem.share') + '</span></button>' +
        '<button class="btn btn--ghost" id="ttsBtn"><span data-lucide="volume-2"></span> <span data-i18n="poem.tts">' + i18n.t('poem.tts') + '</span></button>' +
        '<button class="btn btn--ghost" id="quoteBtn"><span data-lucide="image"></span> <span data-i18n="poem.quoteCard">' + i18n.t('poem.quoteCard') + '</span></button>' +
        '<div class="tts-player hidden" id="ttsPlayer" style="margin-top:12px;flex-basis:100%;justify-content:center;">' +
          '<button class="tts-player__btn" id="ttsStop"><span data-lucide="square"></span></button>' +
          '<div class="tts-player__progress"><div class="tts-player__bar" id="ttsBar"></div></div>' +
          '<span class="tts-player__status" id="ttsStatus">…</span>' +
        '</div>' +
      '</div>' +
      '<div class="related-section section">' +
        '<div class="section-head"><span class="eyebrow">Related</span><h2 class="section-title" style="font-size:1.6rem;" data-i18n="section.related">' + i18n.t('section.related') + '</h2></div>' +
        '<div class="grid grid--poems" id="relatedGrid"></div>' +
      '</div>';

    i18n.apply(view);
    if (window.lucide) window.lucide.createIcons();

    // favorite
    var favBtn = document.getElementById('favBtn');
    var favText = document.getElementById('favText');
    favBtn.addEventListener('click', function () {
      var now = api.isFavorite(poem.id);
      api.toggleFavorite(poem.id).then(function (isFav) {
        favBtn.classList.toggle('btn--soft', !isFav);
        favText.textContent = isFav ? i18n.t('poem.inFav') : i18n.t('poem.addToFav');
        window.UNDES.toast.success(isFav ? i18n.t('toast.favAdded') : i18n.t('toast.favRemoved'));
      });
    });

    // copy
    document.getElementById('copyBtn').addEventListener('click', function () {
      var text = poem.title + '\n\n' + poem.content + (author ? '\n\n— ' + author.name : '');
      function onSuccess() { window.UNDES.toast.success(i18n.t('poem.copy'), i18n.t('poem.copied')); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
        if (ok) onSuccess(); else window.UNDES.toast.error(i18n.t('toast.error'));
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
      } else {
        fallback();
      }
    });

    // share
    document.getElementById('shareBtn').addEventListener('click', function () {
      var shareData = { title: poem.title, text: poem.excerpt, url: location.href };
      if (navigator.share) {
        navigator.share(shareData).catch(function () {});
      } else {
        if (navigator.clipboard) navigator.clipboard.writeText(location.href);
        window.UNDES.toast.success(i18n.t('poem.share'), i18n.t('poem.linkCopied'));
      }
    });

    // TTS
    var ttsBtn = document.getElementById('ttsBtn');
    var ttsPlayer = document.getElementById('ttsPlayer');
    var ttsBar = document.getElementById('ttsBar');
    var ttsStatus = document.getElementById('ttsStatus');
    ttsBtn.addEventListener('click', function () {
      if (!tts.isSupported) {
        window.UNDES.toast.error(i18n.t('poem.tts'), i18n.t('poem.tts.unsupported'));
        return;
      }
      if (tts.state.playing) {
        tts.stop();
        ttsPlayer.classList.add('hidden');
        ttsBtn.querySelector('span:last-child').textContent = i18n.t('poem.tts');
        return;
      }
      ttsPlayer.classList.remove('hidden');
      ttsStatus.textContent = i18n.t('poem.tts') + '…';
      ttsBar.style.width = '0%';
      var ok = tts.speak(poem.content, poem.language, {
        poemId: poem.id,
        onProgress: function (p) { ttsBar.style.width = Math.round(p * 100) + '%'; },
        onEnd: function () {
          ttsPlayer.classList.add('hidden');
          ttsBtn.querySelector('span:last-child').textContent = i18n.t('poem.tts');
        },
        onUnsupported: function () {
          window.UNDES.toast.error(i18n.t('poem.tts'), i18n.t('poem.tts.unsupported'));
          ttsPlayer.classList.add('hidden');
        }
      });
      if (ok) ttsBtn.querySelector('span:last-child').textContent = i18n.t('poem.tts.stop');
    });
    document.getElementById('ttsStop').addEventListener('click', function () {
      tts.stop(); ttsPlayer.classList.add('hidden');
      ttsBtn.querySelector('span:last-child').textContent = i18n.t('poem.tts');
    });

    // quote card
    document.getElementById('quoteBtn').addEventListener('click', function () {
      comp.quoteCardModal(poem, poem.excerpt);
    });

    // reading mode toggle
    document.getElementById('readingToggle').addEventListener('click', function () {
      document.body.classList.toggle('reading-mode');
      var lbl = this.querySelector('span:last-child');
      lbl.textContent = document.body.classList.contains('reading-mode') ? i18n.t('poem.exitReadingMode') : i18n.t('poem.readingMode');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('reading-mode')) {
        document.body.classList.remove('reading-mode');
        document.getElementById('readingToggle').querySelector('span:last-child').textContent = i18n.t('poem.readingMode');
      }
    });

    // related
    api.getRelated(poem, 3).then(function (related) {
      var grid = document.getElementById('relatedGrid');
      if (!related.length) { grid.innerHTML = ''; return; }
      grid.innerHTML = related.map(comp.poemCard).join('');
      if (window.lucide) window.lucide.createIcons();
    });
  }

  function renderNotFound() {
    view.innerHTML = comp.emptyState('frown', i18n.t('misc.notFound'), i18n.t('misc.notFound.text'), '<a href="explore.html" class="btn">' + i18n.t('misc.goHome') + '</a>');
    if (window.lucide) window.lucide.createIcons();
  }

  window.addEventListener('languagechange', function () {
    if (id) api.getPoem(id).then(render);
  });
});
