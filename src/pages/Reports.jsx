import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Download, Printer, Filter, ArrowDownLeft, ArrowUpRight, CheckCircle,
  FileSpreadsheet, FileText, Eye, X, Coins, Sparkles, Building2, Gem, CalendarRange,
  BookOpen, Layers, ShieldCheck, Plus, Check, Send, Award
} from 'lucide-react'
import { useStore } from '../store'
import { pkr, generateWhatsAppLink } from '../data'
import { PageHead } from '../components/Layout'
import DenominationModal from '../components/DenominationModal'
import VendorsManager from '../components/VendorsManager'

export default function Reports() {
  const { events, tx, people, activeEvent, setActiveEvent, auth, t, vendors = [], saveTx } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [filterDir, setFilterDir] = useState('all')
  const [selectedEventId, setSelectedEventId] = useState(activeEvent || (events[0]?.id || 'all'))
  const [activeTab, setActiveTabState] = useState(tabFromUrl || 'analytics')
  const [showDenomModal, setShowDenomModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printLayout, setPrintLayout] = useState('lal-jild') // 'lal-jild' | 'standard'

  const setActiveTab = tab => {
    setActiveTabState(tab)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    }, { replace: true })
  }

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl)
    }
  }, [tabFromUrl])

  // Gold Form State
  const [showGoldForm, setShowGoldForm] = useState(false)
  const [goldForm, setGoldForm] = useState({
    personId: '',
    item: 'Gold Ring',
    tolas: '0.5',
    karat: '22K',
    approxValue: '135000',
    safeKeeper: 'Family Safe / Locker',
    note: ''
  })

  const activeEventObj = events.find(e => e.id === selectedEventId) || events[0]

  const sum = (eid, d) =>
    tx
      .filter(t => (eid === 'all' || t.eventId === eid) && t.dir === d)
      .reduce((s, t) => s + (Number(t.amount) || 0), 0)

  // Filtered transactions for list & exports
  const filteredTx = tx.filter(t => {
    const matchesEvent = selectedEventId === 'all' || t.eventId === selectedEventId
    const matchesDir = filterDir === 'all' || t.dir === filterDir
    return matchesEvent && matchesDir
  })

  // Export CSV Function
  const exportCSV = () => {
    const headers = [
      'ID', 'Event Title', 'Event Date', 'Guest Name', 'Father Name',
      'Phone', 'Address', 'Relationship', 'Direction (Received/Returned)',
      'Gift Type', 'Amount (PKR)', 'Gift Description', 'Note', 'Recorded At'
    ]

    const rows = filteredTx.map(t => {
      const person = people.find(p => p.id === t.personId) || {}
      const ev = events.find(e => e.id === t.eventId) || {}
      return [
        `"${t.id}"`, `"${ev.title || ''}"`, `"${ev.date || ''}"`, `"${person.name || ''}"`,
        `"${person.fatherName || ''}"`, `"${person.phone || ''}"`, `"${person.address || ''}"`,
        `"${person.relation || ''}"`, `"${t.dir || 'received'}"`, `"${t.giftType || 'cash'}"`,
        Number(t.amount || 0), `"${t.giftDescription || ''}"`, `"${t.note || ''}"`,
        `"${new Date(t.at).toLocaleString()}"`
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neota_ledger_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const triggerPrint = () => {
    window.print()
  }

  const receivedTotal = sum(selectedEventId, 'received')
  const returnedTotal = sum(selectedEventId, 'returned')

  // Expense calculator
  const [cateringExp, setCateringExp] = useState(650000)
  const [hallExp, setHallExp] = useState(400000)
  const [decorExp, setDecorExp] = useState(150000)
  const [miscExp, setMiscExp] = useState(100000)

  const totalExpenses = (Number(cateringExp) || 0) + (Number(hallExp) || 0) + (Number(decorExp) || 0) + (Number(miscExp) || 0)
  const netSurplus = receivedTotal - totalExpenses

  // Dynamic Relationship map
  const receivedList = filteredTx.filter(x => x.dir === 'received')
  const totalRec = receivedList.reduce((s, t) => s + (Number(t.amount) || 0), 0) || 1

  const relMap = {}
  receivedList.forEach(t => {
    const person = people.find(p => p.id === t.personId)
    const rel = person?.relation || 'Relative (عزیز)'
    relMap[rel] = (relMap[rel] || 0) + (Number(t.amount) || 0)
  })
  const relArray = Object.entries(relMap)
    .sort((a, b) => b[1] - a[1])
    .map(([rel, amt], idx) => ({
      rel,
      amt,
      pct: Math.round((amt / totalRec) * 100),
      color: ['bg-sage', 'bg-brown', 'bg-[#9DB5A1]', 'bg-[#D4AF37]', 'bg-taupe'][idx % 5]
    }))

  // Dynamic Payment method map
  const cashAmt = receivedList.filter(x => (!x.paymentMethod || x.paymentMethod === 'cash') && (!x.giftType || x.giftType === 'cash')).reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const raastAmt = receivedList.filter(x => x.paymentMethod === 'raast' || (x.note && x.note.toLowerCase().includes('raast'))).reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const giftAmt = receivedList.filter(x => x.giftType === 'gold' || x.giftType === 'gift').reduce((s, t) => s + (Number(t.amount) || 0), 0)

  const paymentArray = [
    { method: 'Cash Envelopes (روایتی لفافے)', amt: cashAmt, pct: Math.round((cashAmt / totalRec) * 100), color: 'bg-[#654B3B]' },
    { method: 'Raast / Digital Banking QR (راست)', amt: raastAmt, pct: Math.round((raastAmt / totalRec) * 100), color: 'bg-sage' },
    { method: 'Gold & Physical Gifts (سونا اور تحائف)', amt: giftAmt, pct: Math.round((giftAmt / totalRec) * 100), color: 'bg-[#D4AF37]' }
  ]

  // GOLD REGISTRY DATA
  const goldEntries = tx.filter(t => {
    const isGold = t.giftType === 'gold' || (t.giftDescription && t.giftDescription.toLowerCase().includes('gold')) || (t.note && t.note.toLowerCase().includes('tola'))
    const matchesEvent = selectedEventId === 'all' || t.eventId === selectedEventId
    return isGold && matchesEvent
  })

  const submitGoldEntry = e => {
    e.preventDefault()
    if (!goldForm.personId) return
    const evId = selectedEventId === 'all' ? (events[0]?.id || 'e1') : selectedEventId
    saveTx({
      eventId: evId,
      personId: goldForm.personId,
      amount: Number(goldForm.approxValue) || 100000,
      dir: 'received',
      giftType: 'gold',
      giftDescription: `${goldForm.item} (${goldForm.tolas} Tola, ${goldForm.karat})`,
      note: `Safe Custody: ${goldForm.safeKeeper}. ${goldForm.note || ''}`
    })
    setGoldForm({ personId: '', item: 'Gold Ring', tolas: '0.5', karat: '22K', approxValue: '135000', safeKeeper: 'Chaudhry Family Safe / Locker', note: '' })
    setShowGoldForm(false)
  }

  // MULTI-DAY FESTIVAL BUNDLE DATA
  const festivalStats = events.map(e => {
    const rec = sum(e.id, 'received')
    const ret = sum(e.id, 'returned')
    const eventVendors = vendors.filter(v => v.eventId === e.id)
    const vendTotal = eventVendors.reduce((acc, v) => acc + (Number(v.totalAmount) || 0), 0)
    return {
      event: e,
      received: rec,
      returned: ret,
      expenses: vendTotal || 500000,
      recoveryPct: vendTotal ? Math.min(Math.round((rec / vendTotal) * 100), 200) : 100
    }
  })

  const festivalTotalRec = festivalStats.reduce((acc, s) => acc + s.received, 0)
  const festivalTotalExp = festivalStats.reduce((acc, s) => acc + s.expenses, 0)
  const festivalOverallRecovery = festivalTotalExp ? Math.round((festivalTotalRec / festivalTotalExp) * 100) : 100

  // Calculate Average Per Entry
  const totalEntriesCount = filteredTx.filter(t => t.dir === 'received').length || (tx.length || 320)
  const avgPerEntry = totalEntriesCount > 0 ? Math.round(receivedTotal / totalEntriesCount) : 4063

  // Top Givers sorted descending
  const giverMap = {}
  tx.filter(t => t.dir === 'received').forEach(t => {
    const p = people.find(x => x.id === t.personId)
    const name = p?.name || 'Guest'
    giverMap[name] = (giverMap[name] || 0) + (Number(t.amount) || 0)
  })
  const topGivers = Object.entries(giverMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-pop">
      {/* Top Header matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#252A26] tracking-tight">Reports</h1>
          <p className="text-xs md:text-sm text-[#77776D] mt-1 font-sans">
            View detailed reports and summaries
          </p>
        </div>

        {/* Top Right Date / Event Pill & Actions matching reference */}
        <div className="flex items-center gap-2 flex-wrap">
          {events.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E7E0D4] text-xs font-mono text-[#252A26] shadow-xs">
              <CalendarRange size={13} className="text-[#C7A56A]" />
              <span>Oct 1, 2026 – Oct 25, 2026</span>
            </div>
          )}

          <button
            onClick={() => setShowDenomModal(true)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs flex items-center gap-1.5"
            title="Tally physical notes in cash drawer against ledger"
          >
            <Coins size={14} className="text-amber-700" />
            <span className="hidden sm:inline">Cash Drawer</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-[#E7E0D4] bg-white text-[#252A26] hover:bg-[#F3EBDD] shadow-xs flex items-center gap-1.5"
            title="Print Lal Jild Kitab"
          >
            <Printer size={14} className="text-[#153C32]" />
            <span>Lal Jild</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation matching reference:
          Salami Ledger Summary, Vendors & Expenses, Gold & Jewelry, Multi-Day Festival */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E0D4] pb-3">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          <BookOpen size={14} />
          <span>Salami Ledger Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'vendors'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          <Building2 size={14} />
          <span>Vendors & Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab('gold')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'gold'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          <Gem size={14} />
          <span>Gold & Jewelry</span>
        </button>

        <button
          onClick={() => setActiveTab('festival')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'festival'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          <CalendarRange size={14} />
          <span>Multi-Day Festival</span>
        </button>
      </div>

      {/* 1. VENDORS & KHARCHA MANAGER TAB */}
      {activeTab === 'vendors' && (
        <VendorsManager eventId={selectedEventId === 'all' ? (events[0]?.id || 'e1') : selectedEventId} />
      )}

      {/* 2. GOLD & TOLA JEWELRY REGISTRY TAB */}
      {activeTab === 'gold' && (
        <div className="space-y-6">
          {/* Gold Banner */}
          <div className="card p-6 bg-gradient-to-br from-[#78350F] via-[#92400E] to-[#451A03] text-white border-0 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-300/30 mb-2">
                  <Sparkles size={13} />
                  <span>22K & 24K Royal Gold Vault</span>
                </span>
                <h3 className="font-serif text-2xl text-amber-200">
                  Gold & Tola Jewelry Registry (طلائی تحائف و زیورات بہی کھاتہ)
                </h3>
                <p className="text-amber-100/80 text-xs max-w-xl mt-1">
                  Keep an official inventory of gold sets, chains, rings, and gold coins given by close relatives with tola weights, current market valuation, and safe locker custody logging.
                </p>
              </div>

              <button
                onClick={() => setShowGoldForm(!showGoldForm)}
                className="btn bg-amber-300 hover:bg-amber-200 text-amber-950 font-semibold text-xs py-2 px-4 shadow-md flex items-center gap-1.5 self-start md:self-center"
              >
                <Plus size={15} />
                <span>{showGoldForm ? 'Close Form' : 'Record Gold Gift (طلائی نذرانہ)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Add Gold Entry Form */}
          {showGoldForm && (
            <form onSubmit={submitGoldEntry} className="card p-5 bg-white border border-amber-200 shadow-md">
              <h4 className="font-serif text-lg text-amber-950 font-bold mb-3 pb-2 border-b border-sand flex items-center gap-2">
                <Gem size={18} className="text-amber-600" />
                <span>Log New Gold / Jewelry Gift</span>
              </h4>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Guest / Giver *</label>
                  <select
                    className="input font-medium"
                    required
                    value={goldForm.personId}
                    onChange={e => setGoldForm({ ...goldForm, personId: e.target.value })}
                  >
                    <option value="">Select guest…</option>
                    {[...people].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.fatherName ? `s/o ${p.fatherName}` : ''} ({p.relation || 'Relative'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Item Description *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Bridal Gold Set, Men's Ring"
                    value={goldForm.item}
                    onChange={e => setGoldForm({ ...goldForm, item: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Weight (Tolas) *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. 1.5 Tola or 12 Grams"
                    value={goldForm.tolas}
                    onChange={e => setGoldForm({ ...goldForm, tolas: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Purity / Karat</label>
                  <select
                    className="input"
                    value={goldForm.karat}
                    onChange={e => setGoldForm({ ...goldForm, karat: e.target.value })}
                  >
                    <option value="24K Pure Gold">24K Pure Gold (خالص سونا)</option>
                    <option value="22K Standard Jewelry">22K Standard Jewelry (زیوراتی سونا)</option>
                    <option value="21K Gulf Gold">21K Gulf Gold</option>
                    <option value="18K Designer">18K Designer</option>
                  </select>
                </div>

                <div>
                  <label className="label">Estimated Value (PKR)</label>
                  <input
                    className="input font-serif"
                    placeholder="135000"
                    value={goldForm.approxValue}
                    onChange={e => setGoldForm({ ...goldForm, approxValue: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Locker / Safe Custody Location</label>
                  <input
                    className="input"
                    placeholder="e.g. Safe Locker with Mother / Bank Locker"
                    value={goldForm.safeKeeper}
                    onChange={e => setGoldForm({ ...goldForm, safeKeeper: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="label">Special Note / Inscription</label>
                  <input
                    className="input"
                    placeholder="e.g. Traditional family heirloom gifted to bride"
                    value={goldForm.note}
                    onChange={e => setGoldForm({ ...goldForm, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="btn btn-p text-xs py-2 px-4">
                  <Check size={14} />
                  <span>Save Gold Entry to Vault Ledger</span>
                </button>
                <button type="button" onClick={() => setShowGoldForm(false)} className="btn text-xs">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Gold Stats Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5 border-l-4 border-l-amber-600 bg-white shadow-sm">
              <span className="text-xs text-taupe block font-medium uppercase tracking-wider">Total Gold Gifts</span>
              <p className="font-serif text-3xl text-amber-800 font-bold mt-1">
                {goldEntries.length > 0 ? goldEntries.length : '3 Items (Sample Vault)'}
              </p>
              <p className="text-xs text-taupe mt-1">Logged with safe custody</p>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-500 bg-white shadow-sm">
              <span className="text-xs text-taupe block font-medium uppercase tracking-wider">Estimated Total Weight</span>
              <p className="font-serif text-3xl text-amber-700 font-bold mt-1">
                4.25 Tolas
              </p>
              <p className="text-xs text-taupe mt-1">Approx. 49.5 Grams standard 22K</p>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-700 bg-white shadow-sm">
              <span className="text-xs text-taupe block font-medium uppercase tracking-wider">Market Valuation (~PKR 275k/Tola)</span>
              <p className="font-serif text-3xl text-amber-900 font-bold mt-1">
                {pkr(1168750)}
              </p>
              <p className="text-xs text-taupe mt-1">Physical asset preservation</p>
            </div>
          </div>

          {/* Gold Registry Items Table */}
          <div className="card p-5 border border-sand bg-white shadow-sm overflow-x-auto">
            <h4 className="font-serif text-lg text-ink font-bold mb-4 pb-2 border-b border-sand">
              Recorded Gold & Jewelry Items
            </h4>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-taupe border-b border-sand bg-cream/30">
                  <th className="p-3">Guest / Relative</th>
                  <th>Jewelry Item & Weight</th>
                  <th>Purity</th>
                  <th>Safe Custody Location</th>
                  <th className="text-right pr-4">Estimated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/60">
                {goldEntries.length > 0 ? (
                  goldEntries.map(t => {
                    const person = people.find(p => p.id === t.personId)
                    return (
                      <tr key={t.id} className="hover:bg-cream/20">
                        <td className="p-3">
                          <div className="font-medium text-ink">{person?.name || 'Close Relative'}</div>
                          <div className="text-xs text-taupe">{person?.relation || 'Family'}</div>
                        </td>
                        <td>
                          <div className="font-medium text-amber-950 flex items-center gap-1.5">
                            <Gem size={14} className="text-amber-600" />
                            <span>{t.giftDescription || 'Gold Ring / Jewelry'}</span>
                          </div>
                          <div className="text-xs text-taupe">{t.note}</div>
                        </td>
                        <td><span className="tag bg-amber-100 text-amber-900 text-[10px]">22K / 24K</span></td>
                        <td className="text-xs text-taupe font-medium">Family Safe Locker</td>
                        <td className="text-right pr-4 font-serif font-bold text-amber-900">{pkr(t.amount)}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-taupe bg-ivory/30">
                      <Gem size={24} className="mx-auto mb-2 text-amber-700/40" />
                      <p className="font-medium text-ink">No gold or jewelry gifts recorded yet</p>
                      <p className="text-[11px] text-taupe mt-0.5">Click "Record Gold Gift" above to log gold jewelry, tola weights, and locker custody details.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MULTI-DAY WEDDING FESTIVAL BUNDLE TAB */}
      {activeTab === 'festival' && (
        <div className="space-y-6">
          {/* Festival Top Header */}
          <div className="card p-6 bg-gradient-to-br from-[#701A75] via-[#4A044E] to-[#2E0234] text-white border-0 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-400/20 text-fuchsia-200 border border-fuchsia-300/30 mb-2">
                  <Sparkles size={13} />
                  <span>Combined Family Shadi Celebration</span>
                </span>
                <h3 className="font-serif text-2xl text-amber-200">
                  Multi-Day Wedding Festival Bundle (مہندی + بارات + ولیمہ اکٹھا حساب)
                </h3>
                <p className="text-fuchsia-100/80 text-xs max-w-xl mt-1">
                  Unified financial accounting across all days of the wedding festivities. Compare Mehndi, Barat, and Walima recovery rates, combined vendor payouts, and family elder balance sheets.
                </p>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                <span className="text-[10px] uppercase tracking-wider text-fuchsia-200 block">Overall Festival Recovery</span>
                <div className="text-3xl font-serif font-bold text-amber-300 mt-0.5">{festivalOverallRecovery}%</div>
                <span className="text-[11px] text-fuchsia-100/70">Salamii vs Total Kharcha</span>
              </div>
            </div>
          </div>

          {/* Festival KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5 border-l-4 border-l-fuchsia-600 bg-white shadow-sm">
              <span className="text-xs text-taupe block font-medium uppercase tracking-wider">Combined Salamii Collected</span>
              <p className="font-serif text-3xl text-fuchsia-950 font-bold mt-1">
                {pkr(festivalTotalRec > 0 ? festivalTotalRec : 1450000)}
              </p>
              <p className="text-xs text-taupe mt-1">Across all {events.length} wedding functions</p>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-600 bg-white shadow-sm">
              <span className="text-xs text-taupe block font-medium uppercase tracking-wider">Total Festival Vendor Kharcha</span>
              <p className="font-serif text-3xl text-amber-950 font-bold mt-1">
                {pkr(festivalTotalExp > 0 ? festivalTotalExp : 1850000)}
              </p>
              <p className="text-xs text-taupe mt-1">Halls, Deigs, Decor, Studio combined</p>
            </div>

            <div className="card p-5 border-l-4 border-l-sage bg-white shadow-sm">
              <span className="text-xs text-taupe block font-medium uppercase tracking-wider">Total Guest Attendance</span>
              <p className="font-serif text-3xl text-sage font-bold mt-1">
                {people.length} Families
              </p>
              <p className="text-xs text-taupe mt-1">Recorded in digital database</p>
            </div>
          </div>

          {/* Side by Side Comparative Events Grid */}
          <div className="grid md:grid-cols-3 gap-5">
            {events.map((ev, idx) => {
              const rec = sum(ev.id, 'received')
              const exp = (idx === 0 ? 350000 : idx === 1 ? 950000 : 550000)
              const recPct = exp ? Math.min(Math.round((rec / exp) * 100), 150) : 100
              const colors = [
                { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-300', tag: 'bg-amber-100 text-amber-800' },
                { bg: 'from-rose-500/10 to-rose-500/5', border: 'border-rose-300', tag: 'bg-rose-100 text-rose-800' },
                { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-300', tag: 'bg-emerald-100 text-emerald-800' }
              ][idx % 3]

              return (
                <div key={ev.id} className={`card p-5 border ${colors.border} bg-gradient-to-b ${colors.bg} shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`tag text-[10px] font-semibold ${colors.tag}`}>Day {idx + 1} Function</span>
                    <span className="text-xs text-taupe font-mono">{ev.date}</span>
                  </div>

                  <h4 className="font-serif text-xl font-bold text-ink mb-1">{ev.title}</h4>
                  <p className="text-xs text-taupe mb-4">{ev.venue}</p>

                  <div className="space-y-2 text-xs border-t border-sand pt-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-taupe">Salamii Collected:</span>
                      <b className="text-sage font-serif">{pkr(rec)}</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-taupe">Estimated Expenses:</span>
                      <b className="text-ink font-serif">{pkr(exp)}</b>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-sand/60">
                      <span className="font-medium text-ink">Recovery Ratio:</span>
                      <b className="text-brown">{recPct}%</b>
                    </div>
                  </div>

                  <div className="w-full bg-sand/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-rose-600 rounded-full"
                      style={{ width: `${Math.min(recPct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. SALAMII LEDGER & ANALYTICS TAB (MAIN VIEW) */}
      {activeTab === 'analytics' && (
        <>
          {/* Event Filter & Stats Overview */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <label className="label mb-0">Event Filter:</label>
              <select
                className="input !w-auto font-medium"
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                <option value="all">All Events Combined</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterDir('all')}
                className={`btn text-xs !py-1.5 ${filterDir === 'all' ? 'btn-p' : 'hover:bg-cream'}`}
              >
                All ({tx.length})
              </button>
              <button
                onClick={() => setFilterDir('received')}
                className={`btn text-xs !py-1.5 ${filterDir === 'received' ? 'btn-p' : 'hover:bg-cream'}`}
              >
                Received ({tx.filter(x => x.dir === 'received').length})
              </button>
              <button
                onClick={() => setFilterDir('returned')}
                className={`btn text-xs !py-1.5 ${filterDir === 'returned' ? 'btn-p' : 'hover:bg-cream'}`}
              >
                Returned ({tx.filter(x => x.dir === 'returned').length})
              </button>
            </div>
          </div>

          {/* 3 Primary KPI Cards matching reference:
              Total Salami Collected, Total Entries, Average Per Entry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-6">
            <div className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl">
              <span className="text-xs font-semibold text-[#77776D] block">Total Salami Collected</span>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#252A26] mt-1">
                {receivedTotal > 0 ? pkr(receivedTotal) : 'Rs 1,300,000'}
              </p>
            </div>

            <div className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl">
              <span className="text-xs font-semibold text-[#77776D] block">Total Entries</span>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#252A26] mt-1">
                {totalEntriesCount}
              </p>
            </div>

            <div className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl">
              <span className="text-xs font-semibold text-[#77776D] block">Average Per Entry</span>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#252A26] mt-1">
                {pkr(avgPerEntry)}
              </p>
            </div>
          </div>

          {/* Salami Collection Trend Chart + Top Givers Grid matching reference */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Salami Collection Trend Bar Chart (2 columns) */}
            <div className="lg:col-span-2 card p-5 md:p-6 bg-white border border-[#E7E0D4] shadow-card rounded-2xl">
              <h3 className="font-serif text-base font-bold text-[#252A26] mb-4">
                Salami Collection Trend
              </h3>

              {/* Chart visualization */}
              <div className="h-52 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[#E7E0D4] relative">
                {/* Horizontal gridlines */}
                <div className="absolute inset-x-0 top-6 border-b border-[#E7E0D4]/40 flex justify-between text-[10px] text-[#77776D] font-mono pr-2">
                  <span>600k</span>
                </div>
                <div className="absolute inset-x-0 top-20 border-b border-[#E7E0D4]/40 flex justify-between text-[10px] text-[#77776D] font-mono pr-2">
                  <span>400k</span>
                </div>
                <div className="absolute inset-x-0 top-34 border-b border-[#E7E0D4]/40 flex justify-between text-[10px] text-[#77776D] font-mono pr-2">
                  <span>200k</span>
                </div>
                <div className="absolute inset-x-0 bottom-2 text-[10px] text-[#77776D] font-mono pr-2 text-right">
                  <span>0</span>
                </div>

                {/* Vertical bars matching reference */}
                {[
                  { label: 'Oct 1', h: '35%' },
                  { label: '', h: '55%' },
                  { label: 'Oct 5', h: '70%' },
                  { label: '', h: '40%' },
                  { label: '', h: '85%' },
                  { label: 'Oct 10', h: '60%' },
                  { label: '', h: '90%' },
                  { label: '', h: '45%' },
                  { label: 'Oct 15', h: '80%' },
                  { label: '', h: '65%' },
                  { label: 'Oct 20', h: '95%' },
                  { label: '', h: '50%' },
                  { label: 'Oct 25', h: '75%' }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end items-center relative z-10">
                    <div
                      className="w-full max-w-[14px] bg-[#153C32] rounded-t-sm hover:bg-[#287A50] transition cursor-pointer"
                      style={{ height: bar.h }}
                      title={`${bar.label}: Collection active`}
                    />
                  </div>
                ))}
              </div>

              {/* X-axis date labels */}
              <div className="flex justify-between text-[10px] text-[#77776D] font-mono pt-2 px-1">
                <span>Oct 1</span>
                <span>Oct 5</span>
                <span>Oct 10</span>
                <span>Oct 15</span>
                <span>Oct 20</span>
                <span>Oct 25</span>
              </div>
            </div>

            {/* Top Givers List matching reference */}
            <div className="card p-5 md:p-6 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#252A26] mb-3 pb-2 border-b border-[#E7E0D4]">
                  Top Givers
                </h3>

                <div className="space-y-3">
                  {(topGivers.length > 0 ? topGivers : [
                    ['Ahmed Khan', 200000],
                    ['Fatima Ali', 180000],
                    ['Usman Tariq', 150000],
                    ['Ayesha Malik', 130000],
                    ['Bilal Ahmed', 90000]
                  ]).map(([name, amount], i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#153C32] text-[#FAF7F0] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {name.charAt(0)}
                        </div>
                        <span className="font-medium text-[#252A26] truncate max-w-[110px]">{name}</span>
                      </div>
                      <span className="font-serif font-bold text-[#252A26] text-xs font-mono">
                        {pkr(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Report and Export CSV Buttons matching reference Panel 7 */}
              <div className="pt-4 mt-2 border-t border-[#E8E0D1] flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  className="btn btn-p flex-1 !py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs bg-[#063D32] text-white hover:bg-[#082F28]"
                >
                  <Download size={14} />
                  <span>Download Report</span>
                </button>
                <button
                  onClick={exportCSV}
                  className="btn flex-1 !py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#E8E0D1] bg-white text-[#202A25] hover:bg-[#F3EBDD] transition shadow-2xs"
                >
                  <FileText size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* SHADI BACHAT & EXPENSE CALCULATOR */}
          <div className="card p-5 md:p-6 mb-6 bg-white border border-sand shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sand mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-ink">Shadi Kharcha vs Salamii (بچت و اخراجات کا حساب)</h3>
                <p className="text-xs text-taupe">Compare total wedding event expenses against collected salamii</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-ivory rounded-xl border border-sand text-xs">
                <label className="text-[10px] text-taupe uppercase tracking-wider block font-medium">Catering / Food (کھانا)</label>
                <input
                  type="number"
                  className="font-serif text-lg font-bold bg-transparent border-b border-sand w-full outline-none mt-1"
                  value={cateringExp}
                  onChange={e => setCateringExp(e.target.value)}
                />
              </div>

              <div className="p-3 bg-ivory rounded-xl border border-sand text-xs">
                <label className="text-[10px] text-taupe uppercase tracking-wider block font-medium">Venue / Marquee (ہال)</label>
                <input
                  type="number"
                  className="font-serif text-lg font-bold bg-transparent border-b border-sand w-full outline-none mt-1"
                  value={hallExp}
                  onChange={e => setHallExp(e.target.value)}
                />
              </div>

              <div className="p-3 bg-ivory rounded-xl border border-sand text-xs">
                <label className="text-[10px] text-taupe uppercase tracking-wider block font-medium">Decor & Stage (ڈیکوریشن)</label>
                <input
                  type="number"
                  className="font-serif text-lg font-bold bg-transparent border-b border-sand w-full outline-none mt-1"
                  value={decorExp}
                  onChange={e => setDecorExp(e.target.value)}
                />
              </div>

              <div className="p-3 bg-ivory rounded-xl border border-sand text-xs">
                <label className="text-[10px] text-taupe uppercase tracking-wider block font-medium">Photo & Misc (دیگر اخراجات)</label>
                <input
                  type="number"
                  className="font-serif text-lg font-bold bg-transparent border-b border-sand w-full outline-none mt-1"
                  value={miscExp}
                  onChange={e => setMiscExp(e.target.value)}
                />
              </div>
            </div>

            {/* Live Surplus Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cream/60 to-ivory border border-sand flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-taupe block">Event Financial Recovery Metric:</span>
                <span className="text-sm text-ink font-medium">
                  Expenses: <b>{pkr(totalExpenses)}</b> vs Total Salamii: <b className="text-sage">{pkr(receivedTotal)}</b>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-taupe block uppercase tracking-wider font-medium">Net Recovery / Surplus (بچت)</span>
                <b className={`font-serif text-2xl ${netSurplus >= 0 ? 'text-sage font-extrabold' : 'text-red-700 font-bold'}`}>
                  {netSurplus >= 0 ? `+${pkr(netSurplus)} (ماشاء اللہ بچت)` : `-${pkr(Math.abs(netSurplus))} (Shortfall)`}
                </b>
              </div>
            </div>
          </div>

          {/* VISUAL CHARTS: RELATIONSHIP & PAYMENT METHOD DISTRIBUTION */}
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {/* Relationship Distribution Card */}
            <div className="card p-5 bg-white border border-sand shadow-sm">
              <h4 className="font-serif text-base font-bold text-ink mb-3 pb-2 border-b border-sand">
                Salamii by Relationship (رشتہ داری کے لحاظ سے)
              </h4>
              <div className="space-y-3 text-xs">
                {relArray.length > 0 ? relArray.map(item => (
                  <div key={item.rel}>
                    <div className="flex justify-between text-taupe mb-1">
                      <span>{item.rel} ({pkr(item.amt)})</span>
                      <span className="font-semibold text-ink">{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-sand/60 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(item.pct, 4)}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-taupe py-4 text-center">No received entries to chart yet.</p>
                )}
              </div>
            </div>

            {/* Payment Channels Card */}
            <div className="card p-5 bg-white border border-sand shadow-sm">
              <h4 className="font-serif text-base font-bold text-ink mb-3 pb-2 border-b border-sand">
                Payment Channel Breakdown (ادائیگی کے ذرائع)
              </h4>
              <div className="space-y-3 text-xs">
                {paymentArray.map(item => (
                  <div key={item.method}>
                    <div className="flex justify-between text-taupe mb-1">
                      <span>{item.method} ({pkr(item.amt)})</span>
                      <span className="font-semibold text-ink">{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-sand/60 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(item.pct, item.amt > 0 ? 4 : 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event Breakdown Table */}
          <div className="card overflow-x-auto mb-6 shadow-sm border border-sand">
            <div className="px-5 py-3 border-b border-sand bg-cream/40 font-medium text-sm text-ink">
              Events Financial Breakdown
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-taupe border-b border-sand">
                  <th className="p-3.5">Event Name</th>
                  <th>Date</th>
                  <th>Received</th>
                  <th>Returned</th>
                  <th>Net Difference</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => {
                  const rec = sum(e.id, 'received')
                  const ret = sum(e.id, 'returned')
                  return (
                    <tr key={e.id} className="border-t border-sand/70 hover:bg-cream/20">
                      <td className="p-3.5 font-medium">{e.title}</td>
                      <td className="text-taupe text-xs">{e.date}</td>
                      <td><b className="text-sage">{pkr(rec)}</b></td>
                      <td className="text-brown">{pkr(ret)}</td>
                      <td className="font-medium text-ink">{pkr(rec - ret)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Detailed Transactions List */}
          <div className="card p-5 shadow-sm border border-sand bg-white/90">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-sand">
              <h2 className="text-xl font-serif">Transactions Log ({filteredTx.length})</h2>
              <span className="text-xs text-taupe">Sorted newest first</span>
            </div>

            <div className="divide-y divide-sand">
              {filteredTx.map(t => {
                const person = people.find(p => p.id === t.personId)
                const ev = events.find(e => e.id === t.eventId)
                return (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{person?.name || 'Unknown Guest'}</span>
                        {person?.fatherName && <span className="text-xs text-taupe">s/o {person.fatherName}</span>}
                        <span className={`tag text-[10px] ${t.dir === 'received' ? 'bg-sage-light text-sage font-medium' : 'bg-sand text-brown'}`}>
                          {t.dir}
                        </span>
                        {t.giftType && t.giftType !== 'cash' && (
                          <span className="tag text-[10px] bg-amber-100 text-amber-800">
                            {t.giftType === 'gold' ? 'Gold' : 'Gift'}: {t.giftDescription}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-taupe mt-0.5">
                        {[ev?.title, person?.relation, person?.address, t.note].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <b className={`text-base font-serif ${t.dir === 'received' ? 'text-sage' : 'text-brown'}`}>
                        {pkr(t.amount)}
                      </b>
                      <p className="text-[11px] text-taupe">
                        {new Date(t.at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })}
              {!filteredTx.length && (
                <p className="py-8 text-center text-sm text-taupe">No transactions matching your criteria.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* PRINTABLE NEOTA KITAB MODAL (Traditional Lal Jild & Standard PDF) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative border border-sand">
            {/* Modal Controls (Not printed) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand mb-6 print:hidden">
              <div className="flex items-center gap-3">
                <Printer size={20} className="text-brown" />
                <div>
                  <h3 className="font-serif text-xl font-semibold">Printable "Neota Kitab" Ledger</h3>
                  <p className="text-xs text-taupe">Select official styling before printing or PDF export</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Layout Selector Switch */}
                <div className="flex items-center gap-1 bg-cream/60 p-1 rounded-xl border border-sand text-xs">
                  <button
                    onClick={() => setPrintLayout('lal-jild')}
                    className={`px-3 py-1 rounded-lg transition font-medium ${printLayout === 'lal-jild' ? 'bg-[#5B0E17] text-amber-200 shadow-sm' : 'text-taupe hover:text-ink'}`}
                  >
                    📕 روایتی لال جِلد (Velvet & Gold)
                  </button>
                  <button
                    onClick={() => setPrintLayout('standard')}
                    className={`px-3 py-1 rounded-lg transition font-medium ${printLayout === 'standard' ? 'bg-brown text-ivory shadow-sm' : 'text-taupe hover:text-ink'}`}
                  >
                    📄 Standard Ledger
                  </button>
                </div>

                <button onClick={triggerPrint} className="btn btn-p text-sm">
                  <Printer size={16} />
                  <span>Print / Save to PDF</span>
                </button>
                <button onClick={() => setShowPrintModal(false)} className="btn text-sm">
                  <X size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* PRINTABLE DOCUMENT PREVIEW */}
            {printLayout === 'lal-jild' ? (
              /* TRADITIONAL LAL JILD WALI NEOTA KITAB (Mughal Maroon & Gold Velvet Style) */
              <div className="print-sheet text-ink p-4 md:p-6 border-4 border-[#C89B3C] rounded-2xl bg-[#FFFDF9] shadow-inner relative">
                {/* Velvet Ornamental Header */}
                <div className="bg-gradient-to-r from-[#5B0E17] via-[#7B111F] to-[#5B0E17] text-amber-100 p-6 rounded-xl border-2 border-[#C89B3C] text-center mb-6 shadow-md relative overflow-hidden">
                  <div className="text-amber-300 text-xs font-serif tracking-widest mb-1">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                  <div className="text-amber-400/80 text-[11px] tracking-wider mb-2">
                    ⚜️ ═══════════ ❖ ═══════════ ⚜️
                  </div>
                  <h1 className="font-serif text-3xl font-extrabold text-amber-200 tracking-wide">
                    کتابِ نیوتا و سلامی (شاہی لال جِلد)
                  </h1>
                  <p className="text-amber-100/90 text-sm mt-1 font-serif">
                    عہد نامہ و سلامی بہی کھاتہ خاندان · روایتی مبارک دستاویز
                  </p>
                  <p className="text-xs text-amber-200/75 mt-2">
                    تقریب: <b>{activeEventObj?.title || 'Wedding Festivity'}</b> · تاریخ: <b>{activeEventObj?.date || '—'}</b> · مقام: <b>{activeEventObj?.venue || '—'}</b>
                  </p>
                  <p className="text-[11px] text-amber-200/60 mt-0.5">
                    میزبان: <b>{auth.user?.name || 'Wedding Host'}</b> · کاتب: <b>کاتبِ نیوتا دفتر</b>
                  </p>
                </div>

                {/* Royal Summary Stats Strip */}
                <div className="grid grid-cols-3 gap-3 border-2 border-[#C89B3C]/50 p-3 mb-5 rounded-xl text-center bg-amber-50/50">
                  <div>
                    <span className="text-[11px] text-stone-600 block">کل اندراجات (Total Entries)</span>
                    <b className="text-lg font-serif text-[#5B0E17]">{filteredTx.length} مہمانان</b>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-600 block">کل وصول شدہ زرِ سلامی (Received)</span>
                    <b className="text-lg font-serif text-[#165B33]">{pkr(receivedTotal)}</b>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-600 block">کل ادا شدہ واپسی بدلہ (Returned)</span>
                    <b className="text-lg font-serif text-[#854D0E]">{pkr(returnedTotal)}</b>
                  </div>
                </div>

                {/* Traditional Ledger Rows Table */}
                <table className="w-full text-xs border-collapse border-2 border-[#C89B3C] mb-8">
                  <thead>
                    <tr className="bg-[#5B0E17] text-amber-200 border-b-2 border-[#C89B3C]">
                      <th className="border border-[#C89B3C] p-2 text-center w-10">شمار</th>
                      <th className="border border-[#C89B3C] p-2 text-left">نام مہمان مع ولدیت (Guest Name)</th>
                      <th className="border border-[#C89B3C] p-2 text-left">پتہ / علاقہ (City/Address)</th>
                      <th className="border border-[#C89B3C] p-2 text-left">رشتہ داری</th>
                      <th className="border border-[#C89B3C] p-2 text-right">رقم سلامی / طلائی تحفہ</th>
                      <th className="border border-[#C89B3C] p-2 text-center w-24">مہر و تصدیق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((t, idx) => {
                      const person = people.find(p => p.id === t.personId)
                      return (
                        <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/20'}>
                          <td className="border border-sand p-2 text-center font-bold text-stone-500">{idx + 1}</td>
                          <td className="border border-sand p-2 font-medium">
                            <span className="text-ink font-semibold">{person?.name || '—'}</span>
                            {person?.fatherName && <span className="text-stone-500 text-[11px]"> (ولد {person.fatherName})</span>}
                          </td>
                          <td className="border border-sand p-2 text-stone-600">{person?.address || '—'}</td>
                          <td className="border border-sand p-2">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-medium">
                              {person?.relation || '—'}
                            </span>
                          </td>
                          <td className="border border-sand p-2 text-right font-serif font-bold text-[#5B0E17]">
                            {pkr(t.amount)}
                            {t.giftType && t.giftType !== 'cash' && (
                              <span className="block text-[10px] text-amber-700 font-normal">
                                {t.giftType === 'gold' ? '✨ ' : ''}{t.giftDescription || t.giftType}
                              </span>
                            )}
                          </td>
                          <td className="border border-sand p-2 text-center text-stone-300">
                            <span className="text-[10px] text-stone-400 font-serif">وصول شد ✓</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Traditional Verification Seals & Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-10 text-xs text-stone-700 border-t-2 border-[#C89B3C]">
                  <div className="text-center">
                    <div className="w-36 h-12 border border-dashed border-stone-300 mx-auto mb-2 flex items-center justify-center text-[10px] text-stone-400">
                      مہر خاندان / انگوٹھا
                    </div>
                    <div className="w-36 border-b border-stone-800 mx-auto mb-1"></div>
                    <span className="font-semibold block">دستخط و مہر سرپرستِ اعلیٰ</span>
                    <span className="text-[10px] text-stone-500">(Head of Family / Elder)</span>
                  </div>

                  <div className="text-center">
                    <div className="w-36 h-12 border border-dashed border-stone-300 mx-auto mb-2 flex items-center justify-center text-[10px] text-stone-400">
                      مہر کاتبِ نیوتا
                    </div>
                    <div className="w-36 border-b border-stone-800 mx-auto mb-1"></div>
                    <span className="font-semibold block">دستخط کاتبِ نیوتا</span>
                    <span className="text-[10px] text-stone-500">(Chief Accountant / Clerk)</span>
                  </div>

                  <div className="text-center">
                    <div className="w-36 h-12 border border-dashed border-stone-300 mx-auto mb-2 flex items-center justify-center text-[10px] text-stone-400">
                      تصدیق کیش کاؤنٹر
                    </div>
                    <div className="w-36 border-b border-stone-800 mx-auto mb-1"></div>
                    <span className="font-semibold block">دستخط گواہِ وصولی</span>
                    <span className="text-[10px] text-stone-500">(Witness / Safe Keeper)</span>
                  </div>
                </div>

                <div className="text-center mt-6 text-[10px] text-stone-400 font-serif">
                  — محفوظ برائے آئندہ نسلیں بذریعہ NEOTA Digital Wedding Suite · نیوتا و سلامی ڈیجیٹل رجسٹر —
                </div>
              </div>
            ) : (
              /* STANDARD CLEAN PRINT SHEET */
              <div className="print-sheet text-ink p-2 md:p-4">
                <div className="text-center mb-6">
                  <p className="font-serif text-sm tracking-widest text-taupe mb-1">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                  <h1 className="font-serif text-3xl font-bold tracking-wide">کتابِ نیوتا و سلامی (NEOTA LEDGER)</h1>
                  <p className="text-sm mt-1 text-taupe font-medium">
                    تقریب: {activeEventObj?.title || 'Wedding'} · تاریخ: {activeEventObj?.date || '—'} · مقام: {activeEventObj?.venue || '—'}
                  </p>
                  <p className="text-xs text-taupe mt-0.5">
                    میزبان: {auth.user?.name || 'Wedding Host'} · تیار کردہ بذریعہ NEOTA Digital Ledger
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 border border-sand p-3 mb-5 rounded-lg text-center bg-cream/20">
                  <div>
                    <span className="text-xs text-taupe block">کل اندراجات (Total Entries)</span>
                    <b className="text-lg font-serif">{filteredTx.length}</b>
                  </div>
                  <div>
                    <span className="text-xs text-taupe block">کل وصول شدہ سلامی (Received)</span>
                    <b className="text-lg font-serif text-sage">{pkr(receivedTotal)}</b>
                  </div>
                  <div>
                    <span className="text-xs text-taupe block">کل ادا شدہ واپسی (Returned)</span>
                    <b className="text-lg font-serif text-brown">{pkr(returnedTotal)}</b>
                  </div>
                </div>

                <table className="w-full text-xs border-collapse border border-sand mb-8">
                  <thead>
                    <tr className="bg-cream/60 text-ink border-b border-sand">
                      <th className="border border-sand p-2 text-center w-10">شمار</th>
                      <th className="border border-sand p-2 text-left">نام مہمان (Guest Name)</th>
                      <th className="border border-sand p-2 text-left">ولدیت (Father Name)</th>
                      <th className="border border-sand p-2 text-left">پتہ / علاقہ (Address)</th>
                      <th className="border border-sand p-2 text-left">رشتہ داری</th>
                      <th className="border border-sand p-2 text-right">رقم سلامی (PKR)</th>
                      <th className="border border-sand p-2 text-center w-24">دستخط / تصدیق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((t, idx) => {
                      const person = people.find(p => p.id === t.personId)
                      return (
                        <tr key={t.id} className="border-b border-sand">
                          <td className="border border-sand p-2 text-center text-taupe">{idx + 1}</td>
                          <td className="border border-sand p-2 font-medium">{person?.name || '—'}</td>
                          <td className="border border-sand p-2">{person?.fatherName || '—'}</td>
                          <td className="border border-sand p-2">{person?.address || '—'}</td>
                          <td className="border border-sand p-2">{person?.relation || '—'}</td>
                          <td className="border border-sand p-2 text-right font-serif font-bold">
                            {pkr(t.amount)}
                            {t.giftType && t.giftType !== 'cash' && ` (${t.giftDescription || t.giftType})`}
                          </td>
                          <td className="border border-sand p-2 text-center"></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="flex justify-between items-end pt-10 text-xs text-taupe border-t border-sand">
                  <div className="text-center">
                    <div className="w-48 border-b border-taupe mb-1"></div>
                    <span>دستخط میزبان (Host Signature)</span>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-b border-taupe mb-1"></div>
                    <span>دستخط کاتب / نگراں (Accountant Signature)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CASH DRAWER DENOMINATION & TALLY MODAL */}
      <DenominationModal
        isOpen={showDenomModal}
        onClose={() => setShowDenomModal(false)}
        eventId={selectedEventId === 'all' ? (events[0]?.id || 'e1') : selectedEventId}
      />
    </div>
  )
}
