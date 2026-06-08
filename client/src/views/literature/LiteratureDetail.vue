<template>
  <AppLayout>
    <template #default>
      <div class="max-w-4xl mx-auto space-y-6">
        <div v-if="loading" class="card py-12 text-center">
          <LoadingSpinner text="加载中..." />
        </div>
        <div v-else-if="!doc" class="card py-12 text-center">
          <p style="color: var(--color-text-muted);">文献不存在</p>
          <router-link to="/literature" class="btn-secondary btn-sm mt-4">返回列表</router-link>
        </div>
        <template v-else>
          <!-- Header -->
          <div class="card p-6 animate-fade-in-up">
            <div class="flex items-center gap-2 mb-2">
              <router-link to="/literature" class="text-sm hover:underline" style="color: var(--color-text-muted);">← 返回</router-link>
              <h2 class="text-xl font-bold truncate tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
                {{ doc.title || doc.fileName }}
              </h2>
            </div>
            <div class="flex flex-wrap gap-2 text-sm">
              <span style="color: var(--color-text-secondary);">{{ doc.fileName }}</span>
              <span class="badge-muted text-xs">{{ doc.fileType }}</span>
              <span style="color: var(--color-text-secondary);">{{ formatSize(doc.fileSize) }}</span>
              <span style="color: var(--color-text-muted);">{{ fd(doc.createdAt) }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :style="doc.status === 'completed' ? { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' } : { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }">
                {{ doc.status === 'completed' ? '已处理' : '待处理' }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            <button @click="extractText" :disabled="extracting" class="btn-primary btn-sm">
              {{ extracting ? '提取中...' : '提取文本' }}
            </button>
            <button @click="summarize" :disabled="summarizing" class="btn-secondary btn-sm">
              {{ summarizing ? '分析中...' : '智能摘要' }}
            </button>
            <button @click="genRefs" :disabled="refLoading" class="btn-secondary btn-sm">
              {{ refLoading ? '生成中...' : '生成参考文献' }}
            </button>
            <button @click="deleteDoc" class="btn-danger btn-sm">删除</button>
          </div>

          <!-- Extracted Text -->
          <div v-if="doc.extractedText" class="card p-6 animate-fade-in-up">
            <h3 class="font-semibold mb-3 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">提取文本</h3>
            <pre class="text-sm whitespace-pre-wrap rounded-lg p-4 max-h-96 overflow-y-auto leading-relaxed" style="background: var(--color-surface-raised); color: var(--color-text);">{{ doc.extractedText.slice(0, 5000) }}{{ doc.extractedText.length > 5000 ? '...' : '' }}</pre>
          </div>

          <!-- Summary -->
          <div v-if="doc.summary" class="card p-6 animate-fade-in-up">
            <h3 class="font-semibold mb-2 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">智能摘要</h3>
            <p class="leading-relaxed" style="color: var(--color-text-secondary);">{{ doc.summary }}</p>
            <div class="flex gap-1 mt-3" v-if="doc.keywords?.length">
              <span v-for="k in doc.keywords" :key="k" class="badge-primary text-xs">{{ k }}</span>
            </div>
          </div>

          <!-- References -->
          <div v-if="doc.references?.length" class="card p-6 animate-fade-in-up">
            <h3 class="font-semibold mb-3 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">参考文献</h3>
            <div v-for="fmt in ['gb7714', 'ieee', 'cnki']" :key="fmt" class="mb-4">
              <span class="badge-primary text-xs mb-2">{{ fmt.toUpperCase() }}</span>
              <div v-for="(r, i) in doc.references.filter(r => r.format === fmt)" :key="i"
                class="text-sm py-2 border-b last:border-0" style="border-color: var(--color-border-light); color: var(--color-text);">
                {{ r.text }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { documentAPI } from '@/api';
import dayjs from 'dayjs';
import AppLayout from '@/components/layout/AppLayout.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const doc = ref(null);
const loading = ref(true);
const extracting = ref(false);
const summarizing = ref(false);
const refLoading = ref(false);

const fd = d => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '';
const formatSize = s => {
  if (!s) return '0B';
  if (s < 1024) return s + 'B';
  if (s < 1024 * 1024) return (s / 1024).toFixed(1) + 'KB';
  return (s / (1024 * 1024)).toFixed(1) + 'MB';
};

async function fetchDoc() {
  loading.value = true;
  try { const res = await documentAPI.getOne(route.params.id); doc.value = res.data; }
  catch (_) { doc.value = null; }
  finally { loading.value = false; }
}

async function extractText() {
  extracting.value = true;
  try { const fd = new FormData(); const res = await documentAPI.extractText(route.params.id, fd); doc.value = res.data; }
  catch (e) { alert(e?.message || '提取失败'); }
  finally { extracting.value = false; }
}

async function summarize() {
  summarizing.value = true;
  try { const res = await documentAPI.summarize(route.params.id); doc.value = res.data; }
  catch (e) { alert(e?.message || '摘要失败'); }
  finally { summarizing.value = false; }
}

async function genRefs() {
  refLoading.value = true;
  try { const res = await documentAPI.generateReferences(route.params.id); doc.value = res.data; }
  catch (e) { alert(e?.message || '生成失败'); }
  finally { refLoading.value = false; }
}

async function deleteDoc() {
  if (!confirm('确认删除？')) return;
  try { await documentAPI.delete(route.params.id); router.push('/literature'); } catch (_) { /* ignore */ }
}

onMounted(fetchDoc);
</script>
