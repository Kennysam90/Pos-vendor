import { useState } from 'react'
import { Wallet, Plus, Loader2, ArrowDownCircle, ArrowUpCircle, Building2, RotateCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { Settlement } from '../lib/types'
import { formatNaira, formatDateTime } from '../lib/format'

interface Props { data: Stats }

const TYPE_META: Record<Settlement['type'], { label: string; icon: React.ReactNode; color: string }> = {
  cash_in: { label: 'Cash In', icon: <ArrowDownCircle size={16} />, color: 'text-emerald-600' },
  cash_out: { label: 'Cash Out', icon: <ArrowUpCircle size={16} />, color: 'text-rose-600' },
  bank_deposit: { label: 'Bank Deposit', icon: <Building2 size={16} />, color: 'text-brand-600' },
  float_topup: { label: 'Float Top-up', icon: <RotateCw size={16} />, color: 'text-violet-600' },
}

type FormState = {
  machine_id: string
  amount: string
  type: Settlement['type']
  reference: string
  notes: string
}

const EMPTY: FormState = { machine_id: '', amount: '0', type: 'cash_in', reference: '', notes: '' }

export function SettlementsView({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setForm({ ...EMPTY, machine_id: data.machines[0]?.id ?? '' }); setOpen(true) }

  const handleSave = async () => {
    if (Number(form.amount) <= 0) { toast('error', 'Amount must be greater than 0'); return }
    setSaving(true)
    const payload = {
      machine_id: form.machine_id || null,
      amount: Number(form.amount),
      type: form.type,
      reference: form.reference.trim() || null,
      notes: form.notes.trim() || null,
    }
    const { error } = await supabase.from('settlements').insert(payload)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Settlement recorded')
    setOpen(false)
    data.refresh()
  }

  const machineName = (id: string | null) => data.machines.find((m) => m.id === id)?.nickname ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Settlements</h1>
          <p className="text-sm text-ink-500 mt-1">Track cash movements and bank deposits.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Settlement</button>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : data.settlements.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Wallet size={22} />} title="No settlements yet" message="Record cash-ins, cash-outs, and bank deposits here."
            action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Settlement</button>} />
        </div>
      ) : (
        <div className="space-y-3">
          {data.settlements.map((s) => {
            const meta = TYPE_META[s.type]
            return (
              <div key={s.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`shrink-0 ${meta.color}`}>{meta.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">{meta.label}</p>
                    <p className="text-xs text-ink-400 truncate">{machineName(s.machine_id)}{s.reference && ` · ${s.reference}`}</p>
                    <p className="text-xs text-ink-400">{formatDateTime(s.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-ink-900 shrink-0">{formatNaira(Number(s.amount))}</p>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Settlement">
        <div className="space-y-4">
          <div>
            <label className="label">Machine</label>
            <select className="input" value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })}>
              <option value="">No specific machine</option>
              {data.machines.map((m) => <option key={m.id} value={m.id}>{m.nickname}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Settlement['type'] })}>
                {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount (₦)</label>
              <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Reference</label>
            <input className="input font-mono text-xs" placeholder="Optional" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Settlement
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
