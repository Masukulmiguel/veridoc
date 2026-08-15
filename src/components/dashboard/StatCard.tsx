import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  tone?: 'primary' | 'success' | 'danger' | 'warning' | 'navy'
}

const TONE_CLASSES = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-600',
  navy: 'bg-navy-100 text-navy-700',
}

export function StatCard({ label, value, icon, tone = 'primary' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl',
            TONE_CLASSES[tone],
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold tracking-tight text-navy-900">{value}</p>
          <p className="truncate text-sm text-navy-500">{label}</p>
        </div>
      </div>
    </Card>
  )
}
