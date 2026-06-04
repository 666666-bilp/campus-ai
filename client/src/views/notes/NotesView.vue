<template>
  <AppLayout>
    <template #default>
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">云端笔记</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              记录学习灵感，AI辅助总结，随时随地访问
            </p>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-3">
          <button
            @click="showCreateForm = !showCreateForm"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ showCreateForm ? '取消' : '新建笔记' }}
          </button>

          <!-- Folder Filter -->
          <select
            v-model="folderFilter"
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部文件夹</option>
            <option v-for="f in folders" :key="f" :value="f">{{ f }}</option>
          </select>

          <!-- Search -->
          <div class="relative flex-1 min-w-[200px] max-w-sm">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索笔记..."
              class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Sort Toggle -->
          <button
            @click="toggleSort"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            :title="sortNewest ? '最新优先 (点击切换)' : '最早优先 (点击切换)'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {{ sortNewest ? '最新' : '最早' }}
          </button>
        </div>

        <!-- Inline Create Form -->
        <transition name="slide-down">
          <div v-if="showCreateForm" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 space-y-3">
            <input
              v-model="newNoteTitle"
              type="text"
              placeholder="笔记标题..."
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              v-model="newNoteContent"
              rows="4"
              placeholder="笔记内容..."
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            ></textarea>
            <div class="flex items-center gap-3 flex-wrap">
              <select
                v-model="newNoteFolder"
                class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">选择文件夹</option>
                <option v-for="f in folders" :key="f" :value="f">{{ f }}</option>
                <option value="__new__">+ 新建文件夹</option>
              </select>
              <input
                v-if="newNoteFolder === '__new__'"
                v-model="newFolderName"
                type="text"
                placeholder="文件夹名称"
                class="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
              />
              <input
                v-model="newNoteTags"
                type="text"
                placeholder="标签 (逗号分隔)"
                class="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              />
              <button
                @click="handleCreate"
                :disabled="creating || !newNoteTitle.trim()"
                class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg v-if="creating" class="animate-spin w-4 h-4 inline" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ creating ? '创建中...' : '创建' }}
              </button>
            </div>
          </div>
        </transition>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <LoadingSpinner text="加载笔记中..." />
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
              <button @click="fetchNotes" class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">重试</button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="!loading && !errorMsg && sortedNotes.length === 0"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 p-16"
        >
         <EmptyState
  icon="📝"
  :title="searchQuery ? '没有找到匹配的笔记' : '还没有笔记'"
  :description="searchQuery ? '尝试其他关键词或清除筛选条件' : '点击\'新建笔记\'开始记录你的学习内容，支持AI自动总结'"
/>
        </div>

        <!-- Notes Grid -->
        <div
          v-if="!loading && !errorMsg && sortedNotes.length > 0"
          class="space-y-6"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="note in paginatedNotes"
              :key="note._id || note.id"
              @click="goToDetail(note)"
              class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-all duration-200 group relative"
            >
              <!-- Pin Indicator -->
              <div v-if="note.pinned || note.isPinned" class="absolute top-2 right-2">
                <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                </svg>
              </div>

              <!-- Title -->
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2 pr-6 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ note.title || '无标题' }}
              </h3>

              <!-- Content Preview (150 chars) -->
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                {{ getPreview(note.content) }}
              </p>

              <!-- Tags -->
              <div v-if="note.tags && note.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
                <span
                  v-for="tag in note.tags.slice(0, 4)"
                  :key="tag"
                  class="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                >
                  {{ tag }}
                </span>
                <span v-if="note.tags.length > 4" class="text-xs text-gray-400 dark:text-gray-500">
                  +{{ note.tags.length - 4 }}
                </span>
              </div>

              <!-- Meta: folder & date -->
              <div class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {{ note.folder || note.folderName || '未分类' }}
                </span>
                <span>{{ formatDate(note.updatedAt || note.createdAt) }}</span>
              </div>

              <!-- Hover Actions -->
              <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  @click.stop="handleTogglePin(note)"
                  class="p-1.5 rounded-md text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                  :title="(note.pinned || note.isPinned) ? '取消固定' : '固定'"
                >
                  <svg class="w-4 h-4" :fill="(note.pinned || note.isPinned) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                </button>
                <button
                  @click.stop="handleDeleteClick(note)"
                  class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="删除"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <Pagination
            v-if="totalPages > 1"
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>

        <!-- Delete Confirm Dialog -->
        <ConfirmDialog
          v-if="showDeleteConfirm"
          title="删除笔记"
          :message="`确定要删除笔记“${deletingNote?.title || '未命名'}”吗？此操作不可恢复。`"
          confirm-text="删除"
          cancel-text="取消"
          @confirm="handleDelete"
          @cancel="showDeleteConfirm = false; deletingNote = null"
        />
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { noteAPI } from '@/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Pagination from '@/components/common/Pagination.vue'

const router = useRouter()

const loading = ref(false)
const errorMsg = ref('')
const notes = ref([])
const folders = ref([])
const folderFilter = ref('')
const searchQuery = ref('')
const sortNewest = ref(true)
const showCreateForm = ref(false)
const creating = ref(false)
const newNoteTitle = ref('')
const newNoteContent = ref('')
const newNoteFolder = ref('')
const newNoteTags = ref('')
const newFolderName = ref('')
const showDeleteConfirm = ref(false)
const deletingNote = ref(null)
const togglingPinLoading = ref(false)

// Pagination
const currentPage = ref(1)
const pageSize = 12

const filteredNotes = computed(() => {
  let result = [...notes.value]

  // Folder filter
  if (folderFilter.value) {
    result = result.filter(n =>
      (n.folder === folderFilter.value) || (n.folderName === folderFilter.value)
    )
  }

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }

  return result
})

const sortedNotes = computed(() => {
  const result = [...filteredNotes.value]
  result.sort((a, b) => {
    // Pinned first
    const aPinned = a.pinned || a.isPinned
    const bPinned = b.pinned || b.isPinned
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1

    // Then by date
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return sortNewest.value ? dateB - dateA : dateA - dateB
  })
  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedNotes.value.length / pageSize)))

const paginatedNotes = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedNotes.value.slice(start, start + pageSize)
})

function handlePageChange(page) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function getPreview(content) {
  if (!content) return '暂无内容'
  const plain = content.replace(/<[^>]*>/g, '')
  return plain.length > 150 ? plain.substring(0, 150) + '...' : plain
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toggleSort() {
  sortNewest.value = !sortNewest.value
}

function goToDetail(note) {
  const id = note._id || note.id
  router.push(`/notes/${id}`)
}

async function fetchNotes() {
  loading.value = true
  errorMsg.value = ''

  try {
    const res = await noteAPI.getAll()
    const data = res.data || res
    notes.value = Array.isArray(data) ? data : (data.notes || data.data || [])
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || err?.message || '加载笔记失败'
    console.error('Fetch notes error:', err)
  } finally {
    loading.value = false
  }
}

async function fetchFolders() {
  try {
    const res = await noteAPI.getFolders()
    const data = res.data || res
    folders.value = Array.isArray(data) ? data : ['学习笔记', '论文资料', '读书笔记', '会议记录', '个人日记']
  } catch (err) {
    console.error('Failed to fetch folders:', err)
    folders.value = ['学习笔记', '论文资料', '读书笔记', '会议记录', '个人日记']
  }
}

async function handleCreate() {
  if (!newNoteTitle.value.trim()) return

  creating.value = true

  let folder = newNoteFolder.value
  if (folder === '__new__' && newFolderName.value.trim()) {
    folder = newFolderName.value.trim()
    if (!folders.value.includes(folder)) {
      folders.value.push(folder)
    }
  }

  const tags = newNoteTags.value
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(Boolean)

  try {
    const res = await noteAPI.create({
      title: newNoteTitle.value.trim(),
      content: newNoteContent.value.trim(),
      folder: folder || undefined,
      tags,
      pinned: false
    })

    const newNote = res.data?.note || res.data || {}
    notes.value.unshift({
      ...newNote,
      title: newNote.title || newNoteTitle.value.trim(),
      content: newNote.content || newNoteContent.value.trim(),
      folder: newNote.folder || folder,
      folderName: newNote.folderName || folder,
      tags: newNote.tags || tags,
      pinned: newNote.pinned || false,
      isPinned: newNote.isPinned || false,
      createdAt: newNote.createdAt || new Date().toISOString(),
      updatedAt: newNote.updatedAt || new Date().toISOString()
    })

    // Reset form
    newNoteTitle.value = ''
    newNoteContent.value = ''
    newNoteFolder.value = ''
    newNoteTags.value = ''
    newFolderName.value = ''
    showCreateForm.value = false
  } catch (err) {
    alert(err?.response?.data?.message || err?.message || '创建笔记失败')
  } finally {
    creating.value = false
  }
}

function handleDeleteClick(note) {
  deletingNote.value = note
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingNote.value) return

  try {
    const id = deletingNote.value._id || deletingNote.value.id
    await noteAPI.delete(id)
    notes.value = notes.value.filter(n => (n._id || n.id) !== id)
    showDeleteConfirm.value = false
    deletingNote.value = null
  } catch (err) {
    alert(err?.response?.data?.message || err?.message || '删除失败')
  }
}

async function handleTogglePin(note) {
  togglingPinLoading.value = true

  try {
    const id = note._id || note.id
    const newPinned = !(note.pinned || note.isPinned)
    await noteAPI.update(id, { pinned: newPinned })
    try { await noteAPI.togglePin(id) } catch (_) {}
    note.pinned = newPinned
    note.isPinned = newPinned
  } catch (err) {
    alert(err?.response?.data?.message || err?.message || '操作失败')
  } finally {
    togglingPinLoading.value = false
  }
}

onMounted(() => {
  fetchFolders()
  fetchNotes()
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
  max-height: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 500px;
}
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}
.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>
