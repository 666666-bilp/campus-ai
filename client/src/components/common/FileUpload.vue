<template>
  <div class="w-full">
    <!-- Drop Zone -->
    <div
      :class="[
        'relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer text-center',
        isDragging
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        errorMessage ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : ''
      ]"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <!-- Hidden File Input -->
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Upload Icon -->
      <svg
        v-if="!selectedFileName"
        class="mx-auto w-12 h-12 mb-3 text-gray-400 dark:text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <!-- Selected File Info -->
      <div v-if="selectedFileName" class="mb-3">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span class="truncate max-w-[300px]">{{ selectedFileName }}</span>
          <button
            class="ml-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
            @click.stop="clearSelection"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Instruction Text -->
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <template v-if="!selectedFileName">
          点击或拖拽文件到此处上传
        </template>
        <template v-else>
          点击重新选择文件
        </template>
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        支持格式: {{ accept }}，单文件最大 {{ maxSize }}MB
      </p>
    </div>

    <!-- Error Message -->
    <p
      v-if="errorMessage"
      class="mt-2 text-sm text-red-500 dark:text-red-400"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  accept: {
    type: String,
    default: '.pdf,.doc,.docx,.txt'
  },
  maxSize: {
    type: Number,
    default: 50
  },
  multiple: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['files-selected'])

const fileInputRef = ref(null)
const isDragging = ref(false)
const errorMessage = ref('')
const selectedFileName = ref('')
const selectedFiles = ref(null)

const maxSizeBytes = props.maxSize * 1024 * 1024

function validateFiles(files) {
  errorMessage.value = ''

  const allowedTypes = props.accept.split(',').map(t => t.trim().toLowerCase())

  for (const file of files) {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    const isAllowed = allowedTypes.some(t => t === ext || t === '.*')
    if (!isAllowed) {
      errorMessage.value = `不支持的文件类型: ${file.name}`
      return false
    }

    if (file.size > maxSizeBytes) {
      errorMessage.value = `文件 ${file.name} 超过 ${props.maxSize}MB 大小限制`
      return false
    }
  }

  return true
}

function triggerFileInput() {
  fileInputRef.value.click()
}

function handleFileChange(e) {
  const files = e.target.files
  if (!files || files.length === 0) return
  processFiles(files)
}

function handleDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (!files || files.length === 0) return
  processFiles(files)
}

function processFiles(files) {
  if (!validateFiles(files)) return

  selectedFiles.value = files
  if (files.length === 1) {
    selectedFileName.value = files[0].name
  } else {
    selectedFileName.value = `已选择 ${files.length} 个文件`
  }

  emit('files-selected', files)
}

function clearSelection() {
  selectedFiles.value = null
  selectedFileName.value = ''
  errorMessage.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>
