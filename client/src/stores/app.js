import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')
  const sidebarOpen = ref(true)
  const loading = ref(false)
  const notifications = ref([])

  function initTheme() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      theme.value = saved
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.value = 'dark'
    }
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    localStorage.setItem('theme', theme.value)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  function setTheme(t) {
    theme.value = t
    applyTheme()
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setLoading(val) {
    loading.value = val
  }

  function addNotification(notification) {
    const id = Date.now() + Math.random()
    notifications.value.push({ id, ...notification, timestamp: new Date() })
    setTimeout(() => removeNotification(id), 5000)
    return id
  }

  function removeNotification(id) {
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx > -1) notifications.value.splice(idx, 1)
  }

  return {
    theme, sidebarOpen, loading, notifications,
    initTheme, toggleTheme, setTheme, toggleSidebar, setLoading,
    addNotification, removeNotification,
  }
})
