<template>
  <AppLayout>
    <template #default>
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Loading -->
        <div v-if="loading" class="card py-12 text-center">
          <LoadingSpinner text="加载中..." />
        </div>

        <!-- Not Found -->
        <div v-else-if="!paper" class="card py-12 text-center">
          <p style="color: var(--color-text-muted);">论文不存在</p>
          <router-link to="/paper/history" class="btn-secondary btn-sm mt-4">返回列表</router-link>
        </div>

        <!-- Paper Content -->
        <template v-else>
          <!-- Header Card -->
          <div class="card p-6 animate-fade-in-up">
            <div class="flex items-center gap-2 mb-3">
              <router-link to="/paper/history" class="text-sm hover:underline" style="color: var(--color-text-muted);">
                ← 返回
              </router-link>
              <h1 class="text-xl font-bold truncate tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
                {{ paper.title }}
              </h1>
            </div>
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <span class="badge-primary text-xs">{{ paper.paperType }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :style="paper.status === 'completed' ? { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' } : paper.status === 'generating' ? { background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' } : { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }">
                {{ statusMap[paper.status] }}
              </span>
              <span class="text-xs" style="color: var(--color-text-muted);">{{ paper.major }} · {{ paper.wordCount }} 字</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button @click="generateFull" :disabled="genLoading" class="btn-primary btn-sm">
                <span v-if="genLoading" class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ genLoading ? '生成中...' : '生成全文' }}
              </button>
              <button @click="exportPaper('docx')" class="btn-primary btn-sm">导出 Word</button>
              <button @click="exportPaper('txt')" class="btn-secondary btn-sm">导出 TXT</button>
              <button @click="exportPaper('md')" class="btn-secondary btn-sm">导出 MD</button>
              <button @click="streamGenerate" :disabled="streamLoading" class="btn-outline btn-sm">流式生成</button>
              <button @click="delPaper" class="btn-danger btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                删除
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex gap-2">
            <button v-for="t in tabs" :key="t" @click="activeTab = t"
              :class="activeTab === t ? 'btn-primary btn-sm' : 'btn-outline btn-sm'">{{ t }}</button>
          </div>

          <!-- Outline Tab -->
          <div v-if="activeTab === '大纲'" class="card p-6 animate-fade-in-up">
            <div v-if="paper.content?.body?.length" class="space-y-3">
              <h3 class="font-semibold mb-4 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">论文大纲</h3>
              <div v-for="(s, i) in paper.content.body" :key="i" class="border-l-[3px] pl-4" style="border-color: var(--color-primary);">
                <div class="font-medium" style="color: var(--color-text);">{{ s.sectionTitle }}</div>
                <div v-if="s.subsections?.length" class="ml-4 mt-1 space-y-1">
                  <div v-for="(ss, j) in s.subsections" :key="j" class="text-sm" style="color: var(--color-text-secondary);">{{ ss.title }}</div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <p style="color: var(--color-text-muted);">请先生成大纲</p>
            </div>
          </div>

          <!-- Content Tab -->
          <div v-if="activeTab === '正文'" class="card p-6 animate-fade-in-up">
            <div v-if="paper.fullText" class="prose-custom prose-sm" v-html="renderedContent"></div>
            <div v-else class="text-center py-8">
              <p style="color: var(--color-text-muted);">请先生成全文</p>
            </div>
          </div>

          <!-- Preview Tab -->
          <div v-if="activeTab === '预览'" class="card p-6 animate-fade-in-up">
            <div v-if="paper.content?.abstract" class="mb-6 p-4 rounded-lg" style="background: var(--color-surface-raised);">
              <h3 class="font-semibold mb-2 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">摘要</h3>
              <p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">{{ paper.content.abstract }}</p>
              <div class="flex gap-1 mt-2" v-if="paper.content.keywords">
                <span v-for="kw in paper.content.keywords" :key="kw" class="badge-primary text-xs">{{ kw }}</span>
              </div>
            </div>
            <div v-if="paper.content?.introduction" class="mb-4">
              <h3 class="font-semibold mb-2 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">绪论</h3>
              <div class="text-sm leading-relaxed whitespace-pre-wrap" style="color: var(--color-text-secondary);">{{ paper.content.introduction }}</div>
            </div>
            <div v-if="paper.content?.conclusion">
              <h3 class="font-semibold mb-2 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">结论</h3>
              <div class="text-sm leading-relaxed whitespace-pre-wrap" style="color: var(--color-text-secondary);">{{ paper.content.conclusion }}</div>
            </div>
          </div>

          <!-- References Tab -->
          <div v-if="activeTab === '参考文献'" class="card p-6 animate-fade-in-up">
            <div v-if="paper.content?.references?.length">
              <div v-for="(ref, i) in paper.content.references" :key="i"
                class="py-3 border-b last:border-0" style="border-color: var(--color-border-light);">
                <span class="badge-muted text-xs mr-2">{{ ref.format?.toUpperCase() }}</span>
                <span class="text-sm" style="color: var(--color-text);">{{ ref.text }}</span>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <p style="color: var(--color-text-muted);">暂无参考文献</p>
            </div>
          </div>

          <!-- Stream Content -->
          <div v-if="streamContent" class="card mt-4 p-6 animate-fade-in-up">
            <h3 class="font-semibold mb-3 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">实时生成中...</h3>
            <div class="rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap"
              style="background: var(--color-text); color: var(--color-bg);">
              {{ streamContent }}<span v-if="streamLoading" class="animate-pulse">▌</span>
            </div>
          </div>
        </template>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { paperAPI } from '@/api';
import { marked } from 'marked';
import AppLayout from '@/components/layout/AppLayout.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const paper = ref(null);
const loading = ref(true);
const activeTab = ref('大纲');
const genLoading = ref(false);
const streamLoading = ref(false);
const streamContent = ref('');
const tabs = ['大纲', '正文', '预览', '参考文献'];
const statusMap = { draft: '草稿', generating: '生成中', completed: '已完成' };

const renderedContent = computed(() => paper.value?.fullText ? marked(paper.value.fullText) : '');

async function fetchPaper() {
  loading.value = true;
  try { const res = await paperAPI.getOne(route.params.id); paper.value = res.data; } catch (_) { paper.value = null; }
  finally { loading.value = false; }
}

async function generateFull() {
  genLoading.value = true;
  try { await paperAPI.generateFull(route.params.id); await fetchPaper(); activeTab.value = '正文'; }
  catch (e) { alert(e?.message || '生成失败'); }
  finally { genLoading.value = false; }
}

async function streamGenerate() {
  streamLoading.value = true; streamContent.value = '';
  try {
    const es = paperAPI.streamGenerate(route.params.id);
    es.onmessage = e => {
      if (e.data === '[DONE]') { streamLoading.value = false; es.close(); fetchPaper(); }
      else { try { const d = JSON.parse(e.data); streamContent.value += d.chunk || ''; } catch { streamContent.value += e.data; } }
    };
    es.onerror = () => { streamLoading.value = false; es.close(); };
  } catch (_) { streamLoading.value = false; }
}

async function exportPaper(fmt) {
  try {
    const res = await paperAPI.export(route.params.id, fmt);
    const url = window.URL.createObjectURL(new Blob([res]));
    const a = document.createElement('a'); a.href = url; a.download = `${paper.value?.title || '论文'}.${fmt}`; a.click();
    URL.revokeObjectURL(url);
  } catch (e) { alert('导出失败'); }
}

async function delPaper() {
  if (!confirm('确认删除？')) return;
  try { await paperAPI.delete(route.params.id); router.push('/paper/history'); } catch (_) { /* ignore */ }
}

onMounted(async () => { await fetchPaper(); if (route.query.generate === '1') generateFull(); });
</script>
