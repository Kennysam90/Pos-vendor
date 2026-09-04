import {
  TrendingUp, Coins, Wallet, CheckCircle2, AlertTriangle, HandCoins,
  ArrowRight, CreditCard, Activity,
} from 'lucide-react'
import { useStatsDerived } from '../lib/usePosData'
import type { Stats } from '../lib/usePosData'
import { formatNaira, formatDateTime } from '../lib/format'
import { TRANSACTION_TYPE_META, CREDIT_STATUS_META } from '../lib/types'
import { StatCard } from '../components/StatCard'
import { AdvertSlider } from '../components/AdvertSlider'
import { EmptyState } from '../components/EmptyState'

interface Props {
  data: Stats
  onNavigate: (v: string) => void
}

export function DashboardView({ data, onNavigate }: Props) {
  const s = useStatsDerived(data)

  if (data.loading) {
    return <DashboardSkeleton />
  }

  const recentTxns = data.transactions.slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">Overview of your POS business performance.</p>
      </div>

      <AdvertSlider />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Processed" value={formatNaira(s.totalProcessed)} icon={<Coins size={18} />} />
        <StatCard label="Total Fees" value={formatNaira(s.totalFees)} icon={<TrendingUp size={18} />} accent="text-emerald-600" />
        <StatCard label="Net Profit" value={formatNaira(s.netProfit)} icon={<Wallet size={18} />} accent="text-violet-600" />
        <StatCard label="Success Rate" value={`${s.successRate.toFixed(1)}%`} icon={<CheckCircle2 size={18} />} accent="text-emerald-600" />
        <StatCard label="Today's Earnings" value={formatNaira(s.todayEarnings)} icon={<Activity size={18} />} accent="text-brand-600" />
        <StatCard label="Total Float" value={formatNaira(s.totalFloat)} icon={<CreditCard size={18} />} accent="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-ink-900">Recent Transactions</h2>
            <button onClick={() => onNavigate('transactions')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentTxns.length === 0 ? (
            <EmptyState icon={<ArrowRight size={22} />} title="No transactions yet" message="Your recent transactions will appear here." />
          ) : (
            <div className="space-y-2">
              {recentTxns.map((t) => {
                const meta = TRANSACTION_TYPE_META[t.type]
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{meta?.label ?? t.type}</p>
                      <p className="text-xs text-ink-400">{formatDateTime(t.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-ink-900">{formatNaira(Number(t.amount))}</p>
                      <p className={`text-xs ${t.status === 'success' ? 'text-emerald-600' : t.status === 'failed' ? 'text-rose-600' : 'text-amber-600'}`}>{t.status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink-900">Low Float Alerts</h2>
              <button onClick={() => onNavigate('machines')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Manage <ArrowRight size={12} />
              </button>
            </div>
            {s.lowFloatMachines.length === 0 ? (
              <EmptyState icon={<Wallet size={22} />} title="All good!" message="No machines are below the low-float threshold." />
            ) : (
              <div className="space-y-2">
                {s.lowFloatMachines.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      <span className="text-sm font-medium text-ink-900 truncate">{m.nickname}</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-600 shrink-0">{formatNaira(Number(m.current_float))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink-900">Overdue Credits</h2>
              <button onClick={() => onNavigate('credits')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            {s.overdueCredits.length === 0 ? (
              <EmptyState icon={<HandCoins size={22} />} title="No overdue credits" message="All credits are on track." />
            ) : (
              <div className="space-y-2">
                {s.overdueCredits.slice(0, 4).map((c) => {
                  const meta = CREDIT_STATUS_META[c.status]
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{c.customer_name}</p>
                        <p className="text-xs text-ink-400">Due {c.due_date ? formatDateTime(c.due_date) : '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-rose-600">{formatNaira(Number(c.amount) - Number(c.repaid_amount))}</p>
                        <span className={`badge ${meta?.bg} ${meta?.color}`}>{meta?.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-ink-100 rounded-lg" />
      <div className="h-20 bg-ink-100 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-ink-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
