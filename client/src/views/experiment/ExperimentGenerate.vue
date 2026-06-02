<template>
  <AppLayout>
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <router-link
          to="/experiment"
          class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">生成实验报告</h1>
      </div>

      <!-- Generation Form -->
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">实验信息</h2>

        <div class="space-y-4">
          <!-- Experiment Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              实验名称 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="例如：牛顿第二定律验证实验"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>

          <!-- Course Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              课程名称
            </label>
            <input
              v-model="form.course"
              type="text"
              placeholder="例如：大学物理实验"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>

          <!-- Experiment Data (Optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              实验数据 <span class="text-gray-400 text-xs font-normal">（可选）</span>
            </label>
            <textarea
              v-model="form.data"
              rows="4"
              placeholder="粘贴或输入实验数据，例如：&#10;测量次数 拉力(N) 加速度(m/s²)&#10;1  1.0  0.48&#10;2  2.0  0.95&#10;3  3.0  1.43"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y transition-shadow"
            ></textarea>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="generateError"
          class="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
        >
          {{ generateError }}
        </div>

        <!-- Generate Button -->
        <div class="mt-6 flex items-center gap-3">
          <button
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            :disabled="generating || !form.title.trim()"
            @click="handleGenerate"
          >
            <svg
              v-if="generating"
              class="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {{ generating ? 'AI 生成中...' : 'AI 生成报告' }}
          </button>
          <button
            v-if="generated"
            class="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="handleReset"
          >
            重新生成
          </button>
        </div>
      </div>

      <!-- Generated Report Accordion -->
      <div
        v-if="generated && reportSections.length > 0"
        class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6"
      >
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">生成结果</h2>
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            :disabled="saving"
            @click="handleSave"
          >
            <svg
              v-if="saving"
              class="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {{ saving ? '保存中...' : '保存报告' }}
          </button>
        </div>

        <!-- Editable Accordion Sections -->
        <div class="space-y-3">
          <div
            v-for="section in reportSections"
            :key="section.key"
            class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
              @click="toggleReportSection(section.key)"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="sectionColor(section.key)"
                ></span>
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ section.label }}</span>
              </div>
              <svg
                :class="[
                  'w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0',
                  expandedReportSection === section.key ? 'rotate-180' : ''
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              v-if="expandedReportSection === section.key"
              class="px-4 py-3 border-t border-gray-200 dark:border-gray-700"
            >
              <textarea
                v-model="reportContent[section.key]"
                rows="5"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Fitting Section -->
      <div
        v-if="generated"
        class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          数据拟合
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          输入实验测量的数据点，AI将自动进行曲线拟合分析
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              X 值 <span class="text-gray-400 text-xs font-normal">（逗号分隔）</span>
            </label>
            <input
              v-model="xValuesInput"
              type="text"
              placeholder="例如: 1, 2, 3, 4, 5"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Y 值 <span class="text-gray-400 text-xs font-normal">（逗号分隔）</span>
            </label>
            <input
              v-model="yValuesInput"
              type="text"
              placeholder="例如: 2.1, 4.0, 6.2, 7.9, 10.1"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            :disabled="fitting || !xValuesInput.trim() || !yValuesInput.trim()"
            @click="handleFitData"
          >
            <svg
              v-if="fitting"
              class="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            {{ fitting ? '拟合中...' : '拟合数据' }}
          </button>
        </div>

        <!-- Fit Error -->
        <div
          v-if="fitError"
          class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
        >
          {{ fitError }}
        </div>

        <!-- Fit Results -->
        <div v-if="fitResult" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">拟合方程</p>
              <p class="text-sm font-mono font-medium text-gray-900 dark:text-white break-all">{{ fitResult.equation }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">R²</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ fitResult.r2 || fitResult.rSquared }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">拟合值</p>
              <p class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                {{ formatFittedValues }}
              </p>
            </div>
          </div>

          <!-- Fitted Values Table -->
          <div v-if="fitResult.fittedValues && fitResult.fittedValues.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">X</th>
                  <th class="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Y (原始)</th>
                  <th class="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Y (拟合)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(point, idx) in fitResult.fittedValues"
                  :key="idx"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <td class="py-2 px-3 text-gray-800 dark:text-gray-200">{{ point.x }}</td>
                  <td class="py-2 px-3 text-gray-800 dark:text-gray-200">{{ point.y }}</td>
                  <td class="py-2 px-3 text-blue-600 dark:text-blue-400">{{ point.yFitted }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Fit Chart -->
          <div v-if="fitResult.chartOption || fitResult.chartData">
            <ChartDisplay :option="fitResult.chartOption || fitResult.chartData" height="350px" />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { experimentAPI } from '@/api'
import { useAppStore } from '@/stores/app'
import AppLayout from '@/components/layout/AppLayout.vue'
import ChartDisplay from '@/components/common/ChartDisplay.vue'

const router = useRouter()
const appStore = useAppStore()

// Generation form
const form = reactive({
  title: '',
  course: '',
  data: '',
})

const generating = ref(false)
const generateError = ref('')
const generated = ref(false)
const saving = ref(false)

// Report sections definition
const reportSections = [
  { key: 'purpose', label: '实验目的' },
  { key: 'principle', label: '实验原理' },
  { key: 'equipment', label: '实验器材' },
  { key: 'steps', label: '实验步骤' },
  { key: 'data', label: '实验数据' },
  { key: 'analysis', label: '数据分析' },
  { key: 'conclusion', label: '实验结论' },
]

// Editable report content
const reportContent = reactive({
  purpose: '',
  principle: '',
  equipment: '',
  steps: '',
  data: '',
  analysis: '',
  conclusion: '',
})

const expandedReportSection = ref(null)

function sectionColor(key) {
  const colors = {
    purpose: 'bg-blue-500',
    principle: 'bg-green-500',
    equipment: 'bg-yellow-500',
    steps: 'bg-purple-500',
    data: 'bg-red-500',
    analysis: 'bg-indigo-500',
    conclusion: 'bg-teal-500',
  }
  return colors[key] || 'bg-gray-500'
}

function toggleReportSection(key) {
  expandedReportSection.value = expandedReportSection.value === key ? null : key
}

// Data fitting
const xValuesInput = ref('')
const yValuesInput = ref('')
const fitting = ref(false)
const fitError = ref('')
const fitResult = ref(null)

const formatFittedValues = computed(() => {
  if (!fitResult.value) return ''
  const vals = fitResult.value.fittedValues
  if (!vals || !vals.length) return ''
  const yFitted = vals.map(v => (typeof v === 'object' ? v.yFitted : v)).filter(v => v !== undefined)
  return yFitted.map(v => Number(v).toFixed(3)).join(', ')
})

async function handleGenerate() {
  if (!form.title.trim()) {
    appStore.addNotification({ type: 'warning', message: '请输入实验名称' })
    return
  }
  generating.value = true
  generateError.value = ''
  generated.value = false
  try {
    const payload = {
      title: form.title.trim(),
      course: form.course.trim(),
      data: form.data.trim(),
    }
    const res = await experimentAPI.generate(payload)
    const data = res.data?.report || res.data || res

    // Populate report content from response
    reportContent.purpose = data.purpose || ''
    reportContent.principle = data.principle || ''
    reportContent.equipment = data.equipment || ''
    reportContent.steps = data.steps || ''
    reportContent.data = data.data || data.experimentData || ''
    reportContent.analysis = data.analysis || ''
    reportContent.conclusion = data.conclusion || ''

    generated.value = true
    appStore.addNotification({ type: 'success', message: '实验报告生成成功' })
  } catch (err) {
    generateError.value = err.response?.data?.message || err.message || '生成失败，请稍后重试'
    appStore.addNotification({ type: 'error', message: generateError.value })
  } finally {
    generating.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      course: form.course.trim(),
      ...reportContent,
    }
    await experimentAPI.generate(payload)
    appStore.addNotification({ type: 'success', message: '实验报告已保存' })
    router.push('/experiment')
  } catch (err) {
    appStore.addNotification({
      type: 'error',
      message: err.response?.data?.message || err.message || '保存失败',
    })
  } finally {
    saving.value = false
  }
}

async function handleFitData() {
  const xStr = xValuesInput.value.trim()
  const yStr = yValuesInput.value.trim()
  if (!xStr || !yStr) {
    fitError.value = '请输入 X 和 Y 值'
    return
  }

  fitting.value = true
  fitError.value = ''
  fitResult.value = null

  try {
    const xArr = xStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    const yArr = yStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))

    if (xArr.length < 2 || yArr.length < 2) {
      fitError.value = 'X 和 Y 至少各需要 2 个有效数值'
      fitting.value = false
      return
    }

    if (xArr.length !== yArr.length) {
      fitError.value = `X 和 Y 的数据点数量不一致（X: ${xArr.length}, Y: ${yArr.length}）`
      fitting.value = false
      return
    }

    const res = await experimentAPI.fitData({ xValues: xArr, yValues: yArr })
    fitResult.value = res.data || res
    appStore.addNotification({ type: 'success', message: '数据拟合完成' })
  } catch (err) {
    fitError.value = err.response?.data?.message || err.message || '数据拟合失败'
  } finally {
    fitting.value = false
  }
}

function handleReset() {
  form.title = ''
  form.course = ''
  form.data = ''
  generated.value = false
  generateError.value = ''
  expandedReportSection.value = null
  Object.keys(reportContent).forEach(k => { reportContent[k] = '' })
  xValuesInput.value = ''
  yValuesInput.value = ''
  fitResult.value = null
  fitError.value = ''
}
</script>
