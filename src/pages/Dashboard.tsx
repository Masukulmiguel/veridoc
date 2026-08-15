import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FilePlus2, FileText, ShieldCheck, XCircle, ArrowRight } from 'lucide-react'
import { getDashboardStats } from '@/services/institution.service'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusChart } from '@/components/dashboard/StatusChart'
import { ActivityList } from '@/components/dashboard/ActivityList'
import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const canIssue = user?.role === 'ADMIN' || user?.role === 'ISSUER'

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Olá, ${user?.name.split(' ')[0] ?? ''}`}
        description="Resumo da atividade da sua instituição."
        actions={
          canIssue && (
            <Link to="/documents/new">
              <Button leftIcon={<FilePlus2 className="size-4.5" />}>
                Emitir documento
              </Button>
            </Link>
          )
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <EmptyState
          icon={<FileText className="size-7" />}
          title="Não foi possível carregar o resumo"
          description="Tente novamente em instantes."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Documentos emitidos"
              value={data.totalDocuments}
              icon={<FileText className="size-6" />}
              tone="primary"
            />
            <StatCard
              label="Documentos válidos"
              value={data.validDocuments}
              icon={<ShieldCheck className="size-6" />}
              tone="success"
            />
            <StatCard
              label="Documentos revogados"
              value={data.revokedDocuments}
              icon={<XCircle className="size-6" />}
              tone="danger"
            />
            <StatCard
              label="Total de validações"
              value={data.totalVerifications}
              icon={<ShieldCheck className="size-6" />}
              tone="navy"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Estado dos documentos"
                description="Distribuição atual por estado"
              />
              <CardContent>
                <StatusChart
                  data={[
                    {
                      status: 'VALID',
                      label: 'Válidos',
                      count: data.validDocuments,
                      className: 'bg-success-500',
                    },
                    {
                      status: 'REVOKED',
                      label: 'Revogados',
                      count: data.revokedDocuments,
                      className: 'bg-danger-500',
                    },
                    {
                      status: 'EXPIRED',
                      label: 'Expirados',
                      count: data.totalDocuments - data.validDocuments - data.revokedDocuments,
                      className: 'bg-warning-500',
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader
                title="Atividade recente"
                description="Últimas ações registadas na auditoria"
                action={
                  <Link to="/audit">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                      Ver auditoria
                    </Button>
                  </Link>
                }
              />
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <EmptyState title="Sem atividade recente" />
                ) : (
                  <ActivityList events={data.recentActivity} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
