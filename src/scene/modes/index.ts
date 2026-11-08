import type { RenderMode } from '../../types'
import { buildBaseline } from './buildBaseline'
import { buildInstanced } from './buildInstanced'
import { buildLod } from './buildLod'
import { buildMerged } from './buildMerged'
import type { ModeBuildContext } from './types'

export type { ModeBuildContext } from './types'

const builders: Record<RenderMode, (ctx: ModeBuildContext) => void> = {
  baseline: buildBaseline,
  instanced: buildInstanced,
  merged: buildMerged,
  lod: buildLod,
}

export function buildModeScene(mode: RenderMode, ctx: ModeBuildContext) {
  builders[mode](ctx)
}
