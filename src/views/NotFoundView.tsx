import { Link } from 'lucide-react'

interface Props {
  onGoHome: () => void
}

export function NotFoundView({ onGoHome }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink-50 via-white to-brand-50/30 px-4">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-xl shadow-brand-600/20">
            <span className="text-3xl font-bold">404</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">Page not found</h1>
        <p className="text-sm text-ink-500 max-w-sm mx-auto mb-6">
          The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
        </p>
        <button onClick={onGoHome} className="btn-primary">
          <Link size={16} /> Go to Dashboard
        </button>
      </div>
    </div>
  )
}
