<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import Hud from './components/Hud.vue'
import ModeSwitcher from './components/ModeSwitcher.vue'
import ModelSwitcher from './components/ModelSwitcher.vue'
import { SceneEngine } from './scene/SceneEngine'
import { DEFAULT_MODEL_ID, type ModelId } from './models/catalog'
import { MODES, OBJECT_COUNT, type RenderMode, type RenderStats } from './types'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const mode = ref<RenderMode>('baseline')
const modelId = ref<ModelId>(DEFAULT_MODEL_ID)
const loading = ref(false)
const loadError = ref('')
const engine = shallowRef<SceneEngine | null>(null)
const stats = ref<RenderStats>({
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  geometries: 0,
  textures: 0,
  mode: 'baseline',
})

const activeHint = () => MODES.find((m) => m.id === mode.value)?.hint ?? ''

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
</script>

<template>
  <div class="app">
    <canvas ref="canvasRef" class="viewport" />

    <header class="chrome chrome--top">
      <div class="brand">
        <div class="brand__name">Kiloframe</div>
        <p class="brand__lead">
          同一 {{ OBJECT_COUNT }} 模型场景 · 四模式性能对比
        </p>
      </div>
      <Hud :stats="stats" />
    </header>

    <div class="chrome chrome--mid">
      <ModelSwitcher
        :model-value="modelId"
        :loading="loading"
        @update:model-value="onModelChange"
      />
      <p v-if="loadError" class="error">{{ loadError }}</p>
    </div>

    <footer class="chrome chrome--bottom">
      <ModeSwitcher :model-value="mode" @update:model-value="onModeChange" />
      <p class="footnote">{{ activeHint() }} · 拖拽旋转 · 滚轮缩放</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0b1220;
}

.viewport {
  display: block;
  width: 100%;
  height: 100%;
}

.chrome {
  position: absolute;
  z-index: 2;
  left: 16px;
  right: 16px;
  display: flex;
  gap: 16px;
  pointer-events: none;
}

.chrome > * {
  pointer-events: auto;
}

.chrome--top {
  top: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.chrome--mid {
  top: 108px;
  flex-direction: column;
  align-items: flex-start;
  max-width: min(720px, calc(100% - 32px));
}

.chrome--bottom {
  bottom: 16px;
  flex-direction: column;
}

.brand {
  max-width: min(520px, 70vw);
  padding: 14px 16px;
  border: 1px solid rgba(148, 178, 230, 0.2);
  border-radius: 14px;
  background: rgba(8, 14, 28, 0.72);
  backdrop-filter: blur(10px);
  color: #e8eefc;
}

.brand__name {
  font-family: "Segoe UI Semibold", "DIN Alternate", "Avenir Next", sans-serif;
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.brand__lead {
  margin: 6px 0 0;
  color: #9db0d0;
  font-size: 13px;
  line-height: 1.45;
}

.footnote {
  margin: 0;
  padding-left: 4px;
  color: #8a9bb8;
  font-size: 12px;
}

.error {
  margin: 0;
  color: #ff8f8f;
  font-size: 12px;
}

@media (max-width: 720px) {
  .chrome--top {
    flex-direction: column;
  }

  .chrome--mid {
    top: auto;
    bottom: 168px;
  }
}
</style>
