<template>
  <div class="relative">
    <!-- Loading State -->
    <div
      v-if="!initialized"
      class="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      :style="{ height: height }"
    >
      <div class="flex flex-col items-center gap-2">
        <svg
          class="w-6 h-6 animate-spin text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" />
        </svg>
        <span class="text-xs text-gray-400 dark:text-gray-500">图表加载中...</span>
      </div>
    </div>

    <!-- Chart Container -->
    <div
      ref="chartRef"
      :style="{ width: '100%', height: height }"
      :class="{ 'invisible': !initialized }"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '400px'
  }
})

const chartRef = ref(null)
let chartInstance = null
const initialized = ref(false)

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(props.option)
  initialized.value = true
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// Watch for option changes
watch(
  () => props.option,
  (newOption) => {
    if (chartInstance) {
      chartInstance.setOption(newOption, { notMerge: true })
    }
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>
