import { useEffect, useState } from 'react'
import { Search, ScrollText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listAudit } from '@/services/audit.service'
import { getErrorMessage } from '@/services/api'
import { AUDIT_EVENT_LABELS, formatDateTime } from '@/utils/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import type { AuditEventType } from '@/types/institution'

const ACTION_FILTERS: Array<{ value: AuditEventType | ''; label: string }> = [
  { value: '', label: 'Todas as ações' },
  ...Object.entries(AUDIT_EVENT_LABELS).map(([value, label]) => ({
    value: value as AuditEventType,
    label,
  })),
]

export default function Audit() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [action, setAction] = useState<AuditEventType | ''>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, action])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit', { page, search: debouncedSearch, action }],
    queryFn: () =>
      listAudit({
        page,
        pageSize: 15,
        search: debouncedSearch || undefined,
        action: action || undefined,
      }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Registo de todas as operações importantes da instituição."
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por utilizador ou documento…"
              className="pl-10"
              aria-label="Pesquisar auditoria"
            />
          </div>
          <Select
            value={action}
            onChange={(event) => setAction(event.target.value as AuditEventType | '')}
            aria-label="Filtrar por ação"
          >
            {ACTION_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

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
            icon={<ScrollText className="size-7" />}
            title="Sem registos de auditoria"
            description="As operações importantes aparecerão aqui."
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-500">
                  <th className="px-5 py-3.5 font-semibold">Ação</th>
                  <th className="px-5 py-3.5 font-semibold">Utilizador</th>
                  <th className="px-5 py-3.5 font-semibold">Documento</th>
                  <th className="px-5 py-3.5 font-semibold">Data</th>
                  <th className="px-5 py-3.5 font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                    <td className="px-5 py-4 font-medium text-navy-900">
                      {AUDIT_EVENT_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className="px-5 py-4 text-navy-600">{entry.actorName}</td>
                    <td className="px-5 py-4 font-mono text-xs text-navy-500">{entry.entityId}</td>
                    <td className="px-5 py-4 text-navy-500">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-5 py-4">
                      <Badge tone="success">Sucesso</Badge>
                    </td>
                  </tr>
                ))}
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
