<template>
  <AppLayout>
    <template #default>
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">考点题库</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              智能刷题与错题管理，高效备考
            </p>
          </div>
          <router-link
            to="/exam/generate"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            生成新题库
          </router-link>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <LoadingSpinner text="加载题库数据..." />
        </div>

        <!-- Error State -->
        <div
          v-if="errorMsg && !loading"
          class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
        >
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ errorMsg }}</p>
              <button @click="fetchData" class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">重试</button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="!loading && !errorMsg" class="border-b border-gray-200 dark:border-gray-700">
          <div class="flex gap-0">
            <button
              @click="activeTab = 'bank'"
              :class="activeTab === 'bank'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
            >
              题库
            </button>
            <button
              @click="activeTab = 'wrong'"
              :class="activeTab === 'wrong'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5"
            >
              错题本
              <span
                v-if="wrongBook.length > 0"
                class="px-1.5 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
              >
                {{ wrongBook.length }}
              </span>
            </button>
          </div>
        </div>

        <!-- ===== 题库 Tab ===== -->
        <div v-if="!loading && !errorMsg && activeTab === 'bank'" class="space-y-4">
          <!-- Empty State: No exam sets -->
          <div
            v-if="examSets.length === 0"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 p-16"
          >
            <EmptyState
              icon="📋"
              title="还没有题库"
              description="快去生成一份题库，开始刷题备考吧"
            />
            <div class="flex justify-center mt-4">
              <router-link
                to="/exam/generate"
                class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                生成新题库
              </router-link>
            </div>
          </div>

          <!-- Exam Sets List -->
          <div v-for="examSet in examSets" :key="examSet.id || examSet._id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <!-- Set Header (expandable) -->
            <button
              @click="toggleSet(examSet)"
              class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                  📖
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ examSet.title || examSet.subject || '未命名题库' }}
                  </h3>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {{ examSet.subject || '未知科目' }}
                    <span class="mx-1">&middot;</span>
                    {{ (examSet.questions || []).length }} 题
                    <span v-if="examSet.createdAt" class="mx-1">&middot;</span>
                    <span v-if="examSet.createdAt">{{ formatDate(examSet.createdAt) }}</span>
                  </p>
                </div>
              </div>
              <svg
                :class="isExpanded(examSet) ? 'rotate-180' : ''"
                class="w-5 h-5 text-gray-400 transition-transform flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Questions (expanded) -->
            <div v-if="isExpanded(examSet)" class="border-t border-gray-100 dark:border-gray-700">
              <!-- Empty questions -->
              <div
                v-if="!examSet.questions || examSet.questions.length === 0"
                class="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
              >
                此题库中暂无题目
              </div>

              <!-- Question List -->
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
                <div v-for="(q, qi) in examSet.questions" :key="qi" class="px-5 py-4">
                  <!-- Question Header -->
                  <div class="flex items-start gap-2 mb-3">
                    <span
                      :class="typeBadgeClass(q.type)"
                      class="px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0"
                    >
                      {{ typeLabel(q.type) }}
                    </span>
                    <span class="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                      {{ qi + 1 }}. {{ q.stem || q.question }}
                    </span>
                  </div>

                  <!-- Options (radio for single, checkbox for multiple) -->
                  <div v-if="q.options && q.options.length > 0 && (q.type === 'single' || q.type === 'multiple')" class="ml-7 space-y-1.5 mb-3">
                    <label
                      v-for="(opt, oi) in q.options"
                      :key="oi"
                      :class="getOptionClass(q, qi, oi)"
                      class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      <input
                        v-if="q.type === 'single'"
                        type="radio"
                        :name="`q_${(examSet.id || examSet._id)}_${qi}`"
                        :value="getOptionKey(q, oi)"
                        v-model="answers[qi]"
                        @change="clearResult(qi)"
                        :disabled="results[qi] !== undefined"
                        class="text-blue-600 focus:ring-blue-500"
                      />
                      <input
                        v-else
                        type="checkbox"
                        :value="getOptionKey(q, oi)"
                        v-model="answers[qi]"
                        @change="clearResult(qi)"
                        :disabled="results[qi] !== undefined"
                        class="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span>
                        {{ getOptionKey(q, oi) }}. {{ typeof opt === 'string' ? opt : (opt.value || opt.text || opt) }}
                      </span>
                      <!-- Correct/Wrong indicators after submission -->
                      <span
                        v-if="results[qi] !== undefined && isCorrectOption(q, qi, oi)"
                        class="ml-auto text-xs text-green-600 dark:text-green-400"
                      >
                        &#10003; 正确
                      </span>
                      <span
                        v-else-if="results[qi] !== undefined && isWrongOption(q, qi, oi)"
                        class="ml-auto text-xs text-red-600 dark:text-red-400"
                      >
                        &#10007;
                      </span>
                    </label>
                  </div>

                  <!-- Essay/Text Input -->
                  <div v-if="q.type === 'essay'" class="ml-7 mb-3">
                    <textarea
                      v-model="answers[qi]"
                      placeholder="输入你的答案..."
                      rows="3"
                      :disabled="results[qi] !== undefined"
                      class="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-y outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                    ></textarea>
                  </div>

                  <!-- Judge Input -->
                  <div v-if="q.type === 'judge'" class="ml-7 mb-3 flex gap-4">
                    <label class="flex items-center gap-1.5 text-sm cursor-pointer"
                      :class="results[qi] !== undefined && !results[qi] ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'">
                      <input type="radio" :name="`q_judge_${(examSet.id || examSet._id)}_${qi}`" value="true" v-model="answers[qi]" @change="clearResult(qi)" :disabled="results[qi] !== undefined" class="text-blue-600" />
                      <span>正确 (&#10003;)</span>
                    </label>
                    <label class="flex items-center gap-1.5 text-sm cursor-pointer"
                      :class="results[qi] !== undefined && results[qi] ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'">
                      <input type="radio" :name="`q_judge_${(examSet.id || examSet._id)}_${qi}`" value="false" v-model="answers[qi]" @change="clearResult(qi)" :disabled="results[qi] !== undefined" class="text-blue-600" />
                      <span>错误 (&#10007;)</span>
                    </label>
                  </div>

                  <!-- Result / Analysis after submit -->
                  <div
                    v-if="results[qi] !== undefined"
                    class="ml-7 mt-2 text-xs p-3 rounded-lg"
                    :class="results[qi]
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'"
                  >
                    <p class="font-medium mb-0.5">
                      {{ results[qi] ? '&#10003; 回答正确' : '&#10007; 回答错误' }}
                    </p>
                    <p v-if="!results[qi] && q.answer" class="mt-1">
                      正确答案: <strong>{{ formatAnswer(q.answer) }}</strong>
                    </p>
                    <p v-if="q.analysis" class="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">
                      <span class="font-medium">解析:</span> {{ q.analysis }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Submit / Reset Buttons -->
              <div class="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <button
                  @click="submitAnswers(examSet)"
                  :disabled="submittingSetId === (examSet.id || examSet._id)"
                  class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white transition-colors shadow-sm"
                >
                  <svg v-if="submittingSetId === (examSet.id || examSet._id)" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ submittingSetId === (examSet.id || examSet._id) ? '提交中...' : '提交答案' }}
                </button>
                <button
                  @click="resetSet(examSet)"
                  class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  重做
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 错题本 Tab ===== -->
        <div v-if="!loading && !errorMsg && activeTab === 'wrong'" class="space-y-4">
          <!-- Empty State -->
          <div
            v-if="wrongBook.length === 0"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 p-16"
          >
            <EmptyState
              icon="📒"
              title="错题本为空"
              description="太棒了！还没有错题记录，继续保持"
            />
          </div>

          <!-- Wrong Questions List -->
          <div v-else class="space-y-3">
            <div
              v-for="(item, idx) in wrongBook"
              :key="item.id || item._id || idx"
              class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-4"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {{ item.subject || item.examSubject || '未知科目' }}
                  </span>
                  <span
                    v-if="item.type"
                    class="text-xs px-1.5 py-0.5 rounded"
                    :class="typeBadgeClass(item.type)"
                  >
                    {{ typeLabel(item.type) }}
                  </span>
                  <span
                    v-if="item.wrongCount || item.wrong_count"
                    class="text-xs text-red-500 dark:text-red-400 font-medium"
                  >
                    错 {{ item.wrongCount || item.wrong_count }} 次
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    {{ formatDate(item.updatedAt || item.date || item.createdAt) }}
                  </span>
                </div>
                <p class="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                  {{ item.stem || item.question?.stem || item.questionText || '无题干' }}
                </p>
                <div v-if="item.answer" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  正确答案: {{ formatAnswer(item.answer) }}
                </div>
              </div>
              <button
                @click="removeFromWrongBook(item)"
                :disabled="removingId === (item.id || item._id)"
                class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ removingId === (item.id || item._id) ? '...' : '移出' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { examAPI } from '@/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const activeTab = ref('bank')
const loading = ref(true)
const errorMsg = ref('')
const examSets = ref([])
const wrongBook = ref([])
const expandedSets = reactive({})
const answers = reactive({})
const results = reactive({})
const submittingSetId = ref(null)
const removingId = ref(null)

function toggleSet(examSet) {
  const id = examSet.id || examSet._id
  if (expandedSets[id]) {
    delete expandedSets[id]
    // Clear answers/results for this set
    const qs = examSet.questions || []
    qs.forEach((_, i) => {
      delete answers[i]
      delete results[i]
    })
  } else {
    expandedSets[id] = true
  }
}

function isExpanded(examSet) {
  return !!expandedSets[examSet.id || examSet._id]
}

function typeLabel(type) {
  const map = { single: '单选', multiple: '多选', judge: '判断', essay: '简答' }
  return map[type] || type || '未知'
}

function typeBadgeClass(type) {
  const map = {
    single: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    multiple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    judge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    essay: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
  }
  return map[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
}

function formatAnswer(answer) {
  if (Array.isArray(answer)) return answer.join(', ')
  if (answer === true || answer === 'true') return '正确'
  if (answer === false || answer === 'false') return '错误'
  return String(answer || '')
}

function getOptionKey(q, oi) {
  if (q.options && q.options[oi] && typeof q.options[oi] === 'object') {
    return q.options[oi].key || String.fromCharCode(65 + oi)
  }
  return String.fromCharCode(65 + oi)
}

function getOptionText(q, oi) {
  if (!q.options || !q.options[oi]) return ''
  if (typeof q.options[oi] === 'string') return q.options[oi]
  return q.options[oi].value || q.options[oi].text || String(q.options[oi])
}

function getOptionKeyFromOpt(q, oi) {
  if (!q.options || !q.options[oi]) return String.fromCharCode(65 + oi)
  if (typeof q.options[oi] === 'string') return String.fromCharCode(65 + oi)
  return q.options[oi].key || String.fromCharCode(65 + oi)
}

function isOptionCorrect(q, qi, oi) {
  const correct = q.answer
  const key = getOptionKey(q, oi)
  if (Array.isArray(correct)) return correct.includes(key)
  if (typeof correct === 'boolean') return String(correct) === key
  return String(correct) === key
}

function isCorrectOption(q, qi, oi) {
  return isOptionCorrect(q, qi, oi)
}

function isWrongOption(q, qi, oi) {
  const userAns = answers[qi]
  const key = getOptionKey(q, oi)
  // User selected this but it's not correct
  if (Array.isArray(userAns)) {
    return userAns.includes(key) && !isOptionCorrect(q, qi, oi)
  }
  return !Array.isArray(userAns) && String(userAns) === key && !isOptionCorrect(q, qi, oi)
}

function getOptionClass(q, qi, oi) {
  if (results[qi] === undefined) {
    return 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
  }
  if (isOptionCorrect(q, qi, oi)) {
    return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
  }
  return 'text-gray-400 dark:text-gray-500'
}

function clearResult(qi) {
  delete results[qi]
}

async function submitAnswers(examSet) {
  const setId = examSet.id || examSet._id
  const qs = examSet.questions || []

  submittingSetId.value = setId

  try {
    // Evaluate locally first
    qs.forEach((q, qi) => {
      const userAns = answers[qi]
      const correct = q.answer

      if (q.type === 'single') {
        results[qi] = String(userAns) === String(correct)
      } else if (q.type === 'multiple') {
        if (!Array.isArray(userAns) || !Array.isArray(correct)) {
          results[qi] = String(userAns) === String(correct)
        } else {
          const sortedUser = [...userAns].sort()
          const sortedCorrect = [...correct].sort()
          results[qi] = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
        }
      } else if (q.type === 'judge') {
        results[qi] = String(userAns) === String(correct)
      } else if (q.type === 'essay') {
        // For essay, just mark as needing review or do a simple comparison
        if (userAns && correct) {
          results[qi] = userAns.trim().toLowerCase() === String(correct).trim().toLowerCase()
        } else {
          results[qi] = !!userAns
        }
      } else {
        results[qi] = String(userAns) === String(correct)
      }

      // If wrong, try to add to wrong book via API
      if (!results[qi]) {
        try {
          const questionId = q.id || q._id || `${setId}_${qi}`
          examAPI.addToWrongBook(questionId, {
            stem: q.stem || q.question,
            answer: q.answer,
            analysis: q.analysis,
            type: q.type,
            subject: examSet.subject || examSet.title,
            examSetId: setId
          }).catch(() => { /* ignore */ })
        } catch (_) { /* ignore */ }
      }
    })
  } catch (err) {
    console.error('Failed to submit answers:', err)
  } finally {
    submittingSetId.value = null
  }
}

function resetSet(examSet) {
  const qs = examSet.questions || []
  qs.forEach((_, qi) => {
    delete answers[qi]
    delete results[qi]
  })
}

async function removeFromWrongBook(item) {
  const id = item.id || item._id
  removingId.value = id

  try {
    await examAPI.removeFromWrongBook(id)
    wrongBook.value = wrongBook.value.filter(w => (w.id || w._id) !== id)
  } catch (err) {
    console.error('Failed to remove from wrong book:', err)
    alert(err?.response?.data?.message || err?.message || '移除失败')
  } finally {
    removingId.value = null
  }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function fetchData() {
  loading.value = true
  errorMsg.value = ''

  try {
    const [examRes, wrongRes] = await Promise.all([
      examAPI.getAll(),
      examAPI.getWrongBook()
    ])

    const examData = examRes.data || examRes
    examSets.value = examData.examSets || examData.data || examData || []

    const wrongData = wrongRes.data || wrongRes
    wrongBook.value = wrongData.wrongBook || wrongData.data || wrongData || []
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || err?.message || '加载题库数据失败'
    console.error('Failed to fetch exam data:', err)
    examSets.value = []
    wrongBook.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
