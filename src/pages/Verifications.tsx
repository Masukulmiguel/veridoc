import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { listAudit } from '@/services/audit.service'
import { getErrorMessage } from '@/services/api'
import { formatDateTime } from '@/utils/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'

export default function Verifications() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['verifications', page],
    queryFn: () => listAudit({ action: 'DOCUMENT_VERIFIED', page, pageSize: 15 }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validações"
        description="Registo das validações públicas dos seus documentos."
      />

      {isError && <Alert tone="danger">{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldCheck className="size-7" />}
            title="Sem validações registadas"
            description="Quando alguém validar um documento, o registo aparecerá aqui."
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-500">
                  <th className="px-5 py-3.5 font-semibold">Documento</th>
                  <th className="px-5 py-3.5 font-semibold">Código</th>
                  <th className="px-5 py-3.5 font-semibold">Data</th>
                  <th className="px-5 py-3.5 font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => {
                  const result = String(entry.metadata?.result ?? 'VALID')
                  return (
                    <tr key={entry.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                      <td className="px-5 py-4 font-mono text-xs font-medium text-navy-900">
                        {entry.entityId}
                      </td>
                      <td className="px-5 py-4 text-navy-500">—</td>
                      <td className="px-5 py-4 text-navy-500">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Badge tone={result === 'VALID' ? 'success' : 'danger'}>{result}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}
