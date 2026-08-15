import { Eye, FileDown, Link2, XCircle } from 'lucide-react'
import { DocumentStatusBadge } from './DocumentStatusBadge'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DOCUMENT_TYPE_LABELS, formatDate } from '@/utils/format'
import type { VeriDocument } from '@/types/document'

export interface DocumentsTableProps {
  documents: VeriDocument[]
  onView: (document: VeriDocument) => void
  onDownload: (document: VeriDocument) => void
  onVerify: (document: VeriDocument) => void
  onRevoke: (document: VeriDocument) => void
  canRevoke: boolean
}

export function DocumentsTable({
  documents,
  onView,
  onDownload,
  onVerify,
  onRevoke,
  canRevoke,
}: DocumentsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-500">
              <th className="px-5 py-3.5 font-semibold">Número</th>
              <th className="px-5 py-3.5 font-semibold">Titular</th>
              <th className="px-5 py-3.5 font-semibold">Tipo</th>
              <th className="px-5 py-3.5 font-semibold">Data</th>
              <th className="px-5 py-3.5 font-semibold">Estado</th>
              <th className="px-5 py-3.5 font-semibold">Validações</th>
              <th className="px-5 py-3.5 text-right font-semibold">Acções</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr
                key={document.id}
                className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/60"
              >
                <td className="px-5 py-4 font-medium text-navy-900">{document.number}</td>
                <td className="px-5 py-4">{document.holderName}</td>
                <td className="px-5 py-4">
                  <Badge>{DOCUMENT_TYPE_LABELS[document.type] ?? document.type}</Badge>
                </td>
                <td className="px-5 py-4 text-navy-500">{formatDate(document.issuedAt)}</td>
                <td className="px-5 py-4">
                  <DocumentStatusBadge status={document.status} />
                </td>
                <td className="px-5 py-4 text-navy-500">{document.verificationCount}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(document)}
                      aria-label="Visualizar"
                      title="Visualizar"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(document)}
                      aria-label="Descarregar PDF"
                      title="Descarregar PDF"
                    >
                      <FileDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVerify(document)}
                      aria-label="Validar"
                      title="Validar"
                    >
                      <Link2 className="size-4" />
                    </Button>
                    {canRevoke && document.status !== 'REVOKED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger-600 hover:bg-danger-50"
                        onClick={() => onRevoke(document)}
                        aria-label="Revogar"
                        title="Revogar"
                      >
                        <XCircle className="size-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-navy-100 md:hidden">
        {documents.map((document) => (
          <div key={document.id} className="space-y-3 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-navy-900">{document.number}</p>
                <p className="mt-0.5 text-sm text-navy-500">{document.holderName}</p>
              </div>
              <DocumentStatusBadge status={document.status} />
            </div>
            <div className="flex items-center justify-between text-sm text-navy-500">
              <span>{DOCUMENT_TYPE_LABELS[document.type] ?? document.type}</span>
              <span>{formatDate(document.issuedAt)}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Button variant="outline" size="sm" onClick={() => onView(document)}>
                Ver detalhes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDownload(document)} aria-label="Descarregar">
                <FileDown className="size-4" />
              </Button>
              {canRevoke && document.status !== 'REVOKED' && (
                <Button variant="ghost" size="sm" onClick={() => onRevoke(document)} aria-label="Revogar">
                  <XCircle className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
