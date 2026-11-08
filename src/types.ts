export type RenderMode = 'baseline' | 'instanced' | 'merged' | 'lod'

export interface ModeMeta {
  id: RenderMode
  label: string
  hint: string
}

export interface RenderStats {
  fps: number
  drawCalls: number
  triangles: number
  points: number
  lines: number
  geometries: number
  textures: number
  mode: RenderMode
}

export const MODES: ModeMeta[] = [
  {
    id: 'baseline',
    label: '基线',
    hint: '1000 独立 Mesh · 对照瓶颈',
  },
  {
    id: 'instanced',
    label: 'InstancedMesh',
    hint: '同构实例化 · DrawCall N→1',
  },
  {
    id: 'merged',
    label: '几何合并',
    hint: '同材质静态合并 · DrawCall N→1',
  },
  {
    id: 'lod',
    label: 'LOD + 剔除',
    hint: '距离 LOD + 视锥剔除',
  },
]

export const OBJECT_COUNT = 1000
