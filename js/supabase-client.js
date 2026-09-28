/**
 * Single browser-side Supabase client.
 * Secret/database credentials must never be exposed by this module.
 */
(function initializeSupabaseClient() {
  'use strict';

  window.supabaseClientReady = (async () => {
    const response = await fetch('/api/config', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Konfigurasi Supabase tidak dapat dimuat.');

    const config = await response.json();
    if (!config.configured || !config.supabase) {
      throw new Error('SUPABASE_URL atau SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi di .env.');
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Library Supabase JavaScript gagal dimuat.');
    }

    const client = window.supabase.createClient(
      config.supabase.url,
      config.supabase.publishableKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );

    window.hemoSupabase = client;
    return client;
  })();

  window.supabaseClientReady.catch(error => {
    console.warn('[Supabase]', error.message);
  });
})();
