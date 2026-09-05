import { useState } from 'react'
import {
  CreditCard, Plus, Pencil, Trash2, Loader2, MapPin, Smartphone, Hash,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { Stats } from '../lib/usePosData'
import type { Machine, MachineStatus } from '../lib/types'
import { PROVIDERS } from '../lib/types'
import { formatNaira } from '../lib/format'

interface Props {
  data: Stats
}

const STATUS_META: Record<MachineStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  inactive: { label: 'Inactive', color: 'text-ink-600', bg: 'bg-ink-100' },
  faulty: { label: 'Faulty', color: 'text-rose-700', bg: 'bg-rose-50' },
}

type FormState = {
  nickname: string
  serial_number: string
  provider: string
  terminal_id: string
  location: string
  status: MachineStatus
  sim_number: string
  current_float: string
}

const EMPTY: FormState = {
  nickname: '', serial_number: '', provider: PROVIDERS[0], terminal_id: '',
  location: '', status: 'active', sim_number: '', current_float: '0',
}

export function MachinesView({ data }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Machine | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (m: Machine) => {
    setEditing(m)
    setForm({
      nickname: m.nickname, serial_number: m.serial_number, provider: m.provider,
      terminal_id: m.terminal_id ?? '', location: m.location ?? '', status: m.status,
      sim_number: m.sim_number ?? '', current_float: String(m.current_float),
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.nickname.trim() || !form.serial_number.trim()) {
      toast('error', 'Nickname and serial number are required')
      return
    }
    setSaving(true)
    const payload = {
      nickname: form.nickname.trim(),
      serial_number: form.serial_number.trim(),
      provider: form.provider,
      terminal_id: form.terminal_id.trim() || null,
      location: form.location.trim() || null,
      status: form.status,
      sim_number: form.sim_number.trim() || null,
      current_float: Number(form.current_float) || 0,
    }
    if (editing) {
      const { error } = await supabase.from('machines').update(payload).eq('id', editing.id)
      setSaving(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'Machine updated')
    } else {
      const { error } = await supabase.from('machines').insert(payload)
      setSaving(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'Machine added')
    }
    setOpen(false)
    data.refresh()
  }

  const handleDelete = async (m: Machine) => {
    if (!confirm(`Delete "${m.nickname}"? This cannot be undone.`)) return
    const { error } = await supabase.from('machines').delete().eq('id', m.id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Machine deleted')
    data.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">POS Machines</h1>
          <p className="text-sm text-ink-500 mt-1">Manage your POS terminals and their float.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Machine</button>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : data.machines.length === 0 ? (
        <div className="card">
          <EmptyState icon={<CreditCard size={22} />} title="No machines yet" message="Add your first POS machine to start tracking float and transactions."
            action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Machine</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.machines.map((m) => {
            const sm = STATUS_META[m.status]
            return (
              <div key={m.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink-900 truncate">{m.nickname}</p>
                    <p className="text-xs text-ink-400">{m.provider}</p>
                  </div>
                  <span className={`badge ${sm.bg} ${sm.color}`}>{sm.label}</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="text-ink-500 flex items-center gap-2"><Hash size={13} className="text-ink-300" /> {m.serial_number}</p>
                  {m.terminal_id && <p className="text-ink-500 flex items-center gap-2"><CreditCard size={13} className="text-ink-300" /> {m.terminal_id}</p>}
                  {m.location && <p className="text-ink-500 flex items-center gap-2"><MapPin size={13} className="text-ink-300" /> {m.location}</p>}
                  {m.sim_number && <p className="text-ink-500 flex items-center gap-2"><Smartphone size={13} className="text-ink-300" /> {m.sim_number}</p>}
                </div>
                <div className="mt-4 pt-3 border-t border-ink-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-400">Current Float</p>
                    <p className="text-lg font-bold text-ink-900">{formatNaira(Number(m.current_float))}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(m)} className="btn-ghost px-2 py-1.5"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(m)} className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Machine' : 'Add Machine'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nickname</label>
            <input className="input" placeholder="e.g. Shop 1 POS" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          </div>
          <div>
            <label className="label">Serial Number</label>
            <input className="input font-mono text-xs" placeholder="SN-12345" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Provider</label>
              <select className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MachineStatus })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="faulty">Faulty</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Terminal ID</label>
              <input className="input font-mono text-xs" placeholder="Optional" value={form.terminal_id} onChange={(e) => setForm({ ...form, terminal_id: e.target.value })} />
            </div>
            <div>
              <label className="label">SIM Number</label>
              <input className="input font-mono text-xs" placeholder="Optional" value={form.sim_number} onChange={(e) => setForm({ ...form, sim_number: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="Optional" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Current Float (₦)</label>
            <input className="input" type="number" min="0" value={form.current_float} onChange={(e) => setForm({ ...form, current_float: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {editing ? 'Save Changes' : 'Add Machine'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
