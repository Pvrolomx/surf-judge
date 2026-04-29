import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { heat_id, judge_number, surfer_index, score } = await req.json()
  if (score < 0 || score > 10) return NextResponse.json({ error: 'Score must be 0-10' }, { status: 400 })
  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('sj_scores')
    .select('wave_number')
    .eq('heat_id', heat_id)
    .eq('judge_number', judge_number)
    .eq('surfer_index', surfer_index)
    .order('wave_number', { ascending: false })
    .limit(1)
  const wave_number = existing && existing.length > 0 ? existing[0].wave_number + 1 : 1
  const { data, error } = await supabase
    .from('sj_scores')
    .insert({ heat_id, judge_number, surfer_index, wave_number, score })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const heat_id = req.nextUrl.searchParams.get('heat_id')
  if (!heat_id) return NextResponse.json({ error: 'heat_id required' }, { status: 400 })
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('sj_scores')
    .select('*')
    .eq('heat_id', heat_id)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
