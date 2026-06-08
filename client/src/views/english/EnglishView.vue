<template>
  <AppLayout>
    <template #default>
      <div class="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
        <div>
          <h2 class="text-2xl font-bold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
            外语学习
          </h2>
          <p class="mt-1 text-sm" style="color: var(--color-text-muted);">
            AI 驱动的英语学习工具，提升学术外语能力
          </p>
        </div>

        <!-- Feature Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Bilingual Reading -->
          <div
            @click="toggleSection('bilingual')"
            class="card-hover p-6 group"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent);">
              <svg class="w-6 h-6" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-1 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              文献双语精读
            </h3>
            <p class="text-sm" style="color: var(--color-text-muted);">AI 翻译学术文献，中英对照阅读</p>
            <div class="mt-3 text-xs font-medium" style="color: var(--color-primary);">
              {{ expandedSection === 'bilingual' ? '▲ 收起' : '▼ 展开' }}
            </div>
          </div>

          <!-- Oral Practice -->
          <router-link to="/english/oral"
            class="card-hover p-6 group block">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background: color-mix(in srgb, var(--color-accent) 10%, transparent);">
              <svg class="w-6 h-6" style="color: var(--color-accent);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-1 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              AI 口语陪练
            </h3>
            <p class="text-sm" style="color: var(--color-text-muted);">智能口语对话练习，多场景模拟</p>
            <div class="mt-3 text-xs font-medium" style="color: var(--color-accent);">进入练习 →</div>
          </router-link>

          <!-- CET -->
          <div
            @click="toggleSection('cet')"
            class="card-hover p-6 group"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background: color-mix(in srgb, var(--color-success) 10%, transparent);">
              <svg class="w-6 h-6" style="color: var(--color-success);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-1 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              四六级真题
            </h3>
            <p class="text-sm" style="color: var(--color-text-muted);">真题解析与技巧，AI 辅助备考</p>
            <div class="mt-3 text-xs font-medium" style="color: var(--color-success);">
              {{ expandedSection === 'cet' ? '▲ 收起' : '▼ 展开' }}
            </div>
          </div>
        </div>

        <!-- Bilingual Section -->
        <Transition name="expand">
          <div v-if="expandedSection === 'bilingual'" class="card p-6">
            <h3 class="text-lg font-semibold mb-4 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              文献双语精读
            </h3>
            <div class="mb-4">
              <label class="label">输入文本</label>
              <textarea v-model="bilingualText" class="input min-h-[160px] resize-y" placeholder="请输入需要翻译的学术文本..."></textarea>
            </div>
            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <select v-model="bilingualDirection" class="input w-auto">
                <option value="zh2en">中 → 英</option>
                <option value="en2zh">英 → 中</option>
              </select>
              <button @click="handleBilingualTranslate" :disabled="bilingualLoading || !bilingualText.trim()" class="btn-primary">
                <svg v-if="bilingualLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ bilingualLoading ? '翻译中...' : '开始翻译' }}
              </button>
            </div>
            <div v-if="bilingualResult" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium mb-2" style="color: var(--color-text-secondary);">原文</h4>
                <div class="rounded-lg p-4 h-80 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap" style="background: var(--color-surface-raised); color: var(--color-text);">{{ bilingualResult.original }}</div>
              </div>
              <div>
                <h4 class="text-sm font-medium mb-2" style="color: var(--color-text-secondary);">译文</h4>
                <div class="rounded-lg p-4 h-80 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap" style="background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)); color: var(--color-text);">{{ bilingualResult.translated }}</div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- CET Section -->
        <Transition name="expand">
          <div v-if="expandedSection === 'cet'" class="card p-6">
            <h3 class="text-lg font-semibold mb-4 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              四六级真题解析
            </h3>
            <div class="mb-4">
              <label class="label">真题内容</label>
              <textarea v-model="cetText" class="input min-h-[160px] resize-y" placeholder="请粘贴四六级真题题目..."></textarea>
            </div>
            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <select v-model="cetLevel" class="input w-auto">
                <option value="cet4">四级 (CET-4)</option>
                <option value="cet6">六级 (CET-6)</option>
              </select>
              <button @click="handleCetAnalysis" :disabled="cetLoading || !cetText.trim()" class="btn-primary">
                <svg v-if="cetLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ cetLoading ? '解析中...' : '解析' }}
              </button>
            </div>
            <div v-if="cetResult" class="rounded-lg p-6" style="background: var(--color-surface-raised);">
              <h4 class="text-sm font-semibold mb-3" style="color: var(--color-text);">
                解析结果 ({{ cetLevel === 'cet4' ? '四级' : '六级' }})
              </h4>
              <div class="text-sm leading-relaxed whitespace-pre-wrap" style="color: var(--color-text);">{{ cetResult }}</div>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue';
import { englishAPI } from '@/api';
import AppLayout from '@/components/layout/AppLayout.vue';

const expandedSection = ref(null);

const bilingualText = ref('');
const bilingualDirection = ref('zh2en');
const bilingualLoading = ref(false);
const bilingualResult = ref(null);

const cetText = ref('');
const cetLevel = ref('cet4');
const cetLoading = ref(false);
const cetResult = ref('');

function toggleSection(section) {
  expandedSection.value = expandedSection.value === section ? null : section;
}

async function handleBilingualTranslate() {
  if (!bilingualText.value.trim()) return;
  bilingualLoading.value = true;
  try {
    const res = await englishAPI.bilingualReading({
      text: bilingualText.value.trim(),
      direction: bilingualDirection.value,
    });
    const data = res.data || res;
    bilingualResult.value = {
      original: data.original || bilingualText.value,
      translated: data.translated || data.translation || data.result || '',
    };
  } catch (err) {
    alert('翻译失败：' + (err?.response?.data?.message || err.message));
  } finally { bilingualLoading.value = false; }
}

async function handleCetAnalysis() {
  if (!cetText.value.trim()) return;
  cetLoading.value = true;
  try {
    const res = await englishAPI.cetAnalysis({
      text: cetText.value.trim(),
      level: cetLevel.value,
    });
    const data = res.data || res;
    cetResult.value = data.analysis || data.result || data.message || JSON.stringify(data, null, 2);
  } catch (err) {
    alert('解析失败：' + (err?.response?.data?.message || err.message));
  } finally { cetLoading.value = false; }
}
</script>

<style scoped>
.expand-enter-active { transition: all 0.35s ease-out; }
.expand-leave-active { transition: all 0.25s ease-in; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; overflow: hidden; margin-bottom: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 2000px; }
</style>
