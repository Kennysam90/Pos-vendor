import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import type { Machine, Transaction, Loss, Settlement, Credit, Settings, Customer, Expense } from './types'

export interface Stats {
  machines: Machine[]
  transactions: Transaction[]
  losses: Loss[]
  settlements: Settlement[]
  credits: Credit[]
  customers: Customer[]
  expenses: Expense[]
  settings: Settings | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  saveSettings: (patch: Partial<Pick<Settings, 'daily_target' | 'low_float_threshold'>>) => Promise<void>
}

export function usePosData(): Stats {
  const [machines, setMachines] = useState<Machine[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [losses, setLosses] = useState<Loss[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, t, l, s, c, cu, ex, st] = await Promise.all([
        supabase.from('machines').select('*').order('created_at', { ascending: true }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('losses').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('settlements').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('credits').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (m.error) throw m.error
      if (t.error) throw t.error
      if (l.error) throw l.error
      if (s.error) throw s.error
      if (c.error) throw c.error
      if (cu.error) throw cu.error
      if (ex.error) throw ex.error
      if (st.error) throw st.error
      setMachines((m.data as Machine[]) ?? [])
      setTransactions((t.data as Transaction[]) ?? [])
      setLosses((l.data as Loss[]) ?? [])
      setSettlements((s.data as Settlement[]) ?? [])
      setCredits((c.data as Credit[]) ?? [])
      setCustomers((cu.data as Customer[]) ?? [])
      setExpenses((ex.data as Expense[]) ?? [])
      setSettings((st.data as Settings) ?? null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = useCallback(async (patch: Partial<Pick<Settings, 'daily_target' | 'low_float_threshold'>>) => {
    if (settings) {
      const { data, error } = await supabase
        .from('settings')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
        .select('*')
        .maybeSingle()
      if (error) throw error
      if (data) setSettings(data as Settings)
    } else {
      const { data, error } = await supabase
        .from('settings')
        .insert({ daily_target: patch.daily_target ?? 5000, low_float_threshold: patch.low_float_threshold ?? 10000 })
        .select('*')
        .maybeSingle()
      if (error) throw error
      if (data) setSettings(data as Settings)
    }
  }, [settings])

  useEffect(() => { refresh() }, [refresh])

  return { machines, transactions, losses, settlements, credits, customers, expenses, settings, loading, error, refresh, saveSettings }
}

export function useStatsDerived(data: Stats) {
  const { transactions, losses, settlements, machines, credits, settings } = data

  const verified = transactions.filter((t) => t.verified)
  const totalProcessed = verified.filter((t) => t.status === 'success').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalFees = verified.filter((t) => t.status === 'success').reduce((sum, t) => sum + Number(t.fee), 0)
  const totalLoss = losses.reduce((sum, l) => sum + Number(l.amount), 0)
  const totalRecovered = losses.reduce((sum, l) => sum + Number(l.recovered_amount), 0)
  const netLoss = totalLoss - totalRecovered
  const totalFloat = machines.reduce((sum, m) => sum + Number(m.current_float), 0)
  const successCount = verified.filter((t) => t.status === 'success').length
  const failedCount = verified.filter((t) => t.status === 'failed').length
  const successRate = verified.length ? (successCount / verified.length) * 100 : 0
  const totalCashIn = settlements.filter((s) => s.type === 'cash_in' || s.type === 'float_topup').reduce((sum, s) => sum + Number(s.amount), 0)
  const totalCashOut = settlements.filter((s) => s.type === 'cash_out' || s.type === 'bank_deposit').reduce((sum, s) => sum + Number(s.amount), 0)
  const netProfit = totalFees - netLoss

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayFees = verified.filter((t) => t.status === 'success' && new Date(t.created_at) >= todayStart).reduce((sum, t) => sum + Number(t.fee), 0)
  const todayLoss = losses.filter((l) => new Date(l.created_at) >= todayStart).reduce((sum, l) => sum + Number(l.amount) - Number(l.recovered_amount), 0)
  const todayEarnings = todayFees - todayLoss

  const dailyTarget = Number(settings?.daily_target ?? 0)
  const targetProgress = dailyTarget > 0 ? Math.min((todayEarnings / dailyTarget) * 100, 100) : 0

  const lowFloatThreshold = Number(settings?.low_float_threshold ?? 0)
  const lowFloatMachines = machines.filter(
    (m) => m.status === 'active' && lowFloatThreshold > 0 && Number(m.current_float) < lowFloatThreshold,
  )

  const totalCreditOutstanding = credits.filter((c) => c.status !== 'settled').reduce((sum, c) => sum + Number(c.amount) - Number(c.repaid_amount), 0)
  const overdueCredits = credits.filter(
    (c) => c.status !== 'settled' && c.due_date && new Date(c.due_date) < new Date() && Number(c.repaid_amount) < Number(c.amount),
  )

  return {
    totalProcessed, totalFees, totalLoss, totalRecovered, netLoss, totalFloat,
    successCount, failedCount, successRate, totalCashIn, totalCashOut, netProfit,
    txnCount: transactions.length, todayEarnings, dailyTarget, targetProgress,
    lowFloatThreshold, lowFloatMachines, totalCreditOutstanding, overdueCredits,
  }
}
