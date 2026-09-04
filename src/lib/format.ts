export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-NG').format(n)
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}
