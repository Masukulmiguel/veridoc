import dayjs from 'dayjs'
import 'dayjs/locale/pt'

dayjs.locale('pt')

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD/MM/YYYY')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD/MM/YYYY · HH:mm')
}

export function formatRelativeTime(value: string): string {
  const diffDays = dayjs().diff(dayjs(value), 'day')
  if (diffDays <= 0) {
    const diffHours = dayjs().diff(dayjs(value), 'hour')
    if (diffHours <= 0) return 'há poucos minutos'
    return `há ${diffHours} hora${diffHours === 1 ? '' : 's'}`
  }
  if (diffDays === 1) return 'há 1 dia'
  if (diffDays < 30) return `há ${diffDays} dias`
  return formatDate(value)
}

export function shortHash(hash: string, length = 16): string {
  if (!hash) return '—'
  return `${hash.slice(0, length)}…`
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CERTIFICATE: 'Certificado',
  DIPLOMA: 'Diploma',
  TRANSCRIPT: 'Certidão de Notas',
  DECLARATION: 'Declaração',
  CONTRACT: 'Contrato',
  OTHER: 'Outro',
}

export const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const AUDIT_EVENT_LABELS: Record<string, string> = {
  USER_CREATED: 'Utilizador criado',
  LOGIN: 'Início de sessão',
  DOCUMENT_CREATED: 'Documento emitido',
  DOCUMENT_SIGNED: 'Documento assinado',
  DOCUMENT_VERIFIED: 'Documento validado',
  DOCUMENT_REVOKED: 'Documento revogado',
  INSTITUTION_UPDATED: 'Dados da instituição alterados',
  USER_UPDATED: 'Utilizador alterado',
}
