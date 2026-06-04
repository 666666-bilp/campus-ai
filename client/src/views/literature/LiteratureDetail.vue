<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900">
    <aside :class="['fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col', sb?'w-56':'w-16']">
      <div class="h-14 flex items-center justify-center border-b"><span class="text-xl font-bold text-blue-600 dark:text-blue-400" v-if="sb">🎓 学术AI</span><span class="text-xl" v-else>🎓</span></div>
      <nav class="flex-1 overflow-y-auto py-2"><router-link v-for="n in nav" :key="n.path" :to="n.path" class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"><span class="text-lg">{{n.icon}}</span><span v-if="sb" class="truncate">{{n.label}}</span></router-link></nav>
    </aside>
    <div :class="['flex-1 flex flex-col min-h-screen transition-all duration-300', sb?'ml-56':'ml-16']">
      <header class="sticky top-0 z-30 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b flex items-center px-4 gap-4"><router-link to="/literature" class="text-gray-500 hover:text-gray-700">← 返回</router-link><h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{doc?.title||'文献详情'}}</h1></header>
      <main class="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div v-if="loading" class="card text-center py-12 text-gray-400">加载中...</div>
        <div v-else-if="!doc" class="card text-center py-12 text-gray-400">文献不存在</div>
        <template v-else>
          <div class="card mb-6"><h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{doc.title||doc.fileName}}</h2><div class="flex flex-wrap gap-2 text-sm text-gray-500"><span>{{doc.fileName}}</span><span class="badge-gray">{{doc.fileType}}</span><span>{{formatSize(doc.fileSize)}}</span><span>{{fd(doc.createdAt)}}</span><span :class="doc.status==='completed'?'badge-green':'badge-yellow'" class="text-xs">{{doc.status==='completed'?'已处理':'待处理'}}</span></div></div>
          <div class="flex flex-wrap gap-2 mb-6">
            <button @click="extractText" :disabled="extracting" class="btn-primary btn-sm">📄 {{extracting?'提取中...':'提取文本'}}</button>
            <button @click="summarize" :disabled="summarizing" class="btn-secondary btn-sm">🤖 {{summarizing?'分析中...':'智能摘要'}}</button>
            <button @click="genRefs" :disabled="refLoading" class="btn-secondary btn-sm">📋 {{refLoading?'生成中...':'生成参考文献'}}</button>
            <button @click="deleteDoc" class="btn-danger btn-sm">删除</button>
          </div>
          <div v-if="doc.extractedText" class="card mb-6"><h3 class="font-semibold mb-3">提取文本</h3><pre class="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">{{doc.extractedText.slice(0,5000)}}{{doc.extractedText.length>5000?'...':''}}</pre></div>
          <div v-if="doc.summary" class="card mb-6"><h3 class="font-semibold mb-2">智能摘要</h3><p class="text-gray-700 dark:text-gray-300">{{doc.summary}}</p><div class="flex gap-1 mt-3" v-if="doc.keywords?.length"><span v-for="k in doc.keywords" :key="k" class="badge-blue text-xs">{{k}}</span></div></div>
          <div v-if="doc.references?.length" class="card"><h3 class="font-semibold mb-3">参考文献</h3><div v-for="fmt in ['gb7714','ieee','cnki']" :key="fmt" class="mb-4"><div class="badge-blue text-xs mb-2">{{fmt.toUpperCase()}}</div><div v-for="(r,i) in doc.references.filter(r=>r.format===fmt)" :key="i" class="text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">{{r.text}}</div></div></div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { documentAPI } from '@/api'
import dayjs from 'dayjs'

const route=useRoute();const router=useRouter();const sb=ref(window.innerWidth>=1024)
const doc=ref(null);const loading=ref(true);const extracting=ref(false);const summarizing=ref(false);const refLoading=ref(false)
const fd=d=>d?dayjs(d).format('YYYY-MM-DD HH:mm'):'';const formatSize=s=>{if(!s)return'0B';if(s<1024)return s+'B';if(s<1024*1024)return(s/1024).toFixed(1)+'KB';return(s/(1024*1024)).toFixed(1)+'MB'}
const nav=[{icon:'📊',label:'工作台',path:'/dashboard'},{icon:'📚',label:'文献处理',path:'/literature'},{icon:'✍️',label:'论文生成',path:'/paper/create'},{icon:'📝',label:'论文历史',path:'/paper/history'},{icon:'✨',label:'论文润色',path:'/polish'},{icon:'📐',label:'LaTeX',path:'/latex'},{icon:'📅',label:'智能课表',path:'/schedule'},{icon:'📔',label:'云端笔记',path:'/notes'},{icon:'📋',label:'考点题库',path:'/exam'},{icon:'🔬',label:'实验报告',path:'/experiment'}]

async function fetchDoc(){loading.value=true;try{const res=await documentAPI.getOne(route.params.id);doc.value=res.data}catch(_){doc.value=null}finally{loading.value=false}}
async function extractText(){extracting.value=true;try{const fd=new FormData();const res=await documentAPI.extractText(route.params.id,fd);doc.value=res.data}catch(e){alert(e?.message||'提取失败')}finally{extracting.value=false}}
async function summarize(){summarizing.value=true;try{const res=await documentAPI.summarize(route.params.id);doc.value=res.data}catch(e){alert(e?.message||'摘要失败')}finally{summarizing.value=false}}
async function genRefs(){refLoading.value=true;try{const res=await documentAPI.generateReferences(route.params.id);doc.value=res.data}catch(e){alert(e?.message||'生成失败')}finally{refLoading.value=false}}
async function deleteDoc(){if(!confirm('确认删除？'))return;try{await documentAPI.delete(route.params.id);router.push('/literature')}catch(_){}}
onMounted(fetchDoc)
</script>
