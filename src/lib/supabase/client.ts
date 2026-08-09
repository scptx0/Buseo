import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function createSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas. La app funcionara sin backend.')
    return { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) }), insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }), delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }), update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }), rpc: () => Promise.resolve({ data: null, error: null }), functions: { invoke: () => Promise.resolve({ data: null, error: null }) }, auth: {} as never, storage: {} as never, realtime: {} as never } as unknown as SupabaseClient
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export const supabase = createSupabaseClient()
