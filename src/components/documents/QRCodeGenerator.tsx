import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/utils/cn'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeGenerator({ value, size = 168, className }: QRCodeGeneratorProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-2xl border border-navy-200 bg-white p-3 shadow-card',
        className,
      )}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={1}
        fgColor="#0F172A"
        bgColor="#FFFFFF"
      />
    </div>
  )
}
