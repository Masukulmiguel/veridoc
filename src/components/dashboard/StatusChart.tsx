import type { DocumentStatus } from '@/types/document'
import { cn } from '@/utils/cn'

interface StatusChartProps {
  data: Array<{ status: DocumentStatus; label: string; count: number; className: string }>
  className?: string
}

export function StatusChart({ data, className }: StatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className={cn('space-y-4', className)}>
      {data.map((item) => {
        const percentage = total === 0 ? 0 : Math.round((item.count / total) * 100)
        return (
          <div key={item.status}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-navy-600">{item.label}</span>
              <span className="font-medium text-navy-900">
                {item.count} <span className="text-xs font-normal text-navy-400">({percentage}%)</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-navy-100">
              <div
                className={cn('h-full rounded-full transition-all duration-500', item.className)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
