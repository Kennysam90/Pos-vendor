import { useState } from 'react'
import { HandCoins, Plus, Loader2, Trash2, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { CreditStatus, Credit } from '../lib/types'
import { CREDIT_STATUS_META } from '../lib/types'
import { formatNaira, formatDate } from '../lib/format'

interface Props { data: Stats }

type FormState = {
  customer_name: string
  phone: string
  amount: string
  due_date: string
  notes: string
  machine_id: string
}

const EMPTY: FormState = { customer_name: '', phone: '', amount: '0', due_date: '', notes: '', machine_id: '' }

export function CreditsView({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [repayOpen, setRepayOpen] = useState(false)
  const [repayCredit, setRepayCredit] = useState<Credit | null>(null)
  const [repayAmount, setRepayAmount] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setForm({ ...EMPTY, machine_id: data.machines[0]?.id ?? '' }); setOpen(true) }

  const handleSave = async () => {
    if (!form.customer_name.trim()) { toast('error', 'Customer name is required'); return }
    if (Number(form.amount) <= 0) { toast('error', 'Amount must be greater than 0'); return }
    setSaving(true)
    const payload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || null,
      amount: Number(form.amount),
      repaid_amount: 0,
      status: 'outstanding' as CreditStatus,
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
      machine_id: form.machine_id || null,
    }
    const { error } = await supabase.from('credits').insert(payload)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Credit recorded')
    setOpen(false)
    data.refresh()
  }

  const openRepay = (c: Credit) => { setRepayCredit(c); setRepayAmount(''); setRepayOpen(true) }

  const handleRepay = async () => {
    if (!repayCredit) return
    const amt = Number(repayAmount) || 0
    if (amt <= 0) { toast('error', 'Enter a valid amount'); return }
    const newRepaid = Number(repayCredit.repaid_amount) + amt
    const total = Number(repayCredit.amount)
    const newStatus: CreditStatus = newRepaid >= total ? 'settled' : 'partial'
    setSaving(true)
    const { error } = await supabase.from('credits').update({
      repaid_amount: newRepaid, status: newStatus,
    }).eq('id', repayCredit.id)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Payment recorded')
    setRepayOpen(false)
    data.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this credit record?')) return
    const { error } = await supabase.from('credits').delete().eq('id', id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Credit deleted')
    data.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Customer Credit</h1>
          <p className="text-sm text-ink-500 mt-1">Track money owed by customers and repayments.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Record Credit</button>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : data.credits.length === 0 ? (
        <div className="card">
          <EmptyState icon={<HandCoins size={22} />} title="No credits yet" message="Record customer credits and track repayments here."
            action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Record Credit</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.credits.map((c) => {
            const meta = CREDIT_STATUS_META[c.status]
            const remaining = Number(c.amount) - Number(c.repaid_amount)
            const overdue = c.due_date && new Date(c.due_date) < new Date() && remaining > 0
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink-900 truncate">{c.customer_name}</p>
                    {c.phone && <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5"><Phone size={11} /> {c.phone}</p>}
                  </div>
                  <span className={`badge ${meta.bg} ${meta.color}`}>{meta.label}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-ink-500">Total</span><span className="font-semibold text-ink-900">{formatNaira(Number(c.amount))}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Repaid</span><span className="text-emerald-600">{formatNaira(Number(c.repaid_amount))}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Remaining</span><span className="font-semibold text-rose-600">{formatNaira(remaining)}</span></div>
                  {c.due_date && <div className="flex justify-between"><span className="text-ink-500">Due</span><span className={overdue ? 'text-rose-600 font-medium' : 'text-ink-700'}>{formatDate(c.due_date)}{overdue ? ' · Overdue' : ''}</span></div>}
                </div>
                <div className="mt-4 pt-3 border-t border-ink-50 flex items-center justify-between">
                  {c.status !== 'settled' && <button onClick={() => openRepay(c)} className="btn-secondary text-xs px-3 py-1.5">Record Payment</button>}
                  <button onClick={() => handleDelete(c.id)} className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50 ml-auto"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Record Credit">
        <div className="space-y-4">
          <div>
            <label className="label">Customer Name</label>
            <input className="input" placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input font-mono text-xs" placeholder="Optional" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Amount (₦)</label>
              <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Machine</label>
            <select className="input" value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })}>
              <option value="">No specific machine</option>
              {data.machines.map((m) => <option key={m.id} value={m.id}>{m.nickname}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Record Credit
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={repayOpen} onClose={() => setRepayOpen(false)} title="Record Payment">
        <div className="space-y-4">
          {repayCredit && (
            <div className="rounded-xl bg-ink-50 p-3 text-sm">
              <p className="font-semibold text-ink-900">{repayCredit.customer_name}</p>
              <p className="text-ink-500">Remaining: {formatNaira(Number(repayCredit.amount) - Number(repayCredit.repaid_amount))}</p>
            </div>
          )}
          <div>
            <label className="label">Payment Amount (₦)</label>
            <input className="input" type="number" min="0" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} autoFocus />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setRepayOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleRepay} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Record Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
