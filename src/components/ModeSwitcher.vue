<script setup lang="ts">
import { MODES, type RenderMode } from '../types'

defineProps<{
  modelValue: RenderMode
}>()

const emit = defineEmits<{
  'update:modelValue': [mode: RenderMode]
}>()
</script>

<template>
  <nav class="modes" aria-label="渲染模式">
    <button
      v-for="m in MODES"
      :key="m.id"
      type="button"
      class="modes__btn"
      :class="{ 'is-active': modelValue === m.id }"
      :title="m.hint"
      @click="emit('update:modelValue', m.id)"
    >
      <span class="modes__label">{{ m.label }}</span>
      <span class="modes__hint">{{ m.hint }}</span>
    </button>
  </nav>
</template>

<style scoped>
.modes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.modes__btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid rgba(148, 178, 230, 0.2);
  border-radius: 12px;
  background: rgba(8, 14, 28, 0.72);
  color: #d5e0f5;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.modes__btn:hover {
  border-color: rgba(111, 168, 255, 0.55);
  transform: translateY(-1px);
}

.modes__btn.is-active {
  border-color: #4f8cff;
  background: linear-gradient(180deg, rgba(55, 105, 210, 0.35), rgba(12, 22, 44, 0.85));
}

.modes__label {
  font-size: 13px;
  font-weight: 650;
}

.modes__hint {
  color: #8a9bb8;
  font-size: 11px;
  line-height: 1.35;
}

@media (max-width: 860px) {
  .modes {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
