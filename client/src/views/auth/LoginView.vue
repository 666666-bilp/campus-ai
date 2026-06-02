<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-5xl mb-4">🎓</div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">学术AI助手</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">登录你的学术空间</p>
      </div>
      <div class="card animate-slide-up">
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {{ errorMsg }}
        </div>
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="label">邮箱</label>
            <input v-model="form.email" type="email" class="input" placeholder="your@email.com" required autocomplete="email" />
          </div>
          <div>
            <label class="label">密码</label>
            <div class="relative">
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" class="input pr-10" placeholder="输入密码" required autocomplete="current-password" />
              <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {{ showPwd ? '🙈' : '👁' }}
              </button>
            </div>
          </div>
          <button type="submit" :disabled="loading" class="btn-primary w-full py-3 text-base">
            <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          还没有账号？<router-link to="/register" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">立即注册</router-link>
        </p>
      </div>
      <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
        大学生学术AI助手 · 让学术更智能
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const form = reactive({ email: '', password: '' })
const showPwd = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  if (!form.email || !form.password) { errorMsg.value = '请填写邮箱和密码'; return }
  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    errorMsg.value = err?.message || '登录失败，请检查邮箱和密码'
  } finally {
    loading.value = false
  }
}
</script>
