import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env } from '@/lib/env'

function required(name: string, v: string | undefined) {
  if (!v) throw new Error(`${name} не задан — Supabase не подключён (демо-режим)`)
  return v
}

/** Публичный клиент (anon + RLS) — для чтения витрины. */
export function createPublicClient() {
  return createClient<Database>(
    required('NEXT_PUBLIC_SUPABASE_URL', env.NEXT_PUBLIC_SUPABASE_URL),
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY', env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/** Service-role клиент — только сервер: заказы, бот, сид. */
export function createAdminClient() {
  return createClient<Database>(
    required('NEXT_PUBLIC_SUPABASE_URL', env.NEXT_PUBLIC_SUPABASE_URL),
    required('SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
