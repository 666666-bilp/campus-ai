<template>
  <aside
    :class="[
      'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-60'
    ]"
  >
    <!-- Logo Area -->
    <div class="flex items-center h-14 px-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="text-xl flex-shrink-0">🎓</span>
        <span
          v-show="!collapsed"
          class="text-base font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap"
        >
          学术AI助手
        </span>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :title="collapsed ? item.label : ''"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap overflow-hidden',
          $route.path === item.to
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
        ]"
      >
        <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
        <span
          v-show="!collapsed"
          class="truncate"
        >{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Collapse Toggle -->
    <button
      class="flex items-center justify-center h-10 border-t border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
      @click="$emit('toggle')"
    >
      <svg
        :class="['w-5 h-5 transition-transform duration-300', collapsed ? 'rotate-180' : '']"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    </button>
  </aside>

  <!-- Mobile Backdrop Overlay -->
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        @click="$emit('close-mobile')"
      />
    </transition>
  </Teleport>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  mobileOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle', 'close-mobile'])

const navItems = [
  { to: '/dashboard', icon: '📊', label: '工作台' },
  { to: '/literature', icon: '📚', label: '文献处理' },
  { to: '/paper/create', icon: '✍️', label: '论文生成' },
  { to: '/paper/history', icon: '📝', label: '论文历史' },
  { to: '/polish', icon: '✨', label: '论文润色' },
  { to: '/latex', icon: '📐', label: 'LaTeX' },
  { to: '/schedule', icon: '📅', label: '智能课表' },
  { to: '/notes', icon: '📔', label: '云端笔记' },
  { to: '/exam', icon: '📋', label: '考点题库' },
  { to: '/experiment', icon: '🔬', label: '实验报告' },
  { to: '/code-editor', icon: '💻', label: '代码编辑' },
  { to: '/english', icon: '🌍', label: '外语学习' },
  { to: '/guide', icon: '📖', label: '使用指南' }
]
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}
.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: #4b5563;
}
</style>
