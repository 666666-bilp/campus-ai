<template>
  <div
    v-if="fullPage"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
    style="background: color-mix(in srgb, var(--color-bg) 85%, transparent);"
  >
    <svg :class="spinnerSizeClass" class="animate-spin" style="color: var(--color-primary);" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3.5" />
      <path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <p class="mt-4 text-sm animate-pulse-soft" style="color: var(--color-text-muted);">{{ text }}</p>
  </div>

  <div v-else class="flex flex-col items-center justify-center py-12">
    <svg :class="spinnerSizeClass" class="animate-spin" style="color: var(--color-primary);" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3.5" />
      <path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <p class="mt-4 text-sm" style="color: var(--color-text-muted);">{{ text }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  fullPage: { type: Boolean, default: false },
  text: { type: String, default: '加载中...' },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
});

const spinnerSizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-5 h-5';
    case 'lg': return 'w-12 h-12';
    default: return 'w-8 h-8';
  }
});
</script>
