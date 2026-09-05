import { useMemo } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useStatsDerived } from '../lib/usePosData'
import type { Stats } from '../lib/usePosData'
import { TRANSACTION_TYPE_META } from '../lib/types'
import { formatNaira } from '../lib/format'

interface Props { data: Stats }

const PIE_COLORS = ['#1c83f5', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#64748b']

export function AnalyticsView({ data }: Props) {
  const s = useStatsDerived(data)

  const volumeData = useMemo(() => {
    const byDay: Record<string, { date: string; amount: number; fees: number }> = {}
    data.transactions.filter((t) => t.verified && t.status === 'success').forEach((t) => {
      const day = new Date(t.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
      if (!byDay[day]) byDay[day] = { date: day, amount: 0, fees: 0 }
      byDay[day].amount += Number(t.amount)
      byDay[day].fees += Number(t.fee)
    })
    return Object.values(byDay).slice(-14)
  }, [data.transactions])

  const feeByType = useMemo(() => {
    const byType: Record<string, number> = {}
    data.transactions.filter((t) => t.verified && t.status === 'success').forEach((t) => {
      const label = TRANSACTION_TYPE_META[t.type]?.label ?? t.type
      byType[label] = (byType[label] ?? 0) + Number(t.fee)
    })
    return Object.entries(byType).map(([name, value]) => ({ name, value }))
  }, [data.transactions])

  const successData = useMemo(() => [
    { name: 'Success', value: s.successCount },
    { name: 'Failed', value: s.failedCount },
  ], [s.successCount, s.failedCount])

  if (data.loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
        <p className="text-sm text-ink-500 mt-1">Visual insights into your business performance.</p>
      </div>

      {data.transactions.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 mb-4">
              <BarChart3 size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink-900">No data to analyze yet</h3>
            <p className="text-sm text-ink-500 mt-1 max-w-sm">Add transactions to see charts and insights about your business.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card p-5">
            <h2 className="font-bold text-ink-900 mb-4">Transaction Volume (Last 14 Days)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1c83f5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1c83f5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8593aa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8593aa' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatNaira(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }} />
                <Area type="monotone" dataKey="amount" stroke="#1c83f5" strokeWidth={2} fill="url(#colorAmount)" name="Amount" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-bold text-ink-900 mb-4">Fee Earnings by Type</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={feeByType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8593aa' }} tickFormatter={(v) => `₦${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8593aa' }} width={100} />
                  <Tooltip formatter={(v: number) => formatNaira(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#1c83f5" radius={[0, 4, 4, 0]} name="Fees" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h2 className="font-bold text-ink-900 mb-4">Success vs Failed</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={successData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => `${entry.name}: ${entry.value}`}>
                    {successData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
