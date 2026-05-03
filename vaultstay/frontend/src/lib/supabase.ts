import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const isConfigured = Boolean(supabaseUrl && supabaseKey);

// Singleton supabase client for the browser
let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!isConfigured) {
    // Return a no-op proxy so callers don't crash when Supabase isn't configured
    // Expanded no-op proxy so every call chain resolves without throwing
    const noopQueryBuilder: Record<string, unknown> = {
      select: () => noopQueryBuilder,
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => noopQueryBuilder,
      delete: () => noopQueryBuilder,
      eq: () => noopQueryBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: (v: { data: null; error: null }) => void) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
    };
    return {
      from: () => noopQueryBuilder,
    } as unknown as ReturnType<typeof createSupabaseClient>;
  }

  if (!_client) {
    _client = createSupabaseClient(supabaseUrl, supabaseKey);
  }
  return _client;
}
