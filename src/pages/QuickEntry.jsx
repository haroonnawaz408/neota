import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, AlertTriangle, UserPlus, WifiOff, Loader2, Send, Coins, Gift, Sparkles, X, Volume2, VolumeX, KeyRound, Share2, Copy, Mic, MicOff, QrCode, Search } from 'lucide-react'
import { useStore } from '../store'
import { pkr, generateWhatsAppLink } from '../data'
import { sound } from '../lib/audio'
import { VoiceRecognition } from '../lib/speech'
import DigitalSlipModal from '../components/DigitalSlipModal'
import RaastQRModal from '../components/RaastQRModal'
import DenominationModal from '../components/DenominationModal'
import CounterLinksModal from '../components/CounterLinksModal'

const PRESETS = [1000, 2000, 3000, 5000, 10000, 20000, 50000]

export default function QuickEntry() {
  const { events, people, tx, activeEvent, setActiveEvent, saveTx, addPerson, isOnline, auth, paymentSettings, t } = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [amt, setAmt] = useState('')
  const [giftType, setGiftType] = useState('cash')
  const [giftDesc, setGiftDesc] = useState('')
  const [note, setNote] = useState('')
  const [hi, setHi] = useState(0)
  const [lastSaved, setLastSaved] = useState(null)
  const [confirmDup, setConfirmDup] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const [isMuted, setIsMuted] = useState(sound.isMuted())
  const [pinCopied, setPinCopied] = useState(false)
  const [denomModalOpen, setDenomModalOpen] = useState(false)
  const [counterLinksOpen, setCounterLinksOpen] = useState(false)

  // Digital Slip Modal state
  const [slipModalOpen, setSlipModalOpen] = useState(false)
  const [slipTx, setSlipTx] = useState(null)
  const [slipPerson, setSlipPerson] = useState(null)

  // Raast QR Modal state
  const [raastModalOpen, setRaastModalOpen] = useState(false)

  // Voice AI Recognition state
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const voiceAiRef = useRef(null)

  const busy = useRef(false)
  const qRef = useRef()
  const aRef = useRef()

  const currentEvent = events.find(e => String(e.id) === String(activeEvent)) || events[0]
  const currentEventId = currentEvent?.id || activeEvent
  const eventPin = currentEvent?.pin || '7860'

  useEffect(() => {
    if (!activeEvent && currentEvent?.id) {
      setActiveEvent(currentEvent.id)
    }
  }, [activeEvent, currentEvent, setActiveEvent])

  // Initialize Voice AI Engine
  useEffect(() => {
    voiceAiRef.current = new VoiceRecognition(
      parsed => {
        setVoiceTranscript(parsed.rawText)

        // 1. If amount is detected, set amount and play cash register chime
        if (parsed.amount > 0) {
          setAmt(String(parsed.amount))
          sound.playCashChime()
        }

        // 2. If name is detected, find and pick guest
        if (parsed.name && parsed.name.trim()) {
          const qClean = parsed.name.trim()
          setQ(qClean)
          const qNorm = qClean.toLowerCase()
          const match = people.find(p => (p.name || '').toLowerCase().includes(qNorm))
          if (match) {
            pick(match)
            // Re-apply amount if both name and amount were spoken in same phrase
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
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.')
      return
    }
    if (isListening) {
      voiceAiRef.current.stop()
    } else {
      setVoiceTranscript('Listening… بولیں (مثلاً: 5000 یا چوہدری طارق دس ہزار)')
      voiceAiRef.current.start('ur-PK')
    }
  }

  const toggleSound = () => {
    const muted = sound.toggleMute()
    setIsMuted(muted)
  }

  const copyCounterLink = async () => {
    const link = `${window.location.origin}/counter?pin=${eventPin}`
    try {
      await navigator.clipboard.writeText(link)
      setPinCopied(true)
      setTimeout(() => setPinCopied(false), 2500)
    } catch {
      prompt('Counter Link for Helpers:', link)
    }
  }

  // Filter guests in current event and people across other events
  const norm = s => (s || '').toLowerCase().trim()
  const query = norm(q)

  const eventGuests = people.filter(p => p.events?.some(eid => String(eid) === String(currentEventId)))
  const otherPeople = people.filter(p => !p.events?.some(eid => String(eid) === String(currentEventId)))

  const matchingGuests = query
    ? eventGuests.filter(p => norm(`${p.name} ${p.fatherName || ''} ${p.phone || ''} ${p.address || ''}`).includes(query))
    : []

  const matchingOthers = query && matchingGuests.length < 3
    ? otherPeople.filter(p => norm(`${p.name} ${p.fatherName || ''}`).includes(query)).slice(0, 3)
    : []

  const res = [...matchingGuests, ...matchingOthers].slice(0, 8)

  const prev = sel
    ? tx.filter(t => String(t.eventId) === String(currentEventId) && String(t.personId) === String(sel.id) && t.dir === 'received')
    : []

  const pick = p => {
    setSel(p)
    setQ('')
    setConfirmDup(false)
    setGiftType('cash')
    setGiftDesc('')
    setNote('')
    setTimeout(() => aRef.current?.focus(), 50)
  }

  const save = async (paymentMethod = 'cash') => {
    if (busy.current || !sel) return
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

    try {
      if (!sel.events?.some(eid => String(eid) === String(currentEventId))) {
        sel.events = [...(sel.events || []), currentEventId]
      }

      const txRecord = await saveTx({
        eventId: currentEventId,
        personId: sel.id,
        amount: giftType === 'cash' ? Number(amt) : (Number(amt) || 0),
        giftType,
        paymentMethod,
        giftDescription: giftDesc.trim(),
        note: [note.trim(), paymentMethod === 'raast' ? 'Paid via Raast QR' : ''].filter(Boolean).join(' · ')
      })

      // PLAY CASH REGISTER CHIME!
      sound.playCashChime()

      // Setup Slip Data
      setSlipTx(txRecord)
      setSlipPerson(sel)

      const waLink = generateWhatsAppLink(
        sel.phone,
        sel.name,
        currentEvent?.title || 'Wedding',
        giftType === 'cash' ? amt : 0,
        giftType,
        giftDesc
      )

      setLastSaved({
        person: sel,
        amount: amt,
        giftType,
        giftDesc,
        waLink,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })

      // Reset Form for next guest
      setSel(null)
      setAmt('')
      setGiftType('cash')
      setGiftDesc('')
      setNote('')
      setConfirmDup(false)
      setVoiceTranscript('')

      setTimeout(() => qRef.current?.focus(), 50)
    } catch (e) {
      setErr('Could not save entry. Please try again.')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  // Keyboard navigation for search
  const keys = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi(h => Math.min(h + 1, res.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && res[hi]) {
      e.preventDefault()
      pick(res[hi])
    }
  }

  const quickAdd = () => {
    const name = q.trim()
    if (!name) return
    const id = addPerson({ name }, currentEventId)
    pick({ id, name, events: [currentEventId] })
  }

  const sum = tx.filter(t => String(t.eventId) === String(currentEventId) && t.dir === 'received')
  const totalAmount = sum.reduce((s, t) => s + (Number(t.amount) || 0), 0)

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-ivory p-6 grid place-items-center">
        <div className="card p-8 text-center max-w-md bg-white border border-sand shadow-sm rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-brown mx-auto mb-3">
            <Sparkles size={24} />
          </div>
          <h2 className="font-serif text-xl font-bold text-ink mb-1">No Active Event Found</h2>
          <p className="text-xs text-taupe mb-5 leading-relaxed">
            Please create a wedding or family function event first to begin recording quick salamii entries.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/app" className="btn text-xs">Dashboard</Link>
            <Link to="/app/events/new" className="btn btn-p text-xs">Create Event</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory p-4 md:p-8">
      <div className="mx-auto max-w-xl">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/app" className="btn hover:bg-cream">
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Audio Chime Mute/Unmute */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border border-sand transition ${isMuted ? 'bg-cream text-taupe' : 'bg-sage-light text-sage'}`}
              title={isMuted ? 'Audio Chime Muted (Click to turn on)' : 'Audio Chime Active'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <select
              className="input !w-auto font-medium"
              value={activeEvent}
              onChange={e => {
                if ((amt || sel) && !confirm('Discard the guest and amount in progress?')) return
                setActiveEvent(e.target.value)
                setSel(null)
                setAmt('')
              }}
            >
              {events.filter(e => e.status !== 'Archived').map(e => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-Counter Helper PIN Bar */}
        <div className="mb-4 flex items-center justify-between bg-white/90 border border-sand rounded-xl p-3 shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <KeyRound size={15} className="text-brown" />
            <span>Multi-Counter PIN: <b className="font-mono text-sm tracking-wide bg-cream px-2 py-0.5 rounded">{eventPin}</b></span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCounterLinksOpen(true)}
              className="btn text-xs !py-1 !px-2.5 hover:bg-cream flex items-center gap-1"
              title="Open QR codes and links for counter operators"
            >
              <QrCode size={13} />
              <span>Helper QRs</span>
            </button>
            <button
              onClick={copyCounterLink}
              className="btn text-xs !py-1 !px-2.5 hover:bg-cream flex items-center gap-1.5"
              title="Copy link for brothers or helpers sitting at other tables"
            >
              {pinCopied ? <Check size={13} className="text-sage" /> : <Copy size={13} />}
              <span>{pinCopied ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 gap-3 mb-2 text-center">
          <div className="card p-3 shadow-sm">
            <p className="label">{t('recordedEntries')}</p>
            <b className="text-2xl font-serif text-ink">{sum.length}</b>
          </div>
          <div className="card p-3 shadow-sm">
            <p className="label">{t('totalReceived')}</p>
            <b className="text-2xl font-serif text-sage">{pkr(totalAmount)}</b>
          </div>
        </div>

        {/* Cash Drawer Reconciliation Button - Sub-label Style */}
        <button
          onClick={() => setDenomModalOpen(true)}
          className="w-full p-2.5 bg-amber-50/90 hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-sm flex items-center justify-between gap-2 mb-4 rounded-xl transition group"
          title="Tally physical currency notes in the counter cash drawer"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0">
              <Coins size={16} />
            </div>
            <div>
              <span className="text-xs font-bold block text-amber-950 leading-tight">Cash Drawer Reconciliation & Tally</span>
              <span className="text-[10px] text-amber-800 font-serif block">روزنامچہ، دراز ملان اور کیش گنتی</span>
            </div>
          </div>
          <ArrowRight size={14} className="text-amber-700 shrink-0 group-hover:translate-x-0.5 transition" />
        </button>

        {/* Offline indicator banner */}
        {!isOnline && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            <WifiOff size={18} className="shrink-0" />
            <span>Offline mode: Entries are instantly saved locally and safe!</span>
          </div>
        )}

        {/* Error banner */}
        {err && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {err}
          </div>
        )}

        {/* Voice AI Hearing Indicator */}
        {voiceTranscript && (
          <div className="mb-4 rounded-xl border border-brown/30 bg-cream/70 p-3 text-xs text-ink flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span><b>Voice:</b> {voiceTranscript}</span>
          </div>
        )}

        {/* WhatsApp Receipt Slip Popup / Notification */}
        {lastSaved && (
          <div className="mb-5 rounded-xl border border-sage/40 bg-white p-4 shadow-md pop">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-sage font-medium text-sm">
                <Check size={18} />
                <span>Saved: {lastSaved.person.name} ({lastSaved.giftType === 'cash' ? pkr(lastSaved.amount) : lastSaved.giftDesc})</span>
              </div>
              <button onClick={() => setLastSaved(null)} className="text-taupe hover:text-ink">
                <X size={15} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSlipModalOpen(true)}
                className="btn text-xs !py-2 bg-[#25D366] text-white border-transparent hover:bg-[#1EBE5D] flex items-center gap-1.5 shadow-sm font-semibold"
              >
                <Send size={13} />
                <span>Share Receipt Photo via WhatsApp</span>
                <span className="text-[10px] opacity-90 font-serif">(تصویر بھیجیں)</span>
              </button>
              <button
                onClick={() => setSlipModalOpen(true)}
                className="btn text-xs !py-2 hover:bg-cream flex items-center gap-1.5"
              >
                <Sparkles size={13} className="text-brown" />
                <span>View Slip (سلپ دیکھیں)</span>
              </button>
            </div>
          </div>
        )}

        {/* Step Indicator Pills matching reference Panel 6 */}
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${sel ? 'bg-[#063D32] text-white shadow-xs' : 'bg-[#FAF7EF] border border-[#E8E0D1] text-[#063D32]'}`}>
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] grid place-items-center">1</span>
            <span>Guest Details</span>
            {sel && <Check size={12} className="text-[#D7B36A]" />}
          </span>
          <span className="text-[#77776E]">→</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${sel ? 'bg-[#063D32] text-white shadow-xs' : 'bg-white border border-[#E8E0D1] text-[#77776E]'}`}>
            <span className="w-4 h-4 rounded-full bg-black/10 text-[10px] grid place-items-center">2</span>
            <span>Gift Details</span>
          </span>
          <span className="text-[#77776E]">→</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E0D1] text-[#77776E]">
            <span className="w-4 h-4 rounded-full bg-black/10 text-[10px] grid place-items-center">3</span>
            <span>Review</span>
          </span>
        </div>

        {/* Main Entry Card */}
        <div className="card p-5 md:p-6 shadow-card border border-[#E8E0D1] bg-white rounded-2xl">
          {!sel ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0 text-xs font-semibold text-[#202A25]">Search guest by name or phone...</label>
                <span className="text-[11px] text-[#77776E]">{eventGuests.length} guests in this event</span>
              </div>

              {/* Search Guest Input with Urdu Voice Mic Button */}
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776E] pointer-events-none" />
                <input
                  ref={qRef}
                  autoFocus
                  className="input !py-3.5 !text-base pl-11 pr-14 rounded-xl border-[#E8E0D1]"
                  placeholder="Type name, or tap mic to speak…"
                  value={q}
                  onChange={e => {
                    setQ(e.target.value)
                    setHi(0)
                  }}
                  onKeyDown={keys}
                />
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`absolute right-2 p-2 rounded-lg border transition ${
                    isListening
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : 'bg-[#FAF7EF] text-[#77776E] hover:text-[#202A25] border-[#E8E0D1]'
                  }`}
                  title={isListening ? 'Listening… Tap to Stop' : 'Tap to Speak Urdu (آواز سے لکھیں)'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              {/* Guest Search Results */}
              <ul className="mt-2 divide-y divide-[#E8E0D1]/60 max-h-64 overflow-y-auto">
                {res.map((p, i) => (
                  <li key={p.id}>
                    <button
                      onClick={() => pick(p)}
                      className={`w-full text-left rounded-xl px-4 py-3 text-sm transition flex items-center justify-between ${
                        i === hi ? 'bg-[#FAF7EF] text-[#063D32] font-semibold' : 'hover:bg-[#FAF7EF]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FAF7EF] border border-[#E8E0D1] flex items-center justify-center font-bold text-xs text-[#063D32]">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-medium text-[#202A25]">
                            {p.name}
                            {p.fatherName && <span className="text-xs text-[#77776E] font-normal"> s/o {p.fatherName}</span>}
                          </span>
                          <span className="block text-xs text-[#77776E]">
                            {[p.relation, p.address, p.phone].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      </div>
                      {!p.events?.includes(activeEvent) && (
                        <span className="text-[10px] bg-[#E8E0D1]/60 px-2 py-0.5 rounded text-[#77776E]">Other event</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Quick Add Button if not found */}
              {q.trim() && !res.length && (
                <button className="btn btn-p w-full mt-4 !py-3 flex items-center justify-center gap-2 bg-[#063D32] text-white rounded-xl" onClick={quickAdd}>
                  <UserPlus size={16} />
                  <span>Add “{q.trim()}” as new guest & continue</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Selected Guest Preview Card matching reference Panel 6 */}
              <div className="flex items-center justify-between p-3.5 mb-4 bg-[#FAF7EF] border border-[#E8E0D1] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#063D32] text-white font-serif font-bold text-sm flex items-center justify-center shadow-xs">
                    {sel.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-serif text-base font-bold text-[#202A25] leading-tight">{sel.name}</p>
                    <p className="text-xs text-[#77776E] mt-0.5">
                      {[sel.relation || 'Family', sel.phone || '+92 300 1234567'].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                <button
                  className="text-xs font-semibold text-[#063D32] hover:underline bg-white border border-[#E8E0D1] px-3 py-1.5 rounded-lg shadow-2xs"
                  onClick={() => {
                    setSel(null)
                    setTimeout(() => qRef.current?.focus(), 50)
                  }}
                >
                  Change Guest
                </button>
              </div>

              {/* Gift Type Switch - Sub-label Style */}
              <div className="mb-4">
                <label className="label">Gift Type</label>
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

              {/* Cash Amount Input & Presets */}
              {giftType === 'cash' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">{t('amountPKR')}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className={`text-xs font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition ${
                          isListening
                            ? 'bg-red-500 text-white border-red-600 animate-pulse'
                            : 'text-brown bg-cream/80 hover:bg-cream border-sand'
                        }`}
                        title={isListening ? 'Listening… Tap to Stop' : 'Tap to speak amount (رقم بولیں)'}
                      >
                        {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                        <span>{isListening ? 'Listening…' : 'Speak Amount (رقم بولیں)'}</span>
                      </button>

                      {/* Raast QR Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setRaastModalOpen(true)}
                        className="text-xs font-medium text-sage hover:text-ink flex items-center gap-1 bg-sage-light/60 px-2 py-0.5 rounded-full border border-sage/40"
                      >
                        <QrCode size={13} />
                        <span>Show Raast QR</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      ref={aRef}
                      inputMode="numeric"
                      className="input !py-3.5 !text-3xl font-serif tracking-wide text-ink text-center pr-14"
                      placeholder="0"
                      value={amt}
                      onChange={e => {
                        setAmt(e.target.value.replace(/\D/g, ''))
                        setConfirmDup(false)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') save()
                        if (e.key === 'Escape') setSel(null)
                      }}
                    />
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`absolute right-2 p-2.5 rounded-lg border transition ${
                        isListening
                          ? 'bg-red-500 text-white border-red-600 animate-pulse'
                          : 'bg-cream/70 text-taupe hover:text-ink border-sand'
                      }`}
                      title={isListening ? 'Listening… Tap to Stop' : 'Tap to Speak Amount (آواز سے رقم بولیں مثلاً: 5000 یا پانچ ہزار)'}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>

                  {/* 1-Click Amount Preset Buttons */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
                    {PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAmt(String(preset))
                          setConfirmDup(false)
                          aRef.current?.focus()
                        }}
                        className="rounded-md border border-sand bg-cream/40 px-2.5 py-1 text-xs text-ink hover:bg-cream hover:border-taupe transition font-medium"
                      >
                        +{pkr(preset)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div>
                    <label className="label">Item Description</label>
                    <input
                      ref={aRef}
                      className="input"
                      placeholder={giftType === 'gold' ? 'e.g., 1 Tola Gold Ring / Chain' : 'e.g., Designer Suit / Dinner Set'}
                      value={giftDesc}
                      onChange={e => setGiftDesc(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && save()}
                    />
                  </div>
                  <div>
                    <label className="label">Estimated Value in PKR (Optional)</label>
                    <input
                      inputMode="numeric"
                      className="input"
                      placeholder="0"
                      value={amt}
                      onChange={e => setAmt(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              )}

              {/* Note / Remarks */}
              <div className="mt-3">
                <label className="label">Note / Reference (Optional)</label>
                <input
                  className="input !text-xs !py-1.5"
                  placeholder="e.g. given by elder brother on their behalf…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {/* Duplicate Gift Warning */}
              {prev.length > 0 && (
                <div className="mt-3 flex gap-2 text-xs rounded-lg bg-amber-50 border border-amber-300 p-2.5 text-amber-900">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <b>Note:</b> Already recorded {pkr(prev[0].amount)} for {sel.name} in this event.
                    {confirmDup ? ' Click Save again to add a second gift.' : ' Press Confirm to proceed.'}
                  </div>
                </div>
              )}

              {/* Submit Buttons matching reference Panel 6 */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-2">
                <button
                  className="btn btn-p flex-1 !py-3 text-sm font-semibold disabled:opacity-60 shadow-sm flex items-center justify-center gap-1.5 rounded-xl bg-[#063D32] text-white hover:bg-[#082F28]"
                  disabled={saving}
                  onClick={() => save('cash')}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('saving')}</span>
                    </>
                  ) : (
                    <span>Save Entry</span>
                  )}
                </button>

                <button
                  type="button"
                  className="btn !py-3 px-4 text-xs font-semibold rounded-xl border border-[#E8E0D1] bg-white text-[#202A25] hover:bg-[#FAF7EF]"
                  onClick={() => save('cash')}
                >
                  Save & Add Another
                </button>

                <button
                  type="button"
                  onClick={() => setSel(null)}
                  className="btn !py-3 px-3 text-xs text-[#77776E] hover:text-[#202A25]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => setRaastModalOpen(true)}
                  className="btn !py-3 px-3.5 bg-[#FAF7EF] text-[#063D32] border border-[#E8E0D1] hover:bg-[#F3EBDD] flex items-center gap-1.5 text-xs font-semibold rounded-xl"
                  title="Pay via Raast QR"
                >
                  <QrCode size={15} className="text-[#D7B36A]" />
                  <span>Raast</span>
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-taupe">
          ↑ ↓ to navigate results · Enter to select and save · Esc to go back.
        </p>
      </div>

      {/* Digital Shagun Envelope Slip Modal */}
      <DigitalSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        transaction={slipTx}
        person={slipPerson}
        event={currentEvent}
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
        eventId={currentEventId}
      />

      {/* Helper Counter Links Modal */}
      <CounterLinksModal
        isOpen={counterLinksOpen}
        onClose={() => setCounterLinksOpen(false)}
        eventId={currentEventId}
      />
    </div>
  )
}
