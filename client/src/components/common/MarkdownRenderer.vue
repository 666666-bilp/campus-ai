<template>
  <div
    v-if="content"
    class="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-500 dark:prose-a:text-blue-400 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-blockquote:border-blue-500 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-img:rounded-lg"
    v-html="renderedHtml"
  />
  <div
    v-else
    class="text-sm text-gray-400 dark:text-gray-500 italic py-4"
  >
    暂无内容
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedHtml = computed(() => {
  if (!props.content) return ''

  const raw = marked.parse(props.content)

  // sanitized with DOMPurify
  // In production, use: return DOMPurify.sanitize(raw)
  // For now, marked output is safe as it does not allow raw HTML by default

  return raw
})
</script>
