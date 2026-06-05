import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login', name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true, title: '登录' }
  },
  {
    path: '/register', name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true, title: '注册' }
  },
  {
    path: '/dashboard', name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { auth: true, title: '工作台' }
  },
  {
    path: '/literature', name: 'Literature',
    component: () => import('@/views/literature/LiteratureView.vue'),
    meta: { auth: true, title: '文献处理' }
  },
  {
    path: '/literature/:id', name: 'LiteratureDetail',
    component: () => import('@/views/literature/LiteratureDetail.vue'),
    meta: { auth: true, title: '文献详情' }
  },
  {
    path: '/paper/create', name: 'PaperCreate',
    component: () => import('@/views/paper/PaperCreate.vue'),
    meta: { auth: true, title: '论文生成' }
  },
  {
    path: '/paper/history', name: 'PaperHistory',
    component: () => import('@/views/paper/PaperHistory.vue'),
    meta: { auth: true, title: '论文历史' }
  },
  {
    path: '/paper/:id', name: 'PaperDetail',
    component: () => import('@/views/paper/PaperDetail.vue'),
    meta: { auth: true, title: '论文详情' }
  },
  {
    path: '/polish', name: 'Polish',
    component: () => import('@/views/polish/PolishView.vue'),
    meta: { auth: true, title: '论文润色' }
  },
  {
    path: '/latex', name: 'Latex',
    component: () => import('@/views/latex/LatexView.vue'),
    meta: { auth: true, title: 'LaTeX编辑器' }
  },
  {
    path: '/schedule', name: 'Schedule',
    component: () => import('@/views/schedule/ScheduleView.vue'),
    meta: { auth: true, title: '智能课表' }
  },
  {
    path: '/notes', name: 'Notes',
    component: () => import('@/views/notes/NotesView.vue'),
    meta: { auth: true, title: '云端笔记' }
  },
  {
    path: '/notes/:id', name: 'NoteDetail',
    component: () => import('@/views/notes/NoteDetail.vue'),
    meta: { auth: true, title: '笔记详情' }
  },
  {
    path: '/exam', name: 'Exam',
    component: () => import('@/views/exam/ExamView.vue'),
    meta: { auth: true, title: '考点题库' }
  },
  {
    path: '/exam/generate', name: 'ExamGenerate',
    component: () => import('@/views/exam/ExamGenerate.vue'),
    meta: { auth: true, title: '生成题库' }
  },
  {
    path: '/experiment', name: 'Experiment',
    component: () => import('@/views/experiment/ExperimentView.vue'),
    meta: { auth: true, title: '实验报告' }
  },
  {
    path: '/experiment/generate', name: 'ExperimentGenerate',
    component: () => import('@/views/experiment/ExperimentGenerate.vue'),
    meta: { auth: true, title: '生成实验报告' }
  },
  {
    path: '/code-editor', name: 'CodeEditor',
    component: () => import('@/views/code-editor/CodeEditorView.vue'),
    meta: { auth: true, title: '代码编辑器' }
  },
  {
    path: '/english', name: 'English',
    component: () => import('@/views/english/EnglishView.vue'),
    meta: { auth: true, title: '外语学习' }
  },
  {
    path: '/english/oral', name: 'OralPractice',
    component: () => import('@/views/english/OralPractice.vue'),
    meta: { auth: true, title: '口语陪练' }
  },
  {
    path: '/guide', name: 'Guide',
    component: () => import('@/views/guide/GuideView.vue'),
    meta: { auth: true, title: '使用指南' }
  },
  {
    path: '/profile', name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { auth: true, title: '个人中心' }
  },
  {
    path: '/:pathMatch(.*)*', name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 学术AI助手` : '大学生学术AI助手'
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (to.meta.auth && !authStore.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
