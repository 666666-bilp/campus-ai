import { ref } from 'vue'

export function useStream() {
  const isStreaming = ref(false)
  const content = ref('')
  const error = ref(null)
  let eventSource = null

  function startStream(url) {
    isStreaming.value = true
    content.value = ''
    error.value = null

    const token = localStorage.getItem('token')
    const fullUrl = url.includes('?') ? `${url}&token=${token}` : `${url}?token=${token}`
    eventSource = new EventSource(fullUrl)

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        stopStream()
        return
      }
      try {
        const parsed = JSON.parse(event.data)
        if (parsed.chunk) content.value += parsed.chunk
      } catch {
        content.value += event.data
      }
    }

    eventSource.onerror = () => {
      error.value = '连接中断，请重试'
      stopStream()
    }
  }

  function stopStream() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    isStreaming.value = false
  }

  return { isStreaming, content, error, startStream, stopStream }
}
