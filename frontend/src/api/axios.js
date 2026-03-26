import axios from 'axios'

// In production (Vercel), use VITE_API_URL env var pointing to Railway backend.
// In development, use '/api' which Vite proxies to localhost:3001.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wft_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wft_token')
      localStorage.removeItem('wft_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
