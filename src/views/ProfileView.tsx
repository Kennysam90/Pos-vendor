import { useState, useEffect } from 'react'
import { User as UserIcon, Mail, Phone, Store, LogOut, Save, Loader2, Calendar } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { formatDate } from '../lib/format'
import { toast } from '../components/Toast'

interface Props {
  onSignOut: () => void
}

export function ProfileView({ onSignOut }: Props) {
  const { profile, user, updateProfile, signOut } = useAuth()
  const [form, setForm] = useState({ display_name: '', phone: '', business_name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        phone: profile.phone ?? '',
        business_name: profile.business_name ?? '',
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!form.display_name.trim()) {
      toast('error', 'Display name cannot be empty')
      return
    }
    setSaving(true)
    const { error } = await updateProfile({
      display_name: form.display_name.trim(),
      phone: form.phone.trim() || null,
      business_name: form.business_name.trim() || null,
    })
    setSaving(false)
    if (error) { toast('error', error); return }
    toast('success', 'Profile updated')
  }

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    )
  }

  const initials = (profile.display_name || user?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Profile</h1>
        <p className="text-sm text-ink-500 mt-1">Manage your account details and personal information.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white text-xl font-bold shadow-md">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-ink-900 truncate">{profile.display_name || 'Agent'}</p>
            <p className="text-sm text-ink-500 truncate flex items-center gap-1.5">
              <Mail size={13} /> {user?.email}
            </p>
            {profile.business_name && (
              <p className="text-sm text-ink-500 flex items-center gap-1.5 mt-0.5">
                <Store size={13} /> {profile.business_name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <p className="text-sm font-semibold text-ink-700">Edit details</p>

        <div>
          <label className="label">Display name</label>
          <div className="relative">
            <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-9" placeholder="Your name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9 font-mono text-xs" placeholder="0801 234 5678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Business name</label>
            <div className="relative">
              <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="e.g. Okafor POS Services" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save changes</>}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <p className="text-sm font-semibold text-ink-700">Account info</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500 flex items-center gap-2"><Mail size={14} /> Email</span>
          <span className="font-medium text-ink-900">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500 flex items-center gap-2"><Calendar size={14} /> Member since</span>
          <span className="font-medium text-ink-900">{formatDate(profile.created_at)}</span>
        </div>
      </div>

      <div className="card p-6 border-rose-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-700">Sign out</p>
            <p className="text-xs text-ink-500 mt-0.5">You'll need to sign in again to access your data.</p>
          </div>
          <button onClick={handleSignOut} className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
