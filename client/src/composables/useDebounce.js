import { ref, watch } from 'vue'

export function useDebounce(sourceRef, delay = 300) {
  const debounced = ref(sourceRef.value)
  let timer

  watch(sourceRef, (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = val
    }, delay)
  }, { immediate: true })

  return debounced
}
