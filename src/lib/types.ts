import { formatNaira } from './format'

export type TransactionType =
  | 'withdrawal' | 'transfer' | 'airtime' | 'data' | 'bill_payment'
  | 'cash_deposit' | 'balance_inquiry' | 'betting' | 'tv_subscription'

export type LossReason =
  | 'failed_transaction' | 'chargeback' | 'customer_dispute' | 'network_failure'
  | 'shortfall' | 'stolen' | 'fraud' | 'other'

export type MachineStatus = 'active' | 'inactive' | 'faulty'

export interface Machine {
  id: string
  nickname: string
  serial_number: string
  provider: string
  terminal_id: string | null
  location: string | null
  status: MachineStatus
  sim_number: string | null
  current_float: number
  created_at: string
}

export interface Transaction {
  id: string
  machine_id: string | null
  type: TransactionType
  customer_name: string | null
  amount: number
  fee: number
  status: 'success' | 'failed' | 'reversed'
  reference: string
  phone: string | null
  balance_before: number | null
  balance_after: number | null
  notes: string | null
  verified: boolean
  verified_at: string | null
  created_at: string
}

export interface Loss {
  id: string
  machine_id: string | null
  transaction_id: string | null
  reason: LossReason
  amount: number
  description: string
  recovered: boolean
  recovered_amount: number
  created_at: string
}

export interface Settlement {
  id: string
  machine_id: string | null
  amount: number
  type: 'cash_in' | 'cash_out' | 'bank_deposit' | 'float_topup'
  reference: string | null
  notes: string | null
  created_at: string
}

export const TRANSACTION_TYPE_META: Record<
  TransactionType, { label: string; feeLabel: string; color: string; bg: string }
> = {
  withdrawal: { label: 'Cash Withdrawal', feeLabel: 'Withdrawal fee', color: 'text-brand-700', bg: 'bg-brand-50' },
  transfer: { label: 'Transfer', feeLabel: 'Transfer fee', color: 'text-violet-600', bg: 'bg-violet-50' },
  airtime: { label: 'Airtime', feeLabel: 'Airtime commission', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  data: { label: 'Data Bundle', feeLabel: 'Data commission', color: 'text-teal-600', bg: 'bg-teal-50' },
  bill_payment: { label: 'Bill Payment', feeLabel: 'Bill commission', color: 'text-amber-600', bg: 'bg-amber-50' },
  betting: { label: 'Betting / Funding', feeLabel: 'Betting commission', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  tv_subscription: { label: 'TV Subscription', feeLabel: 'TV commission', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  cash_deposit: { label: 'Cash Deposit', feeLabel: 'Deposit fee', color: 'text-sky-600', bg: 'bg-sky-50' },
  balance_inquiry: { label: 'Balance Inquiry', feeLabel: 'Inquiry fee', color: 'text-ink-600', bg: 'bg-ink-100' },
}

export const LOSS_REASON_META: Record<LossReason, { label: string; color: string; bg: string }> = {
  failed_transaction: { label: 'Failed Transaction', color: 'text-rose-700', bg: 'bg-rose-50' },
  chargeback: { label: 'Chargeback', color: 'text-rose-700', bg: 'bg-rose-50' },
  customer_dispute: { label: 'Customer Dispute', color: 'text-amber-700', bg: 'bg-amber-50' },
  network_failure: { label: 'Network Failure', color: 'text-orange-700', bg: 'bg-orange-50' },
  shortfall: { label: 'Cash Shortfall', color: 'text-amber-700', bg: 'bg-amber-50' },
  stolen: { label: 'Stolen', color: 'text-rose-700', bg: 'bg-rose-50' },
  fraud: { label: 'Fraud', color: 'text-rose-700', bg: 'bg-rose-50' },
  other: { label: 'Other', color: 'text-ink-700', bg: 'bg-ink-100' },
}

export type CreditStatus = 'outstanding' | 'partial' | 'settled'

export interface Credit {
  id: string
  customer_name: string
  phone: string | null
  amount: number
  repaid_amount: number
  status: CreditStatus
  due_date: string | null
  notes: string | null
  machine_id: string | null
  created_at: string
}

export interface Settings {
  id: string
  daily_target: number
  low_float_threshold: number
  updated_at: string
}

export const CREDIT_STATUS_META: Record<CreditStatus, { label: string; color: string; bg: string }> = {
  outstanding: { label: 'Outstanding', color: 'text-rose-700', bg: 'bg-rose-50' },
  partial: { label: 'Partly Paid', color: 'text-amber-700', bg: 'bg-amber-50' },
  settled: { label: 'Settled', color: 'text-emerald-700', bg: 'bg-emerald-50' },
}

export const PROVIDERS = [
  'Moniepoint', 'Opay', 'PalmPay', 'Baxi', 'Kuda', 'UBA', 'Access Bank',
  'Zenith Bank', 'GTBank', 'First Bank', 'Sterling', 'Other',
] as const

export function formatWithSign(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${formatNaira(Math.abs(amount))}`
}

export interface InvoiceItem {
  name: string
  price: number
  quantity: number
}

export type InvoiceStatus = 'pending' | 'paid' | 'cancelled'

export interface Invoice {
  id: string
  reference: string
  customer_name: string | null
  customer_phone: string | null
  items: InvoiceItem[]
  total: number
  status: InvoiceStatus
  account_number: string
  account_name: string
  bank_name: string
  notes: string | null
  created_at: string
  paid_at: string | null
}

export type WalletEntryType = 'payment_received' | 'withdrawal' | 'adjustment'

export interface WalletEntry {
  id: string
  invoice_id: string | null
  amount: number
  type: WalletEntryType
  description: string
  reference: string | null
  created_at: string
}

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  paid: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'text-ink-600', bg: 'bg-ink-100', dot: 'bg-ink-400' },
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  notes: string | null
  created_at: string
}

export type ExpenseCategory = 'rent' | 'fuel' | 'data' | 'electricity' | 'salary' | 'maintenance' | 'supplies' | 'other'

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  created_at: string
}

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; color: string; bg: string }> = {
  rent: { label: 'Rent', color: 'text-rose-700', bg: 'bg-rose-50' },
  fuel: { label: 'Fuel / Transport', color: 'text-orange-700', bg: 'bg-orange-50' },
  data: { label: 'Data / Internet', color: 'text-teal-700', bg: 'bg-teal-50' },
  electricity: { label: 'Electricity', color: 'text-amber-700', bg: 'bg-amber-50' },
  salary: { label: 'Salary / Wages', color: 'text-brand-700', bg: 'bg-brand-50' },
  maintenance: { label: 'Maintenance', color: 'text-violet-700', bg: 'bg-violet-50' },
  supplies: { label: 'Supplies', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  other: { label: 'Other', color: 'text-ink-700', bg: 'bg-ink-100' },
}
