import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors',
        {
          'bg-slate-100 text-slate-700': variant === 'default',
          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20': variant === 'success',
          'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20': variant === 'warning',
          'bg-red-50 text-red-700 ring-1 ring-red-600/20': variant === 'danger',
          'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20': variant === 'info',
          'bg-transparent text-slate-600 ring-1 ring-slate-200': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
