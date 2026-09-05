import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react'
import { toast } from '../components/Toast'
import type { Settings } from '../lib/types'

interface Props {
  settings: Settings | null
  onSave: (patch: Partial<Pick<Settings, 'daily_target' | 'low_float_threshold'>>) => Promise<void>
  onDataChanged: () => Promise<void>
}

export function SettingsView({ settings, onSave }: Props) {
  const [dailyTarget, setDailyTarget] = useState('5000')
  const [lowFloat, setLowFloat] = useState('10000')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setDailyTarget(String(settings.daily_target))
      setLowFloat(String(settings.low_float_threshold))
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ daily_target: Number(dailyTarget) || 0, low_float_threshold: Number(lowFloat) || 0 })
      toast('success', 'Settings saved')
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Configure your business preferences.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon size={18} className="text-brand-600" />
          <p className="text-sm font-semibold text-ink-700">Business Targets</p>
        </div>

        <div>
          <label className="label">Daily Earnings Target (₦)</label>
          <input className="input" type="number" min="0" value={dailyTarget} onChange={(e) => setDailyTarget(e.target.value)} />
          <p className="text-xs text-ink-400 mt-1">Used to track your daily progress on the dashboard.</p>
        </div>

        <div>
          <label className="label">Low Float Alert Threshold (₦)</label>
          <input className="input" type="number" min="0" value={lowFloat} onChange={(e) => setLowFloat(e.target.value)} />
          <p className="text-xs text-ink-400 mt-1">Machines with float below this amount will trigger an alert.</p>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  )
}
