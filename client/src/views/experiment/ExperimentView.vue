<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">实验报告</h1>
        <router-link
          to="/experiment/generate"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          生成实验报告
        </router-link>
      </div>

      <!-- Loading State -->
      <LoadingSpinner v-if="loading" text="加载实验报告中..." />

      <!-- Error State -->
      <div
        v-else-if="error"
        class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center"
      >
        <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="fetchExperiments"
        >
          重新加载
        </button>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="experiments.length === 0"
        icon="🔬"
        title="还没有实验报告"
        description="点击上方按钮生成你的第一份AI实验报告"
        action-text="生成实验报告"
        action-link="/experiment/generate"
      />

      <!-- Experiment List -->
      <div v-else class="space-y-4">
        <div
          v-for="exp in experiments"
          :key="exp._id"
          class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <!-- Card Header -->
          <div
            class="flex items-start justify-between gap-4 p-5 cursor-pointer"
            @click="toggleExpand(exp._id)"
          >
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {{ exp.title }}
              </h3>
              <div class="flex items-center gap-3 mt-1.5">
                <span
                  v-if="exp.course"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  {{ exp.course }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(exp.createdAt) }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="删除"
                @click.stop="confirmDelete(exp)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <svg
                :class="[
                  'w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0',
                  expandedId === exp._id ? 'rotate-180' : ''
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Expanded Content -->
          <div
            v-if="expandedId === exp._id"
            class="px-5 pb-5 border-t border-gray-200 dark:border-gray-700"
          >
            <div class="space-y-6 mt-4">
              <!-- 实验目的 -->
              <section v-if="exp.purpose || editSection === 'purpose'">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-blue-500 rounded-full inline-block flex-shrink-0"></span>
                  实验目的
                </h3>
                <p
                  v-if="editSection !== 'purpose'"
                  class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap"
                >
                  {{ exp.purpose }}
                </p>
                <textarea
                  v-else
                  v-model="editContent"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                ></textarea>
              </section>

              <!-- 实验原理 -->
              <section v-if="exp.principle || editSection === 'principle'">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-green-500 rounded-full inline-block flex-shrink-0"></span>
                  实验原理
                </h3>
                <p
                  v-if="editSection !== 'principle'"
                  class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap"
                >
                  {{ exp.principle }}
                </p>
                <textarea
                  v-else
                  v-model="editContent"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                ></textarea>
              </section>

              <!-- 实验器材 -->
              <section v-if="exp.equipment || editSection === 'equipment'">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-yellow-500 rounded-full inline-block flex-shrink-0"></span>
                  实验器材
                </h3>
                <p
                  v-if="editSection !== 'equipment'"
                  class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap"
                >
                  {{ exp.equipment }}
                </p>
                <textarea
                  v-else
                  v-model="editContent"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                ></textarea>
              </section>

              <!-- 实验步骤 -->
              <section v-if="exp.steps || editSection === 'steps'">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-purple-500 rounded-full inline-block flex-shrink-0"></span>
                  实验步骤
                </h3>
                <p
                  v-if="editSection !== 'steps'"
                  class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap"
                >
                  {{ exp.steps }}
                </p>
                <textarea
                  v-else
                  v-model="editContent"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                ></textarea>
              </section>

              <!-- 实验数据 -->
              <section v-if="exp.data || editSection === 'data'">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-red-500 rounded-full inline-block flex-shrink-0"></span>
                  实验数据
                </h3>
                <p
                  v-if="editSection !== 'data'"
                  class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap"
                >
                  {{ exp.data }}
                </p>
                <textarea
                  v-else
                  v-model="editContent"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                ></textarea>
              </section>

              <!-- 数据分析 -->
              <section v-if="exp.analysis || editSection === 'analysis'">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-indigo-500 rounded-full inline-block flex-shrink-0"></span>
                  数据分析
                </h3>
                <p
                  v-if="editSection !== 'analysis'"
                  class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap"
                >
                  {{ exp.analysis }}
                </p>
                <textarea
                  v-else
                  v-model="editContent"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                ></textarea>
              </section>

              <!-- Chart Display -->
              <section v-if="exp.chartData">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-pink-500 rounded-full inline-block flex-shrink-0"></span>
                  数据图表
                </h3>
                <ChartDisplay :option="exp.chartData" />
              </section>

              <!-- 实验结论 -->
              <section v-if="exp.conclusion || editSection === 'conclusion'">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span class="w-1.5 h-5 bg-teal-500 rounded-full inline-block flex-shrink-0"></span>
                  实验结论
                </h3>
                <p
                  v-if="editSection !== 'conclusion'"
                  class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap"
                >
                  {{ exp.conclusion }}
                </p>
                <textarea
                  v-else
                  v-model="editContent"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                ></textarea>
              </section>
            </div>

            <!-- Edit Controls -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-wrap">
              <template v-if="editSection">
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  @click="saveEdit(exp)"
                >
                  保存修改
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="cancelEdit"
                >
                  取消
                </button>
              </template>
              <template v-else>
                <button
                  v-for="section in sections"
                  :key="section.key"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="startEdit(section.key, exp[section.key])"
                >
                  编辑{{ section.label }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="!loading && experiments.length > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="total"
        @page-change="handlePageChange"
      />

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        :visible="showDeleteDialog"
        title="确认删除"
        :message="`确定要删除实验报告「${deleteTarget?.title || ''}」吗？此操作不可撤销。`"
        confirm-text="删除"
        cancel-text="取消"
        type="danger"
        @confirm="handleDelete"
        @cancel="showDeleteDialog = false"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { experimentAPI } from '@/api'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Pagination from '@/components/common/Pagination.vue'
import ChartDisplay from '@/components/common/ChartDisplay.vue'

const appStore = useAppStore()

const experiments = ref([])
const loading = ref(true)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const pageSize = 10

const expandedId = ref(null)
const editSection = ref(null)
const editContent = ref('')
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const sections = [
  { key: 'purpose', label: '实验目的' },
  { key: 'principle', label: '实验原理' },
  { key: 'equipment', label: '实验器材' },
  { key: 'steps', label: '实验步骤' },
  { key: 'data', label: '实验数据' },
  { key: 'analysis', label: '数据分析' },
  { key: 'conclusion', label: '实验结论' },
]

function formatDate(date) {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function toggleExpand(id) {
  if (expandedId.value === id) {
    expandedId.value = null
    cancelEdit()
  } else {
    expandedId.value = id
    cancelEdit()
  }
}

function startEdit(key, currentValue) {
  editSection.value = key
  editContent.value = currentValue || ''
}

function cancelEdit() {
  editSection.value = null
  editContent.value = ''
}

async function saveEdit(exp) {
  if (!editSection.value || !exp._id) return
  try {
    const updateData = { [editSection.value]: editContent.value }
    await experimentAPI.update(exp._id, updateData)
    exp[editSection.value] = editContent.value
    appStore.addNotification({ type: 'success', message: '修改已保存' })
    cancelEdit()
  } catch (err) {
    appStore.addNotification({ type: 'error', message: err.response?.data?.message || err.message || '保存失败' })
  }
}

function confirmDelete(exp) {
  deleteTarget.value = exp
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await experimentAPI.delete(deleteTarget.value._id)
    experiments.value = experiments.value.filter(e => e._id !== deleteTarget.value._id)
    if (expandedId.value === deleteTarget.value._id) {
      expandedId.value = null
    }
    total.value--
    appStore.addNotification({ type: 'success', message: '实验报告已删除' })
  } catch (err) {
    appStore.addNotification({ type: 'error', message: err.response?.data?.message || err.message || '删除失败' })
  } finally {
    showDeleteDialog.value = false
    deleteTarget.value = null
  }
}

async function fetchExperiments() {
  loading.value = true
  error.value = ''
  try {
    const res = await experimentAPI.getAll({ page: currentPage.value, pageSize })
    const data = res.data
    experiments.value = data?.experiments || data?.list || data || []
    totalPages.value = data?.totalPages || res.totalPages || 1
    total.value = data?.total || res.total || experiments.value.length
  } catch (err) {
    error.value = err.response?.data?.message || err.message || '加载实验报告失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  expandedId.value = null
  cancelEdit()
  fetchExperiments()
}

onMounted(() => {
  fetchExperiments()
})
</script>
