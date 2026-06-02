<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Sidebar (Desktop) -->
    <AppSidebar
      :collapsed="sidebarCollapsed"
      :mobile-open="mobileSidebarOpen"
      @toggle="sidebarCollapsed = !sidebarCollapsed"
      @close-mobile="mobileSidebarOpen = false"
    />

    <!-- Mobile Sidebar Overlay Version -->
    <transition name="slide">
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-y-0 left-0 z-40 lg:hidden"
      >
        <AppSidebar
          :collapsed="false"
          :mobile-open="true"
          @toggle="mobileSidebarOpen = false"
          @close-mobile="mobileSidebarOpen = false"
        />
      </div>
    </transition>

    <!-- Main Content Area -->
    <div
      :class="[
        'flex flex-col min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
      ]"
    >
      <!-- Navbar -->
      <AppNavbar @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" />

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <!-- Footer -->
      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppNavbar from './AppNavbar.vue'
import AppFooter from './AppFooter.vue'

const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
