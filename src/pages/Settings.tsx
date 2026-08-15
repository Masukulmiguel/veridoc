import { ShieldCheck, TerminalSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listAudit } from '@/services/audit.service'
import { getErrorMessage } from '@/services/api'
import { API_URL, USE_MOCKS } from '@/services/config'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/utils/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'

export default function Settings() {
  const { user } = useAuth()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['settings-verifications'],
    queryFn: () => listAudit({ action: 'DOCUMENT_VERIFIED', pageSize: 10 }),
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Definições" description="Configurações da sua conta e da plataforma." />

      <Card>
        <CardHeader title="Conta" description="Informação da sessão atual" />
        <CardContent>
          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-navy-500">Nome</dt>
              <dd className="font-medium text-navy-900">{user?.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-navy-500">E-mail</dt>
              <dd className="font-medium text-navy-900">{user?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-navy-500">Função</dt>
              <dd className="font-medium text-navy-900">{user?.role}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Ligação à API" description="Configuração do frontend" />
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-navy-100 bg-navy-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <TerminalSquare className="size-5 text-navy-500" />
              <div>
                <p className="text-sm font-medium text-navy-800">Modo de demonstração</p>
                <p className="font-mono text-xs text-navy-500">{API_URL}</p>
              </div>
            </div>
            <Badge tone={USE_MOCKS ? 'warning' : 'success'}>
              {USE_MOCKS ? 'Mocks ativos' : 'API ligada'}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-navy-400">
            Defina <span className="font-mono">VITE_USE_MOCKS=false</span> e{' '}
            <span className="font-mono">VITE_API_URL</span> para ligar ao backend FastAPI.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Validações recentes"
          description="Últimas validações públicas registadas"
        />
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <Alert tone="danger">{getErrorMessage(error)}</Alert>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="size-7" />}
              title="Sem validações recentes"
              description="As validações públicas aparecerão aqui."
            />
          ) : (
            <ul className="divide-y divide-navy-50">
              {data.items.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-success-50 text-success-600">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-800">Documento validado</p>
                      <p className="font-mono text-xs text-navy-400">{entry.entityId}</p>
                    </div>
                  </div>
                  <span className="text-xs text-navy-400">{formatDateTime(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-navy-100 bg-navy-50 px-4 py-3 text-xs leading-relaxed text-navy-500">
        <strong className="font-semibold text-navy-700">Segurança:</strong> as chaves privadas de
        assinatura residem exclusivamente no backend. O frontend nunca tem acesso à chave privada.
      </div>
    </div>
  )
}
