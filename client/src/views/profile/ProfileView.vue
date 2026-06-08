<template>
  <AppLayout>
    <template #default>
      <!-- Loading -->
      <div v-if="loading" class="card py-12 text-center">
        <LoadingSpinner text="加载中..." />
      </div>

      <!-- Content -->
      <div v-else class="max-w-5xl mx-auto">
        <h2 class="text-2xl font-bold mb-6 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">个人中心</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left column: Profile card -->
          <div class="lg:col-span-1">
            <div class="card p-6 text-center">
              <div class="w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg" style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));">
                {{ userInitials }}
              </div>
              <h2 class="text-xl font-bold mb-1" style="color: var(--color-text);">{{ profileData.username || authUserName }}</h2>
              <p class="text-sm mb-1" style="color: var(--color-text-secondary);">{{ profileData.email || authUserEmail }}</p>
              <p v-if="memberSince" class="text-xs mb-4" style="color: var(--color-text-muted);">
                加入于 {{ dayjs(memberSince).format('YYYY年MM月DD日') }}
              </p>
              <div v-if="profileData.university" class="text-xs mb-4" style="color: var(--color-text-muted);">
                {{ profileData.university }}{{ profileData.major ? ' / ' + profileData.major : '' }}
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-3 pt-4 border-t" style="border-color: var(--color-border-light);">
                <div class="text-center rounded-lg p-2.5" style="background: var(--color-surface-raised);">
                  <div class="text-lg font-bold" style="color: var(--color-text);">{{ stats.papersGenerated || 0 }}</div>
                  <div class="text-xs" style="color: var(--color-text-muted);">论文</div>
                </div>
                <div class="text-center rounded-lg p-2.5" style="background: var(--color-surface-raised);">
                  <div class="text-lg font-bold" style="color: var(--color-text);">{{ formatNum(stats.wordsProcessed || 0) }}</div>
                  <div class="text-xs" style="color: var(--color-text-muted);">字数</div>
                </div>
                <div class="text-center rounded-lg p-2.5" style="background: var(--color-surface-raised);">
                  <div class="text-lg font-bold" style="color: var(--color-text);">{{ stats.loginCount || 0 }}</div>
                  <div class="text-xs" style="color: var(--color-text-muted);">登录</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right column: Settings -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Profile Edit Form -->
            <div class="card p-6">
              <h3 class="text-lg font-semibold mb-5 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">编辑资料</h3>
              <div class="space-y-4">
                <div>
                  <label class="label">用户名</label>
                  <input v-model="editForm.username" type="text" placeholder="你的用户名" class="input" />
                </div>
                <div>
                  <label class="label">学校</label>
                  <input v-model="editForm.school" type="text" placeholder="你的大学" class="input" />
                </div>
                <div>
                  <label class="label">专业</label>
                  <input v-model="editForm.major" type="text" placeholder="你的专业" class="input" />
                </div>
                <div>
                  <label class="label">年级</label>
                  <select v-model="editForm.grade" class="input">
                    <option value="">请选择</option>
                    <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">个人简介</label>
                  <textarea v-model="editForm.bio" rows="4" placeholder="简单介绍一下自己..." class="input resize-y"></textarea>
                </div>
                <div class="flex items-center gap-3">
                  <button @click="saveProfile" :disabled="savingProfile" class="btn-primary">
                    <svg v-if="savingProfile" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {{ savingProfile ? '保存中...' : '保存修改' }}
                  </button>
                  <span v-if="profileSaved" class="text-xs flex items-center gap-1" style="color: var(--color-success);">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    已保存
                  </span>
                </div>
              </div>
            </div>

            <!-- Theme Toggle -->
            <div class="card p-6">
              <h3 class="text-lg font-semibold mb-4 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">外观设置</h3>
              <div class="flex items-center justify-between py-2">
                <div>
                  <span class="text-sm font-medium" style="color: var(--color-text);">主题模式</span>
                  <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">切换亮色/暗色主题外观</p>
                </div>
                <button @click="toggleTheme"
                  class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200"
                  :style="theme === 'dark' ? { background: 'var(--color-primary)' } : { background: 'var(--color-border)' }"
                >
                  <span :class="theme === 'dark' ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="card p-6" style="border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);">
              <h3 class="text-lg font-semibold mb-4 tracking-tight" style="color: var(--color-danger); font-family: var(--font-display);">危险操作</h3>

              <!-- Change Password -->
              <div class="pb-4 mb-4 border-b" style="border-color: var(--color-border-light);">
                <button @click="showPassword = !showPassword"
                  class="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-80" style="color: var(--color-text);"
                >
                  <svg :class="showPassword ? 'rotate-90' : ''" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  修改密码
                </button>
                <div v-if="showPassword" class="mt-3 space-y-3 p-4 rounded-lg border" style="background: var(--color-surface-raised); border-color: var(--color-border);">
                  <div>
                    <label class="block text-xs mb-1" style="color: var(--color-text-muted);">当前密码</label>
                    <input v-model="passwordForm.oldPassword" type="password" placeholder="输入当前密码" class="input" />
                  </div>
                  <div>
                    <label class="block text-xs mb-1" style="color: var(--color-text-muted);">新密码</label>
                    <input v-model="passwordForm.newPassword" type="password" placeholder="输入新密码" class="input" />
                  </div>
                  <div>
                    <label class="block text-xs mb-1" style="color: var(--color-text-muted);">确认新密码</label>
                    <input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码" class="input" />
                  </div>
                  <div v-if="passwordError" class="text-xs p-2 rounded" style="color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 15%, transparent);">{{ passwordError }}</div>
                  <div v-if="passwordSuccess" class="text-xs p-2 rounded" style="color: var(--color-success); background: color-mix(in srgb, var(--color-success) 15%, transparent);">{{ passwordSuccess }}</div>
                  <button @click="changePassword" :disabled="changingPassword" class="btn-primary btn-sm">{{ changingPassword ? '修改中...' : '修改密码' }}</button>
                </div>
              </div>

              <!-- Delete Account -->
              <div>
                <p class="text-sm mb-3" style="color: var(--color-text-secondary);">
                  删除账号将会永久移除你的所有数据，包括论文、文献、笔记等，此操作不可恢复。
                </p>

                <template v-if="deleteStep === 0">
                  <button @click="deleteStep = 1" class="btn-danger btn-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    删除账号
                  </button>
                </template>

                <template v-if="deleteStep === 1">
                  <div class="p-4 rounded-lg border" style="background: color-mix(in srgb, var(--color-danger) 10%, transparent); border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);">
                    <div class="flex items-start gap-2 mb-3">
                      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                      <p class="text-sm font-medium" style="color: var(--color-danger);">确认要删除账号吗？此操作不可撤销！</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button @click="deleteStep = 2" class="btn-danger btn-sm">我确定要删除</button>
                      <button @click="deleteStep = 0" class="btn-secondary btn-sm">取消</button>
                    </div>
                  </div>
                </template>

                <template v-if="deleteStep === 2">
                  <div class="p-4 rounded-lg border" style="background: color-mix(in srgb, var(--color-danger) 10%, transparent); border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);">
                    <p class="text-sm font-medium mb-3" style="color: var(--color-danger);">
                      最后一步：在下方输入 <code class="px-1.5 py-0.5 rounded text-xs font-mono" style="background: color-mix(in srgb, var(--color-danger) 20%, transparent);">DELETE</code> 以确认删除
                    </p>
                    <input v-model="deleteConfirmText" type="text" placeholder="DELETE" class="input mb-3" />
                    <div class="flex items-center gap-2">
                      <button @click="deleteAccount" :disabled="deleteConfirmText !== 'DELETE' || deleting" class="btn-danger btn-sm">
                        <svg v-if="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        {{ deleting ? '删除中...' : '确认删除账号' }}
                      </button>
                      <button @click="deleteStep = 0; deleteConfirmText = ''" class="btn-secondary btn-sm">取消</button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userAPI, authAPI } from '@/api'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const { theme, toggleTheme } = appStore
const userInitials = computed(() => {
  const name = editForm.username || authUserName.value || '用户'
  return name.slice(0, 2).toUpperCase()
})

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
