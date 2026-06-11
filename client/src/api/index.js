import request from '@/utils/request'

export const authAPI = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  logout: () => request.post('/auth/logout'),
  getMe: () => request.get('/auth/me'),
  updateProfile: (data) => request.put('/auth/profile', data),
  updatePreferences: (data) => request.put('/auth/preferences', data),
  changePassword: (data) => request.put('/auth/password', data),
}

export const documentAPI = {
  upload: (formData) => request.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => request.get('/documents', { params }),
  getOne: (id) => request.get(`/documents/${id}`),
  extractText: (id, formData) => request.post(`/documents/${id}/extract`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  summarize: (id) => request.post(`/documents/${id}/summarize`),
  generateReferences: (id) => request.post(`/documents/${id}/references`),
  search: (params) => request.get('/documents/search', { params }),
  delete: (id) => request.delete(`/documents/${id}`),
}

export const paperAPI = {
  create: (data) => request.post('/papers', data),
  getAll: (params) => request.get('/papers', { params }),
  getOne: (id) => request.get(`/papers/${id}`),
  generateOutline: (id) => request.post(`/papers/${id}/outline`),
  generateSection: (id, data) => request.post(`/papers/${id}/section`, data),
  generateFull: (id) => request.post(`/papers/${id}/generate`),
  update: (id, data) => request.put(`/papers/${id}`, data),
  delete: (id) => request.delete(`/papers/${id}`),
  export: (id, format) => request.get(`/papers/${id}/export/${format}`, { responseType: 'blob' }),
  streamGenerate: (id) => {
    const token = localStorage.getItem('token')
    const baseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
    return new EventSource(`${baseUrl}/papers/${id}/stream?token=${token}`)
  }
}

export const polishAPI = {
  polishText: (data) => request.post('/polish', data),
  getHistory: () => request.get('/polish/history'),
}

export const latexAPI = {
  generate: (data) => request.post('/latex/generate', data),
  render: (data) => request.post('/latex/render', data),
}

export const scheduleAPI = {
  importFromText: (data) => request.post('/schedule/import', data),
  getCurrent: () => request.get('/schedule'),
  addCourse: (data) => request.post('/schedule/course', data),
  updateCourse: (courseId, data) => request.put(`/schedule/course/${courseId}`, data),
  deleteCourse: (courseId) => request.delete(`/schedule/course/${courseId}`),
  getByDay: (day) => request.get(`/schedule/day/${day}`),
  getWallpaper: () => request.get('/schedule/wallpaper'),
}

export const noteAPI = {
  create: (data) => request.post('/notes', data),
  getAll: (params) => request.get('/notes', { params }),
  getOne: (id) => request.get(`/notes/${id}`),
  update: (id, data) => request.put(`/notes/${id}`, data),
  togglePin: (id) => request.patch(`/notes/${id}/pin`),
  summarize: (id) => request.post(`/notes/${id}/summarize`),
  delete: (id) => request.delete(`/notes/${id}`),
  getFolders: () => request.get('/notes/folders'),
}

export const examAPI = {
  generate: (formData) => request.post('/exam/generate', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  create: (data) => request.post('/exam', data),
  getAll: (params) => request.get('/exam', { params }),
  getOne: (id) => request.get(`/exam/${id}`),
  delete: (id) => request.delete(`/exam/${id}`),
  addToWrongBook: (questionId, data) => request.post(`/exam/wrong-book/${questionId}`, data),
  getWrongBook: () => request.get('/exam/wrong-book'),
  removeFromWrongBook: (questionId) => request.delete(`/exam/wrong-book/${questionId}`),
  submitAnswer: (id, data) => request.post(`/exam/${id}/submit`, data),
}

export const experimentAPI = {
  generate: (data) => request.post('/experiment/generate', data),
  getAll: (params) => request.get('/experiment', { params }),
  getOne: (id) => request.get(`/experiment/${id}`),
  update: (id, data) => request.put(`/experiment/${id}`, data),
  delete: (id) => request.delete(`/experiment/${id}`),
  generateChart: (data) => request.post('/experiment/chart', data),
  fitData: (data) => request.post('/experiment/fit', data),
}

export const codeAPI = {
  save: (data) => request.post('/code', data),
  getAll: (params) => request.get('/code', { params }),
  getOne: (id) => request.get(`/code/${id}`),
  update: (id, data) => request.put(`/code/${id}`, data),
  delete: (id) => request.delete(`/code/${id}`),
  addComments: (id) => request.post(`/code/${id}/comments`),
  format: (id) => request.post(`/code/${id}/format`),
  share: (id) => request.post(`/code/${id}/share`),
}

export const englishAPI = {
  bilingualReading: (data) => request.post('/english/bilingual', data),
  oralStart: () => request.post('/english/oral/start'),
  oralChat: (data) => request.post('/english/oral/chat', data),
  oralHistory: () => request.get('/english/oral/history'),
  cetAnalysis: (data) => request.post('/english/cet', data),
}

export const userAPI = {
  getProfile: () => request.get('/users/profile'),
  updateProfile: (data) => request.put('/users/profile', data),
  getStats: () => request.get('/users/stats'),
  deleteAccount: () => request.delete('/users/account'),
}
