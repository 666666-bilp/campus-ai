<template>
  <header
    class="sticky top-0 z-50 h-14 flex items-center justify-between px-4 border-b glass"
  >
    <!-- Left Section -->
    <div class="flex items-center gap-3">
      <button
        class="lg:hidden p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] transition-colors"
        @click="$emit('toggle-sidebar')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 class="text-base font-semibold text-[var(--color-text)] whitespace-nowrap tracking-tight" style="font-family: var(--font-display);">
        学术AI助手
      </h1>
    </div>

    <!-- Right Section -->
    <div class="flex items-center gap-1.5">
      <button
        class="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] transition-colors"
        @click="appStore.toggleTheme()"
        :title="appStore.theme === 'dark' ? '切换亮色模式' : '切换暗色模式'"
      >
        <svg v-if="appStore.theme === 'dark'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <div class="relative" ref="dropdownRef">
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
          @click="dropdownOpen = !dropdownOpen"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
          >
            {{ authStore.userName.charAt(0).toUpperCase() }}
          </div>
          <span class="hidden sm:inline max-w-[100px] truncate">{{ authStore.userName }}</span>
          <svg :class="['w-4 h-4 hidden sm:block transition-transform duration-200', dropdownOpen ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <transition name="dropdown">
          <div
            v-if="dropdownOpen"
            class="absolute right-0 mt-1.5 w-44 rounded-[var(--radius-lg)] shadow-soft-lg border border-[var(--color-border-light)] py-1 z-50"
            style="background: var(--color-surface);"
          >
            <router-link
              to="/profile"
              class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
              @click="dropdownOpen = false"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              个人中心
            </router-link>
            <div class="my-1 border-t border-[var(--color-border-light)]" />
            <button
              class="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)] transition-colors"
              @click="handleLogout"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

defineEmits(['toggle-sidebar']);

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const dropdownRef = ref(null);
const dropdownOpen = ref(false);

function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false;
  }
}

async function handleLogout() {
  dropdownOpen.value = false;
  await authStore.logout();
  router.push('/login');
}

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
