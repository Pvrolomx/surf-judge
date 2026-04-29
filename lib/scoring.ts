import type { Score, SurferResult, WaveResult, Heat } from './types'

/**
 * Compute score for a single wave given all judge scores.
 * 5 judges: drop highest + lowest, average remaining 3
 * 3 judges: average all 3
 * Returns null if not all judges have scored.
 */
export function computeWaveScore(judgeScores: (number | null)[], judgeCount: number): number | null {
  const filled = judgeScores.filter(s => s !== null) as number[]
  if (filled.length < judgeCount) return null

  if (judgeCount === 5) {
    const sorted = [...filled].sort((a, b) => a - b)
    const middle = sorted.slice(1, 4)
    return Math.round((middle.reduce((s, v) => s + v, 0) / 3) * 100) / 100
  } else {
    return Math.round((filled.reduce((s, v) => s + v, 0) / 3) * 100) / 100
  }
}

/**
 * Build WaveResult[] for one surfer from raw Score rows.
 * judgeScores array is indexed by judge_number - 1.
 */
export function buildWaveResults(
  scores: Score[],
  surferIndex: number,
  judgeCount: number
): WaveResult[] {
  // Group by wave_number
  const byWave: Record<number, (number | null)[]> = {}
  for (const s of scores) {
    if (s.surfer_index !== surferIndex) continue
    if (!byWave[s.wave_number]) byWave[s.wave_number] = Array(judgeCount).fill(null)
    byWave[s.wave_number][s.judge_number - 1] = s.score
  }
  return Object.entries(byWave)
    .map(([wn, js]) => {
      const allIn = js.every(v => v !== null)
      const computed = allIn ? computeWaveScore(js, judgeCount) : null
      return {
        wave_number: Number(wn),
        judge_scores: js,
        computed,
        all_judges_in: allIn
      }
    })
    .sort((a, b) => a.wave_number - b.wave_number)
}

/**
 * Pick top 2 waves by computed score.
 * Tiebreak: if two surfers have same total, compare best wave, then 3rd wave.
 */
export function getTop2(waves: WaveResult[]): number[] {
  const completed = waves
    .filter(w => w.computed !== null)
    .sort((a, b) => (b.computed ?? 0) - (a.computed ?? 0))
  const top = completed.slice(0, 2).map(w => w.computed ?? 0)
  return top
}

/**
 * Compute all surfer results with ranking and needs_to_advance.
 */
export function computeResults(heat: Heat, scores: Score[]): SurferResult[] {
  const results: SurferResult[] = heat.surfers.map((name, idx) => {
    const waves = buildWaveResults(scores, idx, heat.judge_count)
    const top2 = getTop2(waves)
    const total = Math.round(top2.reduce((s, v) => s + v, 0) * 100) / 100
    return { surfer_index: idx, name, waves, top2, total, rank: 0, needs_to_advance: null }
  })

  // Rank with tiebreak
  const ranked = rankSurfers(results, scores, heat)

  // needs_to_advance: how many points to reach the next rank
  for (const r of ranked) {
    if (r.rank === 1) {
      r.needs_to_advance = null
    } else {
      const leader = ranked.find(x => x.rank === r.rank - 1)!
      const diff = Math.round((leader.total - r.total + 0.05) * 100) / 100
      r.needs_to_advance = Math.max(0, diff)
    }
  }

  return ranked
}

function rankSurfers(results: SurferResult[], scores: Score[], heat: Heat): SurferResult[] {
  const sorted = [...results].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    // Tiebreak 1: best single wave
    const bestA = a.waves.filter(w => w.computed !== null).sort((x, y) => (y.computed ?? 0) - (x.computed ?? 0))[0]?.computed ?? 0
    const bestB = b.waves.filter(w => w.computed !== null).sort((x, y) => (y.computed ?? 0) - (x.computed ?? 0))[0]?.computed ?? 0
    if (bestB !== bestA) return bestB - bestA
    // Tiebreak 2: 3rd wave
    const thirdA = a.waves.filter(w => w.computed !== null).sort((x, y) => (y.computed ?? 0) - (x.computed ?? 0))[2]?.computed ?? 0
    const thirdB = b.waves.filter(w => w.computed !== null).sort((x, y) => (y.computed ?? 0) - (x.computed ?? 0))[2]?.computed ?? 0
    return thirdB - thirdA
  })
  sorted.forEach((r, i) => { r.rank = i + 1 })
  return sorted
}
