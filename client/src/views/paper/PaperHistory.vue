<template>
  <AppLayout>
    <template #default>
      <div class="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
            论文历史
          </h2>
          <router-link to="/paper/create" class="btn-primary btn-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            新建论文
          </router-link>
        </div>

        <div class="flex gap-2">
          <button v-for="f in filters" :key="f" @click="filter = f; page = 1; fetchPapers()"
            :class="filter === f ? 'btn-primary btn-sm' : 'btn-outline btn-sm'">{{ f }}</button>
          <input v-model="search" class="input flex-1 !ml-2" placeholder="搜索论文..." @input="fetchPapers" />
        </div>

        <div v-if="loading" class="card py-12 text-center">
          <LoadingSpinner text="加载中..." size="sm" />
        </div>

        <div v-else-if="papers.length === 0" class="card py-12 text-center">
          <p style="color: var(--color-text-muted);">
            还没有论文，
            <router-link to="/paper/create" class="font-medium hover:underline" style="color: var(--color-primary);">开始生成</router-link>
          </p>
        </div>

        <div v-else class="space-y-2.5">
          <div v-for="p in papers" :key="p._id"
            class="card-hover flex items-center justify-between px-5 py-4"
            @click="$router.push('/paper/' + p._id)">
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate" style="color: var(--color-text);">{{ p.title }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge-muted text-xs">{{ p.paperType }}</span>
                <span class="text-xs" style="color: var(--color-text-muted);">{{ p.wordCount }} 字</span>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0 ml-4">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :style="statusStyle(p.status)">
                {{ statusMap[p.status] || p.status }}
              </span>
              <span class="text-xs hidden sm:inline" style="color: var(--color-text-muted);">{{ fd(p.updatedAt) }}</span>
              <button @click.stop="delPaper(p._id)" class="text-sm hover:opacity-70 transition-opacity" style="color: var(--color-danger);" title="删除">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="total > 1" class="flex justify-center gap-2">
          <button v-for="i in total" :key="i" @click="page = i; fetchPapers()"
            :class="page === i ? 'btn-primary btn-sm' : 'btn-outline btn-sm'">{{ i }}</button>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { paperAPI } from '@/api';
import dayjs from 'dayjs';
import AppLayout from '@/components/layout/AppLayout.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const papers = ref([]);
const loading = ref(true);
const filter = ref('全部');
const search = ref('');
const page = ref(1);
const total = ref(1);
const filters = ['全部', '草稿', '已完成'];
const statusMap = { draft: '草稿', generating: '生成中', completed: '已完成' };

const fd = d => d ? dayjs(d).format('MM-DD HH:mm') : '';

function statusStyle(status) {
  if (status === 'completed') return { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' };
  if (status === 'generating') return { background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' };
  return { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' };
}

async function fetchPapers() {
  loading.value = true;
  const params = { page: page.value, limit: 10 };
  if (filter.value === '草稿') params.status = 'draft';
  else if (filter.value === '已完成') params.status = 'completed';
  if (search.value) params.search = search.value;
  try {
    const res = await paperAPI.getAll(params);
    papers.value = res.data || [];
    total.value = Math.ceil((res.total || 0) / 10);
  } catch (_) { /* ignore */ }
  finally { loading.value = false; }
}

async function delPaper(id) {
  if (!confirm('确认删除？')) return;
  try { await paperAPI.delete(id); fetchPapers(); } catch (_) { /* ignore */ }
}

onMounted(fetchPapers);
</script>
