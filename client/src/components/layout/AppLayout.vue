<template>
  <div class="min-h-screen" style="background-color: var(--color-bg); color: var(--color-text);">
    <!-- Desktop Sidebar -->
    <div class="hidden lg:block">
      <AppSidebar
        :collapsed="sidebarCollapsed"
        :mobile-open="false"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
        @close-mobile="mobileSidebarOpen = false"
      />
    </div>

    <!-- Mobile Sidebar -->
    <transition name="slide">
      <div v-if="mobileSidebarOpen" class="fixed inset-y-0 left-0 z-40 lg:hidden">
        <AppSidebar
          :collapsed="false"
          :mobile-open="true"
          @toggle="mobileSidebarOpen = false"
          @close-mobile="mobileSidebarOpen = false"
        />
      </div>
    </transition>

    <!-- Main Content -->
    <div
      :class="[
        'flex flex-col min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
      ]"
    >
      <AppNavbar @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen" />

      <main class="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <slot />
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppSidebar from './AppSidebar.vue';
import AppNavbar from './AppNavbar.vue';
import AppFooter from './AppFooter.vue';

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
