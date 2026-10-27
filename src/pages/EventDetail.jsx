import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Zap, Pencil, Printer, UserPlus, Users, CheckCircle2, Clock, KeyRound, MailOpen } from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'
import { PageHead } from '../components/Layout'
import CounterLinksModal from '../components/CounterLinksModal'

export default function EventDetail() {
  const { id } = useParams()
  const { events, people, tx, setActiveEvent, t } = useStore()
  const nav = useNavigate()
  const [filterTab, setFilterTab] = useState('all')
  const [counterLinksOpen, setCounterLinksOpen] = useState(false)

  const e = events.find(x => x.id === id)
  if (!e) {
    return (
      <div className="card p-8 text-center text-sm">
        Event not found. <Link className="underline font-medium" to="/app/events">Back to events</Link>
      </div>
    )
  }

  const guests = people.filter(p => p.events?.includes(id)).sort((a, b) => a.name.localeCompare(b.name))
  const rec = tx.filter(t => t.eventId === id && t.dir === 'received')
  const by = pid => rec.filter(t => t.personId === pid)

  const doneGuests = guests.filter(g => by(g.id).length > 0)
  const pendingGuests = guests.filter(g => by(g.id).length === 0)
  const doneCount = doneGuests.length
  const pct = guests.length ? Math.round((doneCount / guests.length) * 100) : 0
  const totalAmount = rec.reduce((s, t) => s + (Number(t.amount) || 0), 0)

  const displayedGuests = filterTab === 'done' ? doneGuests : filterTab === 'pending' ? pendingGuests : guests

  const S = [
    ['Total Guests', guests.length],
    ['Recorded Salamii', `${doneCount} (${pct}%)`],
    ['Total Received', pkr(totalAmount)],
    ['Status', e.status]
  ]

  return (
    <>
      <PageHead
        title={e.title}
        sub={`${e.type} · ${e.date} · ${e.venue || 'No venue specified'}`}
      >
        <Link
          to={`/invite/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn border border-sand hover:bg-cream flex items-center gap-1.5"
          title="Open Public Digital Shadi Card & RSVP"
        >
          <MailOpen size={15} />
          <span>Digital Card</span>
        </Link>
        <Link to={`/app/events/${id}/edit`} className="btn">
          <Pencil size={15} />
          <span>Edit Event</span>
        </Link>
        <button
          className="btn btn-p"
          onClick={() => {
            setActiveEvent(id)
            nav('/app/quick-entry')
          }}
        >
          <Zap size={16} />
          <span>Quick Entry</span>
        </button>
      </PageHead>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {S.map(([l, v]) => (
          <div key={l} className="card p-5 bg-white shadow-sm border border-sand">
            <p className="label">{l}</p>
            <p className="font-serif text-2xl text-ink mt-1">{v}</p>
          </div>
        ))}
      </div>

      {/* Multi-Counter & Secret Links Security Box */}
      <div className="card p-4 mb-6 bg-white border border-sand flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <span>Multi-Counter Access PIN:</span>
              <span className="font-mono text-base tracking-widest bg-cream px-2 py-0.5 rounded text-brown font-bold">
                {e.pin || '7860'}
              </span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              e.allowPinEntry ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {e.allowPinEntry ? 'PIN Active' : 'Secret Link Only (Strict)'}
            </span>
          </div>
          <p className="text-xs text-taupe mt-1">
            ہر کاؤنٹر اسسٹنٹ (بھائی / دوست) کا الگ خفیہ لنک بنائیں تاکہ ہر انٹری اور دراز کے کیش کا الگ آڈٹ ریکارڈ رہے۔
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/app/events/${id}/counters`}
            className="btn btn-p text-xs !py-2 flex items-center gap-1.5 shadow-xs bg-brown hover:bg-[#523B2E] text-white"
          >
            <KeyRound size={14} />
            <span>کاؤنٹرز ٹیم و کیش ملان پیج (Manage Counters)</span>
          </Link>

          <button
            onClick={() => setCounterLinksOpen(true)}
            className="btn text-xs !py-2 hover:bg-cream border border-sand"
          >
            <span>Quick Popup</span>
          </button>
        </div>
      </div>

      <CounterLinksModal
        isOpen={counterLinksOpen}
        onClose={() => setCounterLinksOpen(false)}
        eventId={id}
      />


      {/* Guests List for Event */}
      <div className="card shadow-sm border border-sand bg-white/95">
        <div className="p-4 border-b border-sand flex flex-wrap items-center justify-between gap-3 bg-cream/30">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`btn text-xs !py-1.5 ${filterTab === 'all' ? 'btn-p' : 'hover:bg-cream'}`}
            >
              All Guests ({guests.length})
            </button>
            <button
              onClick={() => setFilterTab('done')}
              className={`btn text-xs !py-1.5 ${filterTab === 'done' ? 'btn-p' : 'hover:bg-cream'}`}
            >
              Recorded ({doneCount})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`btn text-xs !py-1.5 ${filterTab === 'pending' ? 'btn-p' : 'hover:bg-cream'}`}
            >
              Pending ({pendingGuests.length})
            </button>
          </div>

          <Link to="/app/guests" className="btn text-xs !py-1.5">
            <UserPlus size={13} />
            <span>Manage Guests</span>
          </Link>
        </div>

        <div className="divide-y divide-sand">
          {displayedGuests.map(g => {
            const guestTx = by(g.id)
            return (
              <Link
                key={g.id}
                to={`/app/people/${g.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-cream/40 transition"
              >
                <div className="min-w-0">
                  <span className="block font-medium text-ink">{g.name}</span>
                  <span className="block text-xs text-taupe truncate">
                    {[g.fatherName && 's/o ' + g.fatherName, g.relation, g.address].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div>
                  {guestTx.length ? (
                    <b className="text-sage font-serif text-base whitespace-nowrap">
                      {pkr(guestTx.reduce((s, x) => s + (Number(x.amount) || 0), 0))}
                    </b>
                  ) : (
                    <span className="tag text-xs text-amber-900 bg-amber-50 border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>
              </Link>
            )
          })}

          {!displayedGuests.length && (
            <div className="p-8 text-center text-sm text-taupe">
              No guests matching this filter.
            </div>
          )}
        </div>
      </div>

    </>
  )
}
