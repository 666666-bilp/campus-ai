<template>
  <AppLayout>
    <template #default>
      <div class="max-w-4xl mx-auto h-[calc(100vh-7rem)] flex flex-col animate-fade-in-up">
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 class="text-xl font-bold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              AI 口语陪练
            </h2>
            <p class="text-sm mt-0.5" style="color: var(--color-text-muted);">实时英语对话，多场景模拟练习</p>
          </div>
          <select v-model="scenario" class="input w-auto text-sm">
            <option value="daily">日常对话</option>
            <option value="academic">学术讨论</option>
            <option value="interview">面试英语</option>
            <option value="travel">旅游英语</option>
          </select>
        </div>

        <!-- Chat Area -->
        <div class="card flex-1 flex flex-col overflow-hidden">
          <!-- Messages -->
          <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background: color-mix(in srgb, var(--color-accent) 10%, transparent);">
                  <svg class="w-8 h-8" style="color: var(--color-accent);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <p class="text-lg font-medium tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
                  开始你的英语口语练习吧！
                </p>
                <p class="text-sm mt-1" style="color: var(--color-text-muted);">选择一个场景，然后输入你想说的话</p>
                <button @click="handleNewConversation" class="btn-secondary mt-4 text-xs">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  新对话
                </button>
              </div>
            </div>

            <div v-for="msg in messages" :key="msg._id || msg.id || msg.timestamp" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[80%]">
                <div class="text-xs mb-1 px-1" :class="msg.role === 'user' ? 'text-right' : 'text-left'" style="color: var(--color-text-muted);">
                  {{ msg.role === 'user' ? '你' : 'AI 陪练' }}
                </div>
                <div
                  :class="msg.role === 'user'
                    ? 'rounded-2xl rounded-br-md text-white'
                    : 'rounded-2xl rounded-bl-md'"
                  class="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
                  :style="msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }
                    : { background: 'var(--color-surface-raised)', color: 'var(--color-text)' }"
                >
                  {{ msg.content }}
                </div>
              </div>
            </div>

            <div v-if="sending" class="flex justify-start">
              <div :style="{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }" class="rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                <span class="animate-pulse-soft">AI 正在回复...</span>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="border-t p-4" style="border-color: var(--color-border-light);">
            <div class="flex items-center gap-2">
              <input
                v-model="inputText"
                @keydown.enter="handleSend"
                :disabled="sending"
                class="input flex-1 rounded-xl"
                placeholder="输入英语对话内容..."
                autofocus
              />
              <button
                @click="handleSend"
                :disabled="sending || !inputText.trim()"
                class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-white transition-all duration-200 disabled:opacity-40"
                style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { englishAPI } from '@/api';
import AppLayout from '@/components/layout/AppLayout.vue';

const messagesContainer = ref(null);
const messages = ref([]);
const conversationId = ref(null);
const scenario = ref('daily');
const inputText = ref('');
const sending = ref(false);

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

watch(messages, () => scrollToBottom(), { deep: true });

async function handleSend() {
  const text = inputText.value.trim();
  if (!text || sending.value) return;

  messages.value.push({ role: 'user', content: text, timestamp: new Date().toISOString(), _id: 'u-' + Date.now() });
  inputText.value = '';
  scrollToBottom();

  sending.value = true;
  try {
    if (!conversationId.value) {
      const startRes = await englishAPI.oralStart();
      const startData = startRes.data || startRes;
      conversationId.value = startData.conversationId || startData._id;
    }
    const res = await englishAPI.oralChat({ conversationId: conversationId.value, message: text, scenario: scenario.value });
    const data = res.data || res;
    messages.value.push({ role: 'ai', content: data.reply || data.message || data.content || '', timestamp: new Date().toISOString(), _id: 'a-' + Date.now() });
  } catch (_) {
    messages.value.push({ role: 'ai', content: '抱歉，出了点问题。请重试。', timestamp: new Date().toISOString(), _id: 'e-' + Date.now() });
  } finally {
    sending.value = false;
    scrollToBottom();
  }
}

async function handleNewConversation() {
  messages.value = []; conversationId.value = null; inputText.value = ''; sending.value = false;
  try { await englishAPI.oralStart(); } catch (_) { /* start on send */ }
  scrollToBottom();
}

async function loadHistory() {
  try {
    const res = await englishAPI.oralHistory();
    const data = res.data || res;
    const conversations = data.conversations || data || [];
    if (Array.isArray(conversations) && conversations.length > 0) {
      const latest = conversations[conversations.length - 1];
      conversationId.value = latest.conversationId || latest._id || latest.id;
      if (latest.messages?.length) {
        messages.value = latest.messages.map(m => ({ ...m, _id: m._id || m.id || ('h-' + Math.random()) }));
        scrollToBottom();
      }
    }
  } catch (_) { /* fresh start */ }
}

onMounted(() => loadHistory());
</script>
