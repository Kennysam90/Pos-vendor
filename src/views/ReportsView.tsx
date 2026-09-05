import { useState, useMemo } from 'react'
import { Download, Loader2, FileText, Calendar } from 'lucide-react'
import { toast } from '../components/Toast'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import { TRANSACTION_TYPE_META } from '../lib/types'
import { formatNaira, formatDateTime } from '../lib/format'

interface Props { data: Stats }

export function ReportsView({ data }: Props) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportType, setReportType] = useState<'transactions' | 'losses' | 'expenses'>('transactions')
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<Record<string, string | number | null>[]>([])

  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate + 'T23:59:59') : null
    const source = reportType === 'transactions' ? data.transactions : reportType === 'losses' ? data.losses : data.expenses
    return source.filter((item) => {
      const d = new Date(item.created_at)
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  }, [data.transactions, data.losses, data.expenses, fromDate, toDate, reportType])

  const generate = () => {
    setGenerating(true)
    setTimeout(() => {
      setReportData(filtered as unknown as Record<string, string | number | null>[])
      setGenerating(false)
      if (filtered.length === 0) toast('info', 'No records found for the selected range')
      else toast('success', `Report generated: ${filtered.length} records`)
    }, 300)
  }

  const exportCSV = () => {
    if (filtered.length === 0) { toast('error', 'No data to export'); return }
    const source = filtered as unknown as Record<string, unknown>[]
    const headers = Object.keys(source[0])
    const csv = [
      headers.join(','),
      ...source.map((row) => headers.map((h) => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const s = typeof val === 'object' ? JSON.stringify(val) : String(val)
        return `"${s.replace(/"/g, '""')}"`
      }).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('success', 'Report exported')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Reports</h1>
        <p className="text-sm text-ink-500 mt-1">Generate and export reports for your records.</p>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-brand-600" />
          <p className="text-sm font-semibold text-ink-700">Report Filters</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Report Type</label>
            <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value as 'transactions' | 'losses' | 'expenses')}>
              <option value="transactions">Transactions</option>
              <option value="losses">Losses</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>
          <div>
            <label className="label">From Date</label>
            <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={exportCSV} disabled={filtered.length === 0} className="btn-secondary">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={generate} disabled={generating} className="btn-primary">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Generate Report
          </button>
        </div>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : reportData.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText size={22} />} title="No report generated" message="Select a date range and click Generate Report to view data." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50">
                  {Object.keys(reportData[0]).slice(0, 6).map((k) => (
                    <th key={k} className="text-left px-4 py-2.5 font-semibold text-ink-700 capitalize">{k.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-ink-50 last:border-0">
                    {Object.keys(reportData[0]).slice(0, 6).map((k) => {
                      const val = row[k]
                      const display = k === 'amount' || k === 'fee' || k === 'recovered_amount' || k === 'total'
                        ? formatNaira(Number(val) || 0)
                        : k === 'created_at'
                          ? formatDateTime(String(val))
                          : k === 'type' && TRANSACTION_TYPE_META[val as keyof typeof TRANSACTION_TYPE_META]
                            ? TRANSACTION_TYPE_META[val as keyof typeof TRANSACTION_TYPE_META].label
                            : String(val ?? '')
                      return <td key={k} className="px-4 py-2.5 text-ink-600">{display}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length > 50 && <p className="text-center text-xs text-ink-400 py-3">Showing 50 of {reportData.length} records. Export CSV for full data.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
