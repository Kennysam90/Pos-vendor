import { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart, Plus, Trash2, Search, Loader2, Package,
  Copy, CheckCircle, ArrowRight, Store, Edit2, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { EmptyState } from '../components/EmptyState'
import type { Product, InvoiceItem, Invoice } from '../lib/types'
import { INVOICE_STATUS_META } from '../lib/types'
import { formatNaira, formatDateTime } from '../lib/format'

interface Props { onDataChanged: () => Promise<void> }

interface CartItem extends InvoiceItem {
  product_id: string | null
  stock: number
}

function genAccountNumber(): string {
  let s = ''
  for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10)
  return s
}

export function SaleCalcView(_: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bankName, setBankName] = useState('Opay')
  const [accountNumber, setAccountNumber] = useState(genAccountNumber())
  const [generating, setGenerating] = useState(false)
  const [lastSale, setLastSale] = useState<Invoice | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)

  // inline product form
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', category: '' })
  const [savingProduct, setSavingProduct] = useState(false)

  const loadProducts = async () => {
    setLoadingProducts(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setLoadingProducts(false)
    if (error) { toast('error', error.message); return }
    setProducts((data as Product[]) ?? [])
  }

  const loadInvoices = async () => {
    setLoadingInvoices(true)
    const { data, error } = await supabase
      .from('invoices').select('*').order('created_at', { ascending: false }).limit(10)
    setLoadingInvoices(false)
    if (error) { toast('error', error.message); return }
    setRecentInvoices((data as Invoice[]) ?? [])
  }

  useEffect(() => { loadProducts(); loadInvoices() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category?.toLowerCase().includes(q) ?? false))
  }, [products, search])

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const addToCart = (p: Product) => {
    const existing = cart.find((i) => i.product_id === p.id)
    if (existing) {
      if (existing.quantity >= p.stock) { toast('error', 'Not enough stock'); return }
      setCart(cart.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      if (p.stock <= 0) { toast('error', 'Out of stock'); return }
      setCart([...cart, { name: p.name, price: Number(p.price), quantity: 1, product_id: p.id, stock: p.stock }])
    }
  }

  const updateQty = (idx: number, delta: number) => {
    const item = cart[idx]
    const newQty = item.quantity + delta
    if (newQty <= 0) { setCart(cart.filter((_, i) => i !== idx)); return }
    if (newQty > item.stock) { toast('error', 'Not enough stock'); return }
    setCart(cart.map((i, ci) => ci === idx ? { ...i, quantity: newQty } : i))
  }

  const removeFromCart = (idx: number) => setCart(cart.filter((_, i) => i !== idx))

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id)
    setProductForm({ name: p.name, price: String(p.price), stock: String(p.stock), category: p.category ?? '' })
    setShowProductForm(true)
  }

  const resetProductForm = () => {
    setShowProductForm(false)
    setEditingProductId(null)
    setProductForm({ name: '', price: '', stock: '', category: '' })
  }

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { toast('error', 'Product name is required'); return }
    if (!productForm.price || Number(productForm.price) <= 0) { toast('error', 'Enter a valid price'); return }
    setSavingProduct(true)
    const payload = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock) || 0,
      category: productForm.category.trim() || null,
    }
    if (editingProductId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProductId)
      setSavingProduct(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'Product updated')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      setSavingProduct(false)
      if (error) { toast('error', error.message); return }
      toast('success', 'Product added')
    }
    resetProductForm()
    loadProducts()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { toast('error', error.message); return }
    toast('success', 'Product deleted')
    loadProducts()
  }

  const generateSale = async () => {
    if (cart.length === 0) { toast('error', 'Add products to the cart first'); return }
    if (!accountNumber.trim()) { toast('error', 'Account number is needed'); return }
    if (!accountName.trim()) { toast('error', 'Account name is needed'); return }
    setGenerating(true)
    const items: InvoiceItem[] = cart.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity }))
    const payload = {
      reference: 'SAL-' + Date.now().toString(36).toUpperCase(),
      customer_name: customerName.trim() || null,
      customer_phone: customerPhone.trim() || null,
      items,
      total: cartTotal,
      status: 'pending' as const,
      account_number: accountNumber.trim(),
      account_name: accountName.trim(),
      bank_name: bankName.trim(),
    }
    const { data, error } = await supabase.from('invoices').insert(payload).select('*').maybeSingle()
    setGenerating(false)
    if (error) { toast('error', error.message); return }
    const inv = data as Invoice
    setLastSale(inv)
    setRecentInvoices([inv, ...recentInvoices])
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setAccountNumber(genAccountNumber())
    toast('success', 'Sale generated — account number ready for customer')
  }

  const markPaid = async (inv: Invoice) => {
    const { error: invErr } = await supabase
      .from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id)
    if (invErr) { toast('error', invErr.message); return }

    const { error: walErr } = await supabase.from('wallet_entries').insert({
      invoice_id: inv.id,
      amount: Number(inv.total),
      type: 'payment_received',
      description: `Payment for ${inv.reference}${inv.customer_name ? ' — ' + inv.customer_name : ''}`,
      reference: inv.reference,
    })
    if (walErr) { toast('error', walErr.message); return }

    for (const item of inv.items) {
      const prod = products.find((p) => p.name === item.name)
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity)
        await supabase.from('products').update({ stock: newStock }).eq('id', prod.id)
      }
    }

    toast('success', `${formatNaira(Number(inv.total))} added to wallet`)
    const updated = { ...inv, status: 'paid' as const, paid_at: new Date().toISOString() }
    if (lastSale?.id === inv.id) setLastSale(updated)
    setRecentInvoices(recentInvoices.map((r) => r.id === inv.id ? updated : r))
    loadProducts()
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast('success', `${label} copied`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Sales Calculator</h1>
        <p className="text-sm text-ink-500 mt-1">List products, calculate total, generate an account number for your customer to pay.</p>
      </div>

      {/* Products section */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => { resetProductForm(); setShowProductForm(true) }} className="btn-primary whitespace-nowrap">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Inline product form */}
        {showProductForm && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-800">{editingProductId ? 'Edit Product' : 'New Product'}</p>
              <button onClick={resetProductForm} className="text-ink-400 hover:text-ink-600"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="input" placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              <input className="input" placeholder="Category (optional)" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
              <input className="input" type="number" min="0" placeholder="Price (₦)" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
              <input className="input" type="number" min="0" placeholder="Stock quantity" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={resetProductForm} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveProduct} disabled={savingProduct} className="btn-primary">
                {savingProduct ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {editingProductId ? 'Update' : 'Add'} Product
              </button>
            </div>
          </div>
        )}

        {loadingProducts ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={22} />}
            title="No products yet"
            message="Add products to your shop so you can start generating sales."
            action={<button onClick={() => { resetProductForm(); setShowProductForm(true) }} className="btn-primary"><Plus size={16} /> Add Product</button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="card p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{p.name}</p>
                    {p.category && <p className="text-xs text-ink-400">{p.category}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditProduct(p)} className="text-ink-400 hover:text-brand-600 p-1"><Edit2 size={13} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="text-ink-400 hover:text-rose-600 p-1"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold text-ink-900">{formatNaira(Number(p.price))}</p>
                  <span className={`text-xs font-medium ${p.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="btn-secondary w-full mt-2 !py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} /> Add to cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart + checkout inline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={18} className="text-brand-600" />
            <h3 className="text-sm font-bold text-ink-900">Cart</h3>
            {cart.length > 0 && <span className="badge bg-brand-50 text-brand-700 ml-auto">{cart.length} items</span>}
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-8">Tap "Add to cart" on any product above</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-ink-50 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{item.name}</p>
                    <p className="text-xs text-ink-400">{formatNaira(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateQty(i, -1)} className="w-6 h-6 rounded bg-white text-ink-600 hover:bg-ink-100 flex items-center justify-center text-sm font-bold">−</button>
                    <span className="w-6 text-center text-sm font-semibold text-ink-900">{item.quantity}</span>
                    <button onClick={() => updateQty(i, 1)} className="w-6 h-6 rounded bg-white text-ink-600 hover:bg-ink-100 flex items-center justify-center text-sm font-bold">+</button>
                  </div>
                  <p className="text-sm font-bold text-ink-900 shrink-0 w-16 text-right">{formatNaira(item.price * item.quantity)}</p>
                  <button onClick={() => removeFromCart(i)} className="text-rose-500 hover:text-rose-700 shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="border-t border-ink-100 mt-3 pt-3 flex items-center justify-between">
              <span className="text-sm text-ink-500">Total</span>
              <span className="text-xl font-bold text-ink-900">{formatNaira(cartTotal)}</span>
            </div>
          )}
        </div>

        {/* Checkout details */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-bold text-ink-900">Checkout Details</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className="input text-xs" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <input className="input text-xs" placeholder="Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Account Name</label>
            <input className="input text-xs" placeholder="e.g. John Doe" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Bank</label>
              <input className="input text-xs" placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div>
              <label className="label">Account No.</label>
              <div className="flex gap-1">
                <input className="input text-xs font-mono" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                <button onClick={() => setAccountNumber(genAccountNumber())} className="btn-ghost px-2 text-brand-600" title="Generate new"><ArrowRight size={14} /></button>
              </div>
            </div>
          </div>
          <button onClick={generateSale} disabled={cart.length === 0 || generating} className="btn-primary w-full">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Generate Sale — {formatNaira(cartTotal)}</>}
          </button>
        </div>
      </div>

      {/* Last sale / payment details inline */}
      {lastSale && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-ink-900">Payment Details — {lastSale.reference}</h3>
            {lastSale.status === 'paid' ? (
              <span className="badge bg-emerald-50 text-emerald-700">Paid</span>
            ) : (
              <span className="badge bg-amber-50 text-amber-700">Awaiting Payment</span>
            )}
          </div>

          {lastSale.status === 'paid' ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">Payment Received</p>
                <p className="text-xs text-emerald-600">{formatNaira(Number(lastSale.total))} added to your wallet</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <ShoppingCart size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Awaiting Payment</p>
                <p className="text-xs text-amber-600">Share the account number below with your customer</p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-ink-50 p-4 space-y-3">
            <div className="text-center">
              <p className="text-xs text-ink-400 mb-1">Account Number</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-ink-900 font-mono tracking-wider">{lastSale.account_number}</p>
                <button onClick={() => copyText(lastSale.account_number, 'Account number')} className="text-brand-600 hover:text-brand-700"><Copy size={16} /></button>
              </div>
              <p className="text-sm text-ink-600 mt-1">{lastSale.account_name}</p>
              <p className="text-xs text-ink-400">{lastSale.bank_name}</p>
            </div>

            <div className="border-t border-ink-200 pt-3">
              <p className="text-xs text-ink-400 mb-1">Amount to Pay</p>
              <p className="text-2xl font-bold text-brand-700">{formatNaira(Number(lastSale.total))}</p>
            </div>

            <div className="border-t border-ink-200 pt-3 space-y-1">
              <p className="text-xs text-ink-400">Items</p>
              {lastSale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-ink-700">{item.name} × {item.quantity}</span>
                  <span className="text-ink-900 font-medium">{formatNaira(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {lastSale.customer_name && (
              <div className="border-t border-ink-200 pt-3">
                <p className="text-xs text-ink-400">Customer</p>
                <p className="text-sm text-ink-700">{lastSale.customer_name}{lastSale.customer_phone ? ` · ${lastSale.customer_phone}` : ''}</p>
              </div>
            )}
          </div>

          {lastSale.status === 'pending' && (
            <button onClick={() => markPaid(lastSale)} className="btn-primary w-full">
              <CheckCircle size={16} /> Mark as Paid — {formatNaira(Number(lastSale.total))} to Wallet
            </button>
          )}
        </div>
      )}

      {/* Recent sales inline */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Store size={18} className="text-brand-600" />
          <h3 className="text-sm font-bold text-ink-900">Recent Sales</h3>
        </div>
        {loadingInvoices ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-500" /></div>
        ) : recentInvoices.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-8">No sales yet. Generate your first sale above.</p>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map((inv) => {
              const meta = INVOICE_STATUS_META[inv.status]
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-ink-400 font-mono">{inv.reference}</span>
                    </div>
                    <p className="text-sm text-ink-700 mt-1 truncate">
                      {inv.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                    <p className="text-xs text-ink-400">{formatDateTime(inv.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-ink-900">{formatNaira(Number(inv.total))}</p>
                    {inv.status === 'pending' && (
                      <button onClick={() => markPaid(inv)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1">
                        Mark paid <ArrowRight size={10} className="inline" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
