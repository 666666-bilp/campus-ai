<template>
  <Teleport to="body">
    <transition name="confirm">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="$emit('cancel')"
        />

        <!-- Dialog Card -->
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
          <!-- Title -->
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {{ title }}
          </h3>

          <!-- Message -->
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {{ message }}
          </p>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              @click="$emit('cancel')"
            >
              {{ cancelText }}
            </button>
            <button
              :class="[
                'px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors',
                buttonColorClass
              ]"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['danger', 'warning', 'info'].includes(v)
  }
})

defineEmits(['confirm', 'cancel'])

const buttonColorClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-500 hover:bg-red-600'
    case 'warning':
      return 'bg-yellow-500 hover:bg-yellow-600'
    case 'info':
    default:
      return 'bg-blue-500 hover:bg-blue-600'
  }
})
</script>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.2s ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-active .relative {
  transition: transform 0.2s ease;
}
.confirm-enter-from .relative {
  transform: scale(0.95);
}
</style>
