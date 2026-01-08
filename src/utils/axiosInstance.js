import axios from 'axios'
import { store } from '@/redux-store'
import { setLoading } from '@/redux-store/slices/loading'

// Base URL from .env file
let baseURL = process.env.NEXT_PUBLIC_API_URL
if (baseURL && !baseURL.endsWith('/')) baseURL += '/'

const api = axios.create({
  baseURL,
  timeout: 40000,
  headers: { 'Content-Type': 'application/json' }
})

// FILE UPLOAD FIX – MOST IMPORTANT!
api.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'] // Let browser set multipart + boundary
  }
  return config
})

// Token attach interceptor
api.interceptors.request.use(
  config => {
    // Show loader for all requests unless explicitly disabled
    if (config.showLoader !== false) {
      store.dispatch(setLoading(true))
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    store.dispatch(setLoading(false))
    return Promise.reject(error)
  }
)

// Response interceptor (token refresh)
api.interceptors.response.use(
  res => {
    if (res.config.showLoader !== false) {
      store.dispatch(setLoading(false))
    }
    return res
  },
  async err => {
    if (err.config?.showLoader !== false) {
      store.dispatch(setLoading(false))
    }

    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${baseURL}auth/token/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          api.defaults.headers.Authorization = `Bearer ${data.access}`
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          if (typeof window !== 'undefined') window.location.href = '/en/login'
        }
      } else {
        localStorage.removeItem('access_token')
        if (typeof window !== 'undefined') window.location.href = '/en/login'
      }
    }
    return Promise.reject(err)
  }
)

// Dev logging (optional)
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(req => {
    console.log('Request:', req.method?.toUpperCase(), req.url, req.data instanceof FormData ? '[FormData]' : req.data)
    return req
  })
}

export default api
