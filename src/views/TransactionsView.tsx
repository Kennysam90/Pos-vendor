import { useState, useMemo } from 'react'
import { ArrowUpDown, Plus, Loader2, Filter, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { TransactionType, Transaction } from '../lib/types'
import { TRANSACTION_TYPE_META } from '../lib/types'
import { formatNaira, formatDateTime } from '../lib/format'

interface Props {
  data: Stats
}

const STATUS_COLOR: Record<string, string> = {
  success: 'text-emerald-600',
  failed: 'text-rose-600',
  reversed: 'text-amber-600',
}

type FormState = {
  machine_id: string
  type: TransactionType
  customer_name: string
  amount: string
  fee: string
  status: Transaction['status']
  phone: string
  notes: string
}

const EMPTY: FormState = {
  machine_id: '', type: 'withdrawal', customer_name: '', amount: '0',
  fee: '0', status: 'success', phone: '', notes: '',
}

export function TransactionsView({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [fType, setFType] = useState<string>('all')
  const [fStatus, setFStatus] = useState<string>('all')
  const [fMachine, setFMachine] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return data.transactions.filter((t) => {
      if (fType !== 'all' && t.type !== fType) return false
      if (fStatus !== 'all' && t.status !== fStatus) return false
      if (fMachine !== 'all' && t.machine_id !== fMachine) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matches = t.reference.toLowerCase().includes(q) || (t.customer_name?.toLowerCase().includes(q) ?? false)
        if (!matches) return false
      }
      return true
    })
  }, [data.transactions, fType, fStatus, fMachine, search])

  const openAdd = () => { setForm({ ...EMPTY, machine_id: data.machines[0]?.id ?? '' }); setOpen(true) }

  const handleSave = async () => {
    if (!form.machine_id) { toast('error', 'Select a machine'); return }
    if (Number(form.amount) <= 0) { toast('error', 'Amount must be greater than 0'); return }
    setSaving(true)
    const machine = data.machines.find((m) => m.id === form.machine_id)
    const balanceBefore = machine ? Number(machine.current_float) : null
    const payload = {
      machine_id: form.machine_id,
      type: form.type,
      customer_name: form.customer_name.trim() || null,
      amount: Number(form.amount),
      fee: Number(form.fee) || 0,
      status: form.status,
      reference: 'TXN-' + Date.now().toString(36).toUpperCase(),
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      balance_before: balanceBefore,
      balance_after: balanceBefore !== null ? balanceBefore + Number(form.fee) : null,
    }
    const { error } = await supabase.from('transactions').insert(payload)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Transaction added')
    setOpen(false)
    data.refresh()
  }

  const machineName = (id: string | null) => data.machines.find((m) => m.id === id)?.nickname ?? 'Unknown'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Transactions</h1>
          <p className="text-sm text-ink-500 mt-1">All POS transaction records.</p>
        </div>
        <button onClick={openAdd} className="btn-primary" disabled={data.machines.length === 0}><Plus size={16} /> Add Transaction</button>
      </div>

      {data.machines.length === 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">Add a POS machine first before logging transactions.</div>
      )}

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-ink-500"><Filter size={15} /> Filters</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={fType} onChange={(e) => setFType(e.target.value)}>
              <option value="all">All types</option>
              {Object.entries(TRANSACTION_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
          <div>
            <label className="label">Machine</label>
            <select className="input" value={fMachine} onChange={(e) => setFMachine(e.target.value)}>
              <option value="all">All machines</option>
              {data.machines.map((m) => <option key={m.id} value={m.id}>{m.nickname}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="Reference or name" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ArrowUpDown size={22} />} title="No transactions found" message="Adjust filters or add a new transaction to get started." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const meta = TRANSACTION_TYPE_META[t.type]
            return (
              <div key={t.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${meta?.bg} ${meta?.color}`}>{meta?.label ?? t.type}</span>
                    <span className={`text-xs font-medium ${STATUS_COLOR[t.status] ?? 'text-ink-500'}`}>{t.status}</span>
                  </div>
                  <p className="text-sm font-medium text-ink-900 truncate">{t.customer_name ?? machineName(t.machine_id)}</p>
                  <p className="text-xs text-ink-400 font-mono">{t.reference} · {machineName(t.machine_id)}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{formatDateTime(t.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-ink-900">{formatNaira(Number(t.amount))}</p>
                  <p className="text-xs text-emerald-600">Fee: {formatNaira(Number(t.fee))}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Transaction">
        <div className="space-y-4">
          <div>
            <label className="label">Machine</label>
            <select className="input" value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })}>
              <option value="">Select machine…</option>
              {data.machines.map((m) => <option key={m.id} value={m.id}>{m.nickname}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}>
                {Object.entries(TRANSACTION_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Transaction['status'] })}>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Customer Name</label>
            <input className="input" placeholder="Optional" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₦)</label>
              <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Fee (₦)</label>
              <input className="input" type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input font-mono text-xs" placeholder="Optional" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Transaction
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
