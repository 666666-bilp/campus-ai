<template>
  <AppLayout>
    <template #default>
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">论文润色 & 降重</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              AI驱动的文本润色、改写与语法纠错，提升学术写作质量
            </p>
          </div>
          <div class="flex items-center gap-2" v-if="result">
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ result.changes?.length || 0 }} 处修改建议
            </span>
          </div>
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
              <button @click="handlePolish" class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">
                重试
              </button>
            </div>
            <button @click="errorMsg = ''" class="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Input Section -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="space-y-4">
            <!-- Mode & Action Selectors -->
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">学科领域:</label>
                <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-0.5">
                  <button
                    v-for="m in disciplineModes"
                    :key="m.value"
                    @click="discipline = m.value"
                    :class="[
                      'px-3 py-1.5 text-xs rounded-md transition-all duration-200',
                      discipline === m.value
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    ]"
                  >
                    {{ m.label }}
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">处理方式:</label>
                <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-0.5">
                  <button
                    v-for="a in actionTypes"
                    :key="a.value"
                    @click="actionType = a.value"
                    :class="[
                      'px-3 py-1.5 text-xs rounded-md transition-all duration-200',
                      actionType === a.value
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    ]"
                  >
                    {{ a.label }}
                  </button>
                </div>
              </div>

              <button
                @click="handlePolish"
                :disabled="loading || !inputText.trim()"
                class="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {{ loading ? '润色中...' : '开始润色' }}
              </button>
            </div>

            <!-- Textarea -->
            <div>
              <textarea
                v-model="inputText"
                placeholder="请输入需要润色的文本...&#10;&#10;支持中文、英文混合文本，建议单次处理不超过2000字"
                class="min-h-48 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors text-sm leading-relaxed"
              ></textarea>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ inputText.length }} 字</span>
                <button
                  v-if="inputText"
                  @click="inputText = ''; result = null"
                  class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center"
        >
          <LoadingSpinner text="AI 正在分析文本并生成润色建议..." />
        </div>

        <!-- Empty State -->
        <div
          v-if="!loading && !result && !errorMsg"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 p-16"
        >
          <EmptyState
            icon="📝"
            title="请输入需要润色的文本..."
            description="在上方文本框中粘贴您需要润色的论文段落，选择学科领域和处理方式后点击开始润色"
          />
        </div>

        <!-- Results Section -->
        <div v-if="result && !loading" class="space-y-6">
          <!-- Side-by-side Comparison -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Original -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">原文</span>
                <span class="text-xs text-gray-400 ml-auto">{{ result.original?.length || inputText.length }} 字</span>
              </div>
              <div class="p-4 overflow-y-auto max-h-96 bg-gray-50 dark:bg-gray-900 flex-1">
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ result.original || inputText }}
                </p>
              </div>
            </div>

            <!-- Polished -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-200 dark:border-green-800 overflow-hidden flex flex-col">
              <div class="px-4 py-3 border-b border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm font-medium text-green-700 dark:text-green-300">润色后</span>
                <span class="text-xs text-green-500 ml-auto">{{ result.polished?.length || 0 }} 字</span>
              </div>
              <div class="p-4 overflow-y-auto max-h-96 bg-green-50/30 dark:bg-green-900/10 flex-1">
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ result.polished }}
                </p>
              </div>
            </div>
          </div>

          <!-- Changes List -->
          <div
            v-if="result.changes && result.changes.length > 0"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                修改详情
                <span class="ml-2 text-xs font-normal text-gray-400">({{ result.changes.length }} 处)</span>
              </h3>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-700">
              <div
                v-for="(change, idx) in result.changes"
                :key="idx"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <!-- Type Badge -->
                  <span
                    :class="[
                      'flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium',
                      changeTypeClass(change.type)
                    ]"
                  >
                    {{ changeTypeLabel(change.type) }}
                  </span>
                  <div class="flex-1 min-w-0 space-y-2">
                    <!-- Original (red strikethrough) -->
                    <div class="flex items-start gap-2">
                      <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">原文:</span>
                      <span class="text-sm text-red-600 dark:text-red-400 line-through">
                        {{ change.original }}
                      </span>
                    </div>
                    <!-- Suggestion (green) -->
                    <div class="flex items-start gap-2">
                      <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">建议:</span>
                      <span class="text-sm text-green-600 dark:text-green-400 font-medium">
                        {{ change.suggestion }}
                      </span>
                    </div>
                    <!-- Reason (italic) -->
                    <div v-if="change.reason" class="flex items-start gap-2">
                      <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">原因:</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 italic">
                        {{ change.reason }}
                      </span>
                    </div>
                  </div>
                  <span class="text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">#{{ idx + 1 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Summary -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ result.changes?.length || 0 }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">修改建议</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ result.polished?.length || 0 }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">润色后字数</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ disciplineLabel }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">学科方向</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
              <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ actionLabel }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">处理方式</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { polishAPI } from '@/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const inputText = ref('')
const discipline = ref('liberal_arts')
const actionType = ref('polish')
const loading = ref(false)
const errorMsg = ref('')
const result = ref(null)

const disciplineModes = [
  { value: 'liberal_arts', label: '文科' },
  { value: 'science', label: '理工科' },
  { value: 'business', label: '经管' }
]

const actionTypes = [
  { value: 'rewrite', label: '改写' },
  { value: 'polish', label: '润色' },
  { value: 'grammar', label: '语法纠错' }
]

const disciplineLabel = computed(() => {
  const found = disciplineModes.find(m => m.value === discipline.value)
  return found ? found.label : '文科'
})

const actionLabel = computed(() => {
  const found = actionTypes.find(a => a.value === actionType.value)
  return found ? found.label : '润色'
})

const changeTypeMap = {
  grammar: { label: '语法', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  vocabulary: { label: '词汇', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  structure: { label: '结构', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  style: { label: '风格', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  academic: { label: '学术', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  redundancy: { label: '冗余', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  replacement: { label: '替换', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  deletion: { label: '删除', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  addition: { label: '新增', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
}

function changeTypeClass(type) {
  return changeTypeMap[type]?.class || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

function changeTypeLabel(type) {
  return changeTypeMap[type]?.label || type || '修改'
}

async function handlePolish() {
  if (!inputText.value.trim()) return

  errorMsg.value = ''
  result.value = null
  loading.value = true

  try {
    const res = await polishAPI.polishText({
      text: inputText.value.trim(),
      discipline: discipline.value,
      actionType: actionType.value
    })

    const data = res.data || res

    result.value = {
      original: data.original || inputText.value.trim(),
      polished: data.polished || data.polished_text || data.text || '',
      changes: data.changes || data.suggestions || []
    }
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || err?.message || '润色请求失败，请稍后重试'
    console.error('Polish error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.min-h-48 {
  min-height: 12rem;
}
</style>
