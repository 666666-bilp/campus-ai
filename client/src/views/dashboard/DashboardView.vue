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
        <button @click="sidebarOpen = !sidebarOpen" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 md:hidden">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
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
      <!-- Content -->
      <main class="flex-1 p-6">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">欢迎回来，{{ authStore.userName }}！</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">{{ today }}</p>
        </div>
        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="card flex items-center gap-4" v-for="stat in stats" :key="stat.label">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" :class="stat.bg">{{ stat.icon }}</div>
            <div><div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</div><div class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</div></div>
          </div>
        </div>
        <!-- Quick Actions -->
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速操作</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <router-link v-for="action in quickActions" :key="action.path" :to="action.path"
            class="card-hover flex flex-col items-center gap-2 p-4 text-center">
            <span class="text-2xl">{{ action.icon }}</span>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ action.label }}</span>
            <span class="text-xs text-gray-400">{{ action.desc }}</span>
          </router-link>
        </div>
        <!-- Recent Papers -->
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">最近论文</h3>
        <div v-if="papers.length === 0 && !paperLoading" class="card text-center py-8 text-gray-400">还没有论文，<router-link to="/paper/create" class="text-blue-600 hover:underline">开始生成</router-link></div>
        <div v-if="paperLoading" class="card text-center py-8 text-gray-400">加载中...</div>
        <div class="space-y-3">
          <div v-for="paper in papers" :key="paper._id" class="card-hover flex items-center justify-between" @click="$router.push(`/paper/${paper._id}`)">
            <div><div class="font-medium text-gray-900 dark:text-white">{{ paper.title }}</div><div class="text-sm text-gray-500 dark:text-gray-400">{{ paper.paperType }} · {{ paper.wordCount }}字</div></div>
            <div class="flex items-center gap-3">
              <span class="badge text-xs" :class="paper.status === 'completed' ? 'badge-green' : paper.status === 'generating' ? 'badge-blue' : 'badge-yellow'">{{ statusMap[paper.status] || paper.status }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(paper.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { paperAPI } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const sidebarOpen = ref(window.innerWidth >= 1024)
const papers = ref([])
const paperLoading = ref(true)
const pageTitle = '工作台'
const statusMap = { draft: '草稿', generating: '生成中', completed: '已完成' }

const today = computed(() => dayjs().format('YYYY年MM月DD日 dddd'))
const stats = [
  { icon: '📄', value: papers.value.length, label: '论文生成', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { icon: '📚', value: 0, label: '文献处理', bg: 'bg-green-100 dark:bg-green-900/30' },
  { icon: '📝', value: 0, label: '云端笔记', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { icon: '🤖', value: 0, label: 'AI调用', bg: 'bg-orange-100 dark:bg-orange-900/30' },
]

const quickActions = [
  { icon: '✍️', label: '生成论文', desc: 'AI全自动', path: '/paper/create' },
  { icon: '📚', label: '上传文献', desc: '智能处理', path: '/literature' },
  { icon: '✨', label: '论文润色', desc: '改写降重', path: '/polish' },
  { icon: '📅', label: '智能课表', desc: '教务导入', path: '/schedule' },
  { icon: '📝', label: '云端笔记', desc: 'AI总结', path: '/notes' },
  { icon: '💻', label: '代码编辑', desc: '在线运行', path: '/code-editor' },
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
]

function formatDate(d) { return d ? dayjs(d).format('MM-DD HH:mm') : '' }

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    const res = await paperAPI.getAll({ limit: 5 })
    papers.value = res.data || []
    stats[0].value = res.total || papers.value.length
  } catch (_) { /* ignore */ }
  finally { paperLoading.value = false }
})
</script>
