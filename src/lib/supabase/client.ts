import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ✅ Singleton
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // ✅ مهم جداً: خليه default
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,

          // ❌ احذف هذا (هو السبب!)
          // storageKey: "athar-auth",
        },
      }
    );
  }

  return _client;
}

// ✅ Session
export async function getSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ✅ User ID
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}