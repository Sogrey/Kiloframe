<script setup lang="ts">
import { MODEL_OPTIONS, type ModelId } from '../models/catalog'

defineProps<{
  modelValue: ModelId
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [id: ModelId]
}>()
</script>

<template>
  <div class="models" aria-label="模型选择">
    <div class="models__head">
      <span>模型</span>
      <span v-if="loading" class="models__loading">加载中…</span>
    </div>
    <div class="models__row">
      <button
        v-for="m in MODEL_OPTIONS"
        :key="m.id"
        type="button"
        class="models__btn"
        :class="{ 'is-active': modelValue === m.id }"
        :disabled="loading"
        :title="m.hint"
        @click="emit('update:modelValue', m.id)"
      >
        <span class="models__label">{{ m.label }}</span>
        <span class="models__hint">{{ m.hint }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.models {
  padding: 10px 12px 12px;
  border: 1px solid rgba(148, 178, 230, 0.2);
  border-radius: 14px;
  background: rgba(8, 14, 28, 0.72);
  backdrop-filter: blur(10px);
}

.models__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #8fb0e8;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.models__loading {
  color: #f0c674;
  letter-spacing: 0;
  text-transform: none;
}

.models__row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.models__btn {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  min-width: 108px;
  padding: 8px 10px;
  border: 1px solid rgba(148, 178, 230, 0.18);
  border-radius: 10px;
  background: rgba(12, 20, 38, 0.7);
  color: #d5e0f5;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.models__btn:hover:not(:disabled) {
  border-color: rgba(111, 168, 255, 0.55);
}

.models__btn.is-active {
  border-color: #5ad0a8;
  background: linear-gradient(180deg, rgba(40, 120, 95, 0.35), rgba(12, 22, 44, 0.85));
}

.models__btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

.models__label {
  font-size: 12px;
  font-weight: 650;
}

.models__hint {
  color: #8a9bb8;
  font-size: 10px;
  line-height: 1.3;
}
</style>
