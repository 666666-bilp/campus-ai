<template>
  <div v-if="totalPages > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
    <!-- Info Text -->
    <span class="text-sm text-gray-500 dark:text-gray-400">
      共{{ total }}条 第{{ currentPage }} / 共{{ totalPages }}页
    </span>

    <!-- Page Controls -->
    <div class="flex items-center gap-1">
      <!-- Previous Button -->
      <button
        :disabled="currentPage <= 1"
        class="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="$emit('page-change', currentPage - 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Page Numbers -->
      <template v-for="page in visiblePages" :key="page">
        <!-- Ellipsis -->
        <span
          v-if="page === '...'"
          class="px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500"
        >
          ...
        </span>
        <!-- Page Number -->
        <button
          v-else
          :class="[
            'px-3 py-1.5 text-sm rounded-md border transition-colors',
            page === currentPage
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="$emit('page-change', page)"
        >
          {{ page }}
        </button>
      </template>

      <!-- Next Button -->
      <button
        :disabled="currentPage >= totalPages"
        class="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="$emit('page-change', currentPage + 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

defineEmits(['page-change'])

const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  pages.push(total)

  return pages
})
</script>
