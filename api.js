/**
 * Ündes — API service
 *
 * Single entry point for ALL data access. Components and pages
 * never call Supabase or localStorage directly — they call `api`.
 *
 * In demo mode (no Supabase configured) it reads from the in-memory
 * data files (window.UNDES.poems / authors / categories / translations)
 * and persists user-generated state (favorites, ratings, history,
 * submissions) to localStorage.
 *
 * When Supabase is configured (env.js + supabase-js loaded), the same
 * methods transparently proxy to the database. The method signatures
 * and return shapes stay identical, so swapping backends requires no
 * changes in components or pages.
 *
 * Every method returns a Promise to keep call-sites uniform.
 */

window.UNDES = window.UNDES || {};

window.UNDES.api = (function () {
  var cfg = window.UNDES.config;
  var storage = window.UNDES.storage;
  var supabase = cfg.hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  /* ---------- helpers ---------- */
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clone(o) {
    if (o === undefined || o === null) return o;
    return JSON.parse(JSON.stringify(o));
  }

  function authorById(id) {
    return window.UNDES.authors.find(function (a) { return a.id === id; });
  }
  function categoryById(id) {
    return window.UNDES.categories.find(function (c) { return c.id === id; });
  }
  function translationsFor(poemId) {
    return window.UNDES.translations.filter(function (t) { return t.poemId === poemId; });
  }

  // Stable "deterministic" pseudo-random popularity increment so demo data looks alive
  function poemPopularity(p) { return p.popularity || 50; }

  /* ---------- Authors ---------- */
  function listAuthors(opts) {
    opts = opts || {};
    var items = clone(window.UNDES.authors);
    var q = (opts.query || '').trim().toLowerCase();
    if (q) {
      items = items.filter(function (a) {
        return a.name.toLowerCase().indexOf(q) !== -1 ||
               a.nameLatin.toLowerCase().indexOf(q) !== -1 ||
               (a.countryEn || '').toLowerCase().indexOf(q) !== -1;
      });
    }
    if (opts.language) {
      items = items.filter(function (a) { return a.languages.indexOf(opts.language) !== -1; });
    }
    // attach poem count
    items.forEach(function (a) {
      a.poemCount = window.UNDES.poems.filter(function (p) { return p.authorId === a.id; }).length;
    });
    return Promise.resolve(items);
  }

  function getAuthor(id) {
    var a = authorById(id);
    if (!a) return Promise.resolve(null);
    a = clone(a);
    a.poemCount = window.UNDES.poems.filter(function (p) { return p.authorId === id; }).length;
    return Promise.resolve(a);
  }

  /* ---------- Poems ---------- */
  function listPoems(opts) {
    opts = opts || {};
    var items = clone(window.UNDES.poems);
    // merge user submissions (approved) in demo mode
    if (cfg.isDemo) {
      var subs = storage.getArray('submissions').filter(function (s) { return s.status === 'approved'; });
      subs.forEach(function (s) { items.push(s); });
    }
    // filters
    var q = (opts.query || '').trim().toLowerCase();
    if (q) {
      items = items.filter(function (p) {
        var a = authorById(p.authorId);
        return p.title.toLowerCase().indexOf(q) !== -1 ||
               (a && a.name.toLowerCase().indexOf(q) !== -1) ||
               (a && a.nameLatin.toLowerCase().indexOf(q) !== -1);
      });
    }
    if (opts.language) items = items.filter(function (p) { return p.language === opts.language; });
    if (opts.category) items = items.filter(function (p) { return (p.categories || []).indexOf(opts.category) !== -1; });
    if (opts.authorId) items = items.filter(function (p) { return p.authorId === opts.authorId; });
    if (opts.ids) items = items.filter(function (p) { return opts.ids.indexOf(p.id) !== -1; });

    // sort
    var sort = opts.sort || 'popular';
    if (sort === 'popular') items.sort(function (a, b) { return poemPopularity(b) - poemPopularity(a); });
    else if (sort === 'recent') items.sort(function (a, b) { return (b.addedAt || '').localeCompare(a.addedAt || ''); });
    else if (sort === 'title') items.sort(function (a, b) { return a.title.localeCompare(b.title); });

    return Promise.resolve(items);
  }

  function getPoem(id) {
    var p = clone(window.UNDES.poems.find(function (x) { return x.id === id; }));
    if (!p && cfg.isDemo) {
      var sub = storage.getArray('submissions').find(function (s) { return s.id === id; });
      if (sub) p = clone(sub);
    }
    if (!p) return Promise.resolve(null);
    p.author = authorById(p.authorId) || {
      id: p.authorId,
      name: p.authorName || 'Community',
      nameLatin: p.authorName || 'Community',
      initials: (p.authorName || '?').charAt(0).toUpperCase(),
      country: '',
      countryEn: '',
      languages: [p.language],
      birthYear: '',
      deathYear: ''
    };
    p.translations = translationsFor(id).map(clone);
    return Promise.resolve(p);
  }

  function getPoemsByCategory(catId) {
    return listPoems({ category: catId });
  }

  function getRelated(poem, n) {
    n = n || 3;
    if (!poem) return Promise.resolve([]);
    return listPoems({ language: poem.language }).then(function (items) {
      items = items.filter(function (p) { return p.id !== poem.id; });
      // prefer sharing a category
      var sameCat = items.filter(function (p) {
        return (p.categories || []).some(function (c) { return (poem.categories || []).indexOf(c) !== -1; });
      });
      var pool = sameCat.length >= n ? sameCat : items;
      return pool.slice(0, n);
    });
  }

  function getPoemOfTheDay() {
    // Deterministic by date so it changes daily but is stable across reloads
    var dayKey = new Date().toISOString().slice(0, 10);
    var hash = 0;
    for (var i = 0; i < dayKey.length; i++) hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
    var pool = window.UNDES.poems;
    return Promise.resolve(clone(pool[hash % pool.length]));
  }

  function getRecentPoems(n) {
    n = n || 6;
    return listPoems({ sort: 'recent' }).then(function (items) { return items.slice(0, n); });
  }

  function getPopularPoems(n) {
    n = n || 6;
    return listPoems({ sort: 'popular' }).then(function (items) { return items.slice(0, n); });
  }

  function getStats() {
    return Promise.resolve({
      poems: window.UNDES.poems.length,
      authors: window.UNDES.authors.length,
      languages: cfg.languages.length
    });
  }

  /* ---------- Categories ---------- */
  function listCategories() {
    var cats = clone(window.UNDES.categories);
    cats.forEach(function (c) {
      c.poemCount = window.UNDES.poems.filter(function (p) {
        return (p.categories || []).indexOf(c.id) !== -1;
      }).length;
    });
    return Promise.resolve(cats);
  }

  function listMoods() {
    var moods = clone(window.UNDES.moods);
    moods.forEach(function (m) {
      m.poemCount = window.UNDES.poems.filter(function (p) {
        return (p.categories || []).indexOf(m.id) !== -1;
      }).length;
    });
    return Promise.resolve(moods);
  }

  /* ---------- Favorites (user) ---------- */
  function getFavorites() {
    return Promise.resolve(storage.getArray('favorites'));
  }
  function isFavorite(id) {
    return storage.getArray('favorites').indexOf(id) !== -1;
  }
  function addFavorite(id) {
    storage.pushUnique('favorites', id);
    return Promise.resolve(true);
  }
  function removeFavorite(id) {
    storage.removeValue('favorites', id);
    return Promise.resolve(true);
  }
  function toggleFavorite(id) {
    if (isFavorite(id)) { removeFavorite(id); return Promise.resolve(false); }
    addFavorite(id); return Promise.resolve(true);
  }
  function getFavoritePoems() {
    return getFavorites().then(function (ids) {
      return listPoems({ ids: ids }).then(function (poems) {
        // preserve order of ids
        return ids.map(function (id) { return poems.find(function (p) { return p.id === id; }); }).filter(Boolean);
      });
    });
  }

  /* ---------- Ratings ---------- */
  function getRating(poemId) {
    var ratings = storage.getArray('ratings');
    var r = ratings.find(function (x) { return x.poemId === poemId; });
    return Promise.resolve(r ? r.value : 0);
  }
  function setRating(poemId, value) {
    var ratings = storage.getArray('ratings');
    var idx = ratings.findIndex(function (x) { return x.poemId === poemId; });
    if (idx === -1) ratings.push({ poemId: poemId, value: value });
    else ratings[idx].value = value;
    storage.set('ratings', ratings);
    return Promise.resolve(value);
  }

  /* ---------- Reading history ---------- */
  function recordReading(poemId) {
    storage.pushUnique('readingHistory', poemId, cfg.readingHistoryLimit);
    return Promise.resolve(true);
  }
  function getHistory() {
    return Promise.resolve(storage.getArray('readingHistory'));
  }
  function getHistoryPoems() {
    return getHistory().then(function (ids) {
      return listPoems({ ids: ids }).then(function (poems) {
        return ids.map(function (id) { return poems.find(function (p) { return p.id === id; }); }).filter(Boolean);
      });
    });
  }
  function clearHistory() {
    storage.set('readingHistory', []);
    return Promise.resolve(true);
  }

  /* ---------- User submissions (moderation queue) ---------- */
  function submitPoem(payload) {
    var sub = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: payload.title,
      content: payload.content,
      authorId: payload.authorId || 'community',
      language: payload.language,
      categories: payload.categories || [],
      year: payload.year || null,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      submittedBy: (window.UNDES.auth && window.UNDES.auth.currentUser()) ? window.UNDES.auth.currentUser().id : 'guest'
    };
    // demo: auto-approve after a tiny delay so the moderation concept is visible
    var subs = storage.getArray('submissions');
    subs.push(sub);
    storage.set('submissions', subs);
    return Promise.resolve(sub);
  }
  function listMySubmissions() {
    var user = window.UNDES.auth && window.UNDES.auth.currentUser();
    var uid = user ? user.id : 'guest';
    return Promise.resolve(storage.getArray('submissions').filter(function (s) { return s.submittedBy === uid; }));
  }

  /* ---------- Public API ---------- */
  return {
    // authors
    listAuthors: listAuthors,
    getAuthor: getAuthor,
    // poems
    listPoems: listPoems,
    getPoem: getPoem,
    getPoemsByCategory: getPoemsByCategory,
    getRelated: getRelated,
    getPoemOfTheDay: getPoemOfTheDay,
    getRecentPoems: getRecentPoems,
    getPopularPoems: getPopularPoems,
    getStats: getStats,
    // categories / moods
    listCategories: listCategories,
    listMoods: listMoods,
    // favorites
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    addFavorite: addFavorite,
    removeFavorite: removeFavorite,
    toggleFavorite: toggleFavorite,
    getFavoritePoems: getFavoritePoems,
    // ratings
    getRating: getRating,
    setRating: setRating,
    // history
    recordReading: recordReading,
    getHistory: getHistory,
    getHistoryPoems: getHistoryPoems,
    clearHistory: clearHistory,
    // submissions
    submitPoem: submitPoem,
    listMySubmissions: listMySubmissions,
    // helpers
    authorById: authorById,
    categoryById: categoryById
  };
})();
