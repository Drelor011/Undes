/**
 * Ündes — Components: cards (poem, author, mood) + skeletons + empty states
 */

window.UNDES = window.UNDES || {};
var comp = window.UNDES.components = window.UNDES.components || {};
var i18n = function () { return window.UNDES.i18nService; };
var api = function () { return window.UNDES.api; };
var esc = window.UNDES.escapeHtml;

/* ---------- Poem card ---------- */
comp.poemCard = function (poem, opts) {
  opts = opts || {};
  var svc = i18n();
  var author = poem.author || api().authorById(poem.authorId);
  var authorName = author ? (svc.current() === 'kz' ? author.name : (author.nameLatin || author.name)) : '';
  var fav = api().isFavorite(poem.id);
  var langChip = '<span class="chip chip--lang-' + poem.language + '">' + svc.t('misc.lang.' + poem.language) + '</span>';
  var cats = (poem.categories || []).slice(0, 1).map(function (cId) {
    var cat = api().categoryById(cId);
    return cat ? '<span class="chip">' + esc(svc.label(cat)) + '</span>' : '';
  }).join('');

  return (
    '<article class="poem-card" data-poem-id="' + esc(poem.id) + '">' +
      '<button class="poem-card__fav' + (fav ? ' is-active' : '') + '" data-fav="' + esc(poem.id) + '" aria-label="favorite">' +
        '<span data-lucide="heart"></span>' +
      '</button>' +
      '<div class="poem-card__top">' + langChip + cats + '</div>' +
      '<a href="poem.html?id=' + encodeURIComponent(poem.id) + '" class="poem-card__title-link" style="display:block;">' +
        '<h3 class="poem-card__title">' + esc(poem.title) + '</h3>' +
        '<p class="poem-card__excerpt">' + esc(poem.excerpt || firstLines(poem.content)) + '</p>' +
      '</a>' +
      '<div class="poem-card__foot">' +
        '<a class="poem-card__author" href="author.html?id=' + encodeURIComponent(poem.authorId) + '">' +
          '<span class="poem-card__avatar">' + esc(author ? author.initials : '?') + '</span>' +
          '<span class="poem-card__author-name">' + esc(authorName) + '</span>' +
        '</a>' +
        (poem.year ? '<span class="text-muted" style="font-size:12px;">' + esc(poem.year) + '</span>' : '') +
      '</div>' +
    '</article>'
  );
};

comp.poemCardSkeleton = function () {
  return (
    '<div class="poem-card" aria-hidden="true">' +
      '<div class="skeleton skeleton--title"></div>' +
      '<div class="skeleton skeleton--text"></div>' +
      '<div class="skeleton skeleton--text" style="width:80%"></div>' +
      '<div class="skeleton skeleton--text" style="width:60%"></div>' +
      '<div class="poem-card__foot"><div class="skeleton" style="width:48px;height:32px;border-radius:50%"></div><div class="skeleton" style="width:90px;height:14px"></div></div>' +
    '</div>'
  );
};

/* ---------- Author card ---------- */
comp.authorCard = function (author) {
  var svc = i18n();
  return (
    '<a class="author-card" href="author.html?id=' + encodeURIComponent(author.id) + '">' +
      '<div class="author-card__photo">' + esc(author.initials) + '</div>' +
      '<div class="author-card__name">' + esc(author.name) + '</div>' +
      '<div class="author-card__meta">' + esc(author.country) + ' · ' + esc(author.poemCount || 0) + ' ' + svc.t('authors.poemsCount') + '</div>' +
    '</a>'
  );
};

comp.authorCardSkeleton = function () {
  return (
    '<div class="author-card" aria-hidden="true">' +
      '<div class="skeleton" style="width:96px;height:96px;border-radius:50%;margin-inline:auto;"></div>' +
      '<div class="skeleton skeleton--title" style="margin-inline:auto;width:60%"></div>' +
      '<div class="skeleton skeleton--text" style="margin-inline:auto;width:80%"></div>' +
    '</div>'
  );
};

/* ---------- Mood card ---------- */
comp.moodCard = function (mood) {
  var svc = i18n();
  var cat = api().categoryById(mood.id);
  var icon = cat ? cat.icon : 'sparkles';
  var count = mood.poemCount || 0;
  return (
    '<a class="mood-card" href="mood.html?mood=' + encodeURIComponent(mood.id) + '">' +
      '<div class="mood-card__icon"><span data-lucide="' + esc(icon) + '"></span></div>' +
      '<div>' +
        '<div class="mood-card__title">' + esc(svc.label(cat)) + '</div>' +
        '<div class="mood-card__count">' + esc(svc.tagline(mood)) + '</div>' +
      '</div>' +
      '<div class="mood-card__bg"><span data-lucide="' + esc(icon) + '"></span></div>' +
      '<div class="mood-card__count" style="position:absolute;top:18px;right:18px;">' + count + ' ' + svc.t('mood.poems') + '</div>' +
    '</a>'
  );
};

/* ---------- Empty / error states ---------- */
comp.emptyState = function (icon, title, text, ctaHtml) {
  return (
    '<div class="state">' +
      '<div class="state__icon"><span data-lucide="' + esc(icon || 'search') + '"></span></div>' +
      '<h3 class="state__title">' + esc(title) + '</h3>' +
      '<p class="state__text">' + esc(text) + '</p>' +
      (ctaHtml ? '<div class="state__action">' + ctaHtml + '</div>' : '') +
    '</div>'
  );
};

comp.errorState = function (text) {
  var svc = i18n();
  return comp.emptyState('frown', svc.t('toast.error'), text || '', '<a href="." class="btn btn--ghost">' + svc.t('misc.loading') + '</a>');
};

/* ---------- Helpers ---------- */
function firstLines(content) {
  if (!content) return '';
  var lines = content.split('\n').filter(Boolean);
  return lines.slice(0, 3).join(' ');
}
window.UNDES.firstLines = firstLines;
