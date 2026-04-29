/**
 * Bracket generation logic for surf tournaments.
 * Format '2-1': heats of 2, winner advances, single elimination.
 * 
 * If surfers count is not a power of 2, top seeds get byes.
 * e.g. 5 surfers → R1 has 2 heats (4 surfers fight), 1 bye → R2 has 3 slots
 * We handle this by padding with null (bye).
 */

export interface SlotInit {
  round: number
  position: number
  surfer_indices: number[]  // -1 = bye/TBD
}

export function generateBracket(surferCount: number): SlotInit[] {
  // Find next power of 2
  let size = 1
  while (size < surferCount) size *= 2

  const byes = size - surferCount
  const slots: SlotInit[] = []

  // Round 1: pair up surfers (byes get top seeds)
  // Seeding: alternating so byes go to top seeds
  // Positions 0..size/2-1
  const r1count = size / 2

  for (let pos = 0; pos < r1count; pos++) {
    const a = pos * 2        // surfer index a
    const b = pos * 2 + 1   // surfer index b
    const aIdx = a < surferCount ? a : -1
    const bIdx = b < surferCount ? b : -1

    if (aIdx === -1 && bIdx === -1) continue // shouldn't happen

    // If one side is bye, this slot auto-advances the real surfer
    slots.push({
      round: 1,
      position: pos,
      surfer_indices: [aIdx, bIdx].filter(x => x !== -1)
    })
  }

  // Generate subsequent rounds (TBD slots)
  let prevCount = r1count
  let round = 2
  while (prevCount > 1) {
    const count = prevCount / 2
    for (let pos = 0; pos < count; pos++) {
      slots.push({ round, position: pos, surfer_indices: [] }) // TBD
    }
    prevCount = count
    round++
  }

  return slots
}

export function totalRounds(surferCount: number): number {
  let size = 1, rounds = 0
  while (size < surferCount) { size *= 2; rounds++ }
  return rounds
}
