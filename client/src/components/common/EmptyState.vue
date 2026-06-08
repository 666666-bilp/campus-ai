<template>
  <div class="flex flex-col items-center justify-center py-20 px-4">
    <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent);">
      <span class="text-3xl" role="img" :aria-label="icon">{{ icon }}</span>
    </div>
    <h3 class="text-lg font-semibold mb-2 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
      {{ title }}
    </h3>
    <p class="text-sm text-center max-w-sm leading-relaxed" style="color: var(--color-text-muted);">
      {{ description }}
    </p>
    <router-link
      v-if="actionText && actionLink"
      :to="actionLink"
      class="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-[var(--radius-md)] text-white text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
      style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover)); box-shadow: 0 2px 8px rgba(59,83,124,0.2);"
    >
      {{ actionText }}
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </router-link>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  actionText: { type: String, default: '' },
  actionLink: { type: String, default: '' },
});
</script>
