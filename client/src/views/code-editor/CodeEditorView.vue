<template>
  <AppLayout>
    <template #default>
      <div class="h-[calc(100vh-7rem)] flex flex-col animate-fade-in-up">
        <h2 class="text-xl font-bold mb-4 flex-shrink-0 tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">
          代码编辑
        </h2>

        <!-- Mobile Snippet Toggle -->
        <div class="lg:hidden flex items-center gap-2 mb-2">
          <button @click="showMobileSnippets = !showMobileSnippets" class="btn-secondary btn-sm flex-1">
            {{ showMobileSnippets ? '隐藏列表' : '代码列表' }} ({{ filteredSnippets.length }})
          </button>
          <button @click="newSnippet" class="btn-primary btn-sm">+ 新建</button>
        </div>

        <div class="flex-1 flex overflow-hidden rounded-[var(--radius-lg)] border relative" style="border-color: var(--color-border-light);">
          <!-- Snippet List Sidebar (Desktop) -->
          <aside class="hidden lg:flex w-64 flex-shrink-0 border-r flex-col" style="background: var(--color-surface); border-color: var(--color-border-light);">
            <div class="p-3 border-b" style="border-color: var(--color-border-light);">
              <button @click="newSnippet" class="btn-primary w-full text-sm">+ 新建代码</button>
            </div>
            <div class="p-2 flex flex-wrap gap-1 border-b" style="border-color: var(--color-border-light);">
              <button v-for="lang in languageFilters" :key="lang.value" @click="activeFilter = lang.value"
                class="px-2 py-1 text-xs rounded-md transition-colors"
                :class="activeFilter === lang.value
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'">
                {{ lang.label }}
              </button>
            </div>
            <div class="flex-1 overflow-y-auto">
              <div v-if="snipsLoading" class="p-6 text-center text-sm" style="color: var(--color-text-muted);">加载中...</div>
              <div v-else-if="filteredSnippets.length === 0" class="p-6 text-center text-sm" style="color: var(--color-text-muted);">暂无代码片段</div>
              <div v-for="snippet in filteredSnippets" :key="snippet._id"
                @click="selectSnippet(snippet)"
                class="p-3 border-b cursor-pointer transition-colors"
                :class="selected?._id === snippet._id ? 'bg-[var(--color-primary)]/8' : 'hover:bg-[var(--color-surface-raised)]'"
                style="border-color: var(--color-border-light);">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="text-sm font-medium truncate" style="color: var(--color-text);">{{ snippet.title || '未命名' }}</span>
                  <button @click.stop="deleteSnippet(snippet._id)"
                    class="flex-shrink-0 p-0.5 hover:opacity-70 transition-opacity" style="color: var(--color-danger);" title="删除">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded" :class="languageBadgeClass(snippet.language)">{{ snippet.language || 'text' }}</span>
                  <span class="text-[10px]" style="color: var(--color-text-muted);">{{ formatDate(snippet.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- Mobile Snippet Overlay -->
          <div v-if="showMobileSnippets" class="lg:hidden absolute inset-0 z-10 flex flex-col" style="background: var(--color-surface);">
            <div class="p-3 border-b flex items-center justify-between" style="border-color: var(--color-border-light);">
              <span class="text-sm font-medium" style="color: var(--color-text);">代码列表</span>
              <button @click="showMobileSnippets = false" class="p-1 rounded hover:bg-[var(--color-surface-raised)]" style="color: var(--color-text-muted);">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="p-2 flex flex-wrap gap-1 border-b" style="border-color: var(--color-border-light);">
              <button v-for="lang in languageFilters" :key="lang.value" @click="activeFilter = lang.value"
                class="px-2 py-1 text-xs rounded-md transition-colors"
                :class="activeFilter === lang.value
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'">
                {{ lang.label }}
              </button>
            </div>
            <div class="flex-1 overflow-y-auto">
              <div v-for="snippet in filteredSnippets" :key="snippet._id"
                @click="selectSnippet(snippet); showMobileSnippets = false"
                class="p-3 border-b cursor-pointer transition-colors"
                :class="selected?._id === snippet._id ? 'bg-[var(--color-primary)]/8' : 'hover:bg-[var(--color-surface-raised)]'"
                style="border-color: var(--color-border-light);">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="text-sm font-medium truncate" style="color: var(--color-text);">{{ snippet.title || '未命名' }}</span>
                  <button @click.stop="deleteSnippet(snippet._id)"
                    class="flex-shrink-0 p-0.5 hover:opacity-70 transition-opacity" style="color: var(--color-danger);" title="删除">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded" :class="languageBadgeClass(snippet.language)">{{ snippet.language || 'text' }}</span>
                  <span class="text-[10px]" style="color: var(--color-text-muted);">{{ formatDate(snippet.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Editor Area -->
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="!selected" class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent);">
                  <svg class="w-8 h-8" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                </div>
                <p class="text-lg font-medium tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">选择一个代码片段开始编辑</p>
                <p class="text-sm mt-1" style="color: var(--color-text-muted);">或点击"新建代码"创建新的代码片段</p>
              </div>
            </div>

            <template v-else>
              <div class="flex items-center gap-3 mb-4">
                <input v-model="editTitle" class="input flex-1" placeholder="代码标题" />
                <select v-model="editLanguage" class="input w-auto">
                  <option value="" disabled>选择语言</option>
                  <option v-for="lang in languageOptions" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
                </select>
              </div>

              <textarea v-model="editCode"
                class="w-full min-h-[250px] sm:min-h-[400px] font-mono text-sm p-4 rounded-lg resize-y border focus:outline-none focus:ring-2"
                style="background: var(--color-text); color: #a5d6ff; border-color: transparent;"
                placeholder="在此编写代码..." spellcheck="false"></textarea>

              <div class="flex items-center gap-2 mt-4 flex-wrap">
                <button @click="handleSave" :disabled="saving" class="btn-primary btn-sm">
                  <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {{ saving ? '保存中...' : '保存' }}
                </button>
                <button @click="handleAddComments" :disabled="addingComments" class="btn-secondary btn-sm">
                  {{ addingComments ? 'AI 注释中...' : 'AI 注释' }}
                </button>
                <button @click="handleFormat" :disabled="formatting" class="btn-secondary btn-sm">
                  {{ formatting ? '格式化中...' : '格式化' }}
                </button>
                <button @click="handleShare" :disabled="sharing" class="btn-outline btn-sm">
                  {{ sharing ? '分享中...' : '分享' }}
                </button>
              </div>

              <!-- Preview -->
              <div class="mt-6 card p-4">
                <h3 class="text-sm font-semibold mb-3 tracking-tight" style="color: var(--color-text);">运行 / 预览</h3>
                <template v-if="isHtmlOrCss">
                  <button @click="runPreview" class="btn-primary btn-sm mb-3">预览 HTML</button>
                  <iframe v-if="previewSrc" :srcdoc="previewSrc"
                    class="w-full h-[250px] sm:h-[400px] rounded-lg border bg-white"
                    style="border-color: var(--color-border);"
                    sandbox="allow-scripts allow-same-origin"></iframe>
                </template>
                <p v-else class="text-sm" style="color: var(--color-text-muted);">
                  当前语言为 {{ editLanguage || '未选择' }}，仅 HTML/CSS 支持在线预览。
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- Share Modal -->
        <Teleport to="body">
          <div v-if="shareModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="shareModalOpen = false">
            <div class="card w-full max-w-md mx-4 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold tracking-tight" style="color: var(--color-text); font-family: var(--font-display);">分享代码</h3>
                <button @click="shareModalOpen = false" class="p-1 rounded-lg hover:bg-[var(--color-surface-raised)]" style="color: var(--color-text-muted);">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div v-if="shareUrl" class="space-y-3">
                <p class="text-sm" style="color: var(--color-text-secondary);">分享链接：</p>
                <div class="flex items-center gap-2">
                  <input :value="shareUrl" readonly class="input flex-1 cursor-text select-all" />
                  <button @click="copyShareUrl" class="btn-primary btn-sm">
                    {{ copied ? '已复制' : '复制' }}
                  </button>
                </div>
              </div>
              <div v-else class="text-sm text-center py-4" style="color: var(--color-text-muted);">正在生成分享链接...</div>
            </div>
          </div>
        </Teleport>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { codeAPI } from '@/api';
import { useClipboard } from '@/composables/useClipboard';
import dayjs from 'dayjs';
import AppLayout from '@/components/layout/AppLayout.vue';

const { copied, copy } = useClipboard();

const snippets = ref([]);
const snipsLoading = ref(true);
const activeFilter = ref('all');
const selected = ref(null);
const editTitle = ref('');
const editLanguage = ref('');
const editCode = ref('');
const saving = ref(false);
const addingComments = ref(false);
const formatting = ref(false);
const sharing = ref(false);
const previewSrc = ref('');
const shareModalOpen = ref(false);
const shareUrl = ref('');
const showMobileSnippets = ref(false);

const isHtmlOrCss = computed(() => {
  const lang = editLanguage.value.toLowerCase();
  return lang === 'html' || lang === 'css';
});

const languageFilters = [
  { label: '全部', value: 'all' }, { label: 'C', value: 'c' }, { label: 'C++', value: 'cpp' },
  { label: 'Python', value: 'python' }, { label: 'Java', value: 'java' }, { label: 'JS', value: 'javascript' },
  { label: 'HTML', value: 'html' }, { label: 'CSS', value: 'css' },
];

const languageOptions = [
  { label: 'C', value: 'c' }, { label: 'C++', value: 'cpp' }, { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' }, { label: 'JavaScript', value: 'javascript' }, { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML', value: 'html' }, { label: 'CSS', value: 'css' }, { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' }, { label: 'SQL', value: 'sql' }, { label: 'Bash', value: 'bash' },
  { label: 'Markdown', value: 'markdown' }, { label: '其他', value: 'other' },
];

const filteredSnippets = computed(() => {
  if (activeFilter.value === 'all') return snippets.value;
  return snippets.value.filter(s => s.language === activeFilter.value);
});

function languageBadgeClass(lang) {
  const map = {
    javascript: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    typescript: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    python: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    java: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    c: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300',
    cpp: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    html: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    css: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    go: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    rust: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    sql: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  return map[lang] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
}

function formatDate(d) { return d ? dayjs(d).format('MM-DD HH:mm') : ''; }

function newSnippet() {
  selected.value = { _id: null, title: '', language: '', code: '' };
  editTitle.value = ''; editLanguage.value = ''; editCode.value = '';
  previewSrc.value = ''; shareModalOpen.value = false; shareUrl.value = '';
}

function selectSnippet(snippet) {
  selected.value = snippet;
  editTitle.value = snippet.title || ''; editLanguage.value = snippet.language || '';
  editCode.value = snippet.code || ''; previewSrc.value = '';
  shareModalOpen.value = false; shareUrl.value = '';
}

async function handleSave() {
  if (!editTitle.value.trim()) { alert('请输入代码标题'); return; }
  saving.value = true;
  try {
    const payload = { title: editTitle.value.trim(), language: editLanguage.value, code: editCode.value };
    if (selected.value?._id) {
      const res = await codeAPI.update(selected.value._id, payload);
      const updated = res.data?.snippet || res.data || res;
      Object.assign(selected.value, updated);
    } else {
      const res = await codeAPI.save(payload);
      selected.value = res.data?.snippet || res.data || res;
    }
    await fetchSnippets();
  } catch (err) { alert('保存失败：' + (err?.response?.data?.message || err.message)); }
  finally { saving.value = false; }
}

async function handleAddComments() {
  if (!selected.value?._id) { alert('请先保存代码片段'); return; }
  addingComments.value = true;
  try {
    const res = await codeAPI.addComments(selected.value._id);
    const data = res.data?.snippet || res.data || res;
    if (data.code) { editCode.value = data.code; if (selected.value) selected.value.code = data.code; }
  } catch (err) { alert('AI 注释失败：' + (err?.response?.data?.message || err.message)); }
  finally { addingComments.value = false; }
}

async function handleFormat() {
  if (!selected.value?._id) { alert('请先保存代码片段'); return; }
  formatting.value = true;
  try {
    const res = await codeAPI.format(selected.value._id);
    const data = res.data?.snippet || res.data || res;
    if (data.code) { editCode.value = data.code; if (selected.value) selected.value.code = data.code; }
  } catch (err) { alert('格式化失败：' + (err?.response?.data?.message || err.message)); }
  finally { formatting.value = false; }
}

async function handleShare() {
  if (!selected.value?._id) { alert('请先保存代码片段'); return; }
  sharing.value = true;
  try {
    const res = await codeAPI.share(selected.value._id);
    const data = res.data || res;
    shareUrl.value = data.shareUrl || data.shareLink || data.url || `${window.location.origin}/code/public/${selected.value._id}`;
    shareModalOpen.value = true;
  } catch (err) { alert('分享失败：' + (err?.response?.data?.message || err.message)); }
  finally { sharing.value = false; }
}

function copyShareUrl() { copy(shareUrl.value); }
function runPreview() { previewSrc.value = editCode.value; }

async function deleteSnippet(id) {
  if (!confirm('确定删除此代码片段吗？')) return;
  try { await codeAPI.delete(id); if (selected.value?._id === id) newSnippet(); await fetchSnippets(); }
  catch (err) { alert('删除失败：' + (err?.response?.data?.message || err.message)); }
}

async function fetchSnippets() {
  snipsLoading.value = true;
  try { const res = await codeAPI.getAll(); snippets.value = res.data?.snippets || res.data?.list || res.data || []; }
  catch (_) { snippets.value = []; }
  finally { snipsLoading.value = false; }
}

onMounted(() => fetchSnippets());
</script>
