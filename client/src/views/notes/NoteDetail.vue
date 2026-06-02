<template>
  <AppLayout>
    <template #default>
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <LoadingSpinner text="加载笔记中..." />
        </div>

        <!-- 404 State -->
        <div
          v-else-if="notFound"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center"
        >
          <div class="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">笔记不存在</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">该笔记可能已被删除或链接无效</p>
          <router-link
            to="/notes"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回笔记列表
          </router-link>
        </div>

        <!-- Main Content -->
        <div v-else class="space-y-4">
          <!-- Back Button & Status -->
          <div class="flex items-center gap-3 flex-wrap">
            <router-link
              to="/notes"
              class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </router-link>

            <span class="text-gray-300 dark:text-gray-600">|</span>

            <!-- Folder Badge -->
            <span v-if="note.folder || note.folderName" class="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
              {{ note.folder || note.folderName }}
            </span>

            <!-- Save Status -->
            <span v-if="saved" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              已保存
            </span>
            <span v-else-if="saving" class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              保存中...
            </span>

            <span v-if="lastSaved" class="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              上次保存: {{ formatTime(lastSaved) }}
            </span>
          </div>

          <!-- Title -->
          <input
            v-model="note.title"
            @input="onContentChange"
            placeholder="笔记标题..."
            class="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
          />

          <!-- Toolbar -->
          <div class="flex items-center gap-2 flex-wrap">
            <button
              @click="handleSave"
              :disabled="saving"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              保存
            </button>

            <button
              @click="handleAISummarize"
              :disabled="aiLoading"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg v-if="aiLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ aiLoading ? '总结中...' : 'AI总结' }}
            </button>

            <button
              @click="handleTogglePin"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
              :class="(note.pinned || note.isPinned)
                ? 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                : 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              <svg class="w-4 h-4" :fill="(note.pinned || note.isPinned) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
              {{ (note.pinned || note.isPinned) ? '已固定' : '固定' }}
            </button>

            <button
              @click="showDeleteConfirm = true"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>

          <!-- Folder & Tags Row -->
          <div class="flex items-center gap-3 flex-wrap">
            <!-- Folder Selector -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 dark:text-gray-500">文件夹:</span>
              <select
                v-model="note.folder"
                @change="onContentChange"
                class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">未分类</option>
                <option v-for="f in folders" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>

            <!-- Tags Input -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">标签:</span>
              <span
                v-for="(tag, i) in (note.tags || [])"
                :key="i"
                class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {{ tag }}
                <button @click="removeTag(i)" class="hover:text-red-500 transition-colors">&times;</button>
              </span>
              <input
                v-model="tagInput"
                @keydown.enter="addTag"
                @keydown.backspace="handleTagBackspace"
                placeholder="添加标签..."
                class="w-20 text-xs bg-transparent border-none outline-none text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600"
              />
            </div>
          </div>

          <!-- Content Textarea -->
          <textarea
            ref="contentRef"
            v-model="note.content"
            @input="onContentChange"
            placeholder="在此输入笔记内容..."
            class="w-full min-h-96 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 font-mono text-sm leading-relaxed resize-y outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 transition-colors placeholder-gray-300 dark:placeholder-gray-600"
          ></textarea>

          <!-- AI Summary Section (Collapsible) -->
          <div
            v-if="aiSummary"
            class="border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 overflow-hidden"
          >
            <button
              @click="summaryOpen = !summaryOpen"
              class="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 智能总结
              </span>
              <svg
                :class="summaryOpen ? 'rotate-180' : ''"
                class="w-4 h-4 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-show="summaryOpen" class="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {{ aiSummary }}
            </div>
          </div>
        </div>

        <!-- Delete Confirm Dialog -->
        <Teleport to="body">
          <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/40" @click="showDeleteConfirm = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">确认删除</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                确定要删除笔记 <strong>"{{ note.title || '未命名笔记' }}"</strong> 吗？此操作不可恢复。
              </p>
              <div class="flex justify-end gap-2">
                <button
                  @click="showDeleteConfirm = false"
                  class="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  @click="handleDelete"
                  :disabled="deleting"
                  class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ deleting ? '删除中...' : '确认删除' }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { noteAPI } from '@/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()

const note = reactive({
  title: '',
  content: '',
  pinned: false,
  isPinned: false,
  folder: '',
  folderName: '',
  tags: []
})

const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const saved = ref(false)
const lastSaved = ref(null)
const aiLoading = ref(false)
const aiSummary = ref('')
const summaryOpen = ref(true)
const tagInput = ref('')
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const contentRef = ref(null)
const folders = ref(['学习笔记', '论文资料', '读书笔记', '会议记录', '个人日记'])

let autoSaveTimer = null

async function fetchNote() {
  loading.value = true
  notFound.value = false

  try {
    const id = route.params.id
    if (!id) {
      notFound.value = true
      loading.value = false
      return
    }

    const res = await noteAPI.getOne(id)
    const data = res.data || res

    note.title = data.title || ''
    note.content = data.content || ''
    note.pinned = data.pinned || data.isPinned || false
    note.isPinned = data.isPinned || data.pinned || false
    note.folder = data.folder || data.folderName || ''
    note.folderName = data.folderName || data.folder || ''
    note.tags = Array.isArray(data.tags) ? data.tags : []
    aiSummary.value = data.aiSummary || data.summary || ''
    lastSaved.value = data.updatedAt || data.createdAt || null
  } catch (err) {
    if (err?.response?.status === 404) {
      notFound.value = true
    } else {
      console.error('Failed to fetch note:', err)
    }
  } finally {
    loading.value = false
  }
}

function onContentChange() {
  saved.value = false
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    handleSave()
  }, 2000)
}

async function handleSave() {
  if (saving.value) return

  saving.value = true

  try {
    const id = route.params.id
    const payload = {
      title: note.title,
      content: note.content,
      folder: note.folder || note.folderName,
      tags: note.tags
    }

    await noteAPI.update(id, payload)
    saved.value = true
    lastSaved.value = new Date().toISOString()
    setTimeout(() => { saved.value = false }, 3000)
  } catch (err) {
    console.error('Failed to save note:', err)
  } finally {
    saving.value = false
  }
}

async function handleAISummarize() {
  if (aiLoading.value) return

  aiLoading.value = true

  try {
    const id = route.params.id
    const res = await noteAPI.summarize(id)
    const data = res.data || res
    aiSummary.value = data.summary || data.aiSummary || data.text || data
    summaryOpen.value = true
  } catch (err) {
    console.error('Failed to summarize:', err)
    alert(err?.response?.data?.message || err?.message || 'AI总结失败，请稍后重试')
  } finally {
    aiLoading.value = false
  }
}

async function handleTogglePin() {
  try {
    const id = route.params.id
    await noteAPI.togglePin(id)
    note.pinned = !note.pinned
    note.isPinned = !note.isPinned
  } catch (err) {
    // Fallback: try update
    try {
      const id = route.params.id
      const newPinned = !(note.pinned || note.isPinned)
      await noteAPI.update(id, { pinned: newPinned })
      note.pinned = newPinned
      note.isPinned = newPinned
    } catch (e2) {
      console.error('Failed to toggle pin:', e2)
    }
  }
}

async function handleDelete() {
  deleting.value = true

  try {
    const id = route.params.id
    await noteAPI.delete(id)
    router.replace('/notes')
  } catch (err) {
    console.error('Failed to delete note:', err)
    alert(err?.response?.data?.message || err?.message || '删除失败')
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

function addTag() {
  const t = tagInput.value.trim()
  if (t && !note.tags.includes(t)) {
    note.tags.push(t)
    onContentChange()
  }
  tagInput.value = ''
}

function removeTag(index) {
  note.tags.splice(index, 1)
  onContentChange()
}

function handleTagBackspace() {
  if (tagInput.value === '' && note.tags.length > 0) {
    note.tags.pop()
    onContentChange()
  }
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  fetchNote()
  fetchFolders()
})

onUnmounted(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})

async function fetchFolders() {
  try {
    const res = await noteAPI.getFolders()
    const data = res.data || res
    if (Array.isArray(data)) folders.value = data
  } catch (_) {
    // Use defaults
  }
}
</script>

<style scoped>
.min-h-96 {
  min-height: 24rem;
}
</style>
