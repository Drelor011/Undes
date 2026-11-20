/**
 * Ündes — Auth service
 *
 * Demo mode: stores a fake user in localStorage. The shape mirrors the
 * Supabase Auth user object (`id`, `email`, `user_metadata.name`), so
 * swapping to real Supabase Auth requires no component changes.
 *
 * Supabase mode (when configured): delegates to supabase.auth —
 * signInWithPassword, signUp, signOut, getSession, onAuthStateChange.
 */

window.UNDES = window.UNDES || {};

window.UNDES.auth = (function () {
  var cfg = window.UNDES.config;
  var storage = window.UNDES.storage;
  var supabase = cfg.hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  function normalizeDemoUser(email, name) {
    var safeEmail = (email || 'reader@undes.app').toLowerCase().trim();
    var base = (name || safeEmail.split('@')[0] || 'Читатель').toString();
    var initials = (base.trim().charAt(0) || '?').toUpperCase();
    return {
      id: 'demo-' + btoa(unescape(encodeURIComponent(safeEmail))).slice(0, 12),
      email: safeEmail,
      name: base,
      initials: initials,
      createdAt: new Date().toISOString(),
      provider: 'demo'
    };
  }

  function currentUser() {
    return storage.get('currentUser', null);
  }

  function onAuthChange(cb) {
    // demo: poll-free; expose a tiny pub/sub
    bus.sub(cb);
    if (supabase) {
      supabase.auth.onAuthStateChange(function (_e, session) {
        cb(sessionToUser(session));
      });
    }
  }

  function sessionToUser(session) {
    if (!session || !session.user) return null;
    var u = session.user;
    var name = (u.user_metadata && u.user_metadata.name) || (u.email || '').split('@')[0];
    return {
      id: u.id,
      email: u.email,
      name: name,
      initials: (name.charAt(0) || '?').toUpperCase(),
      createdAt: u.created_at || new Date().toISOString(),
      provider: 'supabase'
    };
  }

  function signIn(email, password) {
    if (supabase) {
      return supabase.auth.signInWithPassword({ email: email, password: password })
        .then(function (r) {
          if (r.error) throw r.error;
          var u = sessionToUser(r.data.session);
          bus.pub(u);
          return u;
        });
    }
    // demo: accept any non-empty values
    return delay(420).then(function () {
      if (!email || !password) { var e = new Error('Заполните поля'); throw e; }
      var u = normalizeDemoUser(email);
      storage.set('currentUser', u);
      bus.pub(u);
      return u;
    });
  }

  function signUp(name, email, password) {
    if (supabase) {
      return supabase.auth.signUp({
        email: email, password: password,
        options: { data: { name: name } }
      }).then(function (r) {
        if (r.error) throw r.error;
        var u = sessionToUser(r.data.session);
        bus.pub(u);
        return u;
      });
    }
    return delay(520).then(function () {
      if (!email || !password || !name) { var e = new Error('Заполните все поля'); throw e; }
      var u = normalizeDemoUser(email, name);
      storage.set('currentUser', u);
      bus.pub(u);
      return u;
    });
  }

  function signOut() {
    if (supabase) {
      return supabase.auth.signOut().then(function () {
        bus.pub(null);
      });
    }
    storage.remove('currentUser');
    bus.pub(null);
    return Promise.resolve(true);
  }

  function requireAuth(redirect) {
    var u = currentUser();
    if (!u) {
      window.location.href = (redirect || '/pages/login.html') + '?next=' + encodeURIComponent(window.location.pathname + window.location.search);
      return false;
    }
    return true;
  }

  /* ---- tiny pub/sub for demo mode auth state ---- */
  var bus = (function () {
    var subs = [];
    return {
      sub: function (cb) { subs.push(cb); },
      pub: function (user) { subs.forEach(function (cb) { try { cb(user); } catch (e) {} }); }
    };
  })();

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  return {
    currentUser: currentUser,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    onAuthChange: onAuthChange,
    requireAuth: requireAuth
  };
})();
