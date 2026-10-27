import { useState } from 'react'
import {
  X, KeyRound, Copy, Check, Send, Trash2, ShieldCheck,
  UserCheck, Smartphone, Plus, Sparkles, AlertTriangle,
  Coins, History, CheckCircle2, Lock, ShieldAlert, ArrowRight,
  Clock, Edit3, HelpCircle
} from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'

export default function CounterLinksModal({ isOpen, onClose, eventId }) {
  const {
    events,
    tx,
    createCounterLink,
    revokeCounterLink,
    updateEvent,
    saveCashReconciliation
  } = useStore()

  const [activeTab, setActiveTab] = useState('links') // 'links' | 'reconciliation' | 'audit'
  const [name, setName] = useState('')
  const [station, setStation] = useState('Counter 1 (Main Entrance)')
  const [copiedId, setCopiedId] = useState(null)

  // Reconciliation state: map of physical cash counted per counter
  const [physicalCounts, setPhysicalCounts] = useState({})
  const [reconcileNotes, setReconcileNotes] = useState({})

  const event = events.find(e => e.id === eventId)
  if (!isOpen || !event) return null

  const counterLinks = event.counterLinks || []
  const allowPin = event.allowPinEntry || false
  const tallies = event.reconciliationTallies || {}

  const handleCreate = e => {
    e.preventDefault()
    if (!name.trim()) return
    createCounterLink(event.id, name.trim(), station)
    setName('')
  }

  const togglePinAllowance = () => {
    const nextVal = !allowPin
    updateEvent(event.id, { allowPinEntry: nextVal })
  }

  const getAssistantStats = (assistantName, counterTitle, token) => {
    const matchingTx = tx.filter(t =>
      t.eventId === event.id &&
      t.dir === 'received' &&
      (t.counterToken === token || t.recordedBy === assistantName || t.counterName === counterTitle)
    )
    const total = matchingTx.reduce((s, t) => s + (Number(t.amount) || 0), 0)
    return { count: matchingTx.length, total, matchingTx }
  }

  const copyLink = link => {
    const url = `${window.location.origin}/counter?key=${link.token}`
    navigator.clipboard?.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const shareWhatsApp = link => {
    const url = `${window.location.origin}/counter?key=${link.token}`
    const message = `*Assalam-o-Alaikum ${link.name} Bhai!*\n\n` +
      `Your official wedding salamii counter link for *"${event.title}"* is ready:\n\n` +
      `📍 *Station:* ${link.counterTitle}\n` +
      `🔗 *Access Link:* ${url}\n\n` +
      `🔒 *Security Notice:* This link is uniquely assigned to you. All recorded transactions and drawer cash will be attributed directly to you.\n\n` +
      `— NEOTA Secure Ledger`

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSaveTally = (link) => {
    const counted = physicalCounts[link.id]
    if (counted === undefined || counted === '') {
      alert('Please enter physical cash counted in the drawer (دراز کا کیش درج کریں).')
      return
    }
    const note = reconcileNotes[link.id] || ''
    saveCashReconciliation(event.id, link.id, counted, link.name, note)
  }

  // Filter modified transactions for audit tab
  const eventTx = tx.filter(t => t.eventId === event.id)
  const modifiedTx = eventTx.filter(t => t.editHistory && t.editHistory.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-ink/65 backdrop-blur-xs animate-fade-in">
      <div className="card w-full max-w-3xl max-h-[92vh] flex flex-col bg-white shadow-2xl border border-sand rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-sand bg-cream/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-ink">
                Multi-Counter & Audit Engine <span className="text-xs font-sans text-taupe font-normal ml-1">(کاؤنٹرز و آڈٹ)</span>
              </h3>
              <p className="text-xs text-taupe">
                Secret operator links, cash drawer reconciliation, and tamper-proof audit trail — {event.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-taupe hover:text-ink hover:bg-cream">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-sand bg-cream/20 px-4 md:px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('links')}
            className={`pb-2.5 px-3 text-xs md:text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'links'
                ? 'border-brown text-brown font-semibold'
                : 'border-transparent text-taupe hover:text-ink'
            }`}
          >
            <KeyRound size={15} />
            <span>Secret Links (خفیہ لنکس)</span>
            <span className="tag ml-1 text-[10px]">{counterLinks.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`pb-2.5 px-3 text-xs md:text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'reconciliation'
                ? 'border-brown text-brown font-semibold'
                : 'border-transparent text-taupe hover:text-ink'
            }`}
          >
            <Coins size={15} />
            <span>Drawer Reconciliation (کیش ملان)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 text-xs md:text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-brown text-brown font-semibold'
                : 'border-transparent text-taupe hover:text-ink'
            }`}
          >
            <History size={15} />
            <span>Audit Trail (آڈٹ لاگ)</span>
            {modifiedTx.length > 0 && (
              <span className="tag ml-1 text-[10px] bg-red-100 text-red-800">
                {modifiedTx.length} Edited
              </span>
            )}
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* TAB 1: SECRET LINKS */}
          {activeTab === 'links' && (
            <div>
              {/* Security Rule Card */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 max-w-lg">
                  <Lock size={18} className="text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <b className="text-xs text-amber-950 font-serif block">
                      Security Policy: Public 4-Digit PIN Access <span className="text-taupe font-sans font-normal">(سکیورٹی کنٹرول)</span>
                    </b>
                    <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                      When PIN entry is disabled, random persons cannot access the counter even if they know the PIN. Only assistants with your assigned secret link can enter transactions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${allowPin ? 'text-amber-900' : 'text-emerald-800 font-bold'}`}>
                    {allowPin ? 'PIN Entry Allowed' : 'Secret Links Only (Strict)'}
                  </span>
                  <button
                    onClick={togglePinAllowance}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      allowPin ? 'bg-amber-600' : 'bg-emerald-700'
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

              {/* Form to Create New Assistant */}
              <form onSubmit={handleCreate} className="p-4 rounded-xl bg-cream/40 border border-sand mb-6">
                <h4 className="font-serif text-sm font-bold text-ink mb-3 flex items-center gap-1.5">
                  <Plus size={15} className="text-brown" />
                  <span>Assign New Counter Operator <span className="text-xs text-taupe font-sans font-normal">(نیا کاؤنٹر اسسٹنٹ)</span></span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <label className="label">Operator Name <span className="text-taupe font-normal">(نام)</span></label>
                    <input
                      className="input !text-xs"
                      placeholder="e.g. Bilal Tariq (Brother)"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Station Title <span className="text-taupe font-normal">(اسٹیشن)</span></label>
                    <select
                      className="input !text-xs"
                      value={station}
                      onChange={e => setStation(e.target.value)}
                    >
                      <option value="Counter 1 (Main Entrance)">Counter 1 (Main Entrance)</option>
                      <option value="Counter 2 (Stage VIP)">Counter 2 (Stage VIP)</option>
                      <option value="Counter 3 (Elders Table)">Counter 3 (Elders Table)</option>
                      <option value="Counter 4 (Ladies Hall)">Counter 4 (Ladies Hall)</option>
                      <option value="Mobile Counter Operator">Mobile / Moving Operator</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-p text-xs py-2 px-4 shadow-sm flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Generate Dedicated Link</span>
                </button>
              </form>

              {/* List of Generated Links */}
              <div>
                <h4 className="font-serif text-sm font-bold text-ink mb-3">
                  Active Operators ({counterLinks.length})
                </h4>

                {counterLinks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-taupe bg-ivory/50 rounded-xl border border-sand">
                    No secret counter links generated yet. Add your first assistant above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {counterLinks.map(link => {
                      const stats = getAssistantStats(link.name, link.counterTitle, link.token)
                      const isActive = link.active !== false
                      return (
                        <div
                          key={link.id}
                          className={`p-3.5 rounded-xl border transition ${
                            isActive ? 'bg-white border-sand shadow-xs' : 'bg-red-50/30 border-red-200 opacity-70'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                              <div>
                                <b className="text-sm font-serif text-ink">{link.name}</b>
                                <span className="text-[11px] text-taupe ml-1.5">({link.counterTitle})</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <b className="text-sm font-serif text-emerald-800">{pkr(stats.total)}</b>
                              <span className="text-[10px] text-taupe block">{stats.count} entries collected</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand/60 text-xs">
                            <span className="text-[10px] font-mono text-taupe truncate max-w-[200px]">
                              Token: {link.token.slice(0, 10)}••••
                            </span>

                            <div className="flex items-center gap-1.5">
                              {isActive && (
                                <>
                                  <button
                                    onClick={() => shareWhatsApp(link)}
                                    className="btn text-[11px] !py-1 !px-2.5 bg-[#0A4B32] hover:bg-[#123B2A] text-white flex items-center gap-1"
                                  >
                                    <Send size={12} />
                                    <span>WhatsApp</span>
                                  </button>

                                  <button
                                    onClick={() => copyLink(link)}
                                    className="btn text-[11px] !py-1 !px-2.5 hover:bg-cream border border-sand flex items-center gap-1"
                                  >
                                    {copiedId === link.id ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                                    <span>{copiedId === link.id ? 'Copied!' : 'Copy Link'}</span>
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm(`Revoke counter access for ${link.name}? Their phone session will immediately lock out.`)) {
                                    revokeCounterLink(event.id, link.id)
                                  }
                                }}
                                className={`text-[11px] py-1 px-2 rounded-lg font-medium transition ${
                                  isActive
                                    ? 'text-red-700 hover:bg-red-50'
                                    : 'text-taupe bg-sand/30 cursor-not-allowed'
                                }`}
                                disabled={!isActive}
                              >
                                {isActive ? 'Revoke Access (بند کریں)' : 'Access Revoked'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CASH DRAWER RECONCILIATION */}
          {activeTab === 'reconciliation' && (
            <div>
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 mb-5">
                <h4 className="font-serif text-sm font-bold text-emerald-950 flex items-center gap-2 mb-1">
                  <Coins size={16} className="text-emerald-800" />
                  <span>End-of-Event Cash Drawer Reconciliation <span className="font-sans text-xs text-taupe font-normal">(دراز کیش ملان)</span></span>
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Count physical cash in each assistant's drawer at the end of the event. Enter the total counted to automatically verify against digital ledger records.
                </p>
              </div>

              {counterLinks.length === 0 ? (
                <div className="text-center py-8 text-xs text-taupe bg-ivory/50 rounded-xl border border-sand">
                  No active counters yet. First create counter links from the "Secret Links" tab.
                </div>
              ) : (
                <div className="space-y-4">
                  {counterLinks.map(link => {
                    const stats = getAssistantStats(link.name, link.counterTitle, link.token)
                    const tally = tallies[link.id] || {}
                    const userCounted = physicalCounts[link.id] !== undefined ? physicalCounts[link.id] : (tally.physicalCounted !== undefined ? tally.physicalCounted : '')
                    const diff = userCounted !== '' ? Number(userCounted) - stats.total : (tally.difference !== undefined ? tally.difference : null)

                    return (
                      <div key={link.id} className="p-4 rounded-xl bg-white border border-sand shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sand mb-3">
                          <div>
                            <b className="font-serif text-base text-ink">{link.name}</b>
                            <span className="text-xs text-taupe ml-2">({link.counterTitle})</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-taupe block">Digital Ledger Total:</span>
                            <b className="font-serif text-base text-ink">{pkr(stats.total)}</b>
                            <span className="text-[10px] text-taupe block">({stats.count} gifts)</span>
                          </div>
                        </div>

                        {/* Reconciliation Inputs */}
                        <div className="grid sm:grid-cols-2 gap-3 items-end mb-3">
                          <div>
                            <label className="label !text-xs font-semibold">
                              Physical Cash Counted <span className="font-normal text-taupe">(دراز کا کیش)</span>
                            </label>
                            <input
                              type="number"
                              className="input font-mono !text-sm"
                              placeholder="e.g. 350000"
                              value={userCounted}
                              onChange={e => setPhysicalCounts({ ...physicalCounts, [link.id]: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="label !text-xs">Remarks / Note <span className="font-normal text-taupe">(نوٹ)</span></label>
                            <input
                              className="input !text-xs"
                              placeholder="e.g. Verified and placed into safe"
                              value={reconcileNotes[link.id] !== undefined ? reconcileNotes[link.id] : (tally.notes || '')}
                              onChange={e => setReconcileNotes({ ...reconcileNotes, [link.id]: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Difference Badge */}
                        {diff !== null && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand/60">
                            <div>
                              {diff === 0 && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                                  <CheckCircle2 size={14} />
                                  <span>Balanced: Cash matches ledger (0 Difference) ✓</span>
                                </span>
                              )}
                              {diff < 0 && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 bg-red-100 px-3 py-1 rounded-full">
                                  <AlertTriangle size={14} />
                                  <span>⚠️ Shortage: Drawer is short by {pkr(Math.abs(diff))}</span>
                                </span>
                              )}
                              {diff > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                                  <HelpCircle size={14} />
                                  <span>ℹ️ Excess: Drawer has {pkr(diff)} over recorded ledger</span>
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleSaveTally(link)}
                              className="btn btn-p text-xs py-1.5 px-3 shadow-xs"
                            >
                              Save Tally (محفوظ کریں)
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div>
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 mb-5">
                <h4 className="font-serif text-sm font-bold text-amber-950 flex items-center gap-2 mb-1">
                  <ShieldAlert size={16} className="text-amber-800" />
                  <span>Tamper-Proof Audit Trail <span className="font-sans text-xs text-taupe font-normal">(آڈٹ ٹریل)</span></span>
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Every recorded gift includes operator attribution, counter station, and timestamp. If any record is later edited or amounts modified, the full change history is logged here.
                </p>
              </div>

              {/* Transactions List with Audit Badges */}
              <div className="space-y-3">
                {eventTx.length === 0 ? (
                  <div className="text-center py-8 text-xs text-taupe bg-ivory/50 rounded-xl border border-sand">
                    No transactions recorded for this event yet.
                  </div>
                ) : (
                  eventTx.map(t => {
                    const hasEdits = t.editHistory && t.editHistory.length > 0
                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border transition ${
                          hasEdits ? 'bg-amber-50/30 border-amber-300' : 'bg-white border-sand'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div>
                            <b className="font-serif text-base text-ink">{pkr(t.amount)}</b>
                            <span className="text-xs text-taupe ml-2">
                              By: <b className="text-ink">{t.recordedBy || 'Master Host'}</b> ({t.counterName || 'Counter'})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasEdits && (
                              <span className="tag bg-amber-200 text-amber-900 text-[10px] font-bold">
                                ⚠️ Modified ({t.editHistory.length}x)
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-taupe">
                              {new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {t.note && (
                          <p className="text-xs text-taupe italic mb-2">"{t.note}"</p>
                        )}

                        {/* Audit Log Accordion if edited */}
                        {hasEdits && (
                          <div className="mt-2 pt-2 border-t border-amber-200/80 bg-amber-100/30 rounded-lg p-2 text-xs space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-950 block">
                              Modification History (ترامیم کا ریکارڈ):
                            </span>
                            {t.editHistory.map((edit, idx) => (
                              <div key={idx} className="text-[11px] text-amber-900 border-l-2 border-amber-600 pl-2">
                                <span className="font-semibold">{edit.editedBy}</span> modified on {new Date(edit.editedAt).toLocaleTimeString()}:
                                <span className="block text-red-800 font-mono text-[10px]">
                                  {edit.changes?.join(' · ') || 'Details modified'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 border-t border-sand bg-cream/30 text-right">
          <button onClick={onClose} className="btn text-xs py-2 px-5">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
