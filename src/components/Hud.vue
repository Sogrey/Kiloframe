<script setup lang="ts">
import type { RenderStats } from '../types'

defineProps<{
  stats: RenderStats
}>()
</script>

<template>
  <aside class="hud" aria-label="renderer.info">
    <div class="hud__title">renderer.info</div>
    <dl class="hud__grid">
      <div>
        <dt>FPS</dt>
        <dd>{{ stats.fps || '—' }}</dd>
      </div>
      <div>
        <dt>Draw Calls</dt>
        <dd>{{ stats.drawCalls.toLocaleString() }}</dd>
      </div>
      <div>
        <dt>Triangles</dt>
        <dd>{{ stats.triangles.toLocaleString() }}</dd>
      </div>
      <div>
        <dt>Geometries</dt>
        <dd>{{ stats.geometries }}</dd>
      </div>
    </dl>
  </aside>
</template>

<style scoped>
.hud {
  pointer-events: none;
  min-width: 168px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 178, 230, 0.22);
  border-radius: 12px;
  background: rgba(8, 14, 28, 0.72);
  backdrop-filter: blur(10px);
  color: #e8eefc;
  font-variant-numeric: tabular-nums;
}

.hud__title {
  margin-bottom: 10px;
  color: #8fb0e8;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hud__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
  margin: 0;
}

.hud__grid dt {
  color: #8a9bb8;
  font-size: 11px;
}

.hud__grid dd {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
}
</style>
