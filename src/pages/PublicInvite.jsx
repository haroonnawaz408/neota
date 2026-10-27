import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Calendar, MapPin, Clock, Heart, Users, CheckCircle2, Send, Share2, Copy, Sparkles, Navigation, QrCode, Music, Volume2, VolumeX, MailOpen, Edit3, ExternalLink, CalendarPlus, Check, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { DEFAULT_CARD_CONFIG } from '../data'
import { sound } from '../lib/audio'
import CardCustomizerModal from '../components/CardCustomizerModal'
import RaastQRModal from '../components/RaastQRModal'

export default function PublicInvite() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { events, submitRSVP, resolvePublicEvent, auth, paymentSettings } = useStore()

  const [cloudEvent, setCloudEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // VIP Guest parameter (e.g. ?guest=Chaudhry%20Asif or ?to=Malik%20Sahib)
  const guestParam = searchParams.get('guest') || searchParams.get('to') || ''

  useEffect(() => {
    let isMounted = true
    const loadEvent = async () => {
      const local = events.find(e => e.id === id)
      if (local) {
        if (isMounted) {
          setCloudEvent(local)
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      const fetched = await resolvePublicEvent(id)
      if (isMounted) {
        setCloudEvent(fetched)
        setIsLoading(false)
      }
    }
    loadEvent()
    return () => { isMounted = false }
  }, [id, events])

  const event = cloudEvent || events.find(e => e.id === id)
  const config = event?.cardConfig || DEFAULT_CARD_CONFIG

  // Wax Seal Envelope Opening State
  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)

  // RSVP Form States
  const [name, setName] = useState(guestParam || '')
  const [phone, setPhone] = useState('')
  const [attending, setAttending] = useState(true)
  const [guestCount, setGuestCount] = useState(2)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Modals state
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [raastModalOpen, setRaastModalOpen] = useState(false)

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!event?.date) return
    const targetDate = new Date(`${event.date}T19:00:00`).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const difference = targetDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [event?.date])

  const openEnvelope = () => {
    setEnvelopeOpened(true)
    if (!isAudioMuted && config.enableAudioChime) {
      sound.playCashChime()
    }
  }

  const handleRSVP = e => {
    e.preventDefault()
    if (!name.trim()) return
    submitRSVP(event.id, {
      name: name.trim(),
      phone: phone.trim(),
      attending,
      guestCount: attending ? Number(guestCount) : 0,
      message: message.trim()
    })
    setSubmitted(true)
  }

  const copyInviteLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = `*دعوت نامہ شادی و تقریب* 🌸\n` +
      `السلام علیکم!\n` +
      `بفضلِ باری تعالیٰ، آپ کو ہمارے ہاں ${event.title} میں شرکت کی پُرتپاک دعوت دی جاتی ہے۔\n\n` +
      `📅 تاریخ: ${event.date}\n` +
      `🏛️ مقام: ${config.venueName || event.venue || 'Wedding Hall'}\n` +
      `📍 مکمل کارڈ اور لوکیشن دیکھیے:\n${window.location.href}`

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(event.title)
    const venue = encodeURIComponent(config.venueName ? `${config.venueName}, ${config.venueAddress || ''}` : (event.venue || ''))
    const details = encodeURIComponent(`You are cordially invited to ${event.title}. Digital Card: ${window.location.href}`)
    const dateFormatted = event.date.replace(/-/g, '')
    const startIso = `${dateFormatted}T140000Z`
    const endIso = `${dateFormatted}T180000Z`
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${venue}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center p-5 text-center">
        <div>
          <div className="w-12 h-12 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-serif text-lg text-ink">دعوت نامہ لوڈ ہو رہا ہے...</p>
          <p className="text-xs text-taupe mt-1">Loading digital invitation card...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center p-5 text-center">
        <p className="text-taupe">Event invitation not found or link has expired.</p>
      </div>
    )
  }

  const mapUrl = config.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.venueName || event.venue || event.title)}`

  // Theme styling configurations
  const themeClassMap = {
    mughal_gold: {
      border: 'border-[#D4AF37]',
      accentBg: 'bg-[#D4AF37]/15',
      accentText: 'text-[#856514]',
      headerText: 'text-[#2E241D]',
      cardBg: 'bg-white/95'
    },
    emerald_velvet: {
      border: 'border-[#1C4E38]',
      accentBg: 'bg-[#1C4E38]/15',
      accentText: 'text-[#1C4E38]',
      headerText: 'text-[#1C4E38]',
      cardBg: 'bg-[#FAFDFB]/95'
    },
    ruby_maroon: {
      border: 'border-[#721C24]',
      accentBg: 'bg-[#721C24]/15',
      accentText: 'text-[#721C24]',
      headerText: 'text-[#721C24]',
      cardBg: 'bg-[#FDF8F8]/95'
    },
    royal_navy: {
      border: 'border-[#1A2E40]',
      accentBg: 'bg-[#1A2E40]/15',
      accentText: 'text-[#1A2E40]',
      headerText: 'text-[#1A2E40]',
      cardBg: 'bg-[#F8FAFC]/95'
    }
  }

  const themeStyle = themeClassMap[config.theme] || themeClassMap.mughal_gold

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F3EB] via-[#EFE7DA] to-[#F7F3EB] text-ink py-8 px-3 md:px-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        {/* Top Floating Bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <Link to="/" className="text-xs font-serif tracking-widest text-brown uppercase font-semibold flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#D4AF37]" />
            <span>NEOTA INVITATIONS</span>
          </Link>

          <div className="flex items-center gap-2">
            {auth.in && (
              <button
                onClick={() => setCustomizerOpen(true)}
                className="btn text-xs !py-1 !px-2.5 bg-brown text-white hover:bg-brown-dark shadow-sm flex items-center gap-1 font-medium"
                title="Customize Shadi Card Details"
              >
                <Edit3 size={13} />
                <span>Card Settings</span>
              </button>
            )}

            <button
              onClick={copyInviteLink}
              className="btn text-xs !py-1 !px-2.5 bg-white border border-sand hover:bg-cream flex items-center gap-1.5 shadow-sm"
              title="Copy Link"
            >
              {linkCopied ? <Check size={13} className="text-sage" /> : <Copy size={13} />}
              <span>{linkCopied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={shareWhatsApp}
              className="btn text-xs !py-1 !px-2.5 bg-[#25D366] text-white border-transparent hover:bg-[#1EBE5D] flex items-center gap-1.5 shadow-sm"
              title="Share Card on WhatsApp"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* 1. ROYAL CEREMONIAL WAX SEAL ENVELOPE (Unfolds on Click) */}
        {!envelopeOpened ? (
          <div className="bg-gradient-to-b from-[#FAF7F0] to-[#EFE8DC] rounded-3xl border-2 border-[#D4AF37] p-8 md:p-12 shadow-2xl text-center relative overflow-hidden transition-all duration-500">
            {/* Background Geometric Borders */}
            <div className="absolute top-2 left-2 text-[#D4AF37] text-lg select-none">✦</div>
            <div className="absolute top-2 right-2 text-[#D4AF37] text-lg select-none">✦</div>
            <div className="absolute bottom-2 left-2 text-[#D4AF37] text-lg select-none">✦</div>
            <div className="absolute bottom-2 right-2 text-[#D4AF37] text-lg select-none">✦</div>

            <p className="font-serif text-sm tracking-widest text-taupe mb-3">
              {config.bismillahText || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
            </p>

            <span className="inline-block text-[11px] uppercase tracking-[0.25em] text-brown bg-white/80 border border-[#D4AF37]/50 px-3 py-1 rounded-full font-medium mb-6">
              ROYAL WEDDING INVITATION
            </span>

            {/* Personalized Guest Badge */}
            <div className="my-6 p-4 rounded-2xl bg-white/90 border border-sand shadow-sm max-w-sm mx-auto">
              <span className="text-[10px] uppercase text-taupe tracking-wider block font-medium">بخدمت معزز و محترم</span>
              <b className="font-serif text-xl md:text-2xl text-ink block mt-0.5">
                {guestParam ? `${guestParam} و جملہ اہل خانہ` : 'معزز مہمان گرامی و اہل خانہ'}
              </b>
              <span className="text-[11px] text-taupe mt-1 block">
                منجانب: {config.hostParents || 'چوہدری محمد طارق و اہلیہ'}
              </span>
            </div>

            {/* Wax Seal Button */}
            <div className="my-8 flex flex-col items-center justify-center">
              <button
                onClick={openEnvelope}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#9B1B30] to-[#C43249] text-white shadow-2xl flex flex-col items-center justify-center border-4 border-[#D4AF37] hover:scale-105 active:scale-95 transition cursor-pointer select-none group"
                title="Tap to Open Invitation"
              >
                <span className="text-xl font-serif font-bold tracking-widest">مُبَارَک</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-200 mt-0.5">OPEN</span>
              </button>
              <p className="text-xs text-taupe mt-4 font-serif">
                دعوت نامہ کھولنے کے لیے مہر پر کلک کریں
              </p>
            </div>

            <p className="text-[11px] text-taupe/80">
              Celebration of {event.title} · {event.date}
            </p>
          </div>
        ) : (
          /* 2. UNFOLDED ROYAL SHADI CARD INTERFACE */
          <div className="space-y-6 animate-fade-in">
            {/* Main Shadi Card Shell */}
            <div className={`${themeStyle.cardBg} rounded-3xl border-2 ${themeStyle.border} p-6 md:p-8 shadow-2xl relative overflow-hidden text-center`}>
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-[#D4AF37] text-sm select-none">✦</div>
              <div className="absolute top-2 right-2 text-[#D4AF37] text-sm select-none">✦</div>
              <div className="absolute bottom-2 left-2 text-[#D4AF37] text-sm select-none">✦</div>
              <div className="absolute bottom-2 right-2 text-[#D4AF37] text-sm select-none">✦</div>

              {/* Calligraphy Header */}
              <p className="font-serif text-sm tracking-widest text-taupe mb-1">
                {config.bismillahText || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
              </p>

              {/* Quranic Ayat */}
              {config.quranicAyat && (
                <p className="font-serif text-xs md:text-sm text-taupe/90 max-w-md mx-auto my-2 leading-relaxed italic">
                  "{config.quranicAyat}"
                </p>
              )}

              {/* MODE A: CUSTOM IMAGE UPLOAD DISPLAY */}
              {config.mode === 'custom_image' && config.customImageUrl ? (
                <div className="my-6">
                  <div className="p-2 md:p-3 bg-white rounded-2xl border-2 border-[#D4AF37] shadow-xl inline-block max-w-full">
                    <img
                      src={config.customImageUrl}
                      alt="Custom Wedding Invitation Card"
                      className="rounded-xl max-h-[520px] w-auto object-contain mx-auto shadow-sm"
                    />
                  </div>
                  <div className="mt-3 flex justify-center gap-2">
                    <a
                      href={config.customImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={`wedding_card_${event.id}.png`}
                      className="btn text-xs !py-1.5 !px-3 bg-white border border-sand hover:bg-cream flex items-center gap-1"
                    >
                      <span>View Full Image ↗</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* MODE B: ROYAL DIGITAL TEMPLATE DISPLAY */
                <div className="my-5">
                  <span className="inline-block text-[10px] uppercase tracking-[0.25em] text-brown bg-cream/70 border border-sand px-3 py-1 rounded-full font-medium mb-3">
                    {event.type} CEREMONY · دعوتِ مسرت
                  </span>

                  {/* Host Parents Greeting */}
                  <div className="my-3">
                    <p className="text-xs text-taupe">
                      ہم نہایت خوشی اور مسرت کے ساتھ آپ کو اور آپ کے اہل خانہ کو
                    </p>
                    <b className="font-serif text-lg text-ink block mt-0.5">
                      {config.hostParents || 'چوہدری محمد طارق و اہلیہ'}
                    </b>
                    <p className="text-xs text-taupe">کی جانب سے شرکت کی دلی دعوت پیش کرتے ہیں</p>
                  </div>

                  {/* Couple Details Ornate Box */}
                  <div className="my-6 p-5 rounded-2xl bg-ivory/60 border border-sand/90 relative">
                    <div className="grid md:grid-cols-2 gap-4 items-center">
                      {/* Groom */}
                      <div className="text-center md:text-right md:pr-3">
                        <span className="text-[10px] text-taupe uppercase tracking-wider block font-medium">
                          {config.groomTitle || 'فرزندِ ارجمند'}
                        </span>
                        <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
                          {config.groomName || 'محمد حمزہ طارق'}
                        </h2>
                        {config.groomFatherName && (
                          <span className="text-xs text-taupe block">
                            س/او {config.groomFatherName}
                          </span>
                        )}
                      </div>

                      {/* Bride */}
                      <div className="text-center md:text-left md:pl-3 border-t md:border-t-0 md:border-l border-sand pt-3 md:pt-0">
                        <span className="text-[10px] text-taupe uppercase tracking-wider block font-medium">
                          {config.brideTitle || 'دخترِ گرامی'}
                        </span>
                        <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
                          {config.brideName || 'عائشہ نور'}
                        </h2>
                        {config.brideFatherName && (
                          <span className="text-xs text-taupe block">
                            دخترِ {config.brideFatherName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Looking forward family names */}
                  {config.familyLookingForward && (
                    <div className="my-3 text-xs text-taupe border-y border-sand/50 py-2.5">
                      <span className="text-[10px] uppercase tracking-wider block text-taupe/80 font-medium">چشم براہ و شکر گزار</span>
                      <p className="font-serif text-ink mt-0.5">{config.familyLookingForward}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Date, Time & Venue Bar */}
              <div className="grid gap-3 p-4 rounded-2xl bg-ivory/80 border border-sand my-5 text-left text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-brown shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-taupe block font-medium uppercase">DATE & DAY</span>
                      <b className="text-sm font-serif text-ink">{event.date}</b>
                    </div>
                  </div>

                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="btn text-[11px] !py-1 !px-2.5 bg-white border border-sand hover:bg-cream flex items-center gap-1 text-brown shadow-xs"
                    title="Add to Google Calendar"
                  >
                    <CalendarPlus size={13} />
                    <span>Save Date</span>
                  </a>
                </div>

                <div className="flex items-center justify-between border-t border-sand/60 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center text-brown shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] text-taupe block font-medium uppercase">VENUE & MARQUEE</span>
                      <span className="font-medium text-ink block">{config.venueName || event.venue || 'Pearl Banquet'}</span>
                      {config.venueAddress && <span className="text-[11px] text-taupe block">{config.venueAddress}</span>}
                    </div>
                  </div>

                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn text-[11px] !py-1 !px-2.5 bg-white border border-sand hover:bg-cream flex items-center gap-1 text-brown shadow-xs"
                  >
                    <Navigation size={12} />
                    <span>Map ↗</span>
                  </a>
                </div>
              </div>

              {/* Program Schedule Timeline */}
              {config.programTimeline && config.programTimeline.length > 0 && (
                <div className="my-6 text-left">
                  <span className="text-[11px] font-semibold text-brown uppercase tracking-wider block mb-3 text-center">
                    Program Schedule (تقریب کا شیڈول)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {config.programTimeline.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-sand text-center shadow-xs">
                        <span className="font-mono text-xs font-bold text-brown block">{item.time}</span>
                        <span className="text-[11px] text-ink font-medium mt-0.5 block leading-tight">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Countdown Timer */}
              <div className="my-6">
                <span className="text-[11px] text-taupe uppercase tracking-wider block mb-2 font-medium">
                  Countdown to the Auspicious Occasion
                </span>
                <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto text-center">
                  {[
                    ['Days', timeLeft.days],
                    ['Hours', timeLeft.hours],
                    ['Mins', timeLeft.minutes],
                    ['Secs', timeLeft.seconds]
                  ].map(([unit, val]) => (
                    <div key={unit} className="p-2.5 rounded-xl bg-cream/50 border border-sand">
                      <b className="font-serif text-xl text-ink block leading-none">{val}</b>
                      <span className="text-[9px] text-taupe uppercase tracking-wider">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RSVP Family Contacts */}
              {config.rsvpContacts && (
                <div className="text-xs text-taupe border-t border-sand pt-4 mb-2">
                  <span className="text-[10px] uppercase tracking-wider block font-medium">رابطہ برائے تصدیق و معلومات (RSVP)</span>
                  <p className="font-mono font-medium text-ink mt-0.5">{config.rsvpContacts}</p>
                </div>
              )}

              {/* Overseas Guests E-Salamii via Raast Button */}
              {config.enableRaastShagun && (
                <div className="pt-4 border-t border-sand flex justify-center">
                  <button
                    onClick={() => setRaastModalOpen(true)}
                    className="btn text-xs !py-2 !px-4 bg-[#0A4B32] text-white border-transparent hover:bg-[#073624] flex items-center gap-1.5 shadow-sm"
                  >
                    <QrCode size={15} />
                    <span>Send E-Salamii via Raast (سلامی بھیجیں)</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. INTERACTIVE RSVP FORM */}
            <div className="card p-6 bg-white border border-sand shadow-sm rounded-3xl">
              <h3 className="font-serif text-lg font-bold text-center text-ink mb-1">
                RSVP — کیا آپ تقریب میں تشریف لائیں گے؟
              </h3>
              <p className="text-[11px] text-taupe text-center mb-4">
                براہِ کرم اپنی آمد کی تصدیق فرمائیں تاکہ نشست اور طعام کے انتظامات میں آسانی ہو۔
              </p>

              {submitted ? (
                <div className="p-5 rounded-2xl bg-sage-light text-sage border border-sage/40 text-center">
                  <CheckCircle2 size={32} className="mx-auto mb-2" />
                  <b className="text-base font-serif block">بہت شکریہ! آپ کا جواب موصول ہو گیا ہے۔</b>
                  <p className="text-xs mt-1 text-sage/90">
                    {attending ? 'ہم آپ اور آپ کے اہل خانہ کی آمد کے منتظر ہیں۔ جزاک اللہ!' : 'اطلاع دینے کا بہت شکریہ۔ دعا ہے اللہ آپ کے گھر بھی خوشیاں لائے۔'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRSVP} className="grid gap-3 text-xs">
                  <div>
                    <label className="label">Your Name (آپ کا نام) *</label>
                    <input
                      className="input"
                      required
                      placeholder="e.g. Malik Asif"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">Mobile / WhatsApp Number</label>
                    <input
                      className="input"
                      placeholder="0300-1234567"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Attending Toggle */}
                  <div>
                    <label className="label">Attendance Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAttending(true)}
                        className={`btn text-xs !py-2.5 ${attending ? 'btn-p' : 'hover:bg-cream'}`}
                      >
                        <span>Yes, Will Attend (ان شاء اللہ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttending(false)}
                        className={`btn text-xs !py-2.5 ${!attending ? 'btn-p' : 'hover:bg-cream'}`}
                      >
                        <span>Cannot Attend (معذرت)</span>
                      </button>
                    </div>
                  </div>

                  {attending && (
                    <div>
                      <label className="label">Total Family Members Attending (افراد کی تعداد)</label>
                      <select
                        className="input font-medium"
                        value={guestCount}
                        onChange={e => setGuestCount(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} Person(s)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label">Warm Wishes & Dua for the Couple (دعا و مبارکباد)</label>
                    <input
                      className="input"
                      placeholder="e.g. ماشاء اللہ! اللہ پاک دونوں کے نصیب اچھے کرے اور خوشیاں نصیب فرمائے۔"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-p w-full !py-3 text-sm font-semibold shadow-sm mt-2 flex items-center justify-center gap-2">
                    <Send size={15} />
                    <span>Submit RSVP & Duas</span>
                  </button>
                </form>
              )}
            </div>

            {/* 4. LIVE DUA & WISHES GUESTBOOK BOARD */}
            {config.enableDuaWall && event.duas && event.duas.length > 0 && (
              <div className="card p-6 bg-white border border-sand shadow-sm rounded-3xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-sand">
                  <Heart size={18} className="text-sage" />
                  <h3 className="font-serif text-base font-bold text-ink">
                    Dua & Blessings Wall (اہلِ قرابت کی دعائیں)
                  </h3>
                </div>

                <div className="space-y-3">
                  {event.duas.map(dua => (
                    <div key={dua.id} className="p-3.5 rounded-2xl bg-cream/30 border border-sand text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <b className="text-ink">{dua.name}</b>
                        <span className="text-[10px] text-taupe">
                          {new Date(dua.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-taupe leading-relaxed font-serif">"{dua.message}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-taupe mt-8">
          Powered by <b>NEOTA</b> — Pakistan's Digital Wedding Ledger
        </p>
      </div>

      {/* Card Customizer Modal */}
      {customizerOpen && (
        <CardCustomizerModal
          isOpen={customizerOpen}
          onClose={() => setCustomizerOpen(false)}
          eventId={event.id}
        />
      )}

      {/* Raast QR Modal */}
      {raastModalOpen && (
        <RaastQRModal
          isOpen={raastModalOpen}
          onClose={() => setRaastModalOpen(false)}
          onConfirm={() => setRaastModalOpen(false)}
          amount={0}
          paymentSettings={paymentSettings}
          guestName={guestParam || 'Overseas Guest'}
        />
      )}
    </div>
  )
}
