import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useVerification } from '@/hooks/useVerification'
import { getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { VerificationResult } from '@/components/verification/VerificationResult'

export default function VerifyDocument() {
  const { codigo } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  const verification = useVerification()
  const [code, setCode] = useState(codigo ?? '')
  const [documentId, setDocumentId] = useState('')

  const { mutate: runVerification } = verification

  useEffect(() => {
    if (codigo) {
      setCode(codigo)
      runVerification({ code: codigo })
    }
  }, [codigo, runVerification])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!code.trim() && !documentId.trim()) return
    runVerification({ code: code.trim() || undefined, documentId: documentId.trim() || undefined })
    navigate('/verificar', { replace: true })
  }

  function handleReset() {
    setCode('')
    setDocumentId('')
    verification.reset()
    navigate('/verificar', { replace: true })
  }

  const showResult = verification.data && !verification.isPending

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="pt-16">

      <main className="container-page flex flex-col items-center py-10 sm:py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
              Verificar documento
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-navy-500">
              Introduza o código de validação ou o ID do documento recebido para confirmar a sua
              autenticidade.
            </p>
          </div>

          {!showResult && (
            <div className="rounded-3xl border border-navy-200 bg-white p-6 shadow-card sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="verify-code">Código de validação</Label>
                  <Input
                    id="verify-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="Ex.: V001"
                    autoCapitalize="characters"
                    className="text-center font-mono text-lg tracking-widest uppercase"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-navy-200" />
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-400">ou</span>
                  <div className="h-px flex-1 bg-navy-200" />
                </div>

                <div>
                  <Label htmlFor="verify-id">ID do documento</Label>
                  <Input
                    id="verify-id"
                    value={documentId}
                    onChange={(event) => setDocumentId(event.target.value)}
                    placeholder="Ex.: VD-2026-0001"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  isLoading={verification.isPending}
                  disabled={!code.trim() && !documentId.trim()}
                >
                  Validar documento
                </Button>

                <p className="text-center text-xs leading-relaxed text-navy-400">
                  A verificação cobre apenas documentos emitidos por instituições registadas na
                  VeriDoc. A presença de um QR Code por si só não garante a autenticidade.
                </p>
              </form>
            </div>
          )}

          <div className="mt-6">
            {verification.isPending && (
              <div className="flex flex-col items-center gap-4 py-10 text-navy-500">
                <Spinner size="lg" className="text-primary-600" />
                <p className="text-sm">A verificar o documento…</p>
              </div>
            )}

            {verification.isError && (
              <Alert tone="danger" title="Não foi possível validar este documento.">
                {getErrorMessage(verification.error)}
              </Alert>
            )}

            {showResult && <VerificationResult result={verification.data} onReset={handleReset} />}
          </div>

          <p className="mt-8 text-center text-xs text-navy-400">
            É uma instituição?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Emita documentos na VeriDoc
            </Link>
          </p>
        </div>
      </main>
      </div>
    </div>
  )
}
