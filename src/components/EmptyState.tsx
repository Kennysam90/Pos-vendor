import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  message: string
  action?: ReactNode
}

export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500 mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
