import { createClient } from "@supabase/supabase-js";

// Public Supabase project — anon (publishable) key is safe to expose in client code.
// Schema and RLS are managed manually in the Supabase Dashboard.
const SUPABASE_URL = "https://bfmuthucwogeklucsptj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IpO3WO_h1HCdPUeUeXKMIA_d5tPZYMo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
