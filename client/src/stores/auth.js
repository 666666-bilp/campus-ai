import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, userAPI } from '@/api'
import { setToken, clearToken } from '@/utils/request'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.username || '同学')
  const userAvatar = computed(() => user.value?.profile?.avatar || '')
  const userMajor = computed(() => user.value?.profile?.major || '未设置专业')
  const userEmail = computed(() => user.value?.email || '')
  const userUniversity = computed(() => user.value?.profile?.university || '')

  async function initialize() {
    if (token.value) {
      try {
        const res = await authAPI.getMe()
        user.value = res.data
      } catch {
        clearToken()
        token.value = ''
      }
    }
    initialized.value = true
  }

  async function login(email, password) {
    const res = await authAPI.login({ email, password })
    user.value = res.data.user
    token.value = res.data.token
    setToken(res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res
  }

  async function register(data) {
    const res = await authAPI.register(data)
    user.value = res.data.user
    token.value = res.data.token
    setToken(res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res
  }

  async function logout() {
    try { await authAPI.logout() } catch (_) { /* ignore */ }
    user.value = null
    token.value = ''
    clearToken()
  }

  async function fetchUser() {
    const res = await authAPI.getMe()
    user.value = res.data
  }

  async function updateProfile(data) {
    const res = await userAPI.updateProfile(data)
    user.value = res.data
  }

  return {
    user, token, initialized, isAuthenticated,
    userName, userAvatar, userMajor, userEmail, userUniversity,
    initialize, login, register, logout, fetchUser, updateProfile,
  }
})
