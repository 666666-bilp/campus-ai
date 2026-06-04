<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-5xl mb-4">🎓</div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">创建账号</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">加入学术AI助手，开启智能学术之旅</p>
      </div>
      <div class="card animate-slide-up">
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">{{ errorMsg }}</div>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="label">用户名</label>
            <input v-model="form.username" type="text" class="input" placeholder="3-20位字符" required minlength="3" maxlength="20" />
          </div>
          <div>
            <label class="label">邮箱</label>
            <input v-model="form.email" type="email" class="input" placeholder="your@email.com" required />
          </div>
          <div>
            <label class="label">密码</label>
            <input v-model="form.password" type="password" class="input" placeholder="至少6位" required minlength="6" />
            <div v-if="form.password" class="mt-1 flex gap-1">
              <div class="h-1 flex-1 rounded" :class="pwdStrength >= 1 ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-600'"></div>
              <div class="h-1 flex-1 rounded" :class="pwdStrength >= 2 ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-600'"></div>
              <div class="h-1 flex-1 rounded" :class="pwdStrength >= 3 ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'"></div>
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ pwdStrengthText }}</p>
          </div>
          <div>
            <label class="label">确认密码</label>
            <input v-model="form.confirmPassword" type="password" class="input" placeholder="再次输入密码" required />
          </div>
          <button type="submit" :disabled="loading" class="btn-primary w-full py-3 text-base">
            <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            {{ loading ? '注册中...' : '注 册' }}
          </button>
        </form>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          已有账号？<router-link to="/login" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const errorMsg = ref('')

const pwdStrength = computed(() => {
  const p = form.password; if (!p) return 0
  let s = 0; if (p.length >= 6) s++; if (p.length >= 10) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.min(s, 3)
})
const pwdStrengthText = computed(() => ['', '弱', '中等', '强'][pwdStrength.value] || '')

async function handleRegister() {
  errorMsg.value = ''
  if (form.username.length < 3 || form.username.length > 20) { errorMsg.value = '用户名需要3-20位字符'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errorMsg.value = '请输入有效的邮箱地址'; return }
  if (form.password.length < 6) { errorMsg.value = '密码至少需要6位'; return }
  if (form.password !== form.confirmPassword) { errorMsg.value = '两次输入的密码不一致'; return }
  loading.value = true
  try {
    await authStore.register({ username: form.username, email: form.email, password: form.password })
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err?.message || '注册失败，请稍后重试'
  } finally { loading.value = false }
}
</script>
