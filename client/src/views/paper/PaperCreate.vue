<template>
  <AppLayout>
    <template #default>
      <div class="max-w-3xl mx-auto space-y-6">
        <h2 class="text-2xl font-bold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
          论文生成
        </h2>

        <div v-if="!createdPaper" class="card p-6 animate-fade-in-up">
          <h3 class="text-lg font-semibold mb-6 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
            创建新论文
          </h3>
          <form @submit.prevent="createPaper" class="space-y-5">
            <div>
              <label class="label">论文标题 <span style="color: var(--color-danger);">*</span></label>
              <input v-model="form.title" class="input" placeholder="输入论文标题" required />
            </div>
            <div>
              <label class="label">所属专业 <span style="color: var(--color-danger);">*</span></label>
              <input v-model="form.major" class="input" placeholder="如：计算机科学与技术" required />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">论文类型</label>
                <select v-model="form.paperType" class="input">
                  <option value="课程论文">课程论文</option>
                  <option value="毕业论文">毕业论文</option>
                  <option value="开题报告">开题报告</option>
                  <option value="文献综述">文献综述</option>
                </select>
              </div>
              <div>
                <label class="label">目标字数</label>
                <input v-model.number="form.wordCount" type="number" class="input" min="1000" max="50000" />
              </div>
            </div>
            <button type="submit" :disabled="creating" class="btn-primary w-full py-3">
              <span v-if="creating" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              {{ creating ? '创建中...' : '创建并生成大纲' }}
            </button>
          </form>
        </div>

        <div v-if="createdPaper && outline" class="animate-fade-in-up space-y-6">
          <div class="card p-6">
            <h2 class="text-xl font-bold mb-2 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              {{ outline.title || form.title }}
            </h2>
            <div class="flex gap-2">
              <span class="badge-primary">{{ form.paperType }}</span>
              <span class="badge-muted">{{ form.wordCount }} 字</span>
            </div>
          </div>
          <div class="card p-6">
            <h3 class="font-semibold mb-4 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              论文大纲
            </h3>
            <div class="space-y-3">
              <div v-for="(ch, i) in (outline.chapters || outline.sections || [])" :key="i" class="border-l-[3px] pl-4" style="border-color: var(--color-primary);">
                <div class="font-medium" style="color: var(--color-text);">{{ ch.title || ch.heading }}</div>
                <div v-if="ch.sections" class="ml-4 mt-1 space-y-1">
                  <div v-for="(s, j) in ch.sections" :key="j" class="text-sm" style="color: var(--color-text-secondary);">{{ s }}</div>
                </div>
                <div v-if="ch.subsections" class="ml-4 mt-1 space-y-1">
                  <div v-for="(ss, k) in ch.subsections" :key="k" class="text-sm" style="color: var(--color-text-secondary);">
                    {{ typeof ss === 'string' ? ss : ss.title || ss.heading }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="goGenerate" class="btn-primary flex-1 py-3">基于大纲生成全文</button>
            <button @click="$router.push('/paper/' + createdPaper._id)" class="btn-outline flex-1 py-3">查看草稿</button>
          </div>
        </div>

        <div v-if="generating" class="card p-12 text-center">
          <LoadingSpinner text="AI 正在生成大纲..." />
        </div>

        <div v-if="error" class="card p-4 text-center" style="color: var(--color-danger);">{{ error }}</div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { paperAPI } from '@/api';
import AppLayout from '@/components/layout/AppLayout.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const form = reactive({ title: '', major: '', paperType: '课程论文', wordCount: 3000 });
const creating = ref(false);
const generating = ref(false);
const error = ref('');
const createdPaper = ref(null);
const outline = ref(null);

async function createPaper() {
  if (!form.title || !form.major) { error.value = '请填写标题和专业'; return; }
  creating.value = true;
  error.value = '';
  try {
    const res = await paperAPI.create({ title: form.title, topic: form.title, major: form.major, paperType: form.paperType, wordCount: form.wordCount });
    createdPaper.value = res.data;
    generating.value = true;
    try { const oRes = await paperAPI.generateOutline(res.data._id); outline.value = oRes.data; } catch (_) { /* ignore */ }
    generating.value = false;
  } catch (e) { error.value = e?.message || '创建失败'; } finally { creating.value = false; }
}

function goGenerate() {
  if (createdPaper.value) router.push('/paper/' + createdPaper.value._id + '?generate=1');
}
</script>
