import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('sj_heats')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()
  if (error || !data) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = getSupabase()
  const body = await req.json()
  const { data, error } = await supabase
    .from('sj_heats')
    .update(body)
    .eq('code', code.toUpperCase())
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
