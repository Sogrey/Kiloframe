export type ModelId = 'box' | 'duck' | 'avocado' | 'helmet' | 'bottle'

export interface ModelOption {
  id: ModelId
  label: string
  /** empty = procedural box */
  url: string
  hint: string
  /** Target world height after normalize */
  targetSize: number
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'box',
    label: '程序方块',
    url: '',
    hint: '无纹理 · 最快对照',
    targetSize: 1.4,
  },
  {
    id: 'duck',
    label: 'Duck',
    url: '/models/Duck.glb',
    hint: 'Khronos · ~120KB',
    targetSize: 1.6,
  },
  {
    id: 'avocado',
    label: 'Avocado',
    url: '/models/Avocado.glb',
    hint: 'Khronos · 纹理 PBR',
    targetSize: 1.5,
  },
  {
    id: 'helmet',
    label: 'DamagedHelmet',
    url: '/models/DamagedHelmet.glb',
    hint: 'Khronos · 经典 PBR',
    targetSize: 1.8,
  },
  {
    id: 'bottle',
    label: 'WaterBottle',
    url: '/models/WaterBottle.glb',
    hint: 'Khronos · 玻璃瓶',
    targetSize: 1.7,
  },
]

export const DEFAULT_MODEL_ID: ModelId = 'duck'
