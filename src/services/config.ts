export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export const USE_MOCKS: boolean =
  import.meta.env.VITE_USE_MOCKS === undefined || import.meta.env.VITE_USE_MOCKS === 'true'

export const VERIDOC_PUBLIC_URL: string = import.meta.env.VITE_VERIDOC_PUBLIC_URL ?? 'https://veridoc.ao'

export function verificationUrl(code: string): string {
  return `${VERIDOC_PUBLIC_URL}/verificar/${encodeURIComponent(code)}`
}
