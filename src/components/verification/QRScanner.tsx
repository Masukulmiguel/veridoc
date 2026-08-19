import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface QRScannerProps {
  onScan: (code: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText)
          stopScanner()
          setIsOpen(false)
        },
        () => {},
      )
      .catch(() => {
        setError('Não foi possível aceder à câmara. Verifique as permissões do navegador.')
      })

    return () => {
      stopScanner()
    }
  }, [isOpen])

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear()
      scannerRef.current = null
    }
  }

  function handleClose() {
    stopScanner()
    setIsOpen(false)
    setError('')
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        fullWidth
        leftIcon={<Camera className="size-5" />}
        onClick={() => setIsOpen(true)}
      >
        Ler código QR com a câmara
      </Button>
    )
  }

  return (
    <div className="rounded-2xl border border-navy-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-900">Leitura de código QR</p>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg p-1 text-navy-400 hover:bg-navy-100 hover:text-navy-600"
        >
          <X className="size-4" />
        </button>
      </div>
      <div id="qr-reader" ref={containerRef} className="overflow-hidden rounded-xl" />
      {error && (
        <p className="mt-3 text-center text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
}
