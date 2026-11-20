/**
 * Ündes — Configuration
 *
 * Reads Supabase keys from a global `UNDES_ENV` object (set in env.js,
 * kept out of source control) or from window.__UNDES_ENV__ injected at
 * deploy time. When keys are absent, the platform transparently falls
 * back to demo mode backed by local in-memory + localStorage data.
 */

window.UNDES = window.UNDES || {};

window.UNDES.config = (function () {
  // env.js (gitignored) may define window.UNDES_ENV = { supabaseUrl, supabaseAnonKey }
  var env = (typeof window !== 'undefined' && window.UNDES_ENV) || {};
  var url = env.supabaseUrl || '';
  var key = env.supabaseAnonKey || '';

  var hasSupabase = Boolean(url && key && window.supabase);

  return {
    appName: 'Ündes',
    storagePrefix: 'undes:',
    languages: ['kz', 'ru', 'en'],
    defaultLanguage: 'ru',
    defaultTheme: 'light',
    supabaseUrl: url,
    supabaseAnonKey: key,
    hasSupabase: hasSupabase,
    isDemo: !hasSupabase,
    pageSize: 9,
    readingHistoryLimit: 30
  };
})();
