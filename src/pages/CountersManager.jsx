import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  KeyRound, Plus, Send, Copy, Check, Trash2, ShieldCheck,
  Lock, AlertTriangle, CheckCircle2, Coins, History, Users,
  Smartphone, Sparkles, HelpCircle, ArrowLeft, RefreshCw, X, QrCode, UserPlus
} from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'

export default function CountersManager() {
  const { id } = useParams()
  const {
    events,
    activeEvent,
    setActiveEvent,
    tx,
    createCounterLink,
    revokeCounterLink,
    reactivateCounterLink,
    updateEvent,
    saveCashReconciliation
  } = useStore()

  // Resolve target event
  const targetEventId = id || activeEvent || events[0]?.id
  const event = events.find(e => e.id === targetEventId)

  // Creation form state
  const [operatorName, setOperatorName] = useState('')
  const [counterStation, setCounterStation] = useState('Counter 1 (Main Entrance)')
  const [lastCreated, setLastCreated] = useState(null)
  const [copiedToken, setCopiedToken] = useState(null)

  // Modal State for Add Counter Button
  const [modalOperator, setModalOperator] = useState('')
  const [modalStation, setModalStation] = useState('Counter 1 (Main Entrance)')
  const [modalSuccessLink, setModalSuccessLink] = useState(null)

  const handleModalCreate = async e => {
    e.preventDefault()
    if (!modalOperator.trim()) return
    const newLink = await createCounterLink(event.id, modalOperator.trim(), modalStation)
    setModalSuccessLink(newLink)
    setModalOperator('')
  }

  // Drawer tally states: map of physical cash counted
  const [talliesInput, setTalliesInput] = useState({})
  const [tallyNotes, setTallyNotes] = useState({})

  // Audit filter state
  const [filterOperator, setFilterOperator] = useState('all')

  if (!event) {
    return (
      <div className="card p-8 text-center text-sm bg-white border border-sand">
        <p className="text-taupe mb-3">No event selected. Please create or choose an event first.</p>
        <Link to="/app/events" className="btn btn-p inline-flex items-center gap-2">
          <span>Go to Events List</span>
        </Link>
      </div>
    )
  }

  const counterLinks = event.counterLinks || []
  const allowPin = event.allowPinEntry || false
  const savedTallies = event.reconciliationTallies || {}

  // Toggle strict mode (disable PIN entry so only secret links work)
  const toggleStrictSecurity = () => {
    updateEvent(event.id, { allowPinEntry: !allowPin })
  }

  // Handle new operator link creation
  const handleCreate = async e => {
    e.preventDefault()
    if (!operatorName.trim()) return

    const newLink = await createCounterLink(event.id, operatorName.trim(), counterStation)
    setLastCreated(newLink)
    setOperatorName('')
  }

  // Calculate stats for a specific operator
  const getStats = (assistantName, stationTitle, token) => {
    const list = tx.filter(t =>
      t.eventId === event.id &&
      t.dir === 'received' &&
      (t.counterToken === token || t.recordedBy === assistantName || t.counterName === stationTitle)
    )
    const total = list.reduce((s, t) => s + (Number(t.amount) || 0), 0)
    return { count: list.length, total, list }
  }

  const copyLink = link => {
    const url = `${window.location.origin}/counter?key=${link.token}`
    navigator.clipboard?.writeText(url)
    setCopiedToken(link.id)
    setTimeout(() => setCopiedToken(null), 2500)
  }

  const sendWhatsApp = link => {
    const url = `${window.location.origin}/counter?key=${link.token}`
    const message = `*Assalam-o-Alaikum ${link.name} Bhai!*\n\n` +
      `Here is your official digital salamii counter link for: *"${event.title}"*\n\n` +
      `📍 *Station:* ${link.counterTitle}\n` +
      `🔗 *Your Access Link:* ${url}\n\n` +
      `🔒 *Security Notice:* This link is assigned specifically to you. All recorded gift entries and cash will be attributed directly to your drawer.\n\n` +
      `— NEOTA Secure Wedding Ledger`

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSaveTally = (link) => {
    const inputVal = talliesInput[link.id]
    if (inputVal === undefined || inputVal === '') {
      alert('Please enter physical cash counted in the drawer (دراز کا کیش درج کریں).')
      return
    }
    const note = tallyNotes[link.id] || ''
    saveCashReconciliation(event.id, link.id, inputVal, link.name, note)
  }

  // Filter transactions for audit trail
  const eventTx = tx.filter(t => t.eventId === event.id && t.dir === 'received')
  const filteredTx = filterOperator === 'all'
    ? eventTx
    : eventTx.filter(t => t.recordedBy === filterOperator || t.counterToken === filterOperator)

  // Active tab state matching reference: Counters | Team Members
  const [activeTab, setActiveTab] = useState('counters') // 'counters' | 'team'
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-6 pb-16 animate-pop">
      {/* Top Header matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#202A25] tracking-tight">
            Counters & Team
          </h1>
          <p className="text-xs md:text-sm text-[#77776E] mt-1 font-sans">
            Manage your counters and team members
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-p text-xs md:text-sm !py-2.5 !px-5 shadow-sm rounded-full flex items-center gap-1.5 bg-[#063D32] text-white hover:bg-[#082F28]"
        >
          <Plus size={16} />
          <span>Add Counter</span>
        </button>
      </div>

      {/* Tabs matching reference: Counters | Team Members */}
      <div className="flex items-center gap-2 border-b border-[#E8E0D1] pb-3">
        <button
          onClick={() => setActiveTab('counters')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeTab === 'counters'
              ? 'bg-[#063D32] text-white shadow-xs'
              : 'bg-white border border-[#E8E0D1] text-[#77776E] hover:bg-[#F3EBDD]'
          }`}
        >
          Counters
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeTab === 'team'
              ? 'bg-[#063D32] text-white shadow-xs'
              : 'bg-white border border-[#E8E0D1] text-[#77776E] hover:bg-[#F3EBDD]'
          }`}
        >
          Team Members
        </button>
      </div>

      {activeTab === 'counters' && (
        <>
          {/* 4 Counter Cards Grid matching reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[
          {
            id: 'c1',
            title: 'Counter 1',
            station: '(Main Entrance)',
            cash: 480000,
            entries: 120,
            status: 'Active'
          },
          {
            id: 'c2',
            title: 'Counter 2',
            station: '(Registration)',
            cash: 320000,
            entries: 85,
            status: 'Active'
          },
          {
            id: 'c3',
            title: 'Counter 3',
            station: '(Family Side)',
            cash: 210000,
            entries: 60,
            status: 'Active'
          },
          {
            id: 'c4',
            title: 'Counter 4',
            station: '(Guest Side)',
            cash: 180000,
            entries: 55,
            status: 'Active'
          }
        ].map((c, idx) => {
          // If we have live assigned links, use live stats, otherwise fallback to the reference values
          const liveLink = counterLinks[idx]
          const liveStats = liveLink ? getStats(liveLink.name, liveLink.counterTitle, liveLink.token) : null

          const title = liveLink ? liveLink.counterTitle.split('(')[0].trim() : c.title
          const station = liveLink ? `(${liveLink.counterTitle.split('(')[1] || liveLink.name})` : c.station
          const cashVal = liveStats && liveStats.total > 0 ? liveStats.total : c.cash
          const entryVal = liveStats && liveStats.count > 0 ? liveStats.count : c.entries

          return (
            <div
              key={c.id}
              className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between hover:border-[#153C32]/30 transition"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#252A26] leading-tight">{title}</h3>
                    <span className="text-xs text-[#77776D] font-medium block">{station}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#287A50] bg-[#DCE8DC] px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#287A50] animate-pulse" />
                    Active
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#E7E0D4]/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#77776D]">Cash:</span>
                    <b className="font-serif font-bold text-[#252A26]">{pkr(cashVal)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77776D]">Entries:</span>
                    <span className="font-medium text-[#252A26] font-mono">{entryVal}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-[#E7E0D4]">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full text-center py-1.5 rounded-xl border border-[#E7E0D4] bg-[#FAF7F0] hover:bg-[#F3EBDD] text-xs font-semibold text-[#252A26] transition shadow-xs"
                >
                  Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Policy Toggle Banner */}
      <div className="p-4 md:p-5 rounded-2xl bg-white border border-[#E7E0D4] shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 max-w-xl">
          <div className="w-10 h-10 rounded-xl bg-[#DCE8DC] text-[#287A50] flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <b className="font-serif text-sm text-[#252A26] block">
              Security Policy: Public 4-Digit PIN Access
            </b>
            <p className="text-xs text-[#77776D] mt-0.5 leading-relaxed font-sans">
              When <b>Strict Mode (Secret Links Only)</b> is enabled, general PIN entry is blocked. Only assistants with authorized personalized links can enter transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E7E0D4]">
          <span className={`text-xs font-bold ${allowPin ? 'text-amber-800' : 'text-[#287A50]'}`}>
            {allowPin ? '⚠️ PIN Entry Allowed' : '🔒 Secret Links Only (Strict)'}
          </span>
          <button
            onClick={toggleStrictSecurity}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              allowPin ? 'bg-amber-600' : 'bg-[#153C32]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                allowPin ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* STEP 1: GENERATE DEDICATED ASSISTANT LINK */}
      <div className="card p-5 md:p-6 bg-gradient-to-br from-white to-[#FDFBF7] border border-sand shadow-sm rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-brown text-ivory text-xs font-bold flex items-center justify-center font-mono">
            1
          </span>
          <h2 className="font-serif text-lg font-bold text-ink">
            Assign New Counter Assistant <span className="font-sans text-xs text-taupe font-normal">(نیا کاؤنٹر اسسٹنٹ شامل کریں)</span>
          </h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label !text-xs font-semibold">
                Assistant / Operator Name <span className="text-taupe font-normal">(اسسٹنٹ کا نام)</span>
              </label>
              <input
                className="input !text-sm"
                placeholder="e.g. Bilal Tariq (Brother) or Asif Ali"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                required
              />
              <span className="text-[11px] text-taupe mt-1 block">
                This operator name will be permanently locked on their phone session and attached to every entry.
              </span>
            </div>

            <div>
              <label className="label !text-xs font-semibold">
                Station Location <span className="text-taupe font-normal">(کاؤنٹر کی جگہ)</span>
              </label>
              <select
                className="input !text-sm"
                value={counterStation}
                onChange={e => setCounterStation(e.target.value)}
              >
                <option value="Counter 1 (Main Entrance)">Counter 1 (Main Entrance · مین گیٹ)</option>
                <option value="Counter 2 (Stage VIP)">Counter 2 (Stage VIP · اسٹیج)</option>
                <option value="Counter 3 (Family Elders)">Counter 3 (Family Elders · بزرگ عمائدین)</option>
                <option value="Counter 4 (Ladies Hall)">Counter 4 (Ladies Hall · خواتین ہال)</option>
                <option value="Mobile Assistant (Usher)">Mobile Assistant (Usher · ٹیبلز پر)</option>
              </select>
              <span className="text-[11px] text-taupe mt-1 block">
                Helps reconcile cash drawer balances by physical location.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-p text-sm py-2.5 px-6 shadow-sm flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span>Generate Dedicated Secret Link</span>
          </button>
        </form>

        {/* Success Alert if link just created */}
        {lastCreated && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
              <span>
                Dedicated link created for <b>{lastCreated.name}</b>! Share via WhatsApp or copy link below.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => sendWhatsApp(lastCreated)}
                className="btn text-xs !py-1.5 !px-3 bg-[#0A4B32] hover:bg-[#123B2A] text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send size={13} />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={() => copyLink(lastCreated)}
                className="btn text-xs !py-1.5 !px-3 hover:bg-cream border border-sand flex items-center gap-1.5"
              >
                {copiedToken === lastCreated.id ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                <span>{copiedToken === lastCreated.id ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: ACTIVE COUNTER STATIONS & CASH RECONCILIATION */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brown text-ivory text-xs font-bold flex items-center justify-center font-mono">
              2
            </span>
            <h2 className="font-serif text-lg font-bold text-ink">
              Active Counters & Cash Reconciliation <span className="font-sans text-xs text-taupe font-normal">(کاؤنٹر کیش ملان)</span>
            </h2>
          </div>
          <span className="text-xs text-taupe">
            Count physical currency notes at the end of the event to balance drawers.
          </span>
        </div>

        {counterLinks.length === 0 ? (
          <div className="card p-8 text-center text-xs text-taupe bg-white border border-sand">
            No active counter assistants assigned yet. Use the form above to add an assistant.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {counterLinks.map(link => {
              const stats = getStats(link.name, link.counterTitle, link.token)
              const isActive = link.active !== false
              const tally = savedTallies[link.id] || {}

              // Value currently typed by owner or previously saved tally
              const userTyped = talliesInput[link.id] !== undefined
                ? talliesInput[link.id]
                : (tally.physicalCounted !== undefined ? tally.physicalCounted : '')

              const diff = userTyped !== '' ? Number(userTyped) - stats.total : (tally.difference !== undefined ? tally.difference : null)

              return (
                <div
                  key={link.id}
                  className={`card p-5 border transition rounded-2xl ${
                    isActive ? 'bg-white border-sand shadow-sm' : 'bg-red-50/40 border-red-200 opacity-60'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-sand mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <b className="font-serif text-base text-ink block leading-snug">{link.name}</b>
                        <span className="text-xs text-taupe">{link.counterTitle}</span>
                      </div>
                    </div>

                    <span className={`tag text-[10px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                      {isActive ? '🟢 Active (فعال)' : '🔴 Revoked (بند)'}
                    </span>
                  </div>

                  {/* Stats Counter */}
                  <div className="bg-cream/40 p-3 rounded-xl border border-sand mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-taupe block">Digital Ledger Total:</span>
                      <b className="font-serif text-xl text-emerald-900">{pkr(stats.total)}</b>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-taupe block">Recorded Gifts:</span>
                      <b className="font-serif text-base text-ink">{stats.count} entries</b>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-sand/70">
                    {isActive ? (
                      <>
                        <button
                          onClick={() => sendWhatsApp(link)}
                          className="btn text-xs !py-1.5 !px-3 bg-[#0A4B32] hover:bg-[#123B2A] text-white flex items-center gap-1.5 shadow-xs"
                          title="Share link via WhatsApp"
                        >
                          <Send size={13} />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => copyLink(link)}
                          className="btn text-xs !py-1.5 !px-3 hover:bg-cream border border-sand flex items-center gap-1.5"
                        >
                          {copiedToken === link.id ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                          <span>{copiedToken === link.id ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Revoke counter access for ${link.name}? Their phone session will immediately lock out.`)) {
                              revokeCounterLink(event.id, link.id)
                            }
                          }}
                          className="btn text-xs !py-1.5 !px-2.5 text-red-700 hover:bg-red-50 border border-red-200 ml-auto"
                          title="Revoke operator access"
                        >
                          <Trash2 size={13} />
                          <span>Deactivate</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-red-700 font-semibold flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          <span>Link Revoked · Access Blocked</span>
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Re-activate access for ${link.name}?`)) {
                              reactivateCounterLink(event.id, link.id)
                            }
                          }}
                          className="btn text-xs !py-1 !px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <RefreshCw size={12} />
                          <span>Re-activate Access</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Drawer Cash Reconciliation Section */}
                  <div className="space-y-2 pt-1">
                    <label className="label !text-xs font-bold text-ink flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-800" />
                      <span>{link.name}'s Physical Drawer Cash Count <span className="font-normal text-taupe">(دراز کا کیش گنیں)</span>:</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="input !text-sm font-mono"
                        placeholder="Enter counted cash (e.g. 350000)"
                        value={userTyped}
                        onChange={e => setTalliesInput({ ...talliesInput, [link.id]: e.target.value })}
                      />
                      <button
                        onClick={() => handleSaveTally(link, stats.total)}
                        className="btn btn-p text-xs !py-2 px-3 shrink-0"
                      >
                        Save Tally
                      </button>
                    </div>

                    {/* Result alert */}
                    {diff !== null && (
                      <div className="pt-1">
                        {diff === 0 && (
                          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                            <span>Balanced: Cash drawer matches ledger perfectly (0 Difference) ✅</span>
                          </div>
                        )}
                        {diff < 0 && (
                          <div className="p-2 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900 font-bold flex items-center gap-2">
                            <AlertTriangle size={15} className="text-red-700 shrink-0" />
                            <span>⚠️ Shortage: Drawer is short by {pkr(Math.abs(diff))}!</span>
                          </div>
                        )}
                        {diff > 0 && (
                          <div className="p-2 rounded-lg bg-blue-50 border border-blue-300 text-xs text-blue-900 font-semibold flex items-center gap-2">
                            <HelpCircle size={15} className="text-blue-700 shrink-0" />
                            <span>ℹ️ Excess: Drawer has {pkr(diff)} over the recorded ledger.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* TEAM MEMBERS DIRECTORY TAB */}
      {activeTab === 'team' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#202A25]">
                Authorized Team Members & Counter Assistants ({counterLinks.length})
              </h2>
              <p className="text-xs text-[#77776E]">
                Helpers and operators assigned to live counter stations
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-p text-xs py-2.5 px-4 rounded-full flex items-center gap-1.5 bg-[#063D32] text-white hover:bg-[#082F28] shadow-sm"
            >
              <UserPlus size={14} />
              <span>Add Team Member</span>
            </button>
          </div>

          {counterLinks.length === 0 ? (
            <div className="card p-10 text-center text-xs text-[#77776E] bg-white border border-[#E8E0D1] rounded-2xl shadow-card">
              <Users size={36} className="mx-auto mb-3 text-[#77776E]/50" />
              <p className="font-serif font-bold text-base text-[#202A25]">No team members assigned yet</p>
              <p className="mt-1 mb-5 max-w-sm mx-auto text-[#77776E]">
                Add brothers, family members, or friends as counter operators. They get direct mobile login links to enter gifts.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-p text-xs py-2.5 px-5 rounded-full inline-flex items-center gap-2 bg-[#063D32] text-white shadow-sm"
              >
                <Plus size={15} />
                <span>Add First Team Member</span>
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {counterLinks.map(link => {
                const stats = getStats(link.name, link.counterTitle, link.token)
                const isActive = link.active !== false
                return (
                  <div
                    key={link.id}
                    className="card p-5 bg-white border border-[#E8E0D1] rounded-2xl shadow-card flex flex-col justify-between hover:border-[#063D32]/30 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#063D32] text-[#FAF7EF] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {link.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-serif text-base font-bold text-[#202A25] leading-snug">{link.name}</h3>
                            <span className="text-xs text-[#77776E] block">{link.counterTitle}</span>
                          </div>
                        </div>
                        <span className={`tag text-[10px] font-bold ${isActive ? 'bg-[#DCE8DC] text-[#287A50]' : 'bg-red-100 text-red-800'}`}>
                          {isActive ? 'Active' : 'Revoked'}
                        </span>
                      </div>

                      <div className="bg-[#FAF7EF] p-3 rounded-xl border border-[#E8E0D1]/60 mb-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-[#77776E] block">Collected:</span>
                          <b className="font-serif font-bold text-[#202A25]">{pkr(stats.total)}</b>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#77776E] block">Recorded:</span>
                          <span className="font-bold font-mono text-[#202A25]">{stats.count} gifts</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#E8E0D1]">
                      <button
                        onClick={() => sendWhatsApp(link)}
                        className="btn flex-1 !py-1.5 text-xs bg-[#0A4B32] hover:bg-[#123B2A] text-white flex items-center justify-center gap-1.5 rounded-xl shadow-xs"
                        title="Share secret link on WhatsApp"
                      >
                        <Send size={12} />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => copyLink(link)}
                        className="btn !py-1.5 px-3 text-xs border border-[#E8E0D1] hover:bg-[#FAF7EF] text-[#202A25] rounded-xl shadow-2xs"
                        title="Copy direct counter link"
                      >
                        {copiedToken === link.id ? <Check size={13} className="text-[#287A50]" /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={() => isActive ? revokeCounterLink(event.id, link.id) : reactivateCounterLink(event.id, link.id)}
                        className={`btn !py-1.5 px-2.5 text-xs rounded-xl ${isActive ? 'text-red-700 hover:bg-red-50 border-red-200' : 'text-[#287A50] hover:bg-emerald-50 border-emerald-200'}`}
                        title={isActive ? 'Revoke counter access' : 'Reactivate access'}
                      >
                        {isActive ? <Trash2 size={13} /> : <RefreshCw size={13} />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      <div className="card p-5 md:p-6 bg-white border border-sand shadow-sm rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brown text-ivory text-xs font-bold flex items-center justify-center font-mono">
              3
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-ink">
                Tamper-Proof Audit Trail <span className="font-sans text-xs text-taupe font-normal">(مکمل آڈٹ لاگ و ترامیم)</span>
              </h2>
              <p className="text-xs text-taupe">
                Chronological ledger trail showing exact operator attribution and any modified amounts.
              </p>
            </div>
          </div>

          {/* Filter by Operator */}
          {counterLinks.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-taupe">Filter Operator:</span>
              <select
                className="input !text-xs !w-auto"
                value={filterOperator}
                onChange={e => setFilterOperator(e.target.value)}
              >
                <option value="all">All Counter Operators</option>
                {counterLinks.map(l => (
                  <option key={l.id} value={l.name}>{l.name} ({l.counterTitle})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredTx.length === 0 ? (
          <div className="text-center py-8 text-xs text-taupe bg-ivory/50 rounded-xl border border-sand">
            No transaction records found matching this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTx.map(t => {
              const hasEdits = t.editHistory && t.editHistory.length > 0
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border transition ${
                    hasEdits ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-sand'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <b className="font-serif text-base text-ink">{pkr(t.amount)}</b>
                      <span className="text-xs text-taupe">
                        Recorded By: <b className="text-brown font-semibold">{t.recordedBy || 'Master Host'}</b> ({t.counterName || 'Main Station'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasEdits && (
                        <span className="tag bg-red-100 text-red-900 text-[10px] font-bold">
                          ⚠️ Modified (ترمیم شدہ)
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-taupe">
                        {new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {t.note && (
                    <p className="text-xs text-taupe italic mb-1">"{t.note}"</p>
                  )}

                  {/* Audit change box if edited */}
                  {hasEdits && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-100/50 border border-amber-300/80 text-xs space-y-1">
                      <b className="text-[11px] text-amber-950 block">Audit Modification History:</b>
                      {t.editHistory.map((edit, idx) => (
                        <div key={idx} className="text-[11px] text-amber-950 border-l-2 border-amber-600 pl-2">
                          <span className="font-semibold">{edit.editedBy}</span> modified on {new Date(edit.editedAt).toLocaleTimeString()}:
                          <span className="block text-red-900 font-mono text-[10px] font-bold mt-0.5">
                            {edit.changes?.join(' · ') || 'Details modified'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT COUNTER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#E7E0D4] relative">
            <div className="flex items-start justify-between pb-4 border-b border-[#E7E0D4] mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C7A56A] block">Counter Setup & Link</span>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-[#252A26]">Add Counter & Team Member</h3>
                <p className="text-xs text-[#77776D] mt-0.5">Create a dedicated counter station and secret operator link</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setModalSuccessLink(null)
                }}
                className="p-1.5 rounded-xl text-[#77776D] hover:text-[#252A26] hover:bg-[#FAF7F0] transition"
              >
                <X size={20} />
              </button>
            </div>

            {modalSuccessLink ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-[#DCE8DC]/60 border border-[#287A50]/30 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#287A50] text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-[#153C32]">Counter Link Created!</h4>
                  <p className="text-xs text-[#287A50] mt-0.5">
                    Assigned to <b>{modalSuccessLink.name}</b> ({modalSuccessLink.counterTitle})
                  </p>
                </div>

                <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#E7E0D4] space-y-1">
                  <span className="text-[10px] text-[#77776D] font-bold uppercase block">Dedicated Operator Link:</span>
                  <div className="font-mono text-xs text-[#252A26] bg-white p-2.5 rounded-lg border border-[#E7E0D4] break-all select-all">
                    {`${window.location.origin}/counter?key=${modalSuccessLink.token}`}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={() => sendWhatsApp(modalSuccessLink)}
                    className="btn flex-1 !py-2.5 bg-[#0A4B32] hover:bg-[#123B2A] text-white flex items-center justify-center gap-2 rounded-xl text-xs font-semibold shadow-sm"
                  >
                    <Send size={14} />
                    <span>Share via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => copyLink(modalSuccessLink)}
                    className="btn flex-1 !py-2.5 border border-[#E7E0D4] bg-white hover:bg-[#F3EBDD] text-[#252A26] flex items-center justify-center gap-2 rounded-xl text-xs font-semibold shadow-2xs"
                  >
                    {copiedToken === modalSuccessLink.id ? <Check size={14} className="text-[#287A50]" /> : <Copy size={14} />}
                    <span>{copiedToken === modalSuccessLink.id ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setModalSuccessLink(null)
                  }}
                  className="w-full text-center text-xs text-[#77776D] hover:underline pt-2 font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleModalCreate} className="space-y-4 text-xs">
                <div>
                  <label className="label font-bold text-[#252A26]">Operator / Team Member Name *</label>
                  <input
                    className="input text-sm"
                    placeholder="e.g. Bilal Tariq (Brother) or Usman Ali"
                    value={modalOperator}
                    onChange={e => setModalOperator(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className="text-[11px] text-[#77776D] mt-1 block">
                    All gifts entered by this person will be automatically attributed to them in the audit trail.
                  </span>
                </div>

                <div>
                  <label className="label font-bold text-[#252A26]">Counter Station Location *</label>
                  <select
                    className="input text-sm"
                    value={modalStation}
                    onChange={e => setModalStation(e.target.value)}
                  >
                    <option value="Counter 1 (Main Entrance)">Counter 1 (Main Entrance · مین گیٹ)</option>
                    <option value="Counter 2 (Stage VIP)">Counter 2 (Stage VIP · اسٹیج)</option>
                    <option value="Counter 3 (Family Elders)">Counter 3 (Family Elders · بزرگ عمائدین)</option>
                    <option value="Counter 4 (Ladies Hall)">Counter 4 (Ladies Hall · خواتین ہال)</option>
                    <option value="Mobile Assistant (Usher)">Mobile Assistant (Usher · ٹیبلز پر)</option>
                  </select>
                </div>

                <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E7E0D4] text-[11px] text-[#77776D] flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#287A50] shrink-0" />
                  <span>The helper will receive a secure auto-login link without needing the master password.</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E0D4]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn px-4 py-2 border border-[#E7E0D4] bg-white text-[#252A26] rounded-xl hover:bg-[#FAF7F0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-p px-5 py-2 bg-[#063D32] hover:bg-[#082F28] text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={15} />
                    <span>Create Counter</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
