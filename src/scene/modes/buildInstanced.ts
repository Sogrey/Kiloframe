import * as THREE from 'three'
import { composePlacement } from '../mathPool'
import type { ModeBuildContext } from './types'

export function buildInstanced({ root, placements, template }: ModeBuildContext) {
  const m = new THREE.Matrix4()
  const { parts, groundOffset } = template

  for (const part of parts) {
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, placements.length)
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    for (let i = 0; i < placements.length; i++) {
      composePlacement(placements[i], groundOffset, m)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
    root.add(mesh)
  }
}
