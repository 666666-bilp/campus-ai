<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900">
    <aside :class="['fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col', sb ? 'w-56' : 'w-16']">
      <div class="h-14 flex items-center justify-center border-b border-gray-200 dark:border-gray-700"><span class="text-xl font-bold text-blue-600 dark:text-blue-400" v-if="sb">🎓 学术AI</span><span class="text-xl" v-else>🎓</span></div>
      <nav class="flex-1 overflow-y-auto py-2"><router-link v-for="n in navItems" :key="n.path" :to="n.path" class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700" :class="$route.path===n.path?'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium':'text-gray-600 dark:text-gray-400'"><span class="text-lg">{{n.icon}}</span><span v-if="sb" class="truncate">{{n.label}}</span></router-link></nav>
    </aside>
    <div :class="['flex-1 flex flex-col min-h-screen transition-all duration-300', sb?'ml-56':'ml-16']">
      <header class="sticky top-0 z-30 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between"><h1 class="text-lg font-semibold text-gray-900 dark:text-white">论文历史</h1><router-link to="/paper/create" class="btn-primary btn-sm">新建论文</router-link></header>
      <main class="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div class="flex gap-2 mb-4">
          <button v-for="f in ['全部','草稿','已完成']" :key="f" @click="filter=f;page=1;fetchPapers()" :class="filter===f?'btn-primary btn-sm':'btn-outline btn-sm'">{{f}}</button>
          <input v-model="search" class="input flex-1 ml-2" placeholder="搜索论文..." @input="fetchPapers" />
        </div>
        <div v-if="loading" class="card text-center py-8 text-gray-400">加载中...</div>
        <div v-if="!loading&&papers.length===0" class="card text-center py-12 text-gray-400">还没有论文，<router-link to="/paper/create" class="text-blue-600 hover:underline">开始生成</router-link></div>
        <div class="space-y-3">
          <div v-for="p in papers" :key="p._id" class="card-hover flex items-center justify-between" @click="$router.push('/paper/'+p._id)">
            <div class="flex-1 min-w-0"><div class="font-medium text-gray-900 dark:text-white truncate">{{p.title}}</div><div class="flex items-center gap-2 mt-1"><span :class="p.paperType==='毕业论文'?'badge-blue':p.paperType==='开题报告'?'badge-yellow':'badge-green'" class="text-xs badge">{{p.paperType}}</span><span class="text-xs text-gray-400">{{p.wordCount}}字</span></div></div>
            <div class="flex items-center gap-3"><span :class="p.status==='completed'?'badge-green':p.status==='generating'?'badge-blue':'badge-yellow'" class="text-xs badge">{{statusMap[p.status]||p.status}}</span><span class="text-xs text-gray-400">{{fd(p.updatedAt)}}</span><button @click.stop="delPaper(p._id)" class="text-red-400 hover:text-red-600 ml-2">🗑</button></div>
          </div>
        </div>
        <div v-if="total>1" class="flex justify-center mt-6 gap-2"><button v-for="i in total" :key="i" @click="page=i;fetchPapers()" :class="page===i?'btn-primary btn-sm':'btn-outline btn-sm'">{{i}}</button></div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { paperAPI } from '@/api'
import dayjs from 'dayjs'

const sb=ref(window.innerWidth>=1024);const papers=ref([]);const loading=ref(true);const filter=ref('全部');const search=ref('');const page=ref(1);const total=ref(1)
const statusMap={draft:'草稿',generating:'生成中',completed:'已完成'}
const fd=d=>d?dayjs(d).format('MM-DD HH:mm'):''
const navItems=[{icon:'📊',label:'工作台',path:'/dashboard'},{icon:'📚',label:'文献处理',path:'/literature'},{icon:'✍️',label:'论文生成',path:'/paper/create'},{icon:'📝',label:'论文历史',path:'/paper/history'},{icon:'✨',label:'论文润色',path:'/polish'},{icon:'📐',label:'LaTeX',path:'/latex'},{icon:'📅',label:'智能课表',path:'/schedule'},{icon:'📔',label:'云端笔记',path:'/notes'},{icon:'📋',label:'考点题库',path:'/exam'},{icon:'🔬',label:'实验报告',path:'/experiment'},{icon:'💻',label:'代码编辑',path:'/code-editor'},{icon:'🌍',label:'外语学习',path:'/english'},{icon:'📖',label:'使用指南',path:'/guide'}]

async function fetchPapers(){
  loading.value=true
  const params={page:page.value,limit:10}
  if(filter.value==='草稿')params.status='draft'
  else if(filter.value==='已完成')params.status='completed'
  if(search.value)params.search=search.value
  try{const res=await paperAPI.getAll(params);papers.value=res.data||[];total.value=Math.ceil((res.total||0)/10)}catch(_){}
  finally{loading.value=false}
}
async function delPaper(id){if(confirm('确认删除？')){try{await paperAPI.delete(id);fetchPapers()}catch(_){}}}
onMounted(fetchPapers)
</script>
