import type { ReactNode } from 'react'
import { CheckCircle2, ShieldAlert, ShieldCheck, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DOCUMENT_TYPE_LABELS, formatDate, formatDateTime } from '@/utils/format'
import type { VerificationDetails } from '@/types/verification'
import { cn } from '@/utils/cn'

interface VerificationResultProps {
  result: VerificationDetails
  onReset: () => void
}

export function VerificationResult({ result, onReset }: VerificationResultProps) {
  const isFound = result.outcome !== 'NOT_FOUND' && result.document.id !== ''

  if (!isFound) {
    return (
      <div className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-danger-100 text-danger-600">
          <ShieldAlert className="size-9" />
        </div>
        <h2 className="font-display text-xl font-bold text-danger-700">
          Documento não encontrado
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-danger-700/80">
          O código ou identificador indicado não corresponde a qualquer documento emitido pela
          VeriDoc. Verifique os dados introduzidos e tente novamente.
        </p>
        <Button variant="outline" className="mt-6" onClick={onReset}>
          Nova validação
        </Button>
      </div>
    )
  }

  const outcomeStyles = {
    VALID: {
      banner: 'bg-success-50 border-success-200',
      icon: <CheckCircle2 className="size-10 text-success-600" />,
      title: 'Documento válido',
      description: result.message,
      text: 'text-success-700',
      badge: 'bg-success-100 text-success-700',
    },
    REVOKED: {
      banner: 'bg-danger-50 border-danger-200',
      icon: <XCircle className="size-10 text-danger-600" />,
      title: 'Este documento foi revogado',
      description: result.message,
      text: 'text-danger-700',
      badge: 'bg-danger-100 text-danger-700',
    },
    EXPIRED: {
      banner: 'bg-warning-50 border-warning-200',
      icon: <Clock className="size-10 text-warning-600" />,
      title: 'Documento expirado',
      description: result.message,
      text: 'text-warning-700',
      badge: 'bg-warning-100 text-warning-700',
    },
    INVALID: {
      banner: 'bg-danger-50 border-danger-200',
      icon: <ShieldAlert className="size-10 text-danger-600" />,
      title: 'Integridade não confirmada',
      description: result.message,
      text: 'text-danger-700',
      badge: 'bg-danger-100 text-danger-700',
    },
    NOT_FOUND: {
      banner: '',
      icon: null,
      title: '',
      description: '',
      text: '',
      badge: '',
    },
  }[result.outcome]

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-2xl border p-8 text-center shadow-card',
          outcomeStyles.banner,
        )}
      >
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-card">
          {outcomeStyles.icon}
        </div>
        <h2 className={cn('font-display text-2xl font-bold', outcomeStyles.text)}>
          {outcomeStyles.title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy-600">{outcomeStyles.description}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-card">
        <div className="border-b border-navy-100 px-6 py-5">
          <p className="font-display text-lg font-semibold text-navy-900">
            {result.document.title}
          </p>
          <p className="mt-0.5 text-sm text-navy-500">{result.document.issuer.name}</p>
        </div>
        <dl className="divide-y divide-navy-50">
          <InfoRow label="Instituição emissora" value={result.document.issuer.name} />
          <InfoRow
            label="Tipo de documento"
            value={DOCUMENT_TYPE_LABELS[result.document.type] ?? result.document.type}
          />
          <InfoRow label="Número do documento" value={result.document.number} />
          <InfoRow label="Titular" value={result.document.holderName} />
          <InfoRow label="Data de emissão" value={formatDate(result.document.issuedAt)} />
          <InfoRow label="Data de validação" value={formatDateTime(result.verifiedAt)} />
          <InfoRow
            label="Assinatura digital"
            value={
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  outcomeStyles.badge,
                )}
              >
                <ShieldCheck className="size-3.5" />
                {result.signature?.valid ? 'Assinatura verificada' : 'Assinatura não verificada'}
              </span>
            }
          />
          {result.signature?.algorithm && (
            <InfoRow label="Algoritmo" value={result.signature.algorithm} />
          )}
          <InfoRow label="Referência" value={result.reference} />
        </dl>
      </div>

      <p className="rounded-xl border border-navy-100 bg-navy-50 px-4 py-3 text-center text-xs text-navy-500">
        A validação foi registada na VeriDoc a {formatDateTime(result.verifiedAt)}. O presente
        resultado não certifica a autenticidade de documentos não emitidos pela plataforma.
      </p>

      <Button variant="outline" fullWidth onClick={onReset}>
        Validar outro documento
      </Button>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <dt className="text-sm text-navy-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}
