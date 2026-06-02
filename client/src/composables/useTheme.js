import { ref, watchEffect } from 'vue'

export function useTheme() {
  const isDark = ref(document.documentElement.classList.contains('dark'))

  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  function setDark(val) {
    isDark.value = val
    document.documentElement.classList.toggle('dark', val)
    localStorage.setItem('theme', val ? 'dark' : 'light')
  }

  watchEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true)
    }
  })

  return { isDark, toggle, setDark }
}
