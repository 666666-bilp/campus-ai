<template>
  <AppLayout>
    <template #default>
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <router-link
            to="/exam"
            class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            返回题库
          </router-link>
        </div>

        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">生成考点题库</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI自动提取考点，生成高质量练习题
          </p>
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
            <p class="text-sm font-medium text-red-800 dark:text-red-300 flex-1">{{ errorMsg }}</p>
            <button @click="errorMsg = ''" class="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Generate Form (shown when no questions yet) -->
        <div
          v-if="!generatedQuestions.length"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5"
        >
          <!-- Subject Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              科目名称 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="subject"
              type="text"
              placeholder="如：高等数学、大学物理、数据结构..."
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <!-- Input Mode Toggle -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">内容来源</label>
            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit gap-0.5">
              <button
                @click="inputMode = 'upload'"
                :class="inputMode === 'upload'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
                class="px-4 py-2 text-sm rounded-md font-medium transition-colors"
              >
                上传文件
              </button>
              <button
                @click="inputMode = 'text'"
                :class="inputMode === 'text'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
                class="px-4 py-2 text-sm rounded-md font-medium transition-colors"
              >
                粘贴文本
              </button>
            </div>
          </div>

          <!-- File Upload Mode -->
          <div v-if="inputMode === 'upload'">
            <FileUpload
              v-model="uploadedFile"
              accept=".pdf,.doc,.docx,.txt,.md"
              label="上传课件文件 (PDF, Word, TXT, MD)"
              @change="onFileChange"
            />
          </div>

          <!-- Text Paste Mode -->
          <div v-if="inputMode === 'text'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              课件/教材内容
            </label>
            <textarea
              v-model="contentText"
              rows="10"
              placeholder="将课件、教材内容或知识点粘贴到此处，AI将自动提取考点并生成题目...&#10;&#10;提示：内容越详细，生成的题目质量越高"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors text-sm leading-relaxed"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button
            @click="handleGenerate"
            :disabled="generating || !canGenerate"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg
              v-if="generating"
              class="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {{ generating ? 'AI正在生成题目...' : 'AI生成题目' }}
          </button>
        </div>

        <!-- Generated Results (shown when questions exist) -->
        <div v-if="generatedQuestions.length > 0" class="space-y-5">
          <!-- Summary Card -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {{ subject }} - 题库
            </h2>
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>共 {{ generatedQuestions.length }} 道题目</span>
              <span v-for="t in questionTypes.slice(1)" :key="t.value" class="text-xs">
                {{ t.label }} {{ getCountByType(t.value) }}
              </span>
            </div>
          </div>

          <!-- Filter by Type Tabs -->
          <div class="flex flex-wrap gap-1">
            <button
              v-for="t in questionTypes"
              :key="t.value"
              @click="typeFilter = t.value"
              :class="typeFilter === t.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            >
              {{ t.label }}
              <span class="ml-1 opacity-75">({{ getCountByType(t.value) }})</span>
            </button>
          </div>

          <!-- Editable Question Cards -->
          <div class="space-y-4">
            <div
              v-for="(q, idx) in filteredQuestions"
              :key="getGlobalIndex(q)"
              class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 space-y-3"
            >
              <!-- Question Header -->
              <div class="flex items-center gap-2 mb-1">
                <span
                  :class="typeBadgeClass(q.type)"
                  class="px-2 py-0.5 text-xs font-medium rounded flex-shrink-0"
                >
                  {{ typeLabel(q.type) }}
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-500">#{{ getGlobalIndex(q) }}</span>
                <button
                  @click="removeQuestion(idx)"
                  class="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="删除此题目"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <!-- Stem (editable) -->
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">题目内容</label>
                <textarea
                  v-model="q.stem"
                  rows="2"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors"
                ></textarea>
              </div>

              <!-- Options (for single & multiple choice) -->
              <div v-if="q.options && q.options.length > 0 && (q.type === 'single' || q.type === 'multiple')">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">选项</label>
                <div class="space-y-1.5">
                  <div
                    v-for="(opt, oi) in q.options"
                    :key="oi"
                    class="flex items-center gap-2"
                  >
                    <span class="text-xs text-gray-400 dark:text-gray-500 w-5 flex-shrink-0">
                      {{ typeof opt === 'object' && opt.key ? opt.key : String.fromCharCode(65 + oi) }}.
                    </span>
                    <input
                      v-if="typeof opt === 'string'"
                      v-model="q.options[oi]"
                      type="text"
                      class="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      v-else
                      v-model="opt.value"
                      type="text"
                      class="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Answer & Source Row -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">正确答案</label>
                  <template v-if="q.type === 'single'">
                    <input
                      v-model="q.answer"
                      type="text"
                      placeholder="如：A"
                      class="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </template>
                  <template v-else-if="q.type === 'multiple'">
                    <input
                      v-model="q.answer"
                      type="text"
                      placeholder="如：A, B, C"
                      class="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </template>
                  <template v-else-if="q.type === 'judge'">
                    <select
                      v-model="q.answer"
                      class="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择</option>
                      <option value="正确">正确</option>
                      <option value="错误">错误</option>
                    </select>
                  </template>
                  <template v-else>
                    <textarea
                      v-model="q.answer"
                      rows="2"
                      placeholder="标准答案..."
                      class="w-full px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    ></textarea>
                  </template>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">来源/章节</label>
                  <input
                    v-model="q.source"
                    type="text"
                    placeholder="如：第3章"
                    class="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- Analysis (editable) -->
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">解析</label>
                <textarea
                  v-model="q.analysis"
                  rows="2"
                  placeholder="题目解析..."
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors"
                ></textarea>
              </div>

              <!-- Difficulty -->
              <div class="flex items-center gap-2">
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400">难度:</label>
                <select
                  v-model="q.difficulty"
                  class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <button
            @click="handleSave"
            :disabled="saving"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg
              v-if="saving"
              class="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {{ saving ? '保存中...' : '保存题库' }}
          </button>

          <!-- Regenerate Button -->
          <button
            @click="handleRegenerate"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            不满意？重新生成
          </button>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { examAPI } from '@/api'
import FileUpload from '@/components/common/FileUpload.vue'

const router = useRouter()

const subject = ref('')
const contentText = ref('')
const uploadedFile = ref(null)
const inputMode = ref('text')
const generating = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const generatedQuestions = ref([])
const typeFilter = ref('all')

const questionTypes = [
  { value: 'all', label: '全部' },
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'essay', label: '简答题' }
]

const typeLabelMap = {
  single: '单选',
  multiple: '多选',
  judge: '判断',
  essay: '简答'
}

const typeBadgeClassMap = {
  single: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  multiple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  judge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  essay: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
}

const canGenerate = computed(() => {
  if (!subject.value.trim()) return false
  if (inputMode.value === 'upload') return !!uploadedFile.value
  return contentText.value.trim().length > 0
})

const filteredQuestions = computed(() => {
  if (typeFilter.value === 'all') return generatedQuestions.value
  return generatedQuestions.value.filter(q => q.type === typeFilter.value)
})

function typeLabel(type) {
  return typeLabelMap[type] || type || '未知'
}

function typeBadgeClass(type) {
  return typeBadgeClassMap[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
}

function getCountByType(type) {
  if (type === 'all') return generatedQuestions.value.length
  return generatedQuestions.value.filter(q => q.type === type).length
}

function getGlobalIndex(q) {
  return generatedQuestions.value.indexOf(q) + 1
}

function onFileChange(file) {
  uploadedFile.value = file
}

function mergeQuestions(questions) {
  const raw = Array.isArray(questions) ? questions : []
  return raw.map((q, idx) => ({
    ...q,
    id: q.id || q._id || `gen_${idx}`,
    stem: q.stem || q.question || '',
    type: q.type || 'single',
    options: q.options || [],
    answer: q.answer || '',
    source: q.source || q.chapter || '',
    analysis: q.analysis || q.explanation || '',
    difficulty: q.difficulty || 'medium'
  }))
}

function removeQuestion(idx) {
  generatedQuestions.value.splice(idx, 1)
}

async function handleGenerate() {
  if (!subject.value.trim()) {
    errorMsg.value = '请输入科目名称'
    return
  }

  errorMsg.value = ''
  generating.value = true

  try {
    const formData = new FormData()
    formData.append('subject', subject.value.trim())

    if (inputMode.value === 'upload' && uploadedFile.value) {
      formData.append('file', uploadedFile.value)
    } else if (inputMode.value === 'text' && contentText.value.trim()) {
      formData.append('content', contentText.value.trim())
      formData.append('text', contentText.value.trim())
    } else {
      errorMsg.value = '请上传文件或粘贴文本内容'
      generating.value = false
      return
    }

    const res = await examAPI.generate(formData)
    const data = res.data || res
    const questions = data.questions || data.data || data || []

    generatedQuestions.value = mergeQuestions(questions)

    if (generatedQuestions.value.length === 0) {
      errorMsg.value = '未能生成题目，请尝试更详细的内容或调整科目名称'
    }
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || err?.message || '生成失败，请稍后重试'
    console.error('Generate exam error:', err)
  } finally {
    generating.value = false
  }
}

async function handleSave() {
  if (generatedQuestions.value.length === 0) return

  saving.value = true

  try {
    const payload = {
      subject: subject.value.trim(),
      title: `${subject.value.trim()} - 题库`,
      questions: generatedQuestions.value
    }

    await examAPI.create(payload)
    router.push('/exam')
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || err?.message || '保存失败，请稍后重试'
    console.error('Save exam error:', err)
    saving.value = false
  }
}

function handleRegenerate() {
  generatedQuestions.value = []
  errorMsg.value = ''
}
</script>
