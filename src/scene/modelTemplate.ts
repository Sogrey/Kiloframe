import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js'
import type { ModelOption } from '../models/catalog'

export interface TemplatePart {
  geometry: THREE.BufferGeometry
  material: THREE.Material
}

export interface ModelTemplate {
  id: string
  parts: TemplatePart[]
  /** Y lift so models sit on ground after placement scale */
  groundOffset: number
  dispose: () => void
}

const loader = new GLTFLoader()
const cache = new Map<string, Promise<ModelTemplate>>()

function makeBoxTemplate(targetSize: number): ModelTemplate {
  const geo = new THREE.BoxGeometry(1, 1.4, 1)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4f8cff,
    roughness: 0.55,
    metalness: 0.15,
  })
  const scale = targetSize / 1.4
  geo.scale(scale, scale, scale)
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  const groundOffset = -bb.min.y

  return {
    id: 'box',
    parts: [{ geometry: geo, material: mat }],
    groundOffset,
    dispose: () => {
      geo.dispose()
      mat.dispose()
    },
  }
}

function collectParts(root: THREE.Object3D): TemplatePart[] {
  const parts: TemplatePart[] = []
  root.updateMatrixWorld(true)

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return

    const geo = mesh.geometry.clone()
    geo.applyMatrix4(mesh.matrixWorld)

    const srcMat = mesh.material
    const material = Array.isArray(srcMat) ? srcMat[0].clone() : srcMat.clone()

    // Flatten nested transforms — geometry already baked
    parts.push({ geometry: geo, material })
  })

  return parts
}

function normalizeParts(parts: TemplatePart[], targetSize: number) {
  const box = new THREE.Box3()
  for (const p of parts) {
    p.geometry.computeBoundingBox()
    if (p.geometry.boundingBox) box.union(p.geometry.boundingBox)
  }

  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
  const s = targetSize / maxDim
  const center = new THREE.Vector3()
  box.getCenter(center)

  const offset = new THREE.Matrix4()
    .makeScale(s, s, s)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z))

  for (const p of parts) {
    p.geometry.applyMatrix4(offset)
    p.geometry.computeBoundingBox()
    p.geometry.computeVertexNormals()
  }

  const normBox = new THREE.Box3()
  for (const p of parts) {
    if (p.geometry.boundingBox) normBox.union(p.geometry.boundingBox)
  }
  return -normBox.min.y
}

function disposeGltfScene(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) {
      // Don't dispose textures here — clones may share; template owns materials
      m.dispose?.()
    }
  })
}

async function loadGltfTemplate(option: ModelOption): Promise<ModelTemplate> {
  const gltf = await loader.loadAsync(option.url)
  const parts = collectParts(gltf.scene)
  if (parts.length === 0) {
    disposeGltfScene(gltf.scene)
    throw new Error(`模型无可用 Mesh: ${option.id}`)
  }

  const groundOffset = normalizeParts(parts, option.targetSize)
  disposeGltfScene(gltf.scene)

  return {
    id: option.id,
    parts,
    groundOffset,
    dispose: () => {
      for (const p of parts) {
        p.geometry.dispose()
        const mats = Array.isArray(p.material) ? p.material : [p.material]
        for (const m of mats) {
          // Dispose maps attached to cloned materials
          const std = m as THREE.MeshStandardMaterial
          std.map?.dispose()
          std.normalMap?.dispose()
          std.roughnessMap?.dispose()
          std.metalnessMap?.dispose()
          std.aoMap?.dispose()
          std.emissiveMap?.dispose()
          m.dispose()
        }
      }
    },
  }
}

export function getModelTemplate(option: ModelOption): Promise<ModelTemplate> {
  const key = option.id
  const hit = cache.get(key)
  if (hit) return hit

  const promise = (!option.url
    ? Promise.resolve(makeBoxTemplate(option.targetSize))
    : loadGltfTemplate(option)
  ).catch((err) => {
    cache.delete(key)
    throw err
  })

  cache.set(key, promise)
  return promise
}

/** Build simplified geometry proxies for LOD mid/low levels. */
export function buildLodProxies(
  parts: TemplatePart[],
): { mid: TemplatePart[]; low: TemplatePart[] } {
  const simplify = new SimplifyModifier()

  const mid: TemplatePart[] = []
  const low: TemplatePart[] = []

  for (const part of parts) {
    const src = part.geometry
    const count = src.getAttribute('position')?.count ?? 0

    let midGeo: THREE.BufferGeometry
    let lowGeo: THREE.BufferGeometry

    if (count > 64) {
      try {
        const midCount = Math.max(32, Math.floor(count * 0.35))
        const lowCount = Math.max(12, Math.floor(count * 0.12))
        midGeo = simplify.modify(src.clone(), count - midCount)
        lowGeo = simplify.modify(src.clone(), count - lowCount)
      } catch {
        midGeo = src.clone()
        lowGeo = makeProxyBox(src)
      }
    } else {
      midGeo = src.clone()
      lowGeo = makeProxyBox(src)
    }

    mid.push({ geometry: midGeo, material: part.material })
    low.push({ geometry: lowGeo, material: part.material })
  }

  return { mid, low }
}

function makeProxyBox(src: THREE.BufferGeometry): THREE.BufferGeometry {
  src.computeBoundingBox()
  const bb = src.boundingBox ?? new THREE.Box3(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5))
  const size = new THREE.Vector3()
  bb.getSize(size)
  const center = new THREE.Vector3()
  bb.getCenter(center)
  const box = new THREE.BoxGeometry(
    Math.max(size.x, 0.05),
    Math.max(size.y, 0.05),
    Math.max(size.z, 0.05),
  )
  box.translate(center.x, center.y, center.z)
  return box
}
