import * as THREE from 'three'
import { composePlacement } from '../mathPool'
import type { ModeBuildContext } from './types'

export function buildBaseline({ root, placements, template }: ModeBuildContext) {
  const m = new THREE.Matrix4()
  const { parts, groundOffset } = template

  for (const p of placements) {
    const group = new THREE.Group()
    composePlacement(p, groundOffset, m)
    group.applyMatrix4(m)

    for (const part of parts) {
      const mesh = new THREE.Mesh(part.geometry, part.material)
      mesh.frustumCulled = true
      group.add(mesh)
    }
    root.add(group)
  }
}
