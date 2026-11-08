import * as THREE from 'three'
import type { Placement } from './layouts'

const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _axisY = new THREE.Vector3(0, 1, 0)

/** Compose a placement matrix into `out`, reusing scratch vectors. */
export function composePlacement(
  p: Placement,
  groundOffset: number,
  out: THREE.Matrix4,
): THREE.Matrix4 {
  _pos.set(p.x, p.y + groundOffset * p.scale, p.z)
  _quat.setFromAxisAngle(_axisY, p.rotY)
  _scale.set(p.scale, p.scale, p.scale)
  return out.compose(_pos, _quat, _scale)
}
