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
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">🌍 外语学习</h1>
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
      <main class="flex-1 p-6 overflow-y-auto">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">外语学习</h2>

        <!-- Feature Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <!-- Card 1: Bilingual Reading -->
          <div @click="toggleSection('bilingual')"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group">
            <div class="text-4xl mb-3">📖</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">文献双语精读</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">AI翻译学术文献，中英对照阅读</p>
            <div class="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
              {{ expandedSection === 'bilingual' ? '▲ 收起' : '▼ 展开' }}
            </div>
          </div>

          <!-- Card 2: Oral Practice -->
          <router-link to="/english/oral"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group block">
            <div class="text-4xl mb-3">🎤</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">AI口语陪练</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">智能口语对话练习，多场景模拟</p>
            <div class="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">进入练习 →</div>
          </router-link>

          <!-- Card 3: CET -->
          <div @click="toggleSection('cet')"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group">
            <div class="text-4xl mb-3">📝</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">四六级真题</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">真题解析与技巧，AI辅助备考</p>
            <div class="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
              {{ expandedSection === 'cet' ? '▲ 收起' : '▼ 展开' }}
            </div>
          </div>
        </div>

        <!-- Bilingual Reading Section (expandable) -->
        <Transition name="expand">
          <div v-if="expandedSection === 'bilingual'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📖 文献双语精读</h3>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">输入文本</label>
              <textarea v-model="bilingualText"
                class="w-full h-40 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="请输入需要翻译的学术文本..."></textarea>
            </div>

            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <select v-model="bilingualDirection"
                class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="zh2en">中 → 英</option>
                <option value="en2zh">英 → 中</option>
              </select>
              <button @click="handleBilingualTranslate"
                :disabled="bilingualLoading || !bilingualText.trim()"
                class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
                <svg v-if="bilingualLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span v-else>🌐</span>
                {{ bilingualLoading ? '翻译中...' : '开始翻译' }}
              </button>
            </div>

            <!-- Result: Two Columns -->
            <div v-if="bilingualResult" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">原文</h4>
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{{ bilingualResult.original }}</div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">译文</h4>
                <div class="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 h-80 overflow-y-auto text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{{ bilingualResult.translated }}</div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- CET Section (expandable) -->
        <Transition name="expand">
          <div v-if="expandedSection === 'cet'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📝 四六级真题解析</h3>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">真题内容</label>
              <textarea v-model="cetText"
                class="w-full h-40 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="请粘贴四六级真题题目..."></textarea>
            </div>

            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <select v-model="cetLevel"
                class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cet4">四级 (CET-4)</option>
                <option value="cet6">六级 (CET-6)</option>
              </select>
              <button @click="handleCetAnalysis"
                :disabled="cetLoading || !cetText.trim()"
                class="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
                <svg v-if="cetLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <span v-else>🔍</span>
                {{ cetLoading ? '解析中...' : '解析' }}
              </button>
            </div>

            <!-- CET Result -->
            <div v-if="cetResult" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                解析结果 ({{ cetLevel === 'cet4' ? '四级' : '六级' }})
              </h4>
              <div class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{{ cetResult }}</div>
            </div>
          </div>
        </Transition>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { englishAPI } from '@/api'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const sidebarOpen = ref(window.innerWidth >= 1024)
const expandedSection = ref(null)

// Bilingual Reading
const bilingualText = ref('')
const bilingualDirection = ref('zh2en')
const bilingualLoading = ref(false)
const bilingualResult = ref(null)

// CET
const cetText = ref('')
const cetLevel = ref('cet4')
const cetLoading = ref(false)
const cetResult = ref('')

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

function toggleSection(section) {
  expandedSection.value = expandedSection.value === section ? null : section
  if (section === 'bilingual' && expandedSection.value !== 'bilingual') { bilingualResult.value = null }
  if (section === 'cet' && expandedSection.value !== 'cet') { cetResult.value = '' }
}

async function handleBilingualTranslate() {
  if (!bilingualText.value.trim()) return
  bilingualLoading.value = true
  try {
    const res = await englishAPI.bilingualReading({
      text: bilingualText.value.trim(),
      direction: bilingualDirection.value,
    })
    const data = res.data || res
    bilingualResult.value = {
      original: data.original || bilingualText.value,
      translated: data.translated || data.translation || data.result || '',
    }
  } catch (err) {
    alert('翻译失败：' + (err?.response?.data?.message || err.message))
  } finally { bilingualLoading.value = false }
}

async function handleCetAnalysis() {
  if (!cetText.value.trim()) return
  cetLoading.value = true
  try {
    const res = await englishAPI.cetAnalysis({
      text: cetText.value.trim(),
      level: cetLevel.value,
    })
    const data = res.data || res
    cetResult.value = data.analysis || data.result || data.message || JSON.stringify(data, null, 2)
  } catch (err) {
    alert('解析失败：' + (err?.response?.data?.message || err.message))
  } finally { cetLoading.value = false }
}

async function handleLogout() { await authStore.logout(); router.push('/login') }
</script>

<style scoped>
.expand-enter-active { transition: all 0.35s ease-out; }
.expand-leave-active { transition: all 0.25s ease-in; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; overflow: hidden; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 2000px; }
</style>
