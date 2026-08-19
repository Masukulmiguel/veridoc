import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, History, ShieldCheck, XCircle } from 'lucide-react'
import { useDocument, useRevokeDocument } from '@/hooks/useDocuments'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/api'
import { verificationUrl } from '@/services/config'
import { fetchInstitutionLogoDataUrl } from '@/services/institution.service'
import { buildDocumentPdf, triggerDownload } from '@/utils/pdf'
import { DOCUMENT_TYPE_LABELS, formatDateTime } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { QRCodeGenerator } from '@/components/documents/QRCodeGenerator'

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: document, isLoading, isError, error } = useDocument(id ?? '')
  const revokeMutation = useRevokeDocument()
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')

  const canRevoke = user?.role === 'ADMIN' && document?.status !== 'REVOKED'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (isError || !document) {
    return (
      <EmptyState
        icon={<ShieldCheck className="size-7" />}
        title="Documento não encontrado"
        description={getErrorMessage(error)}
        action={
          <Link to="/documents">
            <Button variant="outline" leftIcon={<ArrowLeft className="size-4" />}>
              Voltar aos documentos
            </Button>
          </Link>
        }
      />
    )
  }

  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    setDownloadError(null)
    try {
      const logo = await fetchInstitutionLogoDataUrl(document.institution.id)
      const blob = await buildDocumentPdf(document, verificationUrl(document.verificationCode), logo)
      triggerDownload(blob, `${document.number}.pdf`)
    } catch (err) {
      console.error('PDF download error:', err)
      setDownloadError('Não foi possível gerar o PDF. Tente novamente.')
    }
  }

  const handleRevoke = () => {
    revokeMutation.mutate(
      { id: document.id, reason: revokeReason || undefined },
      {
        onSuccess: () => setRevokeOpen(false),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-900"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-navy-900">{document.title}</h1>
            <p className="text-sm text-navy-500">
              {document.institution.name} · {document.number}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" leftIcon={<FileDown className="size-4.5" />} onClick={() => void handleDownload()}>
            Descarregar PDF
          </Button>
          {downloadError && <p className="text-xs text-danger-600">{downloadError}</p>}
          {canRevoke && (
            <Button variant="danger" leftIcon={<XCircle className="size-4.5" />} onClick={() => setRevokeOpen(true)}>
              Revogar documento
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Informação do documento" action={<DocumentStatusBadge status={document.status} />} />
            <CardContent>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoItem label="Tipo de documento" value={DOCUMENT_TYPE_LABELS[document.type] ?? document.type} />
                <InfoItem label="Número do documento" value={document.number} />
                <InfoItem label="Titular" value={document.holderName} />
                <InfoItem label="Instituição emissora" value={document.institution.name} />
                <InfoItem label="Data de emissão" value={formatDateTime(document.issuedAt)} />
                <InfoItem label="Data de validade" value={formatDateTime(document.expiresAt)} />
                <InfoItem label="Validações" value={String(document.verificationCount)} />
                <InfoItem label="Estado" value={document.status} />
              </dl>
              {document.description && (
                <div className="mt-6 border-t border-navy-100 pt-5">
                  <p className="mb-1 text-sm font-medium text-navy-700">Descrição</p>
                  <p className="text-sm leading-relaxed text-navy-500">{document.description}</p>
                </div>
              )}
              {document.fields.length > 0 && (
                <div className="mt-6 border-t border-navy-100 pt-5">
                  <p className="mb-3 text-sm font-medium text-navy-700">Campos adicionais</p>
                  <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {document.fields.map((field) => (
                      <InfoItem key={field.key} label={field.label} value={field.value} />
                    ))}
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Proteção criptográfica"
              description="Hash e assinatura digital do documento"
            />
            <CardContent className="space-y-5">
              <div>
                <p className="mb-1 text-sm font-medium text-navy-700">Hash SHA-256 do conteúdo</p>
                <p className="break-all rounded-xl bg-navy-50 px-4 py-3 font-mono text-xs text-navy-600">
                  {document.contentHash}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-success-100 bg-success-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-success-600" />
                  <div>
                    <p className="text-sm font-medium text-success-700">Assinatura digital</p>
                    <p className="text-xs text-success-700/70">
                      {document.signature.algorithm} · {document.signature.signedBy}
                    </p>
                  </div>
                </div>
                <Badge tone="success">Verificada</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Histórico" description="Eventos registados do documento" />
            <CardContent>
              <ul className="space-y-4">
                {document.history.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-600">
                      <History className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-800">{entry.event}</p>
                      <p className="text-xs text-navy-400">
                        {entry.actor} · {formatDateTime(entry.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Código de validação" />
            <CardContent className="flex flex-col items-center gap-4">
              <QRCodeGenerator value={verificationUrl(document.verificationCode)} size={180} />
              <div className="text-center">
                <p className="font-mono text-lg font-bold tracking-widest text-navy-900">
                  {document.verificationCode}
                </p>
                <p className="mt-1 text-xs text-navy-400">
                  Aponte a câmara ou abra{' '}
                  <span className="font-medium text-primary-600">
                    /verificar/{document.verificationCode}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                fullWidth
                onClick={() =>
                  window.open(`/verificar/${document.verificationCode}`, '_blank')
                }
              >
                Abrir página de validação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        title="Revogar documento"
        description={`O documento ${document.number} deixará de ser considerado válido. Esta acção é irreversível.`}
        size="sm"
      >
        <div className="space-y-5">
          <Alert tone="danger">
            A página pública de validação passará a apresentar "Documento revogado".
          </Alert>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
              Motivo <span className="font-normal text-navy-400">(opcional)</span>
            </label>
            <Input
              value={revokeReason}
              onChange={(event) => setRevokeReason(event.target.value)}
              placeholder="Ex.: Emissão por erro administrativo"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={revokeMutation.isPending}
              onClick={() => void handleRevoke()}
            >
              Confirmar revogação
            </Button>
          </div>
          {revokeMutation.isError && (
            <Alert tone="danger">{getErrorMessage(revokeMutation.error)}</Alert>
          )}
        </div>
      </Modal>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-navy-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}
