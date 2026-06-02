<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <span class="text-6xl mb-4">{{ icon }}</span>
    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {{ title }}
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
      {{ description }}
    </p>
    <router-link
      v-if="actionText && actionLink"
      :to="actionLink"
      class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {{ actionText }}
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </router-link>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '📭'
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  actionLink: {
    type: String,
    default: ''
  }
})
</script>
