import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Placement } from './layouts'
import { buildPlacements } from './layouts'
import {
  buildLodProxies,
  getModelTemplate,
  type ModelTemplate,
  type TemplatePart,
} from './modelTemplate'
import type { ModelOption } from '../models/catalog'
import { MODEL_OPTIONS, DEFAULT_MODEL_ID } from '../models/catalog'
import type { RenderMode, RenderStats } from '../types'
import { OBJECT_COUNT } from '../types'

export class SceneEngine {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls

  private readonly root = new THREE.Group()
  private readonly placements: Placement[]
  private readonly clock = new THREE.Clock()

  private mode: RenderMode = 'baseline'
  private modelId = DEFAULT_MODEL_ID
  private template: ModelTemplate | null = null
  private lodMid: TemplatePart[] = []
  private lodLow: TemplatePart[] = []
  private loadToken = 0

  private raf = 0
  private frames = 0
  private fpsAccum = 0
  private fps = 0
  private disposed = false
  private onStats?: (stats: RenderStats) => void
  private onLoading?: (loading: boolean, label?: string) => void

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    this.renderer.shadowMap.enabled = false
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.info.autoReset = true

    this.camera = new THREE.PerspectiveCamera(
      55,
      canvas.clientWidth / Math.max(canvas.clientHeight, 1),
      0.1,
      500,
    )
    this.camera.position.set(28, 34, 42)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.target.set(0, 0, 0)
    this.controls.maxDistance = 180
    this.controls.minDistance = 8

    this.scene.background = new THREE.Color(0x0b1220)
    this.scene.fog = new THREE.Fog(0x0b1220, 70, 180)
    this.scene.add(this.root)

    const hemi = new THREE.HemisphereLight(0xb1c5ff, 0x243044, 1.05)
    const dir = new THREE.DirectionalLight(0xfff2d6, 1.45)
    dir.position.set(40, 60, 20)
    this.scene.add(hemi, dir)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({ color: 0x152033, roughness: 0.95, metalness: 0.05 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    this.scene.add(ground)

    this.placements = buildPlacements(OBJECT_COUNT)
    window.addEventListener('resize', this.onResize)
  }

  get currentMode() {
    return this.mode
  }

  get currentModelId() {
    return this.modelId
  }

  setStatsListener(cb: (stats: RenderStats) => void) {
    this.onStats = cb
  }

  setLoadingListener(cb: (loading: boolean, label?: string) => void) {
    this.onLoading = cb
  }

  async init() {
    await this.setModel(DEFAULT_MODEL_ID)
  }

  setMode(mode: RenderMode) {
    if (mode === this.mode) return
    this.mode = mode
    if (this.template) this.buildMode(mode)
  }

  async setModel(modelId: string) {
    const option = MODEL_OPTIONS.find((m) => m.id === modelId)
    if (!option) return
    await this.loadOption(option)
  }

  start() {
    const tick = () => {
      if (this.disposed) return
      this.raf = requestAnimationFrame(tick)
      const dt = this.clock.getDelta()
      this.frames++
      this.fpsAccum += dt
      if (this.fpsAccum >= 0.5) {
        this.fps = Math.round(this.frames / this.fpsAccum)
        this.frames = 0
        this.fpsAccum = 0
      }

      this.controls.update()
      this.renderer.render(this.scene, this.camera)

      if (this.onStats) {
        const info = this.renderer.info
        this.onStats({
          fps: this.fps,
          drawCalls: info.render.calls,
          triangles: info.render.triangles,
          points: info.render.points,
          lines: info.render.lines,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
          mode: this.mode,
        })
      }
    }
    tick()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    this.clearRoot()
    this.disposeLodProxies()
    this.controls.dispose()
    this.renderer.dispose()
  }

  private readonly onResize = () => {
    const canvas = this.renderer.domElement
    const w = canvas.clientWidth
    const h = Math.max(canvas.clientHeight, 1)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  private async loadOption(option: ModelOption) {
    const token = ++this.loadToken
    this.onLoading?.(true, option.label)

    try {
      const template = await getModelTemplate(option)
      if (token !== this.loadToken || this.disposed) return

      this.disposeLodProxies()
      this.template = template
      this.modelId = option.id
      const proxies = buildLodProxies(template.parts)
      this.lodMid = proxies.mid
      this.lodLow = proxies.low
      this.buildMode(this.mode)
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      if (token === this.loadToken) {
        this.onLoading?.(false)
      }
    }
  }

  private buildMode(mode: RenderMode) {
    this.clearRoot()
    this.mode = mode
    if (!this.template) return

    switch (mode) {
      case 'baseline':
        this.buildBaseline()
        break
      case 'instanced':
        this.buildInstanced()
        break
      case 'merged':
        this.buildMerged()
        break
      case 'lod':
        this.buildLod()
        break
    }
  }

  private placeMatrix(p: Placement, out: THREE.Matrix4) {
    const lift = this.template?.groundOffset ?? 0
    const pos = new THREE.Vector3(p.x, p.y + lift * p.scale, p.z)
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rotY)
    const s = new THREE.Vector3(p.scale, p.scale, p.scale)
    return out.compose(pos, q, s)
  }

  private buildBaseline() {
    const parts = this.template!.parts
    for (const p of this.placements) {
      const group = new THREE.Group()
      const m = new THREE.Matrix4()
      this.placeMatrix(p, m)
      group.applyMatrix4(m)

      for (const part of parts) {
        const mesh = new THREE.Mesh(part.geometry, part.material)
        mesh.frustumCulled = true
        group.add(mesh)
      }
      this.root.add(group)
    }
  }

  private buildInstanced() {
    const parts = this.template!.parts
    const m = new THREE.Matrix4()

    for (const part of parts) {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, this.placements.length)
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
      for (let i = 0; i < this.placements.length; i++) {
        this.placeMatrix(this.placements[i], m)
        mesh.setMatrixAt(i, m)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.frustumCulled = false
      this.root.add(mesh)
    }
  }

  private buildMerged() {
    const parts = this.template!.parts
    const m = new THREE.Matrix4()

    // One merged mesh per material/part — preserves textures, DrawCall ≈ parts
    for (const part of parts) {
      const pieces: THREE.BufferGeometry[] = []
      for (const p of this.placements) {
        const geo = part.geometry.clone()
        this.placeMatrix(p, m)
        geo.applyMatrix4(m)
        pieces.push(geo)
      }

      const merged = mergeGeometries(pieces, false)
      for (const g of pieces) g.dispose()
      if (!merged) continue

      const mesh = new THREE.Mesh(merged, part.material)
      mesh.frustumCulled = true
      mesh.userData.ownsGeometry = true
      this.root.add(mesh)
    }
  }

  private buildLod() {
    const high = this.template!.parts
    const mid = this.lodMid.length ? this.lodMid : high
    const low = this.lodLow.length ? this.lodLow : high
    const m = new THREE.Matrix4()

    for (const p of this.placements) {
      const lod = new THREE.LOD()
      lod.addLevel(this.makePartGroup(high), 0)
      lod.addLevel(this.makePartGroup(mid), 30)
      lod.addLevel(this.makePartGroup(low), 60)
      this.placeMatrix(p, m)
      lod.applyMatrix4(m)
      this.root.add(lod)
    }
  }

  private makePartGroup(parts: TemplatePart[]) {
    const g = new THREE.Group()
    for (const part of parts) {
      const mesh = new THREE.Mesh(part.geometry, part.material)
      mesh.frustumCulled = true
      g.add(mesh)
    }
    return g
  }

  private clearRoot() {
    while (this.root.children.length > 0) {
      const child = this.root.children[0]
      this.root.remove(child)
      child.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh && mesh.userData.ownsGeometry && mesh.geometry) {
          mesh.geometry.dispose()
        }
      })
    }
  }

  private disposeLodProxies() {
    const owned = new Set<THREE.BufferGeometry>()
    for (const p of [...this.lodMid, ...this.lodLow]) {
      if (this.template?.parts.some((t) => t.geometry === p.geometry)) continue
      owned.add(p.geometry)
    }
    for (const g of owned) g.dispose()
    this.lodMid = []
    this.lodLow = []
  }
}
