import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabase()

  // id can be uuid or code
  const isCode = id.length === 6 && id === id.toUpperCase()
  const query = supabase.from('sj_tournaments').select('*')
  const { data: tournament, error } = await (isCode ? query.eq('code', id) : query.eq('id', id)).single()

  if (error || !tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get bracket slots
  const { data: slots } = await supabase
    .from('sj_bracket_slots')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('round').order('position')

  return NextResponse.json({ tournament, slots: slots || [] })
}
