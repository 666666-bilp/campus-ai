<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <!-- Sidebar -->
    <aside
      :class="sidebarOpen ? 'w-56' : 'w-16'"
      class="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-200 flex flex-col shadow-sm"
    >
      <div class="h-14 flex items-center px-3 border-b border-gray-200 dark:border-gray-700">
        <span v-if="sidebarOpen" class="text-lg font-bold text-blue-600 dark:text-blue-400 truncate">学术AI助手</span>
        <button @click="sidebarOpen = !sidebarOpen" class="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto py-2">
        <router-link v-for="link in navLinks" :key="link.path" :to="link.path"
          class="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-sm transition-colors"
          :class="$route.path === link.path ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
        >
          <span class="text-base flex-shrink-0">{{ link.icon }}</span>
          <span v-if="sidebarOpen" class="truncate">{{ link.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main -->
    <div :class="sidebarOpen ? 'ml-56' : 'ml-16'" class="flex-1 transition-all duration-200">
      <!-- Navbar -->
      <header class="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 sticky top-0 z-20">
        <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <h2 class="text-base font-semibold text-gray-800 dark:text-white flex-1 truncate">个人中心</h2>
        <button @click="toggleTheme" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" title="切换主题">
          <svg v-if="theme === 'light'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </button>
        <router-link to="/profile" class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium" title="个人中心">
          {{ userInitials }}
        </router-link>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
        <span class="ml-3 text-gray-500 dark:text-gray-400">加载中...</span>
      </div>

      <!-- Content -->
      <div v-else class="p-4 max-w-5xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left column: Profile card -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center shadow-sm">
              <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                {{ userInitials }}
              </div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ profileData.username || authUserName }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">{{ profileData.email || authUserEmail }}</p>
              <p v-if="memberSince" class="text-xs text-gray-400 dark:text-gray-500 mb-4">
                加入于 {{ dayjs(memberSince).format('YYYY年MM月DD日') }}
              </p>
              <div v-if="profileData.university" class="text-xs text-gray-400 dark:text-gray-500 mb-4">
                {{ profileData.university }}{{ profileData.major ? ' / ' + profileData.major : '' }}
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div class="text-center rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
                  <div class="text-lg font-bold text-gray-900 dark:text-white">{{ stats.papersGenerated || 0 }}</div>
                  <div class="text-xs text-gray-400 dark:text-gray-500">论文</div>
                </div>
                <div class="text-center rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
                  <div class="text-lg font-bold text-gray-900 dark:text-white">{{ formatNum(stats.wordsProcessed || 0) }}</div>
                  <div class="text-xs text-gray-400 dark:text-gray-500">字数</div>
                </div>
                <div class="text-center rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
                  <div class="text-lg font-bold text-gray-900 dark:text-white">{{ stats.loginCount || 0 }}</div>
                  <div class="text-xs text-gray-400 dark:text-gray-500">登录</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right column: Settings -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Profile Edit Form -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-5">编辑资料</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">用户名</label>
                  <input v-model="editForm.username" type="text" placeholder="你的用户名"
                    class="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">学校</label>
                  <input v-model="editForm.school" type="text" placeholder="你的大学"
                    class="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">专业</label>
                  <input v-model="editForm.major" type="text" placeholder="你的专业"
                    class="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">年级</label>
                  <select v-model="editForm.grade"
                    class="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">请选择</option>
                    <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">个人简介</label>
                  <textarea v-model="editForm.bio" rows="4" placeholder="简单介绍一下自己..."
                    class="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y placeholder-gray-400 dark:placeholder-gray-500"
                  ></textarea>
                </div>
                <div class="flex items-center gap-3">
                  <button @click="saveProfile" :disabled="savingProfile"
                    class="px-6 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <svg v-if="savingProfile" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {{ savingProfile ? '保存中...' : '保存修改' }}
                  </button>
                  <span v-if="profileSaved" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    已保存
                  </span>
                </div>
              </div>
            </div>

            <!-- Theme Toggle -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">外观设置</h3>
              <div class="flex items-center justify-between py-2">
                <div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">主题模式</span>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">切换亮色/暗色主题外观</p>
                </div>
                <button @click="toggleTheme"
                  class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200"
                  :class="theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <span :class="theme === 'dark' ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-6 shadow-sm">
              <h3 class="text-base font-semibold text-red-600 dark:text-red-400 mb-4">危险操作</h3>

              <!-- Change Password -->
              <div class="pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
                <button @click="showPassword = !showPassword"
                  class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <svg :class="showPassword ? 'rotate-90' : ''" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  修改密码
                </button>
                <div v-if="showPassword" class="mt-3 space-y-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">当前密码</label>
                    <input v-model="passwordForm.oldPassword" type="password" placeholder="输入当前密码"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">新密码</label>
                    <input v-model="passwordForm.newPassword" type="password" placeholder="输入新密码"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">确认新密码</label>
                    <input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div v-if="passwordError" class="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ passwordError }}</div>
                  <div v-if="passwordSuccess" class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">{{ passwordSuccess }}</div>
                  <button @click="changePassword" :disabled="changingPassword"
                    class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >{{ changingPassword ? '修改中...' : '修改密码' }}</button>
                </div>
              </div>

              <!-- Delete Account -->
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  删除账号将会永久移除你的所有数据，包括论文、文献、笔记等，此操作不可恢复。
                </p>

                <!-- Step 0: Delete button -->
                <template v-if="deleteStep === 0">
                  <button @click="deleteStep = 1"
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    删除账号
                  </button>
                </template>

                <!-- Step 1: First confirm -->
                <template v-if="deleteStep === 1">
                  <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div class="flex items-start gap-2 mb-3">
                      <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                      <p class="text-sm text-red-600 dark:text-red-400 font-medium">
                        确认要删除账号吗？此操作不可撤销！
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button @click="deleteStep = 2"
                        class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">我确定要删除</button>
                      <button @click="deleteStep = 0"
                        class="px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">取消</button>
                    </div>
                  </div>
                </template>

                <!-- Step 2: Type DELETE -->
                <template v-if="deleteStep === 2">
                  <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p class="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
                      最后一步：在下方输入 <code class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 rounded text-xs font-mono text-red-600 dark:text-red-400">DELETE</code> 以确认删除
                    </p>
                    <input v-model="deleteConfirmText" type="text" placeholder="DELETE"
                      class="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-400 dark:placeholder-gray-500 mb-3"
                    />
                    <div class="flex items-center gap-2">
                      <button @click="deleteAccount"
                        :disabled="deleteConfirmText !== 'DELETE' || deleting"
                        class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg v-if="deleting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        {{ deleting ? '删除中...' : '确认删除账号' }}
                      </button>
                      <button @click="deleteStep = 0; deleteConfirmText = ''"
                        class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">取消</button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userAPI, authAPI } from '@/api'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const { theme, toggleTheme } = appStore
const sidebarOpen = ref(true)
const userInitials = computed(() => {
  const name = editForm.username || authUserName.value || '用户'
  return name.slice(0, 2).toUpperCase()
})

const navLinks = [
  { icon: '\u{1F4CA}', label: '工作台', path: '/dashboard' },
  { icon: '\u{1F4DA}', label: '文献', path: '/literature' },
  { icon: '\u{270D}\u{FE0F}', label: '论文生成', path: '/paper/create' },
  { icon: '\u{1F4DD}', label: '论文历史', path: '/paper/history' },
  { icon: '\u{2728}', label: '润色', path: '/polish' },
  { icon: '\u{1F4D0}', label: 'LaTeX', path: '/latex' },
  { icon: '\u{1F4C5}', label: '课表', path: '/schedule' },
  { icon: '\u{1F4D4}', label: '笔记', path: '/notes' },
  { icon: '\u{1F4CB}', label: '题库', path: '/exam' },
  { icon: '\u{1F52C}', label: '实验', path: '/experiment' },
  { icon: '\u{1F4BB}', label: '代码', path: '/code-editor' },
  { icon: '\u{1F30D}', label: '外语', path: '/english' },
]

const authUserName = computed(() => authStore.userName || '')
const authUserEmail = computed(() => authStore.userEmail || '')

const loading = ref(true)
const profileData = reactive({})
const stats = reactive({
  papersGenerated: 0,
  wordsProcessed: 0,
  loginCount: 0,
})
const memberSince = ref('')

const editForm = reactive({
  username: '',
  school: '',
  major: '',
  grade: '',
  bio: '',
})

const savingProfile = ref(false)
const profileSaved = ref(false)

const grades = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士']

const showPassword = ref(false)
const changingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const deleteStep = ref(0)
const deleteConfirmText = ref('')
const deleting = ref(false)

function formatNum(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

async function fetchData() {
  loading.value = true
  try {
    const [profileRes, statsRes] = await Promise.all([
      userAPI.getProfile().catch(() => ({ data: {} })),
      userAPI.getStats().catch(() => ({ data: {} })),
    ])

    const pd = profileRes.data || {}
    profileData.username = pd.username || authUserName.value
    profileData.email = pd.email || authUserEmail.value
    profileData.university = pd.university || pd.profile?.university || authStore.userUniversity || ''
    profileData.major = pd.major || pd.profile?.major || authStore.userMajor || ''
    memberSince.value = pd.createdAt || authStore.user?.createdAt || ''

    editForm.username = profileData.username
    editForm.school = pd.school || pd.profile?.school || pd.profile?.university || authStore.userUniversity || ''
    editForm.major = pd.major || pd.profile?.major || authStore.userMajor || ''
    editForm.grade = pd.grade || pd.profile?.grade || ''
    editForm.bio = pd.bio || pd.profile?.bio || ''

    const sd = statsRes.data || {}
    stats.papersGenerated = sd.papersGenerated || sd.papers || 0
    stats.wordsProcessed = sd.wordsProcessed || sd.words || 0
    stats.loginCount = sd.loginCount || sd.logins || 0
    memberSince.value = memberSince.value || sd.createdAt || ''
  } catch (err) {
    console.error('Failed to fetch profile data:', err)
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  savingProfile.value = true
  profileSaved.value = false
  try {
    await userAPI.updateProfile({
      username: editForm.username,
      school: editForm.school,
      major: editForm.major,
      grade: editForm.grade,
      bio: editForm.bio,
    })
    await authStore.fetchUser()
    profileSaved.value = true
    setTimeout(() => { profileSaved.value = false }, 3000)
  } catch (err) {
    console.error('Failed to save profile:', err)
    alert(err.response?.data?.message || '保存失败')
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!passwordForm.oldPassword) {
    passwordError.value = '请输入当前密码'
    return
  }
  if (!passwordForm.newPassword) {
    passwordError.value = '请输入新密码'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    passwordError.value = '新密码长度不能少于6位'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }

  changingPassword.value = true
  try {
    await authAPI.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordSuccess.value = '密码修改成功'
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    setTimeout(() => {
      showPassword.value = false
      passwordSuccess.value = ''
    }, 1500)
  } catch (err) {
    passwordError.value = err.response?.data?.message || '密码修改失败，请检查当前密码是否正确'
  } finally {
    changingPassword.value = false
  }
}

async function deleteAccount() {
  if (deleteConfirmText.value !== 'DELETE') return
  deleting.value = true
  try {
    await userAPI.deleteAccount()
    await authStore.logout()
    router.push('/login')
  } catch (err) {
    console.error('Failed to delete account:', err)
    alert(err.response?.data?.message || '账号删除失败')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
