import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))

request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject({ status, message: data?.message || '请求失败', data })
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ status: 408, message: '请求超时，请检查网络' })
    }
    return Promise.reject({ status: 0, message: '网络连接失败，请检查网络' })
  }
)

export const setToken = (token) => { localStorage.setItem('token', token) }
export const getToken = () => localStorage.getItem('token')
export const clearToken = () => { localStorage.removeItem('token'); localStorage.removeItem('user') }
export default request
