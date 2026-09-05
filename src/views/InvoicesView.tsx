import { useState, useEffect } from 'react'
import { FileText, Plus, Loader2, CheckCircle, XCircle, Trash2, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { InvoiceStatus, Invoice, InvoiceItem } from '../lib/types'
import { INVOICE_STATUS_META } from '../lib/types'
import { formatNaira, formatDateTime } from '../lib/format'

interface Props { data: Stats }

type FormState = {
  customer_name: string
  customer_phone: string
  account_number: string
  account_name: string
  bank_name: string
  notes: string
  items: InvoiceItem[]
}

const EMPTY: FormState = {
  customer_name: '', customer_phone: '', account_number: '', account_name: '', bank_name: '', notes: '',
  items: [{ name: '', price: 0, quantity: 1 }],
}

export function InvoicesView(_: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(200)
    setLoading(false)
    if (error) { toast('error', error.message); return }
    setInvoices((data as Invoice[]) ?? [])
  }

  useEffect(() => { load() }, [])

  const total = form.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const setItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const items = [...form.items]
    items[idx] = { ...items[idx], ...patch }
    setForm({ ...form, items })
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', price: 0, quantity: 1 }] })
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })

  const handleSave = async () => {
    if (!form.customer_name.trim()) { toast('error', 'Customer name is required'); return }
    if (form.items.length === 0 || form.items.every((i) => !i.name.trim())) { toast('error', 'Add at least one item'); return }
    setSaving(true)
    const payload = {
      reference: 'INV-' + Date.now().toString(36).toUpperCase(),
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      items: form.items.filter((i) => i.name.trim()),
      total,
      status: 'pending' as InvoiceStatus,
      account_number: form.account_number.trim(),
      account_name: form.account_name.trim(),
      bank_name: form.bank_name.trim(),
      notes: form.notes.trim() || null,
    }
    const { error } = await supabase.from('invoices').insert(payload)
    setSaving(false)
    if (error) { toast('error', error.message); return }
    toast('success', 'Invoice created')
    setOpen(false)
    setForm(EMPTY)
    load()
  }

  const markPaid = async (inv: Invoice) => {
    const { error } = await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Invoice marked as paid')
    load()
  }

  const markCancelled = async (inv: Invoice) => {
    const { error } = await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', inv.id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Invoice cancelled')
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Invoice deleted')
    load()
  }

  const copyRef = (ref: string) => { navigator.clipboard.writeText(ref); toast('success', 'Reference copied') }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Invoices</h1>
          <p className="text-sm text-ink-500 mt-1">Create and track invoices for your customers.</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setOpen(true) }} className="btn-primary"><Plus size={16} /> New Invoice</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : invoices.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText size={22} />} title="No invoices yet" message="Create invoices to bill customers and track payments."
            action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus size={16} /> New Invoice</button>} />
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const meta = INVOICE_STATUS_META[inv.status]
            return (
              <div key={inv.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      <button onClick={() => copyRef(inv.reference)} className="text-xs text-ink-400 font-mono hover:text-ink-600 flex items-center gap-1">
                        {inv.reference} <Copy size={11} />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-ink-900">{inv.customer_name ?? 'Walk-in customer'}</p>
                    <p className="text-xs text-ink-400">{formatDateTime(inv.created_at)}</p>
                    <div className="mt-2 space-y-0.5">
                      {inv.items.map((item, i) => (
                        <p key={i} className="text-xs text-ink-500">{item.name} × {item.quantity} — {formatNaira(item.price * item.quantity)}</p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-ink-900">{formatNaira(Number(inv.total))}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {inv.status === 'pending' && (
                        <>
                          <button onClick={() => markPaid(inv)} className="btn-ghost px-2 py-1 text-emerald-600 hover:bg-emerald-50" title="Mark paid"><CheckCircle size={16} /></button>
                          <button onClick={() => markCancelled(inv)} className="btn-ghost px-2 py-1 text-ink-400 hover:bg-ink-50" title="Cancel"><XCircle size={16} /></button>
                        </>
                      )}
                      <button onClick={() => handleDelete(inv.id)} className="btn-ghost px-2 py-1 text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Invoice">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name</label>
              <input className="input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Customer Phone</label>
              <input className="input font-mono text-xs" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Items</label>
              <button onClick={addItem} className="btn-ghost px-2 py-1 text-xs"><Plus size={12} /> Add item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" placeholder="Item name" value={item.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                  <input className="input w-24" type="number" min="0" placeholder="Price" value={item.price || ''} onChange={(e) => setItem(i, { price: Number(e.target.value) || 0 })} />
                  <input className="input w-20" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) || 1 })} />
                  {form.items.length > 1 && <button onClick={() => removeItem(i)} className="btn-ghost px-2 py-1 text-rose-600"><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
            <p className="text-right text-sm font-bold text-ink-900 mt-2">Total: {formatNaira(total)}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Account No.</label>
              <input className="input font-mono text-xs" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
            </div>
            <div>
              <label className="label">Account Name</label>
              <input className="input text-xs" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Bank</label>
              <input className="input text-xs" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create Invoice
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
