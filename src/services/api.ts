import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { API_URL } from './config'
import type { ApiErrorPayload } from '@/types/api'

export const TOKEN_STORAGE_KEY = 'veridoc.accessToken'
export const REFRESH_STORAGE_KEY = 'veridoc.refreshToken'
export const USER_STORAGE_KEY = 'veridoc.user'
export const SESSION_EXPIRED_EVENT = 'veridoc:session-expired'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_STORAGE_KEY)
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken)
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function notifySessionExpired(): void {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

function toCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, ch: string) => ch.toUpperCase())
}

function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`)
}

function transformKeys(value: unknown, transformKey: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => transformKeys(item, transformKey))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [transformKey(key), transformKeys(val, transformKey)]),
    )
  }
  return value
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data && typeof config.data === 'object') {
    config.data = transformKeys(config.data, toSnakeKey)
  }
  if (config.params && typeof config.params === 'object') {
    config.params = transformKeys(config.params, toSnakeKey)
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('Sessão sem token de actualização')
  }
  const response = await axios.post<{ access_token: string; refresh_token?: string }>(
    `${API_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  )
  setTokens(response.data.access_token, response.data.refresh_token)
  return response.data.access_token
}

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeys(response.data, toCamelKey)
    }
    return response
  },
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 401 && original && !original._retry && getRefreshToken()) {
      original._retry = true
      try {
        refreshPromise ??= refreshAccessToken()
        const token = await refreshPromise
        refreshPromise = null
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${token}`,
        }
        return api(original)
      } catch (refreshError) {
        refreshPromise = null
        clearSession()
        notifySessionExpired()
        return Promise.reject(refreshError)
      }
    }

    if (status === 401) {
      clearSession()
      notifySessionExpired()
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined
    if (payload?.detail) {
      if (Array.isArray(payload.detail)) {
        return payload.detail.map((d: { msg?: string }) => d.msg ?? 'Erro de validação').join('; ')
      }
      if (typeof payload.detail === 'string') return payload.detail
      if (typeof payload.detail === 'object') return JSON.stringify(payload.detail)
    }
    if (payload?.message) return String(payload.message)
    if (error.code === 'ECONNABORTED') return 'O servidor excedeu o tempo limite de resposta. Tente novamente.'
    if (!error.response) return 'Não foi possível estabelecer ligação ao servidor. Verifique a sua ligação à internet.'
    if (error.response.status === 401) return 'Sessão expirada. Inicie sessão novamente.'
    if (error.response.status === 403) return 'Não possui permissões para realizar esta operação.'
    if (error.response.status === 404) return 'O recurso solicitado não foi encontrado.'
    return `Ocorreu um erro inesperado (código ${error.response.status}).`
  }
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}
