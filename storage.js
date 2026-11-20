/**
 * Ündes — Storage service
 *
 * Thin, typed wrapper over localStorage with JSON serialization and
 * a single namespaced key prefix. Used by demo-mode data layer and
 * user preferences (favorites, history, theme, language) — the same
 * interface the Supabase-backed api uses when offline / unauthenticated.
 */

window.UNDES = window.UNDES || {};

window.UNDES.storage = (function () {
  var PREFIX = window.UNDES.config.storagePrefix;

  function key(name) { return PREFIX + name; }

  function get(name, fallback) {
    try {
      var raw = localStorage.getItem(key(name));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(name, value) {
    try {
      localStorage.setItem(key(name), JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(name) {
    try { localStorage.removeItem(key(name)); return true; } catch (e) { return false; }
  }

  // Convenience for array helpers
  function getArray(name) { var v = get(name, []); return Array.isArray(v) ? v : []; }
  function pushUnique(name, value, max) {
    var arr = getArray(name).filter(function (x) { return x !== value && JSON.stringify(x) !== JSON.stringify(value); });
    arr.unshift(value);
    if (typeof max === 'number' && arr.length > max) arr.length = max;
    set(name, arr);
    return arr;
  }
  function removeValue(name, value) {
    var arr = getArray(name).filter(function (x) { return JSON.stringify(x) !== JSON.stringify(value); });
    set(name, arr);
    return arr;
  }

  return {
    get: get, set: set, remove: remove,
    getArray: getArray, pushUnique: pushUnique, removeValue: removeValue,
    key: key
  };
})();
