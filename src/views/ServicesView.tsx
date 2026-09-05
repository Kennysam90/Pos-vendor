import { Zap, Phone, Wifi, Tv, Ticket, Receipt } from 'lucide-react'
import type { Stats } from '../lib/usePosData'

interface Props { data: Stats }

interface ServiceInfo {
  icon: React.ReactNode
  name: string
  description: string
  commission: string
  color: string
  bg: string
}

const SERVICES: ServiceInfo[] = [
  { icon: <Phone size={24} />, name: 'Airtime', description: 'Sell airtime for MTN, Airtel, Glo, and 9mobile.', commission: '~2% commission', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: <Wifi size={24} />, name: 'Data Bundles', description: 'Sell data bundles for all major networks.', commission: '~2% commission', color: 'text-teal-600', bg: 'bg-teal-50' },
  { icon: <Receipt size={24} />, name: 'Bill Payments', description: 'Pay electricity, water, and other utility bills.', commission: '~1.5% commission', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: <Tv size={24} />, name: 'TV Subscriptions', description: 'Renew DSTV, GOTV, Startimes, and Showmax.', commission: '~1.5% commission', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: <Ticket size={24} />, name: 'Betting Funding', description: 'Fund betting accounts for Bet9ja, SportyBet, etc.', commission: '~1% commission', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  { icon: <Zap size={24} />, name: 'Cash Withdrawal', description: 'Process cash withdrawals for bank customers.', commission: '~0.6% fee', color: 'text-brand-600', bg: 'bg-brand-50' },
]

export function ServicesView(_: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Services</h1>
        <p className="text-sm text-ink-500 mt-1">Transaction types you can offer through your POS terminal.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((s) => (
          <div key={s.name} className="card p-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg} ${s.color} mb-3`}>
              {s.icon}
            </div>
            <p className="font-bold text-ink-900">{s.name}</p>
            <p className="text-sm text-ink-500 mt-1 leading-relaxed">{s.description}</p>
            <p className={`text-xs font-medium mt-3 ${s.color}`}>{s.commission}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
