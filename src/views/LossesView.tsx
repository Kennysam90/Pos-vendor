import { useState } from 'react'
import { AlertTriangle, Plus, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { LossReason } from '../lib/types'
import { LOSS_REASON_META } from '../lib/types'
import { formatNaira, formatDateTime } from '../lib/format'

interface Props { data: Stats }

type FormState = {
  machine_id: string
  reason: LossReason
  amount: string
  description: string
  recovered: boolean
  recovered_amount: string
}

const EMPTY: FormState = {
  machine_id: '', reason: 'failed_transaction', amount: '0',
  description: '', recovered: false, recovered_amount: '0',
}

export function LossesView({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setForm({ ...EMPTY, machine_id: data.machines[0]?.id ?? '' }); setOpen(true) }

  const handleSave = async () => {
    if (Number(form.amount) <= 0) { toast('error', 'Amount must be greater than 0'); return }
    if (!form.description.trim()) { toast('error', 'Description is required'); return }
    setSaving(true)
    const payload = {
      machine_id: form.machine_id || null,
      reason: form.reason,
      amount: Number(form.amount),
      description: form.description.trim(),
      recovered: form.recovered,
      recovered_amount: form.recovered ? Number(form.recovered_amount) || 0 : 0,
    }
    const { error } = await supabase.from('losses').insert(payload)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Loss recorded')
    setOpen(false)
    data.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this loss record?')) return
    const { error } = await supabase.from('losses').delete().eq('id', id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Loss deleted')
    data.refresh()
  }

  const machineName = (id: string | null) => data.machines.find((m) => m.id === id)?.nickname ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Losses</h1>
          <p className="text-sm text-ink-500 mt-1">Track financial losses and recoveries.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Record Loss</button>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : data.losses.length === 0 ? (
        <div className="card">
          <EmptyState icon={<AlertTriangle size={22} />} title="No losses recorded" message="When you experience a financial loss, record it here to track recovery."
            action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Record Loss</button>} />
        </div>
      ) : (
        <div className="space-y-3">
          {data.losses.map((l) => {
            const meta = LOSS_REASON_META[l.reason]
            const net = Number(l.amount) - Number(l.recovered_amount)
            return (
              <div key={l.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    {l.recovered && <span className="badge bg-emerald-50 text-emerald-700">Recovered</span>}
                  </div>
                  <p className="text-sm font-medium text-ink-900">{l.description}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{machineName(l.machine_id)} · {formatDateTime(l.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-rose-600">{formatNaira(Number(l.amount))}</p>
                  {net > 0 && <p className="text-xs text-ink-400">Net: {formatNaira(net)}</p>}
                  <button onClick={() => handleDelete(l.id)} className="btn-ghost px-1.5 py-1 text-rose-600 hover:bg-rose-50 mt-1"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Record Loss">
        <div className="space-y-4">
          <div>
            <label className="label">Machine</label>
            <select className="input" value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })}>
              <option value="">No specific machine</option>
              {data.machines.map((m) => <option key={m.id} value={m.id}>{m.nickname}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <select className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as LossReason })}>
              {Object.entries(LOSS_REASON_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₦)</label>
            <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} placeholder="What happened?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={form.recovered} onChange={(e) => setForm({ ...form, recovered: e.target.checked })} className="rounded border-ink-300" />
            Amount has been partially or fully recovered
          </label>
          {form.recovered && (
            <div>
              <label className="label">Recovered Amount (₦)</label>
              <input className="input" type="number" min="0" value={form.recovered_amount} onChange={(e) => setForm({ ...form, recovered_amount: e.target.value })} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Record Loss
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
