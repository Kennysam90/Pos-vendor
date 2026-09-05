import { useState, useEffect } from 'react'
import { Calculator, Plus, Trash2 } from 'lucide-react'
import { TRANSACTION_TYPE_META } from '../lib/types'
import type { TransactionType } from '../lib/types'
import { formatNaira } from '../lib/format'

interface Props { onDataChanged: () => Promise<void> }

interface CalcEntry {
  id: string
  type: TransactionType
  amount: number
  fee: number
  note: string
  created_at: string
}

const FEE_RATES: Record<TransactionType, { mode: 'percentage' | 'fixed'; value: number }> = {
  withdrawal: { mode: 'percentage', value: 0.6 },
  transfer: { mode: 'percentage', value: 0.5 },
  airtime: { mode: 'percentage', value: 2 },
  data: { mode: 'percentage', value: 2 },
  bill_payment: { mode: 'percentage', value: 1.5 },
  betting: { mode: 'percentage', value: 1 },
  tv_subscription: { mode: 'percentage', value: 1.5 },
  cash_deposit: { mode: 'percentage', value: 0.5 },
  balance_inquiry: { mode: 'fixed', value: 50 },
}

function calcFee(type: TransactionType, amount: number): number {
  const rate = FEE_RATES[type]
  if (rate.mode === 'fixed') return rate.value
  return Math.round((amount * rate.value) / 100)
}

const STORAGE_KEY = 'pos_salecalc_entries'

export function SaleCalcView(_: Props) {
  const [type, setType] = useState<TransactionType>('withdrawal')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState<CalcEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const save = (list: CalcEntry[]) => {
    setEntries(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  const fee = amount ? calcFee(type, Number(amount)) : 0

  const handleAdd = () => {
    const amt = Number(amount) || 0
    if (amt <= 0) return
    const entry: CalcEntry = {
      id: Date.now().toString(36),
      type, amount: amt, fee: calcFee(type, amt),
      note: note.trim(), created_at: new Date().toISOString(),
    }
    save([entry, ...entries])
    setAmount(''); setNote('')
  }

  const handleDelete = (id: string) => save(entries.filter((e) => e.id !== id))

  const totalFees = entries.reduce((sum, e) => sum + e.fee, 0)
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Sales Calculator</h1>
        <p className="text-sm text-ink-500 mt-1">Estimate fees for different transaction types. Saved locally on your device.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator size={18} className="text-brand-600" />
          <p className="text-sm font-semibold text-ink-700">New Calculation</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Transaction Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
              {Object.entries(TRANSACTION_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₦)</label>
            <input className="input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="input" placeholder="e.g. Morning withdrawal" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {amount && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-700">Estimated Fee ({FEE_RATES[type].mode === 'fixed' ? 'fixed' : `${FEE_RATES[type].value}%`})</p>
              <p className="text-2xl font-bold text-brand-700">{formatNaira(fee)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-500">You receive</p>
              <p className="text-lg font-semibold text-ink-900">{formatNaira(fee)}</p>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={handleAdd} disabled={!amount || Number(amount) <= 0} className="btn-primary"><Plus size={16} /> Save Calculation</button>
        </div>
      </div>

      {entries.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-ink-400">Total Calculated</p>
              <p className="text-lg font-bold text-ink-900">{formatNaira(totalAmount)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-ink-400">Total Fees</p>
              <p className="text-lg font-bold text-emerald-600">{formatNaira(totalFees)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {entries.map((e) => {
              const meta = TRANSACTION_TYPE_META[e.type]
              return (
                <div key={e.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className={`badge ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    {e.note && <p className="text-sm text-ink-700 mt-1">{e.note}</p>}
                    <p className="text-xs text-ink-400 mt-0.5">Amount: {formatNaira(e.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold text-emerald-600">{formatNaira(e.fee)}</p>
                    <button onClick={() => handleDelete(e.id)} className="btn-ghost px-1.5 py-1 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
