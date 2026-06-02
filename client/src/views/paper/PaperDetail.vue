<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900">
    <aside :class="['fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col', sb ? 'w-56' : 'w-16']">
      <div class="h-14 flex items-center justify-center border-b border-gray-200 dark:border-gray-700"><span class="text-xl font-bold text-blue-600 dark:text-blue-400" v-if="sb">🎓 学术AI</span><span class="text-xl" v-else>🎓</span></div>
      <nav class="flex-1 overflow-y-auto py-2"><router-link v-for="n in navItems" :key="n.path" :to="n.path" class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"><span class="text-lg">{{n.icon}}</span><span v-if="sb" class="truncate">{{n.label}}</span></router-link></nav>
    </aside>
    <div :class="['flex-1 flex flex-col min-h-screen transition-all duration-300', sb?'ml-56':'ml-16']">
      <header class="sticky top-0 z-30 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4"><router-link to="/paper/history" class="text-gray-500 hover:text-gray-700">← 返回</router-link><h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{paper?.title||'加载中...'}}</h1></header>
      <main class="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div v-if="loading" class="card text-center py-12"><div class="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div><p class="text-gray-400 mt-4">加载中...</p></div>
        <div v-else-if="!paper" class="card text-center py-12 text-gray-400">论文不存在</div>
        <template v-else>
          <div class="card mb-6">
            <div class="flex flex-wrap items-center gap-3 mb-3"><span :class="paper.paperType==='毕业论文'?'badge-blue':'badge-green'" class="text-sm">{{paper.paperType}}</span><span :class="paper.status==='completed'?'badge-green':paper.status==='generating'?'badge-blue':'badge-yellow'" class="text-sm">{{statusMap[paper.status]}}</span><span class="text-sm text-gray-500">{{paper.major}} · {{paper.wordCount}}字</span></div>
            <div class="flex flex-wrap gap-2"><button @click="generateFull" :disabled="genLoading" class="btn-primary btn-sm"><span v-if="genLoading" class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>生成全文</button><button @click="exportPaper('txt')" class="btn-secondary btn-sm">导出TXT</button><button @click="exportPaper('md')" class="btn-secondary btn-sm">导出MD</button><button @click="streamGenerate" :disabled="streamLoading" class="btn-outline btn-sm">流式生成</button><button @click="delPaper" class="btn-danger btn-sm">删除</button></div>
          </div>
          <div class="flex gap-2 mb-4"><button v-for="t in tabs" :key="t" @click="activeTab=t" :class="activeTab===t?'btn-primary btn-sm':'btn-outline btn-sm'">{{t}}</button></div>
          <div v-if="activeTab==='大纲'" class="card"><div v-if="paper.content?.body?.length" class="space-y-3"><div v-for="(s,i) in paper.content.body" :key="i" class="border-l-4 border-blue-400 pl-4"><div class="font-medium">{{s.sectionTitle}}</div><div v-if="s.subsections?.length" class="ml-4 mt-1 space-y-1"><div v-for="(ss,j) in s.subsections" :key="j" class="text-sm text-gray-500">{{ss.title}}</div></div></div></div><div v-else class="text-gray-400 text-center py-8">请先生成大纲</div></div>
          <div v-if="activeTab==='正文'&&paper.fullText" class="card"><div class="prose-custom prose prose-sm dark:prose-invert max-w-none" v-html="renderedContent"></div></div>
          <div v-if="activeTab==='正文'&&!paper.fullText" class="card text-center py-8 text-gray-400">请先生成全文</div>
          <div v-if="activeTab==='预览'" class="card"><div v-if="paper.content?.abstract" class="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"><h3 class="font-semibold mb-2">摘要</h3><p class="text-sm text-gray-700 dark:text-gray-300">{{paper.content.abstract}}</p><div class="flex gap-1 mt-2"><span v-for="kw in paper.content.keywords" :key="kw" class="badge-blue text-xs">{{kw}}</span></div></div><div v-if="paper.content?.introduction" class="mb-4"><h3 class="font-semibold mb-2">绪论</h3><div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{paper.content.introduction}}</div></div><div v-if="paper.content?.conclusion" class="mb-4"><h3 class="font-semibold mb-2">结论</h3><div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{paper.content.conclusion}}</div></div></div>
          <div v-if="activeTab==='参考文献'" class="card"><div v-if="paper.content?.references?.length"><div v-for="(ref,i) in paper.content.references" :key="i" class="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"><span class="badge-gray text-xs mr-2">{{ref.format?.toUpperCase()}}</span><span class="text-sm">{{ref.text}}</span></div></div><div v-else class="text-gray-400 text-center py-8">暂无参考文献</div></div>
          <div v-if="streamContent" class="card mt-4"><h3 class="font-semibold mb-3">实时生成中...</h3><div class="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap">{{streamContent}}<span v-if="streamLoading" class="animate-pulse">▌</span></div></div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paperAPI } from '@/api'
import { marked } from 'marked'
import dayjs from 'dayjs'

const route=useRoute();const router=useRouter();const sb=ref(window.innerWidth>=1024)
const paper=ref(null);const loading=ref(true);const activeTab=ref('大纲')
const genLoading=ref(false);const streamLoading=ref(false);const streamContent=ref('')
const tabs=['大纲','正文','预览','参考文献'];const statusMap={draft:'草稿',generating:'生成中',completed:'已完成'}
const navItems=[{icon:'📊',label:'工作台',path:'/dashboard'},{icon:'📚',label:'文献处理',path:'/literature'},{icon:'✍️',label:'论文生成',path:'/paper/create'},{icon:'📝',label:'论文历史',path:'/paper/history'},{icon:'✨',label:'论文润色',path:'/polish'},{icon:'📐',label:'LaTeX',path:'/latex'},{icon:'📅',label:'智能课表',path:'/schedule'},{icon:'📔',label:'云端笔记',path:'/notes'},{icon:'📋',label:'考点题库',path:'/exam'},{icon:'🔬',label:'实验报告',path:'/experiment'},{icon:'💻',label:'代码编辑',path:'/code-editor'},{icon:'🌍',label:'外语学习',path:'/english'}]
const renderedContent=computed(()=>paper.value?.fullText?marked(paper.value.fullText):'')

async function fetchPaper(){loading.value=true;try{const res=await paperAPI.getOne(route.params.id);paper.value=res.data}catch(_){paper.value=null}finally{loading.value=false}}
async function generateFull(){genLoading.value=true;try{await paperAPI.generateFull(route.params.id);await fetchPaper();activeTab.value='正文'}catch(e){alert(e?.message||'生成失败')}finally{genLoading.value=false}}
async function streamGenerate(){streamLoading.value=true;streamContent.value='';try{const es=paperAPI.streamGenerate(route.params.id);es.onmessage=e=>{if(e.data==='[DONE]'){streamLoading.value=false;es.close();fetchPaper()}else{try{const d=JSON.parse(e.data);streamContent.value+=d.chunk||''}catch{streamContent.value+=e.data}}};es.onerror=()=>{streamLoading.value=false;es.close()}}catch(_){streamLoading.value=false}}
async function exportPaper(fmt){try{const res=await paperAPI.export(route.params.id,fmt);const url=window.URL.createObjectURL(new Blob([res]));const a=document.createElement('a');a.href=url;a.download=`${paper.value?.title||'论文'}.${fmt}`;a.click();URL.revokeObjectURL(url)}catch(e){alert('导出失败')}}
async function delPaper(){if(!confirm('确认删除？'))return;try{await paperAPI.delete(route.params.id);router.push('/paper/history')}catch(_){}}
onMounted(async ()=>{await fetchPaper();if(route.query.generate==='1')generateFull()})
</script>
