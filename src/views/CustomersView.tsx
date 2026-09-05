import { useState } from 'react'
import { Users, Plus, Loader2, Pencil, Trash2, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { Customer } from '../lib/types'
import { formatDate } from '../lib/format'

interface Props { data: Stats }

type FormState = { name: string; phone: string; notes: string }
const EMPTY: FormState = { name: '', phone: '', notes: '' }

export function CustomersView({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (c: Customer) => { setEditing(c); setForm({ name: c.name, phone: c.phone ?? '', notes: c.notes ?? '' }); setOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('error', 'Customer name is required'); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    }
    if (editing) {
      const { error } = await supabase.from('customers').update(payload).eq('id', editing.id)
      setSaving(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'Customer updated')
    } else {
      const { error } = await supabase.from('customers').insert(payload)
      setSaving(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'Customer added')
    }
    setOpen(false)
    data.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Customer deleted')
    data.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Customers</h1>
          <p className="text-sm text-ink-500 mt-1">Manage your customer directory.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Customer</button>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : data.customers.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Users size={22} />} title="No customers yet" message="Add customers to keep track of your regulars."
            action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Customer</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.customers.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink-900 truncate">{c.name}</p>
                  {c.phone && <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5"><Phone size={11} /> {c.phone}</p>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(c)} className="btn-ghost px-2 py-1.5"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
                </div>
              </div>
              {c.notes && <p className="text-sm text-ink-500 line-clamp-2">{c.notes}</p>}
              <p className="text-xs text-ink-400 mt-3">Added {formatDate(c.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="Customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {editing ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
