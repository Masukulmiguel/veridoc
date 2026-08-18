import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, FilePlus2, FileText } from 'lucide-react'
import { useDocuments, useRevokeDocument } from '@/hooks/useDocuments'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/api'
import { verificationUrl } from '@/services/config'
import { buildDocumentPdf, triggerDownload } from '@/utils/pdf'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { DocumentsTable } from '@/components/documents/DocumentsTable'
import { DOCUMENT_TYPE_OPTIONS } from '@/utils/format'
import type { DocumentStatus, DocumentType, VeriDocument } from '@/types/document'

const STATUS_FILTERS: Array<{ value: DocumentStatus | ''; label: string }> = [
  { value: '', label: 'Todos os estados' },
  { value: 'VALID', label: 'Válidos' },
  { value: 'REVOKED', label: 'Revogados' },
  { value: 'EXPIRED', label: 'Expirados' },
  { value: 'PENDING', label: 'Pendentes' },
]

export default function Documents() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<DocumentStatus | ''>('')
  const [type, setType] = useState<DocumentType | ''>('')
  const [page, setPage] = useState(1)
  const [revokeTarget, setRevokeTarget] = useState<VeriDocument | null>(null)
  const [revokeReason, setRevokeReason] = useState('')

  const canIssue = user?.role === 'ADMIN' || user?.role === 'ISSUER'
  const canRevoke = user?.role === 'ADMIN'

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, type])

  const { data, isLoading, isError, error } = useDocuments({
    page,
    pageSize: 10,
    search: debouncedSearch || undefined,
    status: status || undefined,
    type: type || undefined,
  })

  const revokeMutation = useRevokeDocument()

  async function handleDownload(document: VeriDocument) {
    const blob = await buildDocumentPdf(document, verificationUrl(document.verificationCode))
    triggerDownload(blob, `${document.number}.pdf`)
  }

  function handleRevoke() {
    if (!revokeTarget) return
    revokeMutation.mutate(
      { id: revokeTarget.id, reason: revokeReason || undefined },
      {
        onSuccess: () => {
          setRevokeTarget(null)
          setRevokeReason('')
        },
        onError: (mutationError) => {
          alert(getErrorMessage(mutationError))
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gestão dos documentos emitidos pela instituição."
        actions={
          canIssue && (
            <Link to="/documents/new">
              <Button leftIcon={<FilePlus2 className="size-4.5" />}>Emitir documento</Button>
            </Link>
          )
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por número, titular, título ou código…"
              className="pl-10"
              aria-label="Pesquisar documentos"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as DocumentStatus | '')}
            aria-label="Filtrar por estado"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={(event) => setType(event.target.value as DocumentType | '')} aria-label="Filtrar por tipo">
            <option value="">Todos os tipos</option>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isError && (
        <Alert tone="danger" title="Erro ao carregar documentos">
          {getErrorMessage(error)}
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="size-7" />}
            title="Nenhum documento encontrado"
            description="Ajuste os filtros ou emita um novo documento."
            action={
              canIssue ? (
                <Link to="/documents/new">
                  <Button leftIcon={<FilePlus2 className="size-4" />}>Emitir documento</Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <DocumentsTable
            documents={data.items}
            onView={(document) => navigate(`/documents/${document.id}`)}
            onDownload={handleDownload}
            onVerify={(document) =>
              window.open(`/verificar/${document.verificationCode}`, '_blank')
            }
            onRevoke={setRevokeTarget}
            canRevoke={canRevoke}
          />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            onChange={setPage}
          />
        </>
      )}

      <Modal
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        title="Revogar documento"
        description={
          revokeTarget
            ? `O documento ${revokeTarget.number} deixará de ser considerado válido. Esta acção é irreversível.`
            : undefined
        }
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
              Motivo da revogação <span className="font-normal text-navy-400">(opcional)</span>
            </label>
            <Input
              value={revokeReason}
              onChange={(event) => setRevokeReason(event.target.value)}
              placeholder="Ex.: Emissão por erro administrativo"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={revokeMutation.isPending}
              onClick={() => void handleRevoke()}
            >
              Revogar documento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
