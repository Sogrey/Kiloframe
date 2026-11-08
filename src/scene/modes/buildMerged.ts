import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { composePlacement } from '../mathPool'
import type { ModeBuildContext } from './types'

export function buildMerged({ root, placements, template }: ModeBuildContext) {
  const m = new THREE.Matrix4()
  const { parts, groundOffset } = template

  // One merged mesh per material/part — preserves textures, DrawCall ≈ parts
  for (const part of parts) {
    const pieces: THREE.BufferGeometry[] = []
    for (const p of placements) {
      const geo = part.geometry.clone()
      composePlacement(p, groundOffset, m)
      geo.applyMatrix4(m)
      pieces.push(geo)
    }

    const merged = mergeGeometries(pieces, false)
    for (const g of pieces) g.dispose()
    if (!merged) continue

    const mesh = new THREE.Mesh(merged, part.material)
    mesh.frustumCulled = true
    mesh.userData.ownsGeometry = true
    root.add(mesh)
  }
}
