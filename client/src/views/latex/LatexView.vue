<template>
  <AppLayout>
    <template #default>
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">LaTeX 公式编辑器</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              通过自然语言描述生成 LaTeX 公式，支持实时预览与编辑
            </p>
          </div>
          <button
            v-if="latexCode"
            @click="handleCopy"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="copied
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
          >
            <svg v-if="copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {{ copied ? '已复制' : '复制代码' }}
          </button>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMsg"
          class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
        >
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ errorMsg }}</p>
              <button @click="handleGenerate" class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">重试</button>
            </div>
            <button @click="errorMsg = ''" class="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Two Column Layout: Left 60% / Right 40% -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <!-- Left Panel: Input (3/5 = 60%) -->
          <div class="lg:col-span-3 space-y-4">
            <!-- Input Section -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  公式描述 / LaTeX 代码
                </label>
                <textarea
                  v-model="latexCode"
                  rows="10"
                  placeholder="描述你需要的公式，或直接输入 LaTeX 代码...&#10;&#10;例如：&#10;- 爱因斯坦质能方程 E=mc^2&#10;- 正态分布的概率密度函数&#10;- \\frac{1}{\\sqrt{2\\pi}}e^{-\\frac{x^2}{2}}"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors text-sm font-mono leading-relaxed"
                ></textarea>
              </div>

              <!-- Buttons -->
              <div class="flex flex-wrap items-center gap-3">
                <button
                  @click="handleGenerate"
                  :disabled="generating || !latexCode.trim()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <svg v-if="generating" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ generating ? '生成中...' : 'AI生成公式' }}
                </button>

                <button
                  @click="handlePreview"
                  :disabled="previewLoading || !latexCode.trim()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <svg v-if="previewLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ previewLoading ? '渲染中...' : '渲染预览' }}
                </button>

                <button
                  v-if="latexCode"
                  @click="handleClear"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清空
                </button>
              </div>
            </div>

            <!-- Loading -->
            <div
              v-if="generating"
              class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12"
            >
              <LoadingSpinner text="AI 正在生成 LaTeX 公式..." />
            </div>

            <!-- Recent Formulas -->
            <div
              v-if="recentFormulas.length > 0"
              class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">最近公式</h3>
                <button @click="clearRecent" class="text-xs text-gray-400 hover:text-red-500 transition-colors">清空记录</button>
              </div>
              <div class="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                <div
                  v-for="(item, idx) in recentFormulas"
                  :key="idx"
                  @click="latexCode = item.latex; handlePreview()"
                  class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors group flex items-start justify-between"
                >
                  <div class="min-w-0 flex-1">
                    <div class="text-sm text-gray-700 dark:text-gray-300 truncate font-mono">
                      {{ item.latex }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {{ item.desc || formatTime(item.time) }}
                    </div>
                  </div>
                  <button
                    @click.stop="removeRecent(idx)"
                    class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Panel: Preview (2/5 = 40%) -->
          <div class="lg:col-span-2">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4 space-y-4">
              <!-- Preview Title -->
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  公式预览
                </h3>
                <span v-if="previewError" class="text-xs text-red-500">渲染失败</span>
              </div>

              <!-- Preview Area -->
              <div class="flex items-center justify-center min-h-48 p-6 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                <img
                  v-if="previewUrl && !previewError"
                  :src="previewUrl"
                  :alt="previewAlt"
                  class="max-w-full h-auto"
                  @error="onPreviewError"
                />
                <div v-else-if="previewError" class="text-center">
                  <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm text-gray-500 dark:text-gray-400">公式渲染失败</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">请检查 LaTeX 代码是否正确</p>
                </div>
                <div v-else class="text-center text-gray-400 dark:text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p class="text-sm">输入公式后点击"渲染预览"</p>
                  <p class="text-xs mt-1">或点击"AI生成公式"自动生成</p>
                </div>
              </div>

              <!-- Tips -->
              <div v-if="!latexCode" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 class="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">使用提示</h4>
                <ul class="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <li>- 用中文描述你需要的公式，AI 会自动生成 LaTeX</li>
                  <li>- 也可以直接粘贴 LaTeX 代码并渲染预览</li>
                  <li>- 支持数学、物理、化学等各学科公式</li>
                  <li>- 点击"复制代码"可复制到剪贴板</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { latexAPI } from '@/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const STORAGE_KEY = 'latex_recent_formulas'
const MAX_RECENT = 20

const latexCode = ref('')
const previewUrl = ref('')
const previewAlt = ref('LaTeX Formula Preview')
const previewError = ref(false)
const generating = ref(false)
const previewLoading = ref(false)
const errorMsg = ref('')
const copied = ref(false)
const recentFormulas = ref([])

onMounted(() => {
  loadRecentFormulas()
})

function loadRecentFormulas() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      recentFormulas.value = JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load recent formulas:', e)
    recentFormulas.value = []
  }
}

function saveRecentFormulas() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFormulas.value))
  } catch (e) {
    console.error('Failed to save recent formulas:', e)
  }
}

function addToRecent(latex, desc) {
  const existing = recentFormulas.value.findIndex(f => f.latex === latex)
  if (existing !== -1) {
    recentFormulas.value.splice(existing, 1)
  }

  recentFormulas.value.unshift({
    latex,
    desc: desc || '',
    time: Date.now()
  })

  if (recentFormulas.value.length > MAX_RECENT) {
    recentFormulas.value = recentFormulas.value.slice(0, MAX_RECENT)
  }

  saveRecentFormulas()
}

function removeRecent(index) {
  recentFormulas.value.splice(index, 1)
  saveRecentFormulas()
}

function clearRecent() {
  recentFormulas.value = []
  saveRecentFormulas()
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function encodeLatexForUrl(latex) {
  return encodeURIComponent(latex)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/~/g, '%7E')
}

function extractPreviewLatex(latex) {
  // 如果包含 \documentclass，提取 \begin{document} 和 \end{document} 之间的内容
  const docMatch = latex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)
  if (docMatch) {
    // 去掉 preamble 命令，只保留数学环境内容
    return docMatch[1]
      .replace(/\\maketitle/g, '')
      .replace(/\\section\*?\{[^}]*\}/g, '')
      .replace(/\\section\{[^}]*\}/g, '')
      .trim()
  }
  return latex.trim()
}

function handlePreview() {
  if (!latexCode.value.trim()) return

  previewLoading.value = true
  previewError.value = false

  const cleanLatex = extractPreviewLatex(latexCode.value.trim())
  const encoded = encodeLatexForUrl(cleanLatex)

  previewUrl.value = `https://latex.codecogs.com/svg.image?${encoded}&t=${Date.now()}`
  previewAlt.value = cleanLatex

  addToRecent(latexCode.value.trim(), '')
  previewLoading.value = false
}

function onPreviewError() {
  previewError.value = true
}

async function handleGenerate() {
  const desc = latexCode.value.trim()
  if (!desc) return

  errorMsg.value = ''
  generating.value = true

  try {
    const res = await latexAPI.generate({ description: desc, prompt: desc })
    const data = res.data || res

    const generatedLatex = data.latex || data.formula || data.code || data.text || ''

    if (generatedLatex) {
      latexCode.value = generatedLatex
      addToRecent(generatedLatex, desc)
      handlePreview()
    } else {
      errorMsg.value = 'AI未能生成有效公式，请尝试调整描述'
    }
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'AI生成失败，请稍后重试'
    console.error('Generate error:', err)
  } finally {
    generating.value = false
  }
}

function handleClear() {
  latexCode.value = ''
  previewUrl.value = ''
  previewError.value = false
  errorMsg.value = ''
}

async function handleCopy() {
  if (!latexCode.value) return

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(latexCode.value)
    } else {
      const ta = document.createElement('textarea')
      ta.value = latexCode.value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }

    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Copy failed:', err)
    errorMsg.value = '复制失败，请手动复制'
  }
}
</script>

<style scoped>
.min-h-48 {
  min-height: 12rem;
}
</style>
