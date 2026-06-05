<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <aside :class="['fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col', sidebarOpen ? 'w-56' : 'w-16']">
      <div class="h-14 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <span class="text-xl font-bold text-blue-600 dark:text-blue-400" v-if="sidebarOpen">🎓 学术AI</span>
        <span class="text-xl" v-else>🎓</span>
      </div>
      <nav class="flex-1 overflow-y-auto py-2">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path"
          class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          :class="$route.path === item.path ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'">
          <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
          <span v-if="sidebarOpen" class="truncate">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 truncate" v-if="sidebarOpen">
        {{ authStore.userName }}
      </div>
    </aside>

    <!-- Main -->
    <div :class="['flex-1 flex flex-col min-h-screen transition-all duration-300', sidebarOpen ? 'ml-56' : 'ml-16']">
      <!-- Navbar -->
      <header class="sticky top-0 z-30 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
        <button @click="sidebarOpen = !sidebarOpen" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">💻 代码编辑</h1>
        <div class="flex-1"></div>
        <button @click="appStore.toggleTheme()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
          <span v-if="appStore.theme === 'light'">🌙</span><span v-else>☀️</span>
        </button>
        <div class="relative group">
          <button class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">{{ authStore.userName?.charAt(0)?.toUpperCase() }}</div>
            <span class="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">{{ authStore.userName }}</span>
          </button>
          <div class="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block">
            <router-link to="/profile" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">个人中心</router-link>
            <button @click="handleLogout" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">退出登录</button>
          </div>
        </div>
      </header>

      <!-- Content: Two-column layout -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar: Snippet List -->
        <aside class="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <div class="p-3 border-b border-gray-200 dark:border-gray-700">
            <button @click="newSnippet"
              class="w-full py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              + 新建代码
            </button>
          </div>
          <!-- Language Filter Tabs -->
          <div class="p-2 flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
            <button v-for="lang in languageFilters" :key="lang.value" @click="activeFilter = lang.value"
              class="px-2 py-1 text-xs rounded-md transition-colors"
              :class="activeFilter === lang.value ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'">
              {{ lang.label }}
            </button>
          </div>
          <!-- Snippet List -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="snipsLoading" class="p-6 text-center text-sm text-gray-400 dark:text-gray-500">加载中...</div>
            <div v-else-if="filteredSnippets.length === 0" class="p-6 text-center text-sm text-gray-400 dark:text-gray-500">暂无代码片段</div>
            <div v-for="snippet in filteredSnippets" :key="snippet._id"
              @click="selectSnippet(snippet)"
              class="p-3 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              :class="selected?._id === snippet._id ? 'bg-blue-50 dark:bg-blue-900/10' : ''">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ snippet.title || '未命名' }}</span>
                <button @click.stop="deleteSnippet(snippet._id)"
                  class="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 transition-colors" title="删除">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded" :class="languageBadgeClass(snippet.language)">
                  {{ snippet.language || 'text' }}
                </span>
                <span class="text-[10px] text-gray-400">{{ formatDate(snippet.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right: Editor Area -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Empty State -->
          <div v-if="!selected" class="flex items-center justify-center h-full">
            <div class="text-center text-gray-400 dark:text-gray-500">
              <div class="text-6xl mb-4">💻</div>
              <p class="text-lg">选择一个代码片段开始编辑</p>
              <p class="text-sm mt-1">或点击"新建代码"创建新的代码片段</p>
            </div>
          </div>

          <!-- Editor -->
          <template v-else>
            <!-- Title & Language -->
            <div class="flex items-center gap-3 mb-4">
              <input v-model="editTitle"
                class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="代码标题" />
              <select v-model="editLanguage"
                class="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="" disabled>选择语言</option>
                <option v-for="lang in languageOptions" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
              </select>
            </div>

            <!-- Code Textarea -->
            <textarea v-model="editCode"
              class="w-full min-h-[400px] bg-gray-900 dark:bg-black text-green-400 font-mono text-sm p-4 rounded-lg resize-y border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="在此编写代码..." spellcheck="false"></textarea>

            <!-- Toolbar -->
            <div class="flex items-center gap-2 mt-4 flex-wrap">
              <button @click="handleSave"
                :disabled="saving"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
                <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span v-else>💾</span>
                {{ saving ? '保存中...' : '保存' }}
              </button>
              <button @click="handleAddComments"
                :disabled="addingComments"
                class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
                <svg v-if="addingComments" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span v-else>🤖</span>
                {{ addingComments ? 'AI注释中...' : 'AI注释' }}
              </button>
              <button @click="handleFormat"
                :disabled="formatting"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
                <svg v-if="formatting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span v-else>🧹</span>
                {{ formatting ? '格式化中...' : '格式化' }}
              </button>
              <button @click="handleShare"
                :disabled="sharing"
                class="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
                <svg v-if="sharing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span v-else>🔗</span>
                {{ sharing ? '分享中...' : '分享' }}
              </button>
            </div>

            <!-- Run Section -->
            <div class="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">▶ 运行/预览</h3>
              <template v-if="isHtmlOrCss">
                <button @click="runPreview"
                  class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors mb-3">
                  预览 HTML
                </button>
                <iframe v-if="previewSrc" :srcdoc="previewSrc"
                  class="w-full h-[400px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white"
                  sandbox="allow-scripts allow-same-origin"></iframe>
              </template>
              <template v-else>
                <p class="text-sm text-gray-400 dark:text-gray-500">当前语言为 {{ editLanguage || '未选择' }}，仅 HTML/CSS 支持在线预览。</p>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <Teleport to="body">
      <div v-if="shareModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="shareModalOpen = false">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">分享代码</h3>
            <button @click="shareModalOpen = false" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div v-if="shareUrl" class="space-y-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">分享链接：</p>
            <div class="flex items-center gap-2">
              <input :value="shareUrl" readonly
                class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-text select-all" />
              <button @click="copyShareUrl"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1">
                <span v-if="copied">✓</span>
                <span v-else>📋</span>
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
          <div v-else class="text-sm text-gray-400 text-center py-4">正在生成分享链接...</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { codeAPI } from '@/api'
import { useClipboard } from '@/composables/useClipboard'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const { copied, copy } = useClipboard()

const sidebarOpen = ref(window.innerWidth >= 1024)

// Snippets
const snippets = ref([])
const snipsLoading = ref(true)
const activeFilter = ref('all')

// Editor
const selected = ref(null)
const editTitle = ref('')
const editLanguage = ref('')
const editCode = ref('')
const saving = ref(false)
const addingComments = ref(false)
const formatting = ref(false)
const sharing = ref(false)

// Preview
const previewSrc = ref('')
const isHtmlOrCss = computed(() => {
  const lang = editLanguage.value.toLowerCase()
  return lang === 'html' || lang === 'css'
})

// Share
const shareModalOpen = ref(false)
const shareUrl = ref('')

const languageFilters = [
  { label: '全部', value: 'all' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'JS', value: 'javascript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
]

const languageOptions = [
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'SQL', value: 'sql' },
  { label: 'Bash', value: 'bash' },
  { label: 'Markdown', value: 'markdown' },
  { label: '其他', value: 'other' },
]

const navItems = [
  { icon: '📊', label: '工作台', path: '/dashboard' },
  { icon: '📚', label: '文献处理', path: '/literature' },
  { icon: '✍️', label: '论文生成', path: '/paper/create' },
  { icon: '📝', label: '论文历史', path: '/paper/history' },
  { icon: '✨', label: '论文润色', path: '/polish' },
  { icon: '📐', label: 'LaTeX', path: '/latex' },
  { icon: '📅', label: '智能课表', path: '/schedule' },
  { icon: '📔', label: '云端笔记', path: '/notes' },
  { icon: '📋', label: '考点题库', path: '/exam' },
  { icon: '🔬', label: '实验报告', path: '/experiment' },
  { icon: '💻', label: '代码编辑', path: '/code-editor' },
  { icon: '🌍', label: '外语学习', path: '/english' },
  { icon: '📖', label: '使用指南', path: '/guide' },
]

const filteredSnippets = computed(() => {
  if (activeFilter.value === 'all') return snippets.value
  return snippets.value.filter(s => s.language === activeFilter.value)
})

function languageBadgeClass(lang) {
  const map = {
    javascript: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    typescript: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    python: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    java: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    c: 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-300',
    cpp: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    html: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    css: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
    go: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
    rust: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    sql: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
  }
  return map[lang] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
}

function formatDate(d) { return d ? dayjs(d).format('MM-DD HH:mm') : '' }

function newSnippet() {
  selected.value = { _id: null, title: '', language: '', code: '' }
  editTitle.value = ''
  editLanguage.value = ''
  editCode.value = ''
  previewSrc.value = ''
  shareModalOpen.value = false
  shareUrl.value = ''
}

function selectSnippet(snippet) {
  selected.value = snippet
  editTitle.value = snippet.title || ''
  editLanguage.value = snippet.language || ''
  editCode.value = snippet.code || ''
  previewSrc.value = ''
  shareModalOpen.value = false
  shareUrl.value = ''
}

async function handleSave() {
  if (!editTitle.value.trim()) { alert('请输入代码标题'); return }
  saving.value = true
  try {
    const payload = { title: editTitle.value.trim(), language: editLanguage.value, code: editCode.value }
    if (selected.value?._id) {
      const res = await codeAPI.update(selected.value._id, payload)
      const updated = res.data?.snippet || res.data || res
      Object.assign(selected.value, updated)
    } else {
      const res = await codeAPI.save(payload)
      const created = res.data?.snippet || res.data || res
      selected.value = created
    }
    await fetchSnippets()
  } catch (err) {
    alert('保存失败：' + (err?.response?.data?.message || err.message))
  } finally { saving.value = false }
}

async function handleAddComments() {
  if (!selected.value?._id) { alert('请先保存代码片段'); return }
  addingComments.value = true
  try {
    const res = await codeAPI.addComments(selected.value._id)
    const data = res.data?.snippet || res.data || res
    if (data.code) { editCode.value = data.code; if (selected.value) selected.value.code = data.code }
  } catch (err) {
    alert('AI注释失败：' + (err?.response?.data?.message || err.message))
  } finally { addingComments.value = false }
}

async function handleFormat() {
  if (!selected.value?._id) { alert('请先保存代码片段'); return }
  formatting.value = true
  try {
    const res = await codeAPI.format(selected.value._id)
    const data = res.data?.snippet || res.data || res
    if (data.code) { editCode.value = data.code; if (selected.value) selected.value.code = data.code }
  } catch (err) {
    alert('格式化失败：' + (err?.response?.data?.message || err.message))
  } finally { formatting.value = false }
}

async function handleShare() {
  if (!selected.value?._id) { alert('请先保存代码片段'); return }
  sharing.value = true
  try {
    const res = await codeAPI.share(selected.value._id)
    const data = res.data || res
    shareUrl.value = data.shareUrl || data.shareLink || data.url || `${window.location.origin}/code/public/${selected.value._id}`
    shareModalOpen.value = true
  } catch (err) {
    alert('分享失败：' + (err?.response?.data?.message || err.message))
  } finally { sharing.value = false }
}

function copyShareUrl() { copy(shareUrl.value) }

function runPreview() { previewSrc.value = editCode.value }

async function deleteSnippet(id) {
  if (!confirm('确定删除此代码片段吗？')) return
  try {
    await codeAPI.delete(id)
    if (selected.value?._id === id) { newSnippet() }
    await fetchSnippets()
  } catch (err) { alert('删除失败：' + (err?.response?.data?.message || err.message)) }
}

async function fetchSnippets() {
  snipsLoading.value = true
  try {
    const res = await codeAPI.getAll()
    snippets.value = res.data?.snippets || res.data?.list || res.data || []
  } catch (_) { snippets.value = [] }
  finally { snipsLoading.value = false }
}

async function handleLogout() { await authStore.logout(); router.push('/login') }

onMounted(() => { fetchSnippets() })
</script>
