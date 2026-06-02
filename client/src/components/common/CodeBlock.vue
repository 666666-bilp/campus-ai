<template>
  <div class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-950">
      <!-- Language Badge -->
      <span class="text-xs font-mono text-gray-400 uppercase tracking-wider">
        {{ language }}
      </span>

      <!-- Copy Button -->
      <button
        class="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-800 rounded transition-colors"
        @click="copyCode"
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

    <!-- Code Content -->
    <div class="bg-gray-900 dark:bg-gray-950 overflow-x-auto">
      <table class="w-full border-collapse">
        <tbody>
          <tr v-for="(line, index) in codeLines" :key="index" class="leading-relaxed">
            <!-- Line Number -->
            <td
              v-if="showLineNumbers"
              class="select-none text-right pr-4 pl-4 py-0 text-xs text-gray-600 dark:text-gray-500 align-top border-r border-gray-800 dark:border-gray-900"
              style="width: 1%; white-space: nowrap;"
            >
              {{ index + 1 }}
            </td>
            <!-- Code Line -->
            <td class="pl-4 pr-4 py-0 text-sm font-mono text-gray-100 dark:text-gray-200 whitespace-pre-wrap break-all align-top">
              {{ line || ' ' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  showLineNumbers: {
    type: Boolean,
    default: true
  },
  editable: {
    type: Boolean,
    default: false
  }
})

const copied = ref(false)

const codeLines = computed(() => {
  if (!props.code) return ['']
  return props.code.split('\n')
})

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback: ignore copy failure
  }
}
</script>
