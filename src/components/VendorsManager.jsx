import { useState } from 'react'
import { Plus, Check, Trash2, Edit3, Phone, Building, DollarSign, AlertCircle, CheckCircle2, Printer, X, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'

const VENDOR_CATEGORIES = [
  'Venue / Marquee',
  'Catering / Food',
  'Photo & Video',
  'Decor & Flowers',
  'DJ & Sound',
  'Bridal Salon / Makeup',
  'Car Rental / Transport',
  'Security & Tips',
  'Other'
]

export default function VendorsManager({ eventId }) {
  const { events, vendors, addVendor, updateVendor, deleteVendor, activeEvent } = useStore()
  const targetEventId = eventId || activeEvent
  const currentEvent = events.find(e => e.id === targetEventId) || events[0]

  const eventVendors = vendors.filter(v => v.eventId === targetEventId)

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const [form, setForm] = useState({
    name: '',
    category: 'Catering / Food',
    contact: '',
    totalAmount: '',
    advancePaid: '',
    notes: ''
  })

  // Calculations
  const totalAgreed = eventVendors.reduce((s, v) => s + (Number(v.totalAmount) || 0), 0)
  const totalAdvance = eventVendors.reduce((s, v) => s + (Number(v.advancePaid) || 0), 0)
  const totalRemaining = totalAgreed - totalAdvance

  const handleSubmit = e => {
    e.preventDefault()
    const total = Number(form.totalAmount) || 0
    const advance = Number(form.advancePaid) || 0
    const status = advance >= total ? 'Paid' : advance > 0 ? 'Partial' : 'Unpaid'

    if (editingId) {
      updateVendor(editingId, {
        ...form,
        totalAmount: total,
        advancePaid: advance,
        status
      })
      setEditingId(null)
    } else {
      addVendor({
        ...form,
        eventId: targetEventId,
        totalAmount: total,
        advancePaid: advance,
        status
      })
    }

    setForm({ name: '', category: 'Catering / Food', contact: '', totalAmount: '', advancePaid: '', notes: '' })
    setIsAdding(false)
  }

  const handleEdit = v => {
    setEditingId(v.id)
    setForm({
      name: v.name,
      category: v.category,
      contact: v.contact || '',
      totalAmount: v.totalAmount,
      advancePaid: v.advancePaid,
      notes: v.notes || ''
    })
    setIsAdding(true)
  }

  const handleMarkSettled = v => {
    updateVendor(v.id, { advancePaid: v.totalAmount, status: 'Paid' })
  }

  const filteredVendors = eventVendors.filter(v => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'pending') return v.status !== 'Paid'
    if (filterStatus === 'paid') return v.status === 'Paid'
    return true
  })

  return (
    <div className="card p-5 md:p-6 bg-white border border-sand shadow-sm rounded-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sand mb-5">
        <div>
          <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Building size={20} className="text-brown" />
            <span>Wedding Vendors & Kharcha Manager (وینڈرز اور بقایا جات)</span>
          </h3>
          <p className="text-xs text-taupe mt-0.5">
            Event: <b>{currentEvent?.title}</b> · Marquee, Catering, Photography & Decor balances
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdding(!isAdding)
            setEditingId(null)
            setForm({ name: '', category: 'Catering / Food', contact: '', totalAmount: '', advancePaid: '', notes: '' })
          }}
          className="btn btn-p text-xs !py-2 flex items-center gap-1.5 shadow-sm"
        >
          {isAdding ? <X size={15} /> : <Plus size={15} />}
          <span>{isAdding ? 'Close Form' : 'Add New Vendor'}</span>
        </button>
      </div>

      {/* KPI Balances */}
      <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
        <div className="p-3.5 rounded-2xl bg-cream/30 border border-sand">
          <span className="text-[10px] text-taupe uppercase font-medium block">Total Agreed Budget (کل بجٹ)</span>
          <b className="font-serif text-lg text-ink mt-0.5 block">{pkr(totalAgreed)}</b>
          <span className="text-[10px] text-taupe">{eventVendors.length} vendors contracted</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-sage-light/40 border border-sage/30">
          <span className="text-[10px] text-sage uppercase font-medium block">Advance Paid (ادا شدہ ایڈوانس)</span>
          <b className="font-serif text-lg text-sage mt-0.5 block">{pkr(totalAdvance)}</b>
          <span className="text-[10px] text-sage/80 font-medium">{totalAgreed ? Math.round((totalAdvance / totalAgreed) * 100) : 0}% cleared</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
          <span className="text-[10px] text-amber-900 uppercase font-medium block">Balance Due Tonight (بقایا رات 2 بجے)</span>
          <b className="font-serif text-lg text-amber-900 mt-0.5 block">{pkr(totalRemaining)}</b>
          <span className="text-[10px] text-amber-800 font-medium">To clear after function</span>
        </div>
      </div>

      {/* Add / Edit Form Modal-like Inline Card */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-ivory border border-sand mb-6 space-y-3 text-xs animate-fade-in">
          <b className="text-sm font-serif block text-brown mb-2">{editingId ? 'Edit Vendor Details' : 'Add Wedding Vendor'}</b>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Vendor / Company Name *</label>
              <input
                className="input"
                required
                placeholder="e.g. Royal Deig & Catering"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Category *</label>
              <select
                className="input font-medium"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {VENDOR_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Contact / Phone *</label>
              <input
                className="input"
                placeholder="e.g. Ustad Akram: 0321-4433221"
                value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Total Agreed Price (PKR) *</label>
              <input
                type="number"
                className="input font-bold"
                required
                placeholder="650000"
                value={form.totalAmount}
                onChange={e => setForm({ ...form, totalAmount: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Advance Paid So Far (PKR)</label>
              <input
                type="number"
                className="input"
                placeholder="400000"
                value={form.advancePaid}
                onChange={e => setForm({ ...form, advancePaid: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Remaining Balance (بقایا)</label>
              <div className="input bg-cream/40 font-bold font-serif text-brown flex items-center">
                {pkr((Number(form.totalAmount) || 0) - (Number(form.advancePaid) || 0))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Notes / Package Details</label>
            <input
              className="input"
              placeholder="e.g. Mutton Qorma, Biryani, Kheer for 800 guests; Includes waiters"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null) }}
              className="btn text-xs !py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-p text-xs !py-2 flex items-center gap-1 shadow-sm"
            >
              <Check size={14} />
              <span>{editingId ? 'Save Changes' : 'Save Vendor Contract'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-serif font-bold text-ink">Contracted Vendors ({eventVendors.length})</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`btn text-[11px] !py-1 !px-2.5 ${filterStatus === 'all' ? 'btn-p' : 'hover:bg-cream'}`}
          >
            All ({eventVendors.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`btn text-[11px] !py-1 !px-2.5 ${filterStatus === 'pending' ? 'btn-p' : 'hover:bg-cream'}`}
          >
            Pending Balance ({eventVendors.filter(x => x.status !== 'Paid').length})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`btn text-[11px] !py-1 !px-2.5 ${filterStatus === 'paid' ? 'btn-p' : 'hover:bg-cream'}`}
          >
            Settled ({eventVendors.filter(x => x.status === 'Paid').length})
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="overflow-x-auto rounded-2xl border border-sand">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-cream/40 text-taupe border-b border-sand">
              <th className="p-3">Vendor / Service</th>
              <th>Contact</th>
              <th className="text-right">Total (PKR)</th>
              <th className="text-right">Advance Paid</th>
              <th className="text-right">Balance Due</th>
              <th className="text-center">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/70">
            {filteredVendors.map(v => {
              const balance = (Number(v.totalAmount) || 0) - (Number(v.advancePaid) || 0)
              const isSettled = balance <= 0
              return (
                <tr key={v.id} className="hover:bg-cream/20">
                  <td className="p-3">
                    <b className="font-semibold text-ink block">{v.name}</b>
                    <span className="text-[10px] text-taupe">{v.category} {v.notes ? `· ${v.notes}` : ''}</span>
                  </td>
                  <td className="text-taupe font-mono text-[11px]">{v.contact || '—'}</td>
                  <td className="text-right font-serif font-bold text-ink">{pkr(v.totalAmount)}</td>
                  <td className="text-right text-sage font-medium">{pkr(v.advancePaid)}</td>
                  <td className="text-right font-serif font-bold">
                    <span className={isSettled ? 'text-sage' : 'text-amber-900'}>
                      {isSettled ? '0 (NIL)' : pkr(balance)}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isSettled ? 'bg-sage-light text-sage' : 'bg-amber-100 text-amber-900'}`}>
                      {isSettled ? 'Settled ✓' : 'Balance Due'}
                    </span>
                  </td>
                  <td className="text-right p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isSettled && (
                        <button
                          onClick={() => handleMarkSettled(v)}
                          className="btn text-[11px] !py-1 !px-2 bg-sage-light text-sage hover:bg-sage hover:text-white"
                          title="Mark remaining balance cleared"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(v)}
                        className="p-1.5 rounded-lg text-taupe hover:text-ink hover:bg-cream"
                        title="Edit vendor"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${v.name}?`)) deleteVendor(v.id)
                        }}
                        className="p-1.5 rounded-lg text-taupe hover:text-red-600 hover:bg-red-50"
                        title="Delete vendor"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!filteredVendors.length && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-taupe">
                  No vendors recorded matching this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
