import { useState, useEffect } from 'react'
import { Wallet, Plus, Loader2, Trash2, ArrowDown, ArrowUp, Settings2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { WalletEntry, WalletEntryType } from '../lib/types'
import { formatNaira, formatDateTime } from '../lib/format'

const TYPE_META: Record<WalletEntryType, { label: string; icon: React.ReactNode; color: string }> = {
  payment_received: { label: 'Payment Received', icon: <ArrowDown size={16} />, color: 'text-emerald-600' },
  withdrawal: { label: 'Withdrawal', icon: <ArrowUp size={16} />, color: 'text-rose-600' },
  adjustment: { label: 'Adjustment', icon: <Settings2 size={16} />, color: 'text-amber-600' },
}

export function WalletView() {
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'adjustment' as WalletEntryType, amount: '', description: '' })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('wallet_entries').select('*').order('created_at', { ascending: false }).limit(200)
    setLoading(false)
    if (error) { toast('error', error.message); return }
    setEntries((data as WalletEntry[]) ?? [])
  }

  useEffect(() => { load() }, [])

  const balance = entries.reduce((sum, e) => sum + Number(e.amount), 0)

  const handleSave = async () => {
    if (Number(form.amount) === 0) { toast('error', 'Amount cannot be zero'); return }
    if (!form.description.trim()) { toast('error', 'Description is required'); return }
    setSaving(true)
    const payload = {
      type: form.type,
      amount: Number(form.amount),
      description: form.description.trim(),
      reference: 'WAL-' + Date.now().toString(36).toUpperCase(),
    }
    const { error } = await supabase.from('wallet_entries').insert(payload)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Wallet entry added')
    setOpen(false)
    setForm({ type: 'adjustment', amount: '', description: '' })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this wallet entry?')) return
    const { error } = await supabase.from('wallet_entries').delete().eq('id', id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Entry deleted')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Wallet</h1>
          <p className="text-sm text-ink-500 mt-1">Track wallet balance and payment entries.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={16} /> Add Entry</button>
      </div>

      <div className="card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-500">Current Balance</p>
          <p className="text-3xl font-bold text-ink-900 mt-1">{formatNaira(balance)}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Wallet size={26} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : entries.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Wallet size={22} />} title="No wallet entries" message="Add payment received, withdrawals, or adjustments to track your wallet."
            action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus size={16} /> Add Entry</button>} />
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => {
            const meta = TYPE_META[e.type]
            return (
              <div key={e.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`shrink-0 ${meta.color}`}>{meta.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{e.description}</p>
                    <p className="text-xs text-ink-400">{meta.label} · {formatDateTime(e.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className={`text-sm font-bold ${Number(e.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Number(e.amount) >= 0 ? '+' : ''}{formatNaira(Number(e.amount))}
                  </p>
                  <button onClick={() => handleDelete(e.id)} className="btn-ghost px-1.5 py-1 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Wallet Entry">
        <div className="space-y-4">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WalletEntryType })}>
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₦) — use negative for deductions</label>
            <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000 or -1000" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="What is this entry for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Entry
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
