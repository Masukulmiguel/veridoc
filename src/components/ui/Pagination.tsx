import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/utils/cn'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, totalItems, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      <p className="text-sm text-navy-500">
        Página <span className="font-medium text-navy-700">{page}</span> de {totalPages} ·{' '}
        {totalItems} {totalItems === 1 ? 'resultado' : 'resultados'}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          leftIcon={<ChevronLeft className="size-4" />}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          rightIcon={<ChevronRight className="size-4" />}
        >
          Seguinte
        </Button>
      </div>
    </div>
  )
}
