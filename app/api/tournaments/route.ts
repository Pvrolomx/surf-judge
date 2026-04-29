import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBracket } from '@/lib/bracket'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  const { name, surfers, format, judge_count } = await req.json()
  if (!surfers || surfers.length < 2) return NextResponse.json({ error: 'Minimum 2 surfers' }, { status: 400 })

  const supabase = getSupabase()
  const code = generateCode()

  // Create tournament
  const { data: tournament, error: tErr } = await supabase
    .from('sj_tournaments')
    .insert({ code, name: name || null, surfers, format: format || '2-1', judge_count, status: 'active' })
    .select().single()

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // Generate bracket slots
  const slots = generateBracket(surfers.length)

  // Auto-advance byes (slots with only 1 surfer)
  const slotsToInsert = slots.map(s => ({
    tournament_id: tournament.id,
    round: s.round,
    position: s.position,
    surfer_indices: s.surfer_indices,
    status: s.round === 1 && s.surfer_indices.length === 1 ? 'finished' : 'pending',
    winner_index: s.round === 1 && s.surfer_indices.length === 1 ? s.surfer_indices[0] : null,
    heat_id: null
  }))

  const { error: sErr } = await supabase.from('sj_bracket_slots').insert(slotsToInsert)
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  // Propagate any auto-bye winners to round 2
  await propagateWinners(supabase, tournament.id)

  return NextResponse.json(tournament)
}

// Propagate winners up the bracket after a slot finishes
export async function propagateWinners(supabase: ReturnType<typeof createClient>, tournamentId: string) {
  // Get all slots
  const { data: slots } = await supabase
    .from('sj_bracket_slots')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round').order('position')

  if (!slots) return

  let changed = true
  while (changed) {
    changed = false
    for (const slot of slots) {
      if (slot.winner_index === null) continue
      if (slot.status !== 'finished') continue

      // Find the next round slot this winner feeds into
      const nextRound = slot.round + 1
      const nextPos = Math.floor(slot.position / 2)
      const nextSlot = slots.find(s => s.round === nextRound && s.position === nextPos)
      if (!nextSlot) continue

      // Determine which side of the next slot (0 = left, 1 = right)
      const side = slot.position % 2
      const currentIndices = [...(nextSlot.surfer_indices || [])]

      // Extend array if needed
      while (currentIndices.length <= side) currentIndices.push(-1)
      if (currentIndices[side] === slot.winner_index) continue // already set

      currentIndices[side] = slot.winner_index

      await supabase
        .from('sj_bracket_slots')
        .update({ surfer_indices: currentIndices.filter(x => x !== -1) })
        .eq('id', nextSlot.id)

      // Update local copy
      nextSlot.surfer_indices = currentIndices.filter(x => x !== -1)
      changed = true
    }
  }
}
