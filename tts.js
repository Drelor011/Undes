/**
 * Ündes — Text-to-Speech service
 *
 * Uses the browser SpeechSynthesis API. Picks a voice matching the
 * poem's language when available (Kazakh may fall back to Russian or
 * the default voice on most systems). Exposes play / pause / stop and
 * a progress callback (0..1) for player UIs.
 *
 * If the API is unavailable, surfaces a clean "unsupported" flag so
 * pages can show a friendly toast instead of throwing.
 */

window.UNDES = window.UNDES || {};

window.UNDES.tts = (function () {
  var synth = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null;
  var supported = !!synth;
  var utter = null;
  var onProgress = null;
  var boundEnd = null;
  var state = { playing: false, paused: false, poemId: null };

  function voices() { return supported ? synth.getVoices() : []; }
  function pickVoice(lang) {
    var vs = voices();
    if (!vs.length) return null;
    var map = { kz: ['kk', 'kz', 'ru', 'tr'], ru: ['ru'], en: ['en'] };
    var prefs = map[lang] || [lang];
    for (var i = 0; i < prefs.length; i++) {
      var match = vs.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf(prefs[i]) === 0; });
      if (match) return match;
    }
    return vs[0];
  }

  function speak(text, lang, opts) {
    opts = opts || {};
    if (!supported) { if (opts.onUnsupported) opts.onUnsupported(); return false; }
    stop();
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice(lang);
    if (v) u.voice = v;
    u.lang = (lang === 'kz' ? 'kk-KZ' : (lang === 'ru' ? 'ru-RU' : 'en-US'));
    u.rate = opts.rate || 0.92;
    u.pitch = opts.pitch || 1.0;

    state.playing = true; state.paused = false; state.poemId = opts.poemId || null;
    onProgress = opts.onProgress || null;

    var total = text.length;
    u.onboundary = function (e) {
      if (onProgress && total) onProgress(Math.min(1, (e.charIndex || 0) / total));
    };
    u.onend = function () {
      state.playing = false; state.paused = false; state.poemId = null;
      if (onProgress) onProgress(1);
      if (opts.onEnd) opts.onEnd();
    };
    u.onerror = function () {
      state.playing = false; state.paused = false; state.poemId = null;
      if (opts.onError) opts.onError();
    };
    utter = u;
    synth.speak(u);
    return true;
  }

  function pause() { if (supported && state.playing && !state.paused) { synth.pause(); state.paused = true; } }
  function resume() { if (supported && state.paused) { synth.resume(); state.paused = false; } }
  function stop() {
    if (!supported) return;
    try { synth.cancel(); } catch (e) {}
    state.playing = false; state.paused = false; state.poemId = null;
  }

  return {
    isSupported: supported,
    state: state,
    speak: speak,
    pause: pause,
    resume: resume,
    stop: stop
  };
})();
