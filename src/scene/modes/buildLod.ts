import * as THREE from 'three'
import type { TemplatePart } from '../modelTemplate'
import { composePlacement } from '../mathPool'
import type { ModeBuildContext } from './types'

function makePartGroup(parts: TemplatePart[]) {
  const g = new THREE.Group()
  for (const part of parts) {
    const mesh = new THREE.Mesh(part.geometry, part.material)
    mesh.frustumCulled = true
    g.add(mesh)
  }
  return g
}

export function buildLod({ root, placements, template, lodMid, lodLow }: ModeBuildContext) {
  const high = template.parts
  const mid = lodMid.length ? lodMid : high
  const low = lodLow.length ? lodLow : high
  const m = new THREE.Matrix4()
  const { groundOffset } = template

  for (const p of placements) {
    const lod = new THREE.LOD()
    lod.addLevel(makePartGroup(high), 0)
    lod.addLevel(makePartGroup(mid), 30)
    lod.addLevel(makePartGroup(low), 60)
    composePlacement(p, groundOffset, m)
    lod.applyMatrix4(m)
    root.add(lod)
  }
}
