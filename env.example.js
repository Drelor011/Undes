/**
 * Ündes — Environment configuration template
 *
 * 1. Copy this file to `env.js` (it is gitignored).
 * 2. Fill in your Supabase project URL and anon public key.
 * 3. Load the Supabase JS SDK BEFORE the Ündes services, e.g.:
 *      <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
 *      <script src="env.js"></script>
 *      ... (other Ündes scripts)
 *
 * Without env.js the app runs in DEMO mode backed by localStorage —
 * this is the default so the platform works out of the box.
 *
 * IMPORTANT: only the ANON public key belongs here. Never ship the
 * service_role key in client-side code.
 */

window.UNDES_ENV = {
  supabaseUrl: '',         // e.g. https://abcdefg.supabase.co
  supabaseAnonKey: ''     // eyJhbGciOi... (public anon key)
};
