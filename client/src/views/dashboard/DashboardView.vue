<template>
  <AppLayout>
    <template #default>
      <div class="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        <!-- Welcome -->
        <div>
          <h2 class="text-2xl font-bold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
            欢迎回来，{{ authStore.userName }}
          </h2>
          <p class="mt-1 text-sm" style="color: var(--color-text-muted);">{{ today }}</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="(stat, idx) in stats"
            :key="stat.label"
            class="card p-5 flex items-center gap-4 animate-fade-in-up"
            :class="`stagger-${idx + 1}`"
          >
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              :style="{ background: stat.bg }"
            >
              <span class="text-xl">{{ stat.icon }}</span>
            </div>
            <div>
              <div class="text-xl font-bold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
                {{ stat.value }}
              </div>
              <div class="text-xs mt-0.5" style="color: var(--color-text-muted);">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div>
          <h3 class="text-lg font-semibold mb-4 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
            快速操作
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <router-link
              v-for="(action, idx) in quickActions"
              :key="action.path"
              :to="action.path"
              class="card-hover flex flex-col items-center gap-2 p-5 text-center group"
              :class="`stagger-${idx + 1}`"
            >
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200"
                :style="{ background: `color-mix(in srgb, var(--color-primary) 8%, transparent)` }"
              >
                <span class="text-xl">{{ action.icon }}</span>
              </div>
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ action.label }}</span>
              <span class="text-xs" style="color: var(--color-text-muted);">{{ action.desc }}</span>
            </router-link>
          </div>
        </div>

        <!-- Recent Papers -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
              最近论文
            </h3>
            <router-link
              to="/paper/history"
              class="text-sm font-medium hover:underline transition-colors"
              style="color: var(--color-primary);"
            >
              查看全部
            </router-link>
          </div>

          <div v-if="paperLoading" class="card py-12 text-center">
            <LoadingSpinner text="加载中..." size="sm" />
          </div>

          <div
            v-else-if="papers.length === 0"
            class="card py-12 text-center"
          >
            <p style="color: var(--color-text-muted);">
              还没有论文，
              <router-link to="/paper/create" class="font-medium hover:underline" style="color: var(--color-primary);">开始生成</router-link>
            </p>
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="(paper, idx) in papers"
              :key="paper._id"
              class="card-hover flex items-center justify-between px-5 py-4 animate-fade-in-up"
              :class="`stagger-${idx + 1}`"
              @click="$router.push(`/paper/${paper._id}`)"
            >
              <div class="min-w-0">
                <div class="font-medium truncate" style="color: var(--color-text);">{{ paper.title }}</div>
                <div class="text-xs mt-0.5" style="color: var(--color-text-muted);">
                  {{ paper.paperType }} &middot; {{ paper.wordCount }} 字
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0 ml-4">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :style="statusStyle(paper.status)"
                >
                  {{ statusMap[paper.status] || paper.status }}
                </span>
                <span class="text-xs hidden sm:inline" style="color: var(--color-text-muted);">
                  {{ formatDate(paper.updatedAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { paperAPI } from '@/api';
import dayjs from 'dayjs';
import AppLayout from '@/components/layout/AppLayout.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const authStore = useAuthStore();

const papers = ref([]);
const paperLoading = ref(true);

const statusMap = { draft: '草稿', generating: '生成中', completed: '已完成' };

const today = computed(() => dayjs().format('YYYY年MM月DD日 dddd'));

const stats = computed(() => [
  { icon: '📄', value: papers.value.length, label: '论文生成', bg: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' },
  { icon: '📚', value: 0, label: '文献处理', bg: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' },
  { icon: '📝', value: 0, label: '云端笔记', bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)' },
  { icon: '🤖', value: 0, label: 'AI 调用', bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)' },
]);

const quickActions = [
  { icon: '✍️', label: '生成论文', desc: 'AI 全自动', path: '/paper/create' },
  { icon: '📚', label: '上传文献', desc: '智能处理', path: '/literature' },
  { icon: '✨', label: '论文润色', desc: '改写降重', path: '/polish' },
  { icon: '📅', label: '智能课表', desc: '教务导入', path: '/schedule' },
  { icon: '📝', label: '云端笔记', desc: 'AI 总结', path: '/notes' },
  { icon: '📖', label: '使用指南', desc: '快速上手', path: '/guide' },
];

function statusStyle(status) {
  if (status === 'completed') {
    return { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' };
  }
  if (status === 'generating') {
    return { background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' };
  }
  return { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' };
}

function formatDate(d) {
  return d ? dayjs(d).format('MM-DD HH:mm') : '';
}

onMounted(async () => {
  try {
    const res = await paperAPI.getAll({ limit: 5 });
    papers.value = res.data || [];
  } catch (_) {
    /* ignore */
  } finally {
    paperLoading.value = false;
  }
});
</script>
