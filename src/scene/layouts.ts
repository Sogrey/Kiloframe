import { OBJECT_COUNT } from '../types'

export interface Placement {
  x: number
  y: number
  z: number
  rotY: number
  scale: number
}

/** Deterministic grid placements so all modes share the same scene layout. */
export function buildPlacements(count = OBJECT_COUNT): Placement[] {
  const cols = Math.ceil(Math.sqrt(count))
  const spacing = 2.4
  const origin = ((cols - 1) * spacing) / 2
  const list: Placement[] = []

  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    // Mild deterministic variation — same seed logic for every mode
    const n = ((i * 1103515245 + 12345) >>> 0) / 0xffffffff
    list.push({
      x: col * spacing - origin,
      y: 0,
      z: row * spacing - origin,
      rotY: n * Math.PI * 2,
      scale: 0.85 + (n % 0.3),
    })
  }

  return list
}
