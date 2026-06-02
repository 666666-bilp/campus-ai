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
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">🎤 AI口语陪练</h1>
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

      <!-- Chat Content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Messages Area -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- Empty State -->
          <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center text-gray-400 dark:text-gray-500">
              <div class="text-6xl mb-4">🎤</div>
              <p class="text-lg">开始你的英语口语练习吧！</p>
              <p class="text-sm mt-1">选择一个场景，然后输入你想说的话</p>
            </div>
          </div>

          <!-- Messages -->
          <div v-for="msg in messages" :key="msg._id || msg.id || msg.timestamp" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            <div class="max-w-[75%]">
              <!-- Role label -->
              <div class="text-xs mb-1 px-1" :class="msg.role === 'user' ? 'text-right text-blue-600 dark:text-blue-400' : 'text-left text-gray-500 dark:text-gray-400'">
                {{ msg.role === 'user' ? '你' : 'AI 陪练' }}
              </div>
              <!-- Bubble -->
              <div :class="msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md'"
                class="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {{ msg.content }}
              </div>
              <!-- Timestamp -->
              <div class="text-[10px] mt-1 px-1 text-gray-400" :class="msg.role === 'user' ? 'text-right' : 'text-left'">
                {{ formatTime(msg.createdAt || msg.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="sending" class="flex justify-start">
            <div class="max-w-[75%]">
              <div class="text-xs mb-1 px-1 text-gray-500 dark:text-gray-400">AI 陪练</div>
              <div class="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md px-4 py-3">
                <span>AI正在回复</span><span class="dots">...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div class="flex items-center gap-2 mb-2">
            <select v-model="scenario"
              class="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="daily">日常对话</option>
              <option value="academic">学术讨论</option>
              <option value="interview">面试英语</option>
              <option value="travel">旅游英语</option>
            </select>
            <button @click="handleNewConversation"
              class="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              新对话
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="inputText"
              @keydown.enter="handleSend"
              :disabled="sending"
              class="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="输入英语对话内容..."
              autofocus />
            <button @click="handleSend"
              :disabled="sending || !inputText.trim()"
              class="flex-shrink-0 w-10 h-10 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { englishAPI } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const sidebarOpen = ref(window.innerWidth >= 1024)
const messagesContainer = ref(null)

const messages = ref([])
const conversationId = ref(null)
const scenario = ref('daily')
const inputText = ref('')
const sending = ref(false)

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
]

function formatTime(t) { return t ? dayjs(t).format('HH:mm') : '' }

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value
    if (el) { el.scrollTop = el.scrollHeight }
  })
}

watch(messages, () => { scrollToBottom() }, { deep: true })

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  messages.value.push({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
    _id: 'user-' + Date.now(),
  })
  inputText.value = ''
  scrollToBottom()

  sending.value = true
  try {
    if (!conversationId.value) {
      const startRes = await englishAPI.oralStart()
      const startData = startRes.data || startRes
      conversationId.value = startData.conversationId || startData._id
    }

    const res = await englishAPI.oralChat({
      conversationId: conversationId.value,
      message: text,
      scenario: scenario.value,
    })
    const data = res.data || res
    const reply = data.reply || data.message || data.content || ''

    messages.value.push({
      role: 'ai',
      content: reply,
      timestamp: new Date().toISOString(),
      _id: 'ai-' + Date.now(),
    })
  } catch (err) {
    messages.value.push({
      role: 'ai',
      content: '抱歉，出了点问题。请重试。',
      timestamp: new Date().toISOString(),
      _id: 'ai-error-' + Date.now(),
    })
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

async function handleNewConversation() {
  messages.value = []
  conversationId.value = null
  inputText.value = ''
  sending.value = false
  try {
    await englishAPI.oralStart()
  } catch (_) { /* Start on first send if fails */ }
  scrollToBottom()
}

async function loadHistory() {
  try {
    const res = await englishAPI.oralHistory()
    const data = res.data || res
    const conversations = data.conversations || data || []
    if (Array.isArray(conversations) && conversations.length > 0) {
      const latest = conversations[conversations.length - 1]
      if (latest._id || latest.id || latest.conversationId) {
        conversationId.value = latest.conversationId || latest._id || latest.id
      }
      if (latest.messages && latest.messages.length > 0) {
        messages.value = latest.messages.map(m => ({ ...m, _id: m._id || m.id || ('hist-' + Math.random()) }))
        scrollToBottom()
      }
    }
  } catch (_) { /* Start fresh if no history */ }
}

async function handleLogout() { await authStore.logout(); router.push('/login') }

onMounted(() => { loadHistory() })
</script>

<style scoped>
.dots { animation: blink 1.4s infinite; }
@keyframes blink {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0; }
}
</style>
