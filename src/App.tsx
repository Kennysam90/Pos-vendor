import { useState } from 'react'
import {
  LayoutDashboard, CreditCard, ArrowUpDown, AlertTriangle, Wallet,
  BarChart3, Menu, X, RefreshCw, HandCoins, Settings as SettingsIcon, Calculator, Zap, FileText,
  Users, Receipt, Download, Shield, LogOut, ChevronRight,
} from 'lucide-react'
import { usePosData } from './lib/usePosData'
import { useAuth } from './lib/useAuth'
import { DashboardView } from './views/DashboardView'
import { MachinesView } from './views/MachinesView'
import { TransactionsView } from './views/TransactionsView'
import { LossesView } from './views/LossesView'
import { SettlementsView } from './views/SettlementsView'
import { AnalyticsView } from './views/AnalyticsView'
import { CreditsView } from './views/CreditsView'
import { SettingsView } from './views/SettingsView'
import { SaleCalcView } from './views/SaleCalcView'
import { WalletView } from './views/WalletView'
import { ServicesView } from './views/ServicesView'
import { InvoicesView } from './views/InvoicesView'
import { CustomersView } from './views/CustomersView'
import { ExpensesView } from './views/ExpensesView'
import { ReportsView } from './views/ReportsView'
import { AuthView } from './views/AuthView'
import { ProfileView } from './views/ProfileView'
import { PoliciesView } from './views/PoliciesView'
import { Loading } from './components/Loading'
import { ToastContainer, toast } from './components/Toast'

type View = 'dashboard' | 'machines' | 'salecalc' | 'services' | 'invoices' | 'transactions' | 'losses' | 'settlements' | 'wallet' | 'credits' | 'customers' | 'expenses' | 'reports' | 'analytics' | 'settings' | 'profile' | 'policies'

const NAV: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'machines', label: 'POS Machines', icon: <CreditCard size={20} /> },
  { id: 'salecalc', label: 'Sales Calculator', icon: <Calculator size={20} /> },
  { id: 'services', label: 'Services', icon: <Zap size={20} /> },
  { id: 'invoices', label: 'Invoices', icon: <FileText size={20} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowUpDown size={20} /> },
  { id: 'losses', label: 'Losses', icon: <AlertTriangle size={20} /> },
  { id: 'settlements', label: 'Settlements', icon: <Wallet size={20} /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet size={20} /> },
  { id: 'credits', label: 'Customer Credit', icon: <HandCoins size={20} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={20} /> },
  { id: 'reports', label: 'Reports', icon: <Download size={20} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
]

export default function App() {
  const auth = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const data = usePosData()

  const go = (v: View) => { setView(v); setSidebarOpen(false) }

  const handleRefresh = async () => {
    await data.refresh()
    toast('success', 'Data refreshed')
  }

  const handleSignOut = async () => {
    await auth.signOut()
    setView('dashboard')
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <Loading full label="Loading…" />
      </div>
    )
  }

  if (!auth.session) {
    if (view === 'policies') {
      return <PoliciesView onBack={() => setView('dashboard')} />
    }
    return <AuthView onAuthed={() => {}} onNavigatePolicies={() => setView('policies')} />
  }

  if (view === 'policies') {
    return <PoliciesView onBack={() => setView('dashboard')} />
  }

  const userName = auth.profile?.display_name || auth.user?.email?.split('@')[0] || 'Agent'
  const initials = userName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-ink-200 px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="btn-ghost px-2 py-1.5" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <Brand small />
        <button onClick={() => go('profile')} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">
          {initials}
        </button>
      </header>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-soft animate-slide-up overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between p-4 border-b border-ink-100">
              <Brand />
              <button onClick={() => setSidebarOpen(false)} className="btn-ghost px-2 py-1.5"><X size={20} /></button>
            </div>
            <NavList view={view} onNavigate={go} />
            <UserCard userName={userName} email={auth.user?.email ?? ''} initials={initials} onProfile={() => go('profile')} onSignOut={handleSignOut} onPolicies={() => go('policies')} />
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white border-r border-ink-200">
        <div className="p-5 border-b border-ink-100">
          <Brand />
        </div>
        <NavList view={view} onNavigate={go} />
        <UserCard userName={userName} email={auth.user?.email ?? ''} initials={initials} onProfile={() => go('profile')} onSignOut={handleSignOut} onPolicies={() => go('policies')} />
      </aside>

      <main className="lg:pl-64">
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div>
            <p className="text-xs text-ink-400">Welcome back, {userName}</p>
            <p className="font-bold text-ink-900">{NAV.find((n) => n.id === view)?.label ?? (view === 'profile' ? 'Profile' : '')}</p>
          </div>
          <div className="flex items-center gap-3">
            {data.error && <span className="text-xs text-rose-600">{data.error}</span>}
            <button onClick={handleRefresh} className="btn-secondary" disabled={data.loading}>
              <RefreshCw size={16} className={data.loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => go('profile')} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition" title={userName}>
              {initials}
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {data.error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
              Could not load data: {data.error}. <button onClick={handleRefresh} className="underline font-medium">Try again</button>
            </div>
          )}
          {view === 'dashboard' && <DashboardView data={data} onNavigate={(v) => go(v as View)} />}
          {view === 'machines' && <MachinesView data={data} />}
          {view === 'salecalc' && <SaleCalcView onDataChanged={data.refresh} />}
          {view === 'services' && <ServicesView data={data} />}
          {view === 'invoices' && <InvoicesView data={data} />}
          {view === 'transactions' && <TransactionsView data={data} />}
          {view === 'losses' && <LossesView data={data} />}
          {view === 'settlements' && <SettlementsView data={data} />}
          {view === 'wallet' && <WalletView />}
          {view === 'credits' && <CreditsView data={data} />}
          {view === 'customers' && <CustomersView data={data} />}
          {view === 'expenses' && <ExpensesView data={data} />}
          {view === 'reports' && <ReportsView data={data} />}
          {view === 'analytics' && <AnalyticsView data={data} />}
          {view === 'settings' && <SettingsView settings={data.settings} onSave={data.saveSettings} onDataChanged={data.refresh} />}
          {view === 'profile' && <ProfileView onSignOut={handleSignOut} />}
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}

function Brand({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <CreditCard size={18} />
      </div>
      <div>
        <p className={`font-bold text-ink-900 ${small ? 'text-base' : 'text-base'}`}>POS Tracker NG</p>
        <p className="text-xs text-ink-500">Agent management</p>
      </div>
    </div>
  )
}

function NavList({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <nav className="p-3 space-y-1">
      {NAV.map((n) => (
        <button
          key={n.id}
          onClick={() => onNavigate(n.id)}
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            view === n.id ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
          }`}
        >
          <span className={view === n.id ? 'text-brand-600' : 'text-ink-400'}>{n.icon}</span>
          {n.label}
        </button>
      ))}
    </nav>
  )
}

function UserCard({ userName, email, initials, onProfile, onSignOut, onPolicies }: {
  userName: string; email: string; initials: string
  onProfile: () => void; onSignOut: () => void; onPolicies: () => void
}) {
  return (
    <div className="mt-auto p-4 border-t border-ink-100 space-y-3">
      <button onClick={onProfile} className="flex items-center gap-3 w-full rounded-xl p-2 hover:bg-ink-50 transition text-left">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900 truncate">{userName}</p>
          <p className="text-xs text-ink-400 truncate">{email}</p>
        </div>
        <ChevronRight size={16} className="text-ink-300 shrink-0" />
      </button>
      <div className="flex gap-2">
        <button onClick={onPolicies} className="flex-1 btn-ghost px-2 py-1.5 text-xs text-ink-500 hover:text-ink-700 justify-center">
          <Shield size={13} /> Policies
        </button>
        <button onClick={onSignOut} className="flex-1 btn-ghost px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-50 justify-center">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  )
}
