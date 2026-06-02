<template>
  <div class="space-y-6">
    <!-- Side-by-Side Panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Original Panel -->
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            原文
          </h4>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto max-h-96">
          <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {{ original || '暂无原文' }}
          </p>
        </div>
      </div>

      <!-- Modified Panel -->
      <div class="rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
        <div class="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <h4 class="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
            修改后
          </h4>
        </div>
        <div class="p-4 bg-green-50/50 dark:bg-green-900/10 overflow-y-auto max-h-96">
          <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {{ modified || '暂无修改内容' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Changes List -->
    <div v-if="changes && changes.length > 0" class="space-y-3">
      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
        修改详情（{{ changes.length }} 处改动）
      </h3>

      <div
        v-for="(change, index) in changes"
        :key="index"
        class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2"
      >
        <!-- Change Number -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
            {{ index + 1 }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">修改点</span>
        </div>

        <!-- Original Snippet -->
        <div v-if="change.original">
          <span class="text-xs text-red-500 dark:text-red-400 font-medium">原文:</span>
          <p class="mt-1 text-sm text-red-600 dark:text-red-400 line-through">
            {{ change.original }}
          </p>
        </div>

        <!-- Suggestion -->
        <div v-if="change.suggestion">
          <span class="text-xs text-green-500 dark:text-green-400 font-medium">建议:</span>
          <p class="mt-1 text-sm text-green-700 dark:text-green-400">
            {{ change.suggestion }}
          </p>
        </div>

        <!-- Reason -->
        <div v-if="change.reason">
          <p class="text-xs text-gray-400 dark:text-gray-500 italic">
            原因: {{ change.reason }}
          </p>
        </div>
      </div>
    </div>

    <!-- No Changes -->
    <div
      v-if="!changes || changes.length === 0"
      class="text-center py-6 text-sm text-gray-400 dark:text-gray-500"
    >
      暂无修改详情
    </div>
  </div>
</template>

<script setup>
defineProps({
  original: {
    type: String,
    default: ''
  },
  modified: {
    type: String,
    default: ''
  },
  changes: {
    type: Array,
    default: () => []
    // Each item: { original: String, suggestion: String, reason: String }
  }
})
</script>
