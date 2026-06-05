<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900">
    <aside :class="['fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col', sb ? 'w-56' : 'w-16']">
      <div class="h-14 flex items-center justify-center border-b border-gray-200 dark:border-gray-700"><span class="text-xl font-bold text-blue-600 dark:text-blue-400" v-if="sb">🎓 学术AI</span><span class="text-xl" v-else>🎓</span></div>
      <nav class="flex-1 overflow-y-auto py-2"><router-link v-for="n in navItems" :key="n.path" :to="n.path" class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700" :class="$route.path===n.path?'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium':'text-gray-600 dark:text-gray-400'"><span class="text-lg">{{n.icon}}</span><span v-if="sb" class="truncate">{{n.label}}</span></router-link></nav>
    </aside>
    <div :class="['flex-1 flex flex-col min-h-screen transition-all duration-300', sb?'ml-56':'ml-16']">
      <header class="sticky top-0 z-30 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 flex items-center px-4"><h1 class="text-lg font-semibold text-gray-900 dark:text-white">论文生成</h1></header>
      <main class="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div v-if="!createdPaper" class="card animate-slide-up">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">创建新论文</h2>
          <form @submit.prevent="createPaper" class="space-y-5">
            <div><label class="label">论文标题 <span class="text-red-500">*</span></label><input v-model="form.title" class="input" placeholder="输入论文标题" required /></div>
            <div><label class="label">所属专业 <span class="text-red-500">*</span></label><input v-model="form.major" class="input" placeholder="如：计算机科学与技术" required /></div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="label">论文类型</label><select v-model="form.paperType" class="input"><option value="课程论文">课程论文</option><option value="毕业论文">毕业论文</option><option value="开题报告">开题报告</option><option value="文献综述">文献综述</option></select></div>
              <div><label class="label">目标字数</label><input v-model.number="form.wordCount" type="number" class="input" min="1000" max="50000" /></div>
            </div>
            <button type="submit" :disabled="creating" class="btn-primary w-full py-3"><span v-if="creating" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>{{creating?'创建中...':'创建并生成大纲'}}</button>
          </form>
        </div>
        <div v-if="createdPaper && outline" class="animate-slide-up space-y-6">
          <div class="card"><h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{outline.title||form.title}}</h2><div class="flex gap-2"><span class="badge-blue">{{form.paperType}}</span><span class="badge-gray">{{form.wordCount}}字</span></div></div>
          <div class="card"><h3 class="font-semibold text-gray-900 dark:text-white mb-4">📋 论文大纲</h3><div class="space-y-3"><div v-for="(ch,i) in (outline.chapters||outline.sections||[])" :key="i" class="border-l-4 border-blue-400 dark:border-blue-500 pl-4"><div class="font-medium text-gray-900 dark:text-white">{{ch.title||ch.heading}}</div><div v-if="ch.sections" class="ml-4 mt-1 space-y-1"><div v-for="(s,j) in ch.sections" :key="j" class="text-sm text-gray-600 dark:text-gray-400">{{s}}</div></div><div v-if="ch.subsections" class="ml-4 mt-1 space-y-1"><div v-for="(ss,k) in ch.subsections" :key="k" class="text-sm text-gray-600 dark:text-gray-400">{{typeof ss==='string'?ss:ss.title||ss.heading}}</div></div></div></div></div>
          <div class="flex gap-3"><button @click="goGenerate" class="btn-primary flex-1 py-3">基于大纲生成全文</button><button @click="$router.push('/paper/'+createdPaper._id)" class="btn-outline flex-1 py-3">查看草稿</button></div>
        </div>
        <div v-if="generating" class="card text-center py-8 mt-6"><div class="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div><p class="text-gray-500">AI正在生成大纲...</p></div>
        <div v-if="error" class="card mt-4 text-red-500 text-center">{{error}}</div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { paperAPI } from '@/api'

const router = useRouter()
const sb = ref(window.innerWidth>=1024)
const form = reactive({title:'',major:'',paperType:'课程论文',wordCount:3000})
const creating = ref(false); const generating = ref(false); const error = ref('')
const createdPaper = ref(null); const outline = ref(null)
const navItems=[{icon:'📊',label:'工作台',path:'/dashboard'},{icon:'📚',label:'文献处理',path:'/literature'},{icon:'✍️',label:'论文生成',path:'/paper/create'},{icon:'📝',label:'论文历史',path:'/paper/history'},{icon:'✨',label:'论文润色',path:'/polish'},{icon:'📐',label:'LaTeX',path:'/latex'},{icon:'📅',label:'智能课表',path:'/schedule'},{icon:'📔',label:'云端笔记',path:'/notes'},{icon:'📋',label:'考点题库',path:'/exam'},{icon:'🔬',label:'实验报告',path:'/experiment'},{icon:'💻',label:'代码编辑',path:'/code-editor'},{icon:'🌍',label:'外语学习',path:'/english'},{icon:'📖',label:'使用指南',path:'/guide'}]

async function createPaper(){
  if(!form.title||!form.major){error.value='请填写标题和专业';return}
  creating.value=true;error.value=''
  try{
    const res=await paperAPI.create({title:form.title,topic:form.title,major:form.major,paperType:form.paperType,wordCount:form.wordCount})
    createdPaper.value=res.data;generating.value=true
    try{const oRes=await paperAPI.generateOutline(res.data._id);outline.value=oRes.data}catch(_){}
    generating.value=false
  }catch(e){error.value=e?.message||'创建失败'}
  finally{creating.value=false}
}

function goGenerate(){
  if(createdPaper.value)router.push('/paper/'+createdPaper.value._id+'?generate=1')
}
</script>
