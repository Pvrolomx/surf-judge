import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { propagateWinners } from '../../route'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Mark a slot as finished with a winner and open the heat, or just set winner
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { slot_id, winner_index, action } = await req.json()
  // action: 'open_heat' | 'set_winner'
  const supabase = getSupabase()

  // Get tournament
  const { data: tournament } = await supabase
    .from('sj_tournaments').select('*').eq('id', id).single()
  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

  if (action === 'open_heat') {
    // Create a new heat for this slot
    const { data: slot } = await supabase
      .from('sj_bracket_slots').select('*').eq('id', slot_id).single()
    if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

    const surferNames = slot.surfer_indices.map((i: number) => tournament.surfers[i])

    // Generate heat code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

    const { data: heat, error: hErr } = await supabase
      .from('sj_heats')
      .insert({
        code,
        judge_count: tournament.judge_count,
        surfer_count: surferNames.length,
        surfers: surferNames,
        status: 'active'
      })
      .select().single()

    if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })

    await supabase
      .from('sj_bracket_slots')
      .update({ heat_id: heat.id, status: 'open' })
      .eq('id', slot_id)

    return NextResponse.json({ heat })
  }

  if (action === 'set_winner') {
    await supabase
      .from('sj_bracket_slots')
      .update({ winner_index, status: 'finished' })
      .eq('id', slot_id)

    // Propagate winner to next round
    await propagateWinners(supabase, id)

    // Check if tournament is finished (final slot has winner)
    const { data: slots } = await supabase
      .from('sj_bracket_slots')
      .select('*')
      .eq('tournament_id', id)
    const maxRound = Math.max(...(slots || []).map((s: { round: number }) => s.round))
    const finalSlot = (slots || []).find((s: { round: number; winner_index: number | null }) => s.round === maxRound && s.winner_index !== null)
    if (finalSlot) {
      await supabase.from('sj_tournaments').update({ status: 'finished' }).eq('id', id)
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
