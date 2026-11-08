import type { Group } from 'three'
import type { Placement } from '../layouts'
import type { ModelTemplate, TemplatePart } from '../modelTemplate'

export interface ModeBuildContext {
  root: Group
  placements: Placement[]
  template: ModelTemplate
  lodMid: TemplatePart[]
  lodLow: TemplatePart[]
}
