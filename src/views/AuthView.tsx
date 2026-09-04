import { useState } from 'react'
import {
  CreditCard, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, Loader2,
  Eye, EyeOff, CheckCircle2, ShieldCheck, TrendingUp, Wallet, Zap,
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

type Mode = 'login' | 'signup' | 'otp'

export function AuthView({ onAuthed, onNavigatePolicies }: { onAuthed: () => void; onNavigatePolicies: () => void }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  const switchMode = (m: Mode) => {
    setMode(m)
    setPassword('')
    setShowPassword(false)
  }

  const handleSubmit = async () => {
    if (mode === 'otp') return

    if (!email.trim() || !password) {
      toast('error', 'Please fill in all fields')
      return
    }
    if (mode === 'signup' && !displayName.trim()) {
      toast('error', 'Please enter your name')
      return
    }
    if (password.length < 6) {
      toast('error', 'Password must be at least 6 characters')
      return
    }

    setBusy(true)
    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password)
      setBusy(false)
      if (error) { toast('error', error); return }
      toast('success', 'Welcome back!')
      onAuthed()
    } else {
      const { error } = await signUp(email.trim(), password, displayName.trim())
      setBusy(false)
      if (error) { toast('error', error); return }

      // Check if we got a session immediately (email confirmation OFF)
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        toast('success', 'Account created! Welcome to POS Tracker NG.')
        onAuthed()
      } else {
        // Email confirmation is ON — show OTP screen
        setPendingEmail(email.trim())
        setMode('otp')
        toast('success', 'Account created! Check your email for a verification link.')
      }
    }
  }

  if (mode === 'otp') {
    return <OtpPending email={pendingEmail} onBack={() => { switchMode('login'); setPendingEmail('') }} onAuthed={onAuthed} />
  }

  const isLogin = mode === 'login'

  return (
    <div className="min-h-screen flex bg-ink-50">
      {/* Left showcase panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] auth-gradient-bg relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-24 right-10 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full text-white">
          <div className="flex items-center gap-3 animate-slide-in-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-lg font-bold">POS Tracker NG</p>
              <p className="text-xs text-white/60">Agent management platform</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="animate-slide-in-left" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                Run your POS business<br />like a pro.
              </h2>
              <p className="text-white/70 mt-3 text-sm leading-relaxed">
                Track transactions, manage float, monitor losses, and grow your earnings —
                all in one beautifully simple dashboard built for Nigerian agents.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: TrendingUp, label: 'Real-time earnings & analytics' },
                { icon: Wallet, label: 'Float & settlement tracking' },
                { icon: ShieldCheck, label: 'Bank-grade data security' },
                { icon: Zap, label: 'Invoices, credits & expenses' },
              ].map((f, i) => (
                <div key={f.label} className="flex items-center gap-3 animate-slide-in-left" style={{ animationDelay: `${0.2 + i * 0.08}s`, animationFillMode: 'both' }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/15">
                    <f.icon size={16} className="text-white/90" />
                  </div>
                  <span className="text-sm text-white/80">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-8 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
            <div>
              <p className="text-2xl font-bold">10+</p>
              <p className="text-xs text-white/50">Transaction types</p>
            </div>
            <div className="w-px bg-white/15" />
            <div>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-white/50">Your data, private</p>
            </div>
            <div className="w-px bg-white/15" />
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-white/50">Always available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-40 h-40 bg-brand-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-52 h-52 bg-brand-50 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex flex-col items-center mb-6 animate-bounce-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25 mb-2.5">
              <CreditCard size={26} />
            </div>
            <h1 className="text-xl font-bold text-ink-900">POS Tracker NG</h1>
          </div>

          <div className="mb-7 auth-stagger-1">
            <h2 className="text-2xl font-bold text-ink-900">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-ink-500 mt-1.5">
              {isLogin ? 'Sign in to manage your POS business' : 'Start tracking your business in minutes'}
            </p>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <div className="auth-stagger-2">
                <label className="label">Full name</label>
                <div className="auth-input-wrap">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 auth-input-icon transition-colors" />
                  <input
                    className="input pl-9"
                    placeholder="e.g. Chidi Okafor"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                  />
                </div>
              </div>
            )}

            <div className={isLogin ? 'auth-stagger-2' : 'auth-stagger-3'}>
              <label className="label">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 auth-input-icon transition-colors" />
                <input
                  className="input pl-9"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                />
              </div>
            </div>

            <div className={isLogin ? 'auth-stagger-3' : 'auth-stagger-4'}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                {isLogin && (
                  <button className="text-xs text-brand-600 hover:text-brand-700 font-medium transition" type="button">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="auth-input-wrap">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 auth-input-icon transition-colors" />
                <input
                  className="input pl-9 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition"
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && password.length > 0 && (
                <div className="flex gap-1 mt-2 animate-fade-in">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= n * 2
                          ? password.length >= 8 ? 'bg-emerald-500' : password.length >= 6 ? 'bg-amber-400' : 'bg-rose-400'
                          : 'bg-ink-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSubmit} disabled={busy} className="btn-primary w-full !py-3 relative overflow-hidden group auth-stagger-5">
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 auth-stagger-6 py-1">
              <div className="flex-1 h-px bg-ink-100" />
              <span className="text-xs text-ink-400 font-medium">or</span>
              <div className="flex-1 h-px bg-ink-100" />
            </div>

            <div className="text-center text-sm text-ink-500 auth-stagger-6">
              {isLogin ? (
                <>Don't have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="font-semibold text-brand-600 hover:text-brand-700 transition">
                    Create one free
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="font-semibold text-brand-600 hover:text-brand-700 transition">
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="text-center mt-6 auth-stagger-7">
            <button onClick={onNavigatePolicies} className="text-xs text-ink-400 hover:text-ink-600 transition flex items-center gap-1.5 mx-auto">
              <ShieldCheck size={12} /> Privacy Policy & Terms of Service
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OtpPending({ email, onBack, onAuthed }: { email: string; onBack: () => void; onAuthed: () => void }) {
  const { session } = useAuth()
  const [checking, setChecking] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)

  // Poll for session — when the user clicks the email link and is redirected back,
  // detectSessionInUrl will pick up the session and onAuthStateChange fires.
  // Also allow manual check.
  const checkSession = async () => {
    setChecking(true)
    const { data } = await supabase.auth.getSession()
    setChecking(false)
    if (data.session?.user) {
      onAuthed()
    } else {
      toast('info', 'Your email is not verified yet. Click the link in your email first.')
    }
  }

  // Auto-check when session changes (e.g. after email link redirect)
  if (session?.user) {
    onAuthed()
  }

  const handleResend = async () => {
    setResendDisabled(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      toast('error', error.message)
      setResendDisabled(false)
      return
    }
    toast('success', 'Verification email sent again')
    setTimeout(() => setResendDisabled(false), 30000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink-50 via-white to-brand-50/30 px-4 py-8 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-48 h-48 bg-brand-100/60 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-56 h-56 bg-brand-50 rounded-full blur-3xl animate-float-delayed" />

      <div className="w-full max-w-md relative z-10">
        <div className="card p-8 text-center space-y-5 animate-scale-in">
          <div className="relative mx-auto w-fit">
            <div className="absolute inset-0 bg-emerald-200/50 rounded-2xl animate-ping" />
            <div className="relative flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink-900">Check your email</h2>
            <p className="text-sm text-ink-500 leading-relaxed">
              We sent a verification link to{' '}
              <span className="font-semibold text-ink-700">{email}</span>.
              <br />Click the link to confirm your email, then continue.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button onClick={checkSession} disabled={checking} className="btn-primary w-full">
              {checking ? <Loader2 size={18} className="animate-spin" /> : <>I've verified my email <ArrowRight size={16} /></>}
            </button>
            <button onClick={handleResend} disabled={resendDisabled} className="btn-secondary w-full">
              {resendDisabled ? 'Email sent — check inbox' : 'Resend verification email'}
            </button>
            <button onClick={onBack} className="btn-ghost w-full !text-ink-500">
              <ArrowLeft size={16} /> Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
