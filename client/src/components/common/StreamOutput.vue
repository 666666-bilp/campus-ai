<template>
  <div class="relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
    <!-- Header Bar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div class="flex items-center gap-2">
        <div
          :class="[
            'w-2 h-2 rounded-full',
            isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'
          ]"
        />
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ isStreaming ? '生成中...' : '生成完成' }}
        </span>
      </div>
      <button
        v-if="!isStreaming && content"
        class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        @click="copyContent"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        {{ copied ? '已复制!' : '复制' }}
      </button>
    </div>

    <!-- Content Area -->
    <div
      ref="contentRef"
      class="p-4 overflow-y-auto"
      :style="{ minHeight: '200px', maxHeight: maxHeight }"
    >
      <!-- Empty State -->
      <div
        v-if="!content && !isStreaming"
        class="flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm"
        :style="{ minHeight: '200px', height: '100%' }"
      >
        等待生成...
      </div>

      <!-- Content -->
      <div v-if="content" class="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-500 dark:prose-a:text-blue-400 prose-code:text-pink-600 dark:prose-code:text-pink-400">
        <!-- Use MarkdownRenderer if available, otherwise pre -->
        <MarkdownRenderer :content="content" />
      </div>

      <!-- Blinking Cursor -->
      <span
        v-if="isStreaming"
        class="inline-block w-0.5 h-5 bg-blue-500 align-text-bottom animate-pulse ml-0.5"
      >
        &nbsp;
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps({
  isStreaming: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    default: ''
  },
  maxHeight: {
    type: String,
    default: '500px'
  }
})

const contentRef = ref(null)
const copied = ref(false)

watch(
  () => props.content,
  async () => {
    await nextTick()
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight
    }
  }
)

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback: ignore copy failure
  }
}
</script>
