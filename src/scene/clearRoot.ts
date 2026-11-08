import type * as THREE from 'three'

/** Remove children and dispose geometries owned by merge mode. */
export function clearRoot(root: THREE.Group) {
  while (root.children.length > 0) {
    const child = root.children[0]
    root.remove(child)
    child.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh && mesh.userData.ownsGeometry && mesh.geometry) {
        mesh.geometry.dispose()
      }
    })
  }
}
