import type * as THREE from 'three'
import type { RenderMode, RenderStats } from '../types'

export class StatsSampler {
  private frames = 0
  private fpsAccum = 0
  private fps = 0

  sample(dt: number, renderer: THREE.WebGLRenderer, mode: RenderMode): RenderStats {
    this.frames++
    this.fpsAccum += dt
    if (this.fpsAccum >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsAccum)
      this.frames = 0
      this.fpsAccum = 0
    }

    const info = renderer.info
    return {
      fps: this.fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      mode,
    }
  }
}
