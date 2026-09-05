import { useState } from 'react'
import { Receipt, Plus, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { ExpenseCategory } from '../lib/types'
import { EXPENSE_CATEGORY_META } from '../lib/types'
import { formatNaira, formatDate } from '../lib/format'

interface Props { data: Stats }

type FormState = { category: ExpenseCategory; description: string; amount: string }
const EMPTY: FormState = { category: 'rent', description: '', amount: '0' }

export function ExpensesView({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setForm(EMPTY); setOpen(true) }

  const handleSave = async () => {
    if (!form.description.trim()) { toast('error', 'Description is required'); return }
    if (Number(form.amount) <= 0) { toast('error', 'Amount must be greater than 0'); return }
    setSaving(true)
    const payload = {
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
    }
    const { error } = await supabase.from('expenses').insert(payload)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Expense recorded')
    setOpen(false)
    data.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Expense deleted')
    data.refresh()
  }

  const total = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Expenses</h1>
          <p className="text-sm text-ink-500 mt-1">Track business expenses by category.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Expense</button>
      </div>

      {data.expenses.length > 0 && (
        <div className="card p-5 flex items-center justify-between">
          <span className="text-sm text-ink-500">Total Expenses</span>
          <span className="text-xl font-bold text-rose-600">{formatNaira(total)}</span>
        </div>
      )}

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : data.expenses.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Receipt size={22} />} title="No expenses yet" message="Record rent, fuel, data, and other business expenses here."
            action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Expense</button>} />
        </div>
      ) : (
        <div className="space-y-3">
          {data.expenses.map((e) => {
            const meta = EXPENSE_CATEGORY_META[e.category]
            return (
              <div key={e.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`badge ${meta.bg} ${meta.color} shrink-0`}>{meta.label}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{e.description}</p>
                    <p className="text-xs text-ink-400">{formatDate(e.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-bold text-ink-900">{formatNaira(Number(e.amount))}</p>
                  <button onClick={() => handleDelete(e.id)} className="btn-ghost px-1.5 py-1 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Expense">
        <div className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
              {Object.entries(EXPENSE_CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="What was this expense for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Amount (₦)</label>
            <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Expense
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
