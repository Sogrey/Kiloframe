import * as THREE from 'three'
import { buildPlacements } from './layouts'
import { clearRoot } from './clearRoot'
import { createRendererScene } from './createRendererScene'
import { buildLodProxies, getModelTemplate, type ModelTemplate, type TemplatePart } from './modelTemplate'
import { buildModeScene } from './modes'
import { StatsSampler } from './statsLoop'
import type { ModelOption } from '../models/catalog'
import { DEFAULT_MODEL_ID, MODEL_OPTIONS } from '../models/catalog'
import type { RenderMode, RenderStats } from '../types'
import { OBJECT_COUNT } from '../types'

export class SceneEngine {
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly controls: ReturnType<typeof createRendererScene>['controls']

  private readonly root: THREE.Group
  private readonly disposeScene: () => void
  private readonly placements = buildPlacements(OBJECT_COUNT)
  private readonly clock = new THREE.Clock()
  private readonly stats = new StatsSampler()

  private mode: RenderMode = 'baseline'
  private modelId = DEFAULT_MODEL_ID
  private template: ModelTemplate | null = null
  private lodMid: TemplatePart[] = []
  private lodLow: TemplatePart[] = []
  private loadToken = 0
  private buildToken = 0

  private raf = 0
  private disposed = false
  private onStats?: (stats: RenderStats) => void
  private onLoading?: (loading: boolean, label?: string) => void

  constructor(canvas: HTMLCanvasElement) {
    const created = createRendererScene(canvas)
    this.renderer = created.renderer
    this.scene = created.scene
    this.camera = created.camera
    this.controls = created.controls
    this.root = created.root
    this.disposeScene = created.dispose
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
    if (!this.template) return

    // Heavy rebuilds (especially merge) — yield so UI can show loading
    if (mode === 'merged') {
      void this.rebuildWithFeedback('合并几何…')
      return
    }
    this.buildMode(mode)
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
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      if (this.onStats) {
        this.onStats(this.stats.sample(dt, this.renderer, this.mode))
      }
    }
    tick()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    clearRoot(this.root)
    this.disposeLodProxies()
    this.disposeScene()
  }

  private readonly onResize = () => {
    const canvas = this.renderer.domElement
    const w = canvas.clientWidth
    const h = Math.max(canvas.clientHeight, 1)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  private async rebuildWithFeedback(label: string) {
    const token = ++this.buildToken
    this.onLoading?.(true, label)
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    if (token !== this.buildToken || this.disposed) return
    try {
      this.buildMode(this.mode)
    } finally {
      if (token === this.buildToken) this.onLoading?.(false)
    }
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

      // Yield before heavy scene populate so loading indicator paints
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      if (token !== this.loadToken || this.disposed) return
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
    clearRoot(this.root)
    this.mode = mode
    if (!this.template) return

    buildModeScene(mode, {
      root: this.root,
      placements: this.placements,
      template: this.template,
      lodMid: this.lodMid,
      lodLow: this.lodLow,
    })
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
