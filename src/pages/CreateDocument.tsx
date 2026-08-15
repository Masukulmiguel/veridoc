import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileDown, FilePlus2, ShieldCheck } from 'lucide-react'
import { useCreateDocument } from '@/hooks/useDocuments'
import { getErrorMessage } from '@/services/api'
import { verificationUrl } from '@/services/config'
import { buildDocumentPdf, triggerDownload } from '@/utils/pdf'
import { formatDateTime } from '@/utils/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { DocumentForm } from '@/components/forms/DocumentForm'
import { QRCodeGenerator } from '@/components/documents/QRCodeGenerator'
import type { VeriDocument } from '@/types/document'

export default function CreateDocument() {
  const createMutation = useCreateDocument()
  const [issued, setIssued] = useState<VeriDocument | null>(null)

  function handleIssued(document: VeriDocument) {
    setIssued(document)
  }

  function handleDownload() {
    if (!issued) return
    const blob = buildDocumentPdf(issued, verificationUrl(issued.verificationCode))
    triggerDownload(blob, `${issued.number}.pdf`)
  }

  if (issued) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4 rounded-2xl border border-success-200 bg-success-50 p-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success-600 text-white">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-success-700">
              Documento emitido com sucesso.
            </h1>
            <p className="mt-0.5 text-sm text-success-700/80">
              O documento foi criado e já pode ser verificado através do QR Code.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader
            title={issued.title}
            description={`${issued.institution.name} · ${issued.number}`}
            action={<Badge tone="success">Válido</Badge>}
          />
          <CardContent>
            <div className="grid gap-8 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                <QRCodeGenerator value={verificationUrl(issued.verificationCode)} />
                <p className="font-mono text-sm font-semibold text-navy-900">
                  {issued.verificationCode}
                </p>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-navy-50 pb-2">
                  <dt className="text-navy-500">ID único</dt>
                  <dd className="font-medium text-navy-900">{issued.id}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-navy-50 pb-2">
                  <dt className="text-navy-500">Código de validação</dt>
                  <dd className="font-medium text-navy-900">{issued.verificationCode}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-navy-50 pb-2">
                  <dt className="text-navy-500">Estado</dt>
                  <dd className="font-medium text-navy-900">{issued.status}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-navy-50 pb-2">
                  <dt className="text-navy-500">Data de emissão</dt>
                  <dd className="font-medium text-navy-900">{formatDateTime(issued.issuedAt)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-navy-50 pb-2">
                  <dt className="text-navy-500">Hash SHA-256</dt>
                  <dd className="max-w-[16rem] break-all font-mono text-xs text-navy-900">
                    {issued.contentHash}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <dt className="text-navy-500">Assinatura digital</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-success-700">
                    <ShieldCheck className="size-4" />
                    {issued.signature.algorithm}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-3">
            <Button variant="outline" leftIcon={<FileDown className="size-4.5" />} onClick={handleDownload}>
              Descarregar PDF
            </Button>
            <Link to={`/documents/${issued.id}`}>
              <Button variant="outline">Ver detalhes</Button>
            </Link>
          </div>
          <Button
            onClick={() => setIssued(null)}
            leftIcon={<FilePlus2 className="size-4.5" />}
          >
            Emitir outro documento
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Emitir documento"
        description="Crie um novo documento digital com hash, assinatura e QR Code."
      />

      {createMutation.isError && (
        <Alert tone="danger" title="Não foi possível emitir o documento">
          {getErrorMessage(createMutation.error)}
        </Alert>
      )}

      <Card>
        <CardContent>
          <DocumentForm
            isSubmitting={createMutation.isPending}
            onSubmit={async (payload) => {
              try {
                const document = await createMutation.mutateAsync(payload)
                handleIssued(document)
              } catch {
                // O erro é apresentado pelo Alert acima
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
