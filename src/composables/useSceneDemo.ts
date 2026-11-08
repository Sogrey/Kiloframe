import { computed, onMounted, onUnmounted, ref, shallowRef, type Ref } from 'vue'
import { DEFAULT_MODEL_ID, type ModelId } from '../models/catalog'
import { SceneEngine } from '../scene/SceneEngine'
import { MODES, type RenderMode, type RenderStats } from '../types'

const emptyStats = (): RenderStats => ({
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  geometries: 0,
  textures: 0,
  mode: 'baseline',
})

export function useSceneDemo(canvasRef: Ref<HTMLCanvasElement | null>) {
  const mode = ref<RenderMode>('baseline')
  const modelId = ref<ModelId>(DEFAULT_MODEL_ID)
  const loading = ref(false)
  const loadError = ref('')
  const stats = ref<RenderStats>(emptyStats())
  const engine = shallowRef<SceneEngine | null>(null)

  const activeHint = computed(() => MODES.find((m) => m.id === mode.value)?.hint ?? '')

  function onModeChange(next: RenderMode) {
    mode.value = next
    engine.value?.setMode(next)
  }

  async function onModelChange(next: ModelId) {
    if (next === modelId.value && !loadError.value) return
    modelId.value = next
    loadError.value = ''
    try {
      await engine.value?.setModel(next)
    } catch {
      loadError.value = '模型加载失败，请检查 public/models'
    }
  }

  onMounted(async () => {
    const canvas = canvasRef.value
    if (!canvas) return

    const eng = new SceneEngine(canvas)
    eng.setStatsListener((s) => {
      stats.value = s
    })
    eng.setLoadingListener((v) => {
      loading.value = v
    })
    eng.start()
    engine.value = eng

    loading.value = true
    try {
      await eng.init()
    } catch {
      loadError.value = '模型加载失败，请检查 public/models'
    } finally {
      loading.value = false
    }
  })

  onUnmounted(() => {
    engine.value?.dispose()
    engine.value = null
  })

  return {
    mode,
    modelId,
    loading,
    loadError,
    stats,
    activeHint,
    onModeChange,
    onModelChange,
  }
}
