<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">文献处理</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">上传并管理您的学术文献</p>
        </div>
        <label
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors shadow-sm"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          上传文献
          <input type="file" class="hidden" accept=".pdf,.doc,.docx,.txt" @change="handleFileUpload" />
        </label>
      </div>

      <!-- File Upload Area -->
      <div
        class="relative border-2 border-dashed rounded-xl p-10 text-center transition-colors"
        :class="
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500'
        "
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <div v-if="!uploading" class="space-y-3">
          <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-gray-600 dark:text-gray-300 font-medium">拖拽文件到此处，或点击上方按钮上传</p>
          <p class="text-sm text-gray-400 dark:text-gray-500">支持 PDF、DOC、DOCX、TXT 格式</p>
        </div>
        <div v-else class="space-y-3">
          <svg class="w-10 h-10 mx-auto text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p class="text-blue-600 dark:text-blue-400 font-medium">{{ uploadingFileName }} 上传中...</p>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文献标题或文件名..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          @input="onSearch"
        />
      </div>

      <!-- Loading State -->
      <LoadingSpinner v-if="loading" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="documents.length === 0"
        message="还没有上传文献"
        description="上传您的第一篇文献开始使用吧"
      />

      <!-- Document Cards Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="doc in documents"
          :key="doc._id"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          @click="goToDetail(doc._id)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-3xl flex-shrink-0">📄</span>
              <div class="min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ doc.title || doc.fileName }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ doc.fileName }}</p>
              </div>
            </div>
            <button
              class="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
              @click.stop="confirmDelete(doc)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {{ (doc.fileType || '').toUpperCase() }}
            </span>
            <span
              class="px-2 py-0.5 text-xs font-medium rounded-full"
              :class="
                doc.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              "
            >
              {{ doc.status === 'completed' ? '已完成' : '处理中' }}
            </span>
            <span class="ml-auto text-xs text-gray-400 dark:text-gray-500">
              {{ formatFileSize(doc.fileSize) }}
            </span>
          </div>

          <div class="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{{ dayjs(doc.createdAt).format('YYYY-MM-DD HH:mm') }}</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="onPageChange"
      />

      <!-- ConfirmDialog -->
      <ConfirmDialog
        v-model:visible="showDeleteDialog"
        title="确认删除"
        :message="`确定要删除文献「${deleteTarget?.title || deleteTarget?.fileName}」吗？此操作不可恢复。`"
        @confirm="handleDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { documentAPI } from '@/api'

const router = useRouter()

const documents = ref([])
const loading = ref(false)
const isDragging = ref(false)
const uploading = ref(false)
const uploadingFileName = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 12

const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

async function fetchDocuments() {
  loading.value = true
  try {
    const params = { page: currentPage.value, pageSize }
    if (searchQuery.value) params.search = searchQuery.value
    const res = await documentAPI.getAll(params)
    documents.value = res.data.documents || res.data.data || []
    totalPages.value = res.data.totalPages || Math.ceil((res.data.total || 0) / pageSize) || 1
  } catch (err) {
    console.error('Failed to fetch documents:', err)
    documents.value = []
  } finally {
    loading.value = false
  }
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  await uploadFile(file)
  e.target.value = ''
}

async function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  await uploadFile(file)
}

async function uploadFile(file) {
  uploading.value = true
  uploadingFileName.value = file.name
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
    await documentAPI.upload(formData)
    currentPage.value = 1
    await fetchDocuments()
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '上传失败，请重试'
    alert(msg)
  } finally {
    uploading.value = false
    uploadingFileName.value = ''
  }
}

function goToDetail(id) {
  router.push(`/literature/${id}`)
}

function confirmDelete(doc) {
  deleteTarget.value = doc
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await documentAPI.delete(deleteTarget.value._id)
    showDeleteDialog.value = false
    deleteTarget.value = null
    await fetchDocuments()
  } catch (err) {
    console.error('Delete failed:', err)
  }
}

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    currentPage.value = 1
    await fetchDocuments()
  }, 400)
}

async function onPageChange(page) {
  currentPage.value = page
  await fetchDocuments()
}

onMounted(() => {
  fetchDocuments()
})
</script>
