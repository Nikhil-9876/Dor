import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — surface structured error messages
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

export default api
