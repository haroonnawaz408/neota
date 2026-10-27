import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  KeyRound, ArrowLeft, Check, AlertTriangle, UserPlus, Volume2, VolumeX,
  Sparkles, Send, Coins, Gift, LogOut, CheckCircle2, Mic, MicOff, QrCode,
  Share2, Edit2, History, Search, X, ArrowRight, Eye, Clock
} from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'
import { sound } from '../lib/audio'
import { VoiceRecognition } from '../lib/speech'
import DigitalSlipModal from '../components/DigitalSlipModal'
import RaastQRModal from '../components/RaastQRModal'
import DenominationModal from '../components/DenominationModal'

const PRESETS = [1000, 2000, 3000, 5000, 10000, 20000, 50000]

// Quick Edit Modal for Counter Operator
function CounterEditModal({ txItem, guestName, counterAssistant, onClose, onSave }) {
  const [amount, setAmount] = useState(txItem.amount || 0)
  const [giftType, setGiftType] = useState(txItem.giftType || 'cash')
  const [paymentMethod, setPaymentMethod] = useState(txItem.paymentMethod || 'cash')
  const [giftDescription, setGiftDescription] = useState(txItem.giftDescription || '')
  const [note, setNote] = useState(txItem.note || '')
  const [reason, setReason] = useState('Typo correction at counter')

  const handleUpdate = e => {
    e.preventDefault()
    onSave({
      amount: giftType === 'cash' ? Number(amount) : Number(amount) || 0,
      giftType,
      paymentMethod,
      giftDescription: giftDescription.trim(),
      note: note.trim()
    }, reason)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-sand">
        <div className="flex items-center justify-between pb-2 border-b border-sand mb-3">
          <div>
            <b className="font-serif text-base text-ink block">Edit Recorded Entry</b>
            <span className="text-xs text-taupe">{guestName}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-taupe hover:text-ink hover:bg-cream">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-3 text-xs">
          <div>
            <label className="label">Amount in PKR</label>
            <input
              type="number"
              className="input font-mono !text-lg"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Gift Type</label>
              <select value={giftType} onChange={e => setGiftType(e.target.value)} className="input">
                <option value="cash">Cash — روپیہ</option>
                <option value="gold">Gold — سونا</option>
                <option value="gift">Item / Suit — تحفہ</option>
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input">
                <option value="cash">Cash Drawer</option>
                <option value="raast">Raast / Digital</option>
              </select>
            </div>
          </div>

          {giftType !== 'cash' && (
            <div>
              <label className="label">Gift Description</label>
              <input
                type="text"
                className="input"
                value={giftDescription}
                onChange={e => setGiftDescription(e.target.value)}
                placeholder="e.g. 1 Tola Gold Set"
              />
            </div>
          )}

          <div>
            <label className="label">Reason for Modification *</label>
            <input
              type="text"
              className="input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
            <span className="text-[10px] text-taupe mt-0.5 block">Audit history will log this change with your name ({counterAssistant}).</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn w-full">Cancel</button>
            <button type="submit" className="btn btn-p w-full">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CounterEntry() {
  const {
    events,
    people,
    tx,
    saveTx,
    updateTx,
    addPerson,
    resolveEventByPin,
    resolveEventByCounterKey,
    fetchGuestsForEvent,
    auth,
    paymentSettings,
    isOnline,
    offlineQueue,
    flushOfflineQueue,
    supabase,
    systemConfig
  } = useStore()
  const [searchParams] = useSearchParams()

  const secretKeyParam = searchParams.get('key') || searchParams.get('token')
  const urlPinParam = searchParams.get('pin')
  const [pin, setPin] = useState(urlPinParam || '')
  const [activeEvent, setActiveEvent] = useState(null)
  const [pinError, setPinError] = useState(null)
  const [counterAssistant, setCounterAssistant] = useState('Counter Operator')
  const [counterTitle, setCounterTitle] = useState('Counter 1')
  const [isMuted, setIsMuted] = useState(sound.isMuted())
  const [denomModalOpen, setDenomModalOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // PIN Brute-force & Anti-scraping Protection
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)

  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const timer = setInterval(() => {
      setLockoutSeconds(prev => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutSeconds])

  // Entry states
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [amt, setAmt] = useState('')
  const [giftType, setGiftType] = useState('cash')
  const [giftDesc, setGiftDesc] = useState('')
  const [note, setNote] = useState('')
  const [hi, setHi] = useState(0)
  const [confirmDup, setConfirmDup] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  // Non-intrusive rapid entry toast notice (does NOT block next entry!)
  const [lastSavedNotice, setLastSavedNotice] = useState(null)

  // Digital Slip Modal state (opened on demand, never blocking automatically)
  const [slipModalOpen, setSlipModalOpen] = useState(false)
  const [slipTx, setSlipTx] = useState(null)
  const [slipPerson, setSlipPerson] = useState(null)

  // Editing state
  const [editingTx, setEditingTx] = useState(null)

  // Search within recorded entries table
  const [entrySearch, setEntrySearch] = useState('')

  // Raast QR Modal state
  const [raastModalOpen, setRaastModalOpen] = useState(false)

  // Voice Recognition state
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const voiceAiRef = useRef(null)

  const busy = useRef(false)
  const qRef = useRef()
  const aRef = useRef()

  // Initialize Voice AI Engine
  useEffect(() => {
    voiceAiRef.current = new VoiceRecognition(
      parsed => {
        setVoiceTranscript(parsed.rawText)

        // 1. If amount is detected, set amount and play cash chime
        if (parsed.amount > 0) {
          setAmt(String(parsed.amount))
          sound.playCashChime()
        }

        // 2. If name is detected, search and pick guest
        if (parsed.name && parsed.name.trim()) {
          const qClean = parsed.name.trim()
          setQ(qClean)
          const qNorm = qClean.toLowerCase()
          const match = people.find(p => (p.name || '').toLowerCase().includes(qNorm))
          if (match) {
            pick(match)
            if (parsed.amount > 0) {
              setAmt(String(parsed.amount))
            }
          }
        }
      },
      error => {
        console.warn('Voice error:', error)
        if (error && typeof error === 'string') {
          alert(error)
        }
      },
      status => {
        setIsListening(status)
      }
    )

    return () => {
      voiceAiRef.current?.stop()
    }
  }, [people])

  const toggleVoice = () => {
    if (!voiceAiRef.current?.isSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge.')
      return
    }
    if (isListening) {
      voiceAiRef.current.stop()
    } else {
      setVoiceTranscript('Listening… Speak name and amount (مثلاً: Bilal Tariq 5000)')
      voiceAiRef.current.start('ur-PK')
    }
  }

  // Cross-device auto-verify if secret key or PIN is provided in URL
  useEffect(() => {
    const autoConnect = async () => {
      if (secretKeyParam) {
        setIsConnecting(true)
        const res = await resolveEventByCounterKey(secretKeyParam)
        setIsConnecting(false)
        if (res) {
          setActiveEvent(res.event)
          setCounterAssistant(res.linkInfo.name || 'Counter Operator')
          setCounterTitle(res.linkInfo.counterTitle || 'Counter 1')
          setPinError(null)
          fetchGuestsForEvent(res.event.id)
        } else {
          setPinError('Invalid or revoked secret counter link. Please ask the event host to re-issue access.')
        }
      } else if (urlPinParam) {
        setIsConnecting(true)
        const ev = await resolveEventByPin(urlPinParam)
        setIsConnecting(false)
        if (ev) {
          setActiveEvent(ev)
          setPinError(null)
          fetchGuestsForEvent(ev.id)
        } else {
          setPinError('Invalid or expired Event PIN.')
        }
      }
    }
    autoConnect()
  }, [searchParams])

  // Instant Phone Lockout: Immediately terminates counter access if owner revokes the link
  useEffect(() => {
    if (!secretKeyParam || !supabase) return

    const channel = supabase
      .channel(`rt_counter_lock_${secretKeyParam}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'counter_links',
        filter: `token=eq.${secretKeyParam}`
      }, payload => {
        if (payload.new && payload.new.active === false) {
          setActiveEvent(null)
          setPinError('🚫 Counter Access Revoked: The event host has deactivated this counter link. All further access is blocked.')
        }
      })
      .subscribe()

    // Periodic heartbeat check every 6 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('counter_links')
          .select('active')
          .eq('token', secretKeyParam)
          .single()
        if (data && data.active === false) {
          setActiveEvent(null)
          setPinError('🚫 Counter Access Revoked: The event host has deactivated this counter link. All further access is blocked.')
        }
      } catch (e) {}
    }, 6000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [secretKeyParam, supabase])

  const handleVerifyPin = async e => {
    e?.preventDefault()
    if (lockoutSeconds > 0) return
    setPinError(null)
    const cleanPin = pin.trim()
    if (!cleanPin) return

    setIsConnecting(true)
    const ev = await resolveEventByPin(cleanPin)
    setIsConnecting(false)

    if (ev && !ev.error) {
      setActiveEvent(ev)
      setFailedAttempts(0)
      sound.playCashChime()
      fetchGuestsForEvent(ev.id)
    } else if (ev?.error === 'PIN_DISABLED') {
      setPinError('⚠️ Host Security Restriction: The host has disabled public PIN entry. Please use your personal Secret Link.')
    } else {
      const nextFail = failedAttempts + 1
      setFailedAttempts(nextFail)
      if (nextFail >= 5) {
        setLockoutSeconds(60)
        setPinError('Too many failed attempts. Security lockout active for 60 seconds.')
      } else {
        setPinError(`PIN does not match any active event (${5 - nextFail} attempts remaining).`)
      }
    }
  }

  const toggleSound = () => {
    const muted = sound.toggleMute()
    setIsMuted(muted)
  }

  // Filter guests for autocomplete
  const norm = s => (s || '').toLowerCase().trim()
  const query = norm(q)
  const eventGuests = activeEvent ? people.filter(p => p.events?.includes(activeEvent.id)) : []
  const otherPeople = activeEvent ? people.filter(p => !p.events?.includes(activeEvent.id)) : []

  const matchingGuests = query
    ? eventGuests.filter(p => norm(`${p.name} ${p.fatherName || ''} ${p.phone || ''} ${p.address || ''}`).includes(query))
    : []
  const matchingOthers = query && matchingGuests.length < 3
    ? otherPeople.filter(p => norm(`${p.name} ${p.fatherName || ''}`).includes(query)).slice(0, 3)
    : []
  const res = [...matchingGuests, ...matchingOthers].slice(0, 8)

  const prev = sel && activeEvent
    ? tx.filter(t => t.eventId === activeEvent.id && t.personId === sel.id && t.dir === 'received' && !t.is_deleted)
    : []

  const recentDuplicate = useMemo(() => {
    if (!sel || !prev.length) return null
    return prev.find(t => {
      const recordedTime = new Date(t.at || t.createdAt || 0).getTime()
      const diffMins = (Date.now() - recordedTime) / (1000 * 60)
      return diffMins < 20
    })
  }, [sel, prev])

  // Global rapid keyboard shortcuts for wedding counter operators
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        qRef.current?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && sel) {
        e.preventDefault()
        save('cash')
      }
      if (e.key === 'Escape' && sel) {
        e.preventDefault()
        setSel(null)
        setTimeout(() => qRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [sel, amt, giftType, giftDesc, note, activeEvent])

  const pick = p => {
    setSel(p)
    setQ('')
    setConfirmDup(false)
    setGiftType('cash')
    setGiftDesc('')
    setNote('')
    setTimeout(() => aRef.current?.focus(), 50)
  }

  // Quick Add new guest: instantly creates person and focuses amount
  const quickAdd = async () => {
    const name = q.trim()
    if (!name || !activeEvent) return
    const id = await addPerson({ name }, activeEvent.id, activeEvent.ownerId)
    pick({ id, name, events: [activeEvent.id] })
  }

  // Ultra-Fast Save Routine: Saves, chimes, and immediately focuses search for the next person!
  const save = async (paymentMethod = 'cash') => {
    if (busy.current || !sel || !activeEvent) return
    if (activeEvent?.isFrozen) {
      setErr(`🚫 ایونٹ لاک ہے: ${activeEvent.freezeReason || 'انتظامیہ کی جانب سے اس ایونٹ کی انٹریز عارضی طور پر بند کی گئی ہیں'}`)
      return
    }
    if (giftType === 'cash' && !(Number(amt) > 0)) {
      setErr('Please enter a valid amount in PKR.')
      return
    }
    if (giftType !== 'cash' && !giftDesc.trim()) {
      setErr('Please specify the gift description.')
      return
    }

    if (prev.length && !confirmDup) {
      setConfirmDup(true)
      return
    }

    busy.current = true
    setSaving(true)
    setErr(null)

    // Pre-save security gate: verify token is still active before recording transaction
    if (secretKeyParam && supabase) {
      try {
        const { data: linkStatus } = await supabase
          .from('counter_links')
          .select('active')
          .eq('token', secretKeyParam)
          .single()
        if (linkStatus && linkStatus.active === false) {
          setActiveEvent(null)
          setPinError('🚫 Counter Access Revoked: This link was cancelled by the event host. Transaction blocked.')
          busy.current = false
          setSaving(false)
          return
        }
      } catch (e) {}
    }

    try {
      if (!sel.events?.includes(activeEvent.id)) {
        sel.events = [...(sel.events || []), activeEvent.id]
      }

      const recordedAmount = giftType === 'cash' ? Number(amt) : (Number(amt) || 0)

      const txRecord = await saveTx({
        eventId: activeEvent.id,
        ownerId: activeEvent.ownerId,
        personId: sel.id,
        counterToken: secretKeyParam || null,
        amount: recordedAmount,
        giftType,
        paymentMethod,
        giftDescription: giftDesc.trim(),
        recordedBy: counterAssistant,
        counterName: counterTitle,
        note: [note.trim(), `Recorded by ${counterAssistant} (${counterTitle})`, paymentMethod === 'raast' ? 'Paid via Raast QR' : ''].filter(Boolean).join(' · ')
      })

      // PLAY CASH REGISTER CHIME!
      sound.playCashChime()

      // Instant Rapid Confirmation Notice (Auto-dismisses, provides instant thermal print option)
      setLastSavedNotice({
        amount: recordedAmount,
        name: sel.name,
        tx: txRecord,
        person: sel
      })
      setTimeout(() => setLastSavedNotice(null), 4000)

      // Reset Form IMMEDIATELY so operator can enter the next person without delay!
      setSel(null)
      setAmt('')
      setGiftType('cash')
      setGiftDesc('')
      setNote('')
      setConfirmDup(false)
      setVoiceTranscript('')

      // Auto-focus search for the next guest instantly
      setTimeout(() => qRef.current?.focus(), 50)
    } catch (e) {
      setErr('Could not save entry. Please retry.')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  // --- SCREEN 1: PIN AUTH SCREEN ---
  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center p-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brown text-ivory mb-3 shadow-md">
              <KeyRound size={28} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink">Enter Counter PIN</h1>
            <p className="text-xs text-taupe mt-1 font-serif">
              مخصوص تقریب کا 4 ہندسوں والا پن درج کریں
            </p>
          </div>

          <div className="card p-6 bg-white border border-sand shadow-lg rounded-2xl">
            {pinError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start gap-2 animate-fade-in">
                <AlertTriangle size={16} className="text-red-700 shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                className="input text-center text-3xl tracking-[0.5em] font-mono py-3"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              />

              <button
                disabled={lockoutSeconds > 0 || isConnecting || pin.length < 4}
                className="btn btn-p w-full !py-3 text-base font-semibold shadow-sm disabled:opacity-50"
              >
                <span>
                  {isConnecting
                    ? 'Connecting to Cloud...'
                    : lockoutSeconds > 0
                    ? `Locked (${lockoutSeconds}s)`
                    : 'Connect to Counter'}
                </span>
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-sand text-center">
              <p className="text-xs text-taupe">
                Sample PINs for demo: <b>7860</b> (Walima) or <b>1234</b> (Mehndi)
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-taupe">
            <Link to="/app" className="underline hover:text-ink">Return to Main App Dashboard</Link>
          </p>
        </div>
      </div>
    )
  }

  // --- SCREEN 2: ACTIVE COUNTER ENTRY SCREEN ---
  // Filter all entries recorded for this event
  const eventEntries = tx.filter(t => t.eventId === activeEvent.id && t.dir === 'received')

  // Total cash & entries at this counter/event
  const counterTotalAmount = eventEntries.reduce((s, t) => s + (Number(t.amount) || 0), 0)

  // Filtered entries for search inside entries list
  const filteredEntries = eventEntries.filter(t => {
    if (!entrySearch.trim()) return true
    const qNorm = entrySearch.toLowerCase()
    const p = people.find(person => person.id === t.personId)
    return (p?.name || '').toLowerCase().includes(qNorm) ||
           (t.recordedBy || '').toLowerCase().includes(qNorm) ||
           String(t.amount).includes(qNorm)
  })

  return (
    <div className="min-h-screen bg-ivory p-3 md:p-6 pb-24">
      <div className="mx-auto max-w-xl space-y-4">
        {/* Global Broadcast Announcement Banner */}
        {systemConfig?.broadcast_banner?.enabled && systemConfig.broadcast_banner.message && (
          <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs border ${
            systemConfig.broadcast_banner.type === 'emergency'
              ? 'bg-red-600 text-white border-red-700'
              : systemConfig.broadcast_banner.type === 'warning'
              ? 'bg-amber-500 text-amber-950 border-amber-600'
              : systemConfig.broadcast_banner.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-indigo-900 text-white border-indigo-950'
          }`}>
            <span className="text-[10px] uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded shrink-0">Announcement</span>
            <span className="leading-snug">{systemConfig.broadcast_banner.message}</span>
          </div>
        )}

        {/* Event Frozen Security Banner */}
        {activeEvent?.isFrozen && (
          <div className="p-3.5 rounded-2xl text-xs font-bold bg-red-100 border-2 border-red-400 text-red-950 flex items-start gap-2.5 shadow-xs">
            <span className="text-base leading-none">🔒</span>
            <div>
              <span className="block font-bold">Event Locked by Administration (Read-Only Mode)</span>
              <span className="text-[11px] font-normal opacity-90 block mt-0.5">
                {activeEvent.freezeReason || 'Administrative lock is active. New transaction entries are currently disabled.'}
              </span>
            </div>
          </div>
        )}

        {/* Top Counter Bar */}
        <div className="flex items-center justify-between bg-white/90 p-3 rounded-2xl border border-sand shadow-sm">
          <div className="min-w-0">
            <span className="text-[10px] text-taupe block font-mono">EVENT PIN: #{activeEvent.pin || '7860'}</span>
            <h2 className="font-serif text-lg font-bold text-ink truncate">{activeEvent.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border border-sand transition ${isMuted ? 'bg-cream text-taupe' : 'bg-sage-light text-sage'}`}
              title={isMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={() => setActiveEvent(null)}
              className="btn text-xs !py-1.5 px-3 text-taupe hover:text-red-700 hover:bg-red-50 rounded-xl"
              title="Exit Counter"
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Counter Operator Tag & Live Counter Stats */}
        <div className="bg-gradient-to-r from-emerald-950 to-[#0A4B32] text-white p-3.5 rounded-2xl shadow-sm border border-emerald-800/80">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-800/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-100">
                Operator: <b className="text-amber-300 font-serif text-sm">{counterAssistant}</b> ({counterTitle})
              </span>
            </div>
            <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
              VERIFIED COUNTER ✓
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[11px] text-emerald-200/90 block">Drawer Collection</span>
              <p className="font-serif text-2xl font-bold text-white tracking-tight">{pkr(counterTotalAmount)}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-200/90 block">Total Entries</span>
              <p className="font-serif text-2xl font-bold text-white tracking-tight">{eventEntries.length}</p>
            </div>
          </div>
        </div>

        {/* Instant Rapid Entry Flash Notice (Zero blocking, instant thermal slip shortcut) */}
        {lastSavedNotice && (
          <div className="py-2 px-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs animate-fade-in text-emerald-950 font-medium">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span className="truncate">
                Saved <b>{pkr(lastSavedNotice.amount)}</b> for <b>{lastSavedNotice.name}</b> ✓
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastSavedNotice.tx && (
                <button
                  type="button"
                  onClick={() => {
                    setSlipTx(lastSavedNotice.tx)
                    setSlipPerson(lastSavedNotice.person)
                    setSlipModalOpen(true)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-[11px] font-semibold flex items-center gap-1 shadow-xs transition"
                >
                  <Share2 size={11} />
                  <span>Slip / Print (58mm)</span>
                </button>
              )}
              <span className="text-[10px] text-emerald-800 font-normal hidden sm:inline">Ready for next guest ➔</span>
            </div>
          </div>
        )}

        {/* Offline Queue Indicator */}
        {!isOnline && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-center justify-between">
            <span>Offline Mode: Entries are saved safely locally and will sync when reconnected.</span>
            {offlineQueue?.length > 0 && (
              <button onClick={flushOfflineQueue} className="btn text-xs !py-1 !px-2 bg-amber-600 text-white rounded">
                Sync Now
              </button>
            )}
          </div>
        )}

        {/* Voice AI Transcript Indicator */}
        {voiceTranscript && (
          <div className="rounded-xl border border-brown/30 bg-cream/70 p-3 text-xs text-ink flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span><b>Voice:</b> {voiceTranscript}</span>
          </div>
        )}

        {/* Error Alert */}
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            {err}
          </div>
        )}

        {/* MAIN RAPID ENTRY WORKSTATION CARD */}
        <div className="card p-5 bg-white shadow-sm border border-sand rounded-2xl">
          {!sel ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="label !text-xs font-bold text-ink mb-0">Search Guest Name</label>
                  <span className="text-[10px] text-taupe font-serif block">مہمان کا نام یا موبائل نمبر تلاش کریں</span>
                </div>
                <span className="text-[11px] text-taupe bg-cream/70 px-2 py-0.5 rounded-lg border border-sand/70">
                  {eventGuests.length} guests
                </span>
              </div>

              {/* Fast Search Input with Auto-focus & Voice Mic */}
              <div className="relative flex items-center">
                <input
                  ref={qRef}
                  autoFocus
                  className="input !py-3.5 !text-lg pr-14 rounded-xl"
                  placeholder="Type name to search or add…"
                  value={q}
                  onChange={e => {
                    setQ(e.target.value)
                    setHi(0)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setHi(h => Math.min(h + 1, res.length - 1))
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setHi(h => Math.max(h - 1, 0))
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                      if (res[hi]) {
                        pick(res[hi])
                      } else if (q.trim()) {
                        quickAdd()
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`absolute right-2 p-2 rounded-lg border transition ${
                    isListening
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : 'bg-cream/70 text-taupe hover:text-ink border-sand'
                  }`}
                  title={isListening ? 'Listening… Tap to Stop' : 'Voice AI: Tap to Speak Urdu (آواز سے لکھیں)'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              {/* Instant + Add Guest Button (Always visible when typing unknown name) */}
              {q.trim().length > 0 && (
                <button
                  type="button"
                  onClick={quickAdd}
                  className="w-full mt-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-1.5">
                    <UserPlus size={14} className="text-amber-700" />
                    <span>Add <b>“{q.trim()}”</b> as new guest</span>
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-amber-200">
                    Press Enter ↵
                  </span>
                </button>
              )}

              {/* Guest Search Results */}
              {res.length > 0 && (
                <ul className="mt-2 divide-y divide-sand/50 max-h-56 overflow-y-auto rounded-xl border border-sand/60">
                  {res.map((p, i) => (
                    <li key={p.id}>
                      <button
                        onClick={() => pick(p)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition flex items-center justify-between ${
                          i === hi ? 'bg-cream text-brown font-semibold' : 'hover:bg-cream/40 text-ink'
                        }`}
                      >
                        <div>
                          <span className="block font-medium">
                            {p.name}
                            {p.fatherName && <span className="text-[11px] text-taupe font-normal"> s/o {p.fatherName}</span>}
                          </span>
                          <span className="block text-[10px] text-taupe">
                            {[p.relation, p.address, p.phone].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                        <ArrowRight size={13} className="text-taupe" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              {/* Selected Guest Header */}
              <div className="flex items-start justify-between mb-3 border-b border-sand pb-3">
                <div>
                  <span className="text-[10px] text-taupe block font-medium">Recording Salamii For</span>
                  <p className="font-serif text-2xl font-bold text-ink">{sel.name}</p>
                  <p className="text-xs text-taupe">
                    {[sel.fatherName && 's/o ' + sel.fatherName, sel.relation, sel.address].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  className="text-xs font-semibold text-taupe hover:text-brown border border-sand px-2.5 py-1 rounded-lg bg-cream/50"
                  onClick={() => {
                    setSel(null)
                    setTimeout(() => qRef.current?.focus(), 50)
                  }}
                >
                  Change (Esc)
                </button>
              </div>

              {/* Gift Type Switch - Sub-label Style */}
              <div className="mb-3.5">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGiftType('cash')}
                    className={`btn !py-2 rounded-xl flex flex-col items-center justify-center transition ${
                      giftType === 'cash' ? 'btn-p shadow-sm' : 'hover:bg-cream border border-sand bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Coins size={14} />
                      <span>Cash</span>
                    </div>
                    <span className="text-[10px] opacity-80 font-serif mt-0.5">روپیہ / نقدی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGiftType('gold')}
                    className={`btn !py-2 rounded-xl flex flex-col items-center justify-center transition ${
                      giftType === 'gold' ? 'btn-p shadow-sm' : 'hover:bg-cream border border-sand bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Sparkles size={14} />
                      <span>Gold</span>
                    </div>
                    <span className="text-[10px] opacity-80 font-serif mt-0.5">سونا / زیور</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGiftType('gift')}
                    className={`btn !py-2 rounded-xl flex flex-col items-center justify-center transition ${
                      giftType === 'gift' ? 'btn-p shadow-sm' : 'hover:bg-cream border border-sand bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Gift size={14} />
                      <span>Gift / Item</span>
                    </div>
                    <span className="text-[10px] opacity-80 font-serif mt-0.5">تحفہ / جوڑا</span>
                  </button>
                </div>
              </div>

              {/* Amount Input & 1-Click Presets */}
              {giftType === 'cash' ? (
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div>
                      <label className="label mb-0 !text-xs font-bold text-ink">Amount in PKR</label>
                      <span className="text-[10px] text-taupe font-serif block">رقم روپوں میں درج کریں</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1 rounded-full border transition ${
                          isListening
                            ? 'bg-red-500 text-white border-red-600 animate-pulse'
                            : 'text-brown bg-cream hover:bg-cream/80 border-sand'
                        }`}
                        title={isListening ? 'Listening… Tap to Stop' : 'Tap to speak amount (رقم بولیں)'}
                      >
                        {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                        <span>{isListening ? 'Listening…' : 'Speak Amount (رقم بولیں)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRaastModalOpen(true)}
                        className="text-xs font-medium text-sage hover:text-ink flex items-center gap-1 bg-sage-light/60 px-2.5 py-1 rounded-full border border-sage/40 transition"
                      >
                        <QrCode size={13} />
                        <span>Raast QR</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      ref={aRef}
                      inputMode="numeric"
                      autoFocus
                      className="input !py-3 !text-3xl font-serif tracking-wide text-ink text-center rounded-xl pr-14"
                      placeholder="0"
                      value={amt}
                      onChange={e => {
                        setAmt(e.target.value.replace(/\D/g, ''))
                        setConfirmDup(false)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') save('cash')
                        if (e.key === 'Escape') setSel(null)
                      }}
                    />
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`absolute right-2 p-2 rounded-lg border transition ${
                        isListening
                          ? 'bg-red-500 text-white border-red-600 animate-pulse'
                          : 'bg-cream/70 text-taupe hover:text-ink border-sand'
                      }`}
                      title={isListening ? 'Listening… Tap to Stop' : 'Voice AI: Tap to Speak Amount (آواز سے رقم بولیں)'}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  </div>

                  {/* 1-Click Amount Preset Buttons */}
                  <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                    {PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAmt(String(preset))
                          setConfirmDup(false)
                          aRef.current?.focus()
                        }}
                        className="rounded-lg border border-sand bg-cream/40 px-2.5 py-1 text-xs text-ink hover:bg-cream hover:border-taupe transition font-medium"
                      >
                        +{pkr(preset)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div>
                    <label className="label">Description</label>
                    <input
                      ref={aRef}
                      autoFocus
                      className="input rounded-xl"
                      placeholder={giftType === 'gold' ? 'e.g. 1 Tola Gold Chain' : 'e.g. Dinner Set / Suit'}
                      value={giftDesc}
                      onChange={e => setGiftDesc(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && save('gift')}
                    />
                  </div>
                  <div>
                    <label className="label">Estimated Value in PKR (Optional)</label>
                    <input
                      inputMode="numeric"
                      className="input rounded-xl"
                      placeholder="0"
                      value={amt}
                      onChange={e => setAmt(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              )}

              {/* Duplicate Gift Warning & Real-time Alert */}
              {prev.length > 0 && (
                <div className={`mt-3 flex gap-2 text-xs rounded-xl p-2.5 ${
                  recentDuplicate ? 'bg-red-50 border border-red-300 text-red-950 animate-pulse' : 'bg-amber-50 border border-amber-300 text-amber-900'
                }`}>
                  <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${recentDuplicate ? 'text-red-700' : 'text-amber-700'}`} />
                  <div>
                    {recentDuplicate ? (
                      <div>
                        <b>⚠️ Possible Duplicate Alert:</b> An entry of <b>{pkr(recentDuplicate.amount)}</b> was just recorded for <b>{sel.name}</b> {Math.max(1, Math.round((Date.now() - new Date(recentDuplicate.at).getTime()) / 60000))} min ago!
                        <div className="text-[10px] opacity-90 mt-0.5">Please check drawer/counter before recording again. Click "Confirm" if this is an intentional second gift.</div>
                      </div>
                    ) : (
                      <div>
                        Already recorded {pkr(prev[0].amount)} for this guest earlier. Click save again to confirm second gift.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Instant Save Buttons - Sub-label Style */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <button
                  className="btn btn-p col-span-3 !py-2.5 text-sm font-semibold shadow-sm flex flex-col items-center justify-center rounded-xl"
                  disabled={saving}
                  onClick={() => save('cash')}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{confirmDup ? 'Confirm & Record Salamii' : 'Save & Next Guest'}</span>
                    <ArrowRight size={14} />
                  </span>
                  <span className="text-[10px] opacity-80 font-serif font-normal">
                    {confirmDup ? 'دوبارہ تصدیق کریں' : 'محفوظ کریں اور اگلا مہمان لائیں'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRaastModalOpen(true)}
                  className="btn col-span-1 !py-2.5 bg-[#0A4B32] text-white border-[#0A4B32] hover:bg-[#073624] flex flex-col items-center justify-center text-xs shadow-sm rounded-xl"
                  title="Pay via Raast QR"
                >
                  <QrCode size={16} />
                  <span className="text-[10px] mt-0.5 font-bold">Raast QR</span>
                  <span className="text-[8px] opacity-80 font-serif">راست کیو آر</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* DEDICATED LIVE ENTRIES LIST FOR COUNTER OPERATOR */}
        <div className="card p-5 bg-white border border-sand shadow-sm rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-sand/70">
            <div className="flex items-center gap-2">
              <History size={16} className="text-brown" />
              <h3 className="font-serif text-sm font-bold text-ink">
                Recorded Entries at this Counter <span className="font-sans font-normal text-xs text-taupe">({eventEntries.length})</span>
              </h3>
            </div>

            <div className="relative w-full sm:w-44">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-taupe" />
              <input
                type="text"
                placeholder="Filter entries..."
                value={entrySearch}
                onChange={e => setEntrySearch(e.target.value)}
                className="input !text-xs !py-1 !pl-7 w-full rounded-lg bg-ivory"
              />
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="text-xs text-taupe text-center py-6">
              No entries recorded yet at this counter. Entries will appear here as soon as you save them.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-sand/50">
              {filteredEntries.map(t => {
                const p = people.find(person => person.id === t.personId)
                const guestName = p?.name || 'Guest'
                const isCash = t.giftType === 'cash'

                return (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink truncate">{guestName}</span>
                        {p?.fatherName && <span className="text-[10px] text-taupe hidden sm:inline">s/o {p.fatherName}</span>}
                        <span className={`tag text-[9px] px-1.5 py-0.2 rounded font-medium ${
                          isCash ? 'bg-cream text-brown' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {t.giftType}
                        </span>
                      </div>
                      <div className="text-[10px] text-taupe flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{t.at ? new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                        </span>
                        <span>·</span>
                        <span>{t.paymentMethod || 'cash'}</span>
                        {t.updatedAt && <span className="text-amber-800 font-bold">(Edited)</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <b className="font-serif text-sm font-bold text-emerald-900">
                        {pkr(t.amount)}
                      </b>

                      {/* Share / View Slip Button */}
                      <button
                        onClick={() => {
                          setSlipTx(t)
                          setSlipPerson(p)
                          setSlipModalOpen(true)
                        }}
                        className="btn text-xs !py-1 !px-2.5 bg-cream hover:bg-sand/60 text-brown border border-sand rounded-lg flex items-center gap-1 font-medium"
                        title="Share digital slip / receipt"
                      >
                        <Share2 size={12} />
                        <span className="hidden sm:inline">Receipt</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingTx(t)}
                        className="btn text-xs !py-1 !px-2.5 hover:bg-cream border border-sand text-taupe hover:text-ink rounded-lg flex items-center gap-1 font-medium"
                        title="Edit this entry"
                      >
                        <Edit2 size={12} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Entry Modal */}
      {editingTx && (
        <CounterEditModal
          txItem={editingTx}
          guestName={people.find(p => p.id === editingTx.personId)?.name || 'Guest'}
          counterAssistant={counterAssistant}
          onClose={() => setEditingTx(null)}
          onSave={(patch, reason) => {
            updateTx(editingTx.id, patch, counterAssistant, reason)
            setEditingTx(null)
          }}
        />
      )}

      {/* Digital Shagun Envelope Slip Modal (Opened only on demand via Share button) */}
      <DigitalSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        transaction={slipTx}
        person={slipPerson}
        event={activeEvent}
        hostName={auth.user?.name || 'Wedding Host'}
      />

      {/* Raast QR Payment Modal */}
      <RaastQRModal
        isOpen={raastModalOpen}
        onClose={() => setRaastModalOpen(false)}
        onConfirm={method => save(method)}
        amount={Number(amt) || 0}
        paymentSettings={paymentSettings}
        guestName={sel?.name}
      />

      {/* Cash Drawer Denomination Modal */}
      <DenominationModal
        isOpen={denomModalOpen}
        onClose={() => setDenomModalOpen(false)}
        eventId={activeEvent?.id}
      />
    </div>
  )
}
