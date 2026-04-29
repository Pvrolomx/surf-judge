export type JudgeCount = 3 | 5
export type SurferCount = 2 | 3 | 4

export interface Heat {
  id: string
  code: string
  judge_count: JudgeCount
  surfer_count: SurferCount
  surfers: string[]           // names in order [0..surfer_count-1]
  status: 'active' | 'finished'
  created_at: string
}

export interface Score {
  id: string
  heat_id: string
  judge_number: number        // 1..5
  surfer_index: number        // 0..surfer_count-1
  wave_number: number         // sequential per surfer per judge
  score: number               // 0.00 - 10.00
  created_at: string
}

// Computed per surfer
export interface SurferResult {
  surfer_index: number
  name: string
  waves: WaveResult[]         // all scored waves
  top2: number[]              // top 2 computed scores
  total: number               // sum of top2
  rank: number                // 1..surfer_count
  needs_to_advance: number | null  // points needed to reach next rank
}

export interface WaveResult {
  wave_number: number
  judge_scores: (number | null)[]  // index = judge_number-1, null if not yet scored
  computed: number | null     // computed score after eliminating high/low (5j) or avg (3j)
  all_judges_in: boolean
}

// ─── Tournament types ───────────────────────────────────────────
export type TournamentFormat = '2-1' // expandible: '3-1', '4-2', '3-1-repechaje'

export interface Tournament {
  id: string
  code: string            // 6-char director access code
  name: string | null
  surfers: string[]       // master list
  format: TournamentFormat
  judge_count: JudgeCount
  status: 'active' | 'finished'
  created_at: string
}

export interface BracketSlot {
  id: string
  tournament_id: string
  round: number           // 1 = first round, 2 = semis, etc.
  position: number        // slot index within round (0-based)
  surfer_indices: number[] // indexes into tournament.surfers
  heat_id: string | null  // linked heat once opened
  winner_index: number | null // index into tournament.surfers
  status: 'pending' | 'open' | 'finished'
}
