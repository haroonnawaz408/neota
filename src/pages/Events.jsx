import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Plus, Pencil, Archive, ArchiveRestore, Trash2, Calendar, MapPin,
  Zap, Users, ChevronRight, CheckCircle2, Sparkles, ArrowRight
} from 'lucide-react'
import { useStore } from '../store'
import { pkr, EVENT_TYPES } from '../data'
import { PageHead } from '../components/Layout'

// Authentic local Pakistani wedding photography mapped to specific function types
export const getEventImage = (type = '', title = '') => {
  const t = (type + ' ' + title).toLowerCase()
  if (t.includes('mehndi')) return '/images/event_mehndi.jpg'
  if (t.includes('barat') || t.includes('shadi') || t.includes('wedding')) return '/images/event_barat.jpg'
  if (t.includes('walima')) return '/images/event_walima.jpg'
  if (t.includes('nikkah') || t.includes('nikah')) return '/images/event_nikkah.jpg'
  if (t.includes('mayun') || t.includes('dholki')) return '/images/event_mayun.jpg'
  if (t.includes('engagement') || t.includes('mangni') || t.includes('ring')) return '/images/event_engagement.jpg'
  return '/images/event_walima.jpg'
}

export function Events() {
  const { events, people, tx, updateEvent, deleteEvent, setActiveEvent, activeEvent, t } = useStore()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'upcoming' | 'completed' | 'archived'
  const nav = useNavigate()

  const stats = e => {
    const rec = tx.filter(item => String(item.eventId) === String(e.id) && item.dir === 'received')
    const eventGuests = people.filter(p => (p.events || []).some(id => String(id) === String(e.id)))
    const doneCount = new Set(rec.map(item => item.personId)).size
    return {
      guests: eventGuests.length,
      done: doneCount,
      amt: rec.reduce((s, item) => s + (Number(item.amount) || 0), 0)
    }
  }

  // Filter logic
  const now = new Date().toISOString().split('T')[0]
  const list = events.filter(e => {
    if (activeTab === 'archived') return e.status === 'Archived'
    if (e.status === 'Archived') return false
    if (activeTab === 'upcoming') return e.date >= now || e.status === 'Active'
    if (activeTab === 'completed') return e.date < now || e.status === 'Completed'
    return true
  })

  const upcomingCount = events.filter(e => e.status !== 'Archived' && (e.date >= now || e.status === 'Active')).length
  const completedCount = events.filter(e => e.status !== 'Archived' && (e.date < now || e.status === 'Completed')).length
  const allActiveCount = events.filter(e => e.status !== 'Archived').length

  return (
    <div className="space-y-6 animate-pop">
      {/* Page Header matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#252A26] tracking-tight">Events</h1>
          <p className="text-xs md:text-sm text-[#77776D] mt-1 font-sans">
            Manage your wedding events and functions
          </p>
        </div>

        <Link
          to="/app/events/new"
          className="btn btn-p text-xs md:text-sm !py-2.5 !px-5 shadow-sm rounded-full flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span>Add Event</span>
        </Link>
      </div>

      {/* Filter Tabs matching reference: All (3), Upcoming (1), Completed (2) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E0D4] pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeTab === 'all'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          All ({allActiveCount})
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeTab === 'upcoming'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          Upcoming ({upcomingCount})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeTab === 'completed'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          Completed ({completedCount})
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ml-auto ${
            activeTab === 'archived'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          Archived ({events.filter(e => e.status === 'Archived').length})
        </button>
      </div>

      {/* Empty State */}
      {!list.length && (
        <div className="card p-12 text-center text-sm text-[#77776D] bg-white border border-[#E7E0D4] rounded-2xl">
          <Calendar size={36} className="mx-auto mb-3 text-[#C7A56A]" />
          <p className="font-serif text-xl text-[#252A26] mb-1">
            {activeTab === 'archived' ? 'No archived events.' : 'No events found in this category.'}
          </p>
          <p className="text-xs text-[#77776D] mb-5">Create your wedding or function to start recording guest records.</p>
          {activeTab !== 'archived' && (
            <Link to="/app/events/new" className="btn btn-p text-xs rounded-xl inline-flex items-center gap-1.5">
              <Plus size={14} />
              <span>Create Event</span>
            </Link>
          )}
        </div>
      )}

      {/* Event Cards Grid matching reference */}
      <div className="space-y-4">
        {list.map(e => {
          const s = stats(e)
          const isLive = String(e.id) === String(activeEvent) || (e.status === 'Active' && e.date >= now)
          const isDone = e.status === 'Completed' || (e.date < now && !isLive)
          const imageUrl = getEventImage(e.type, e.title)

          return (
            <div
              key={e.id}
              className="card p-4 md:p-5 bg-white border border-[#E8E0D1] shadow-card rounded-2xl hover:border-[#063D32]/30 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              {/* Left Side: Thumbnail + Event Info */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 border border-[#E8E0D1] relative">
                  <img
                    src={imageUrl}
                    alt={e.title}
                    className="w-full h-full object-cover"
                    onError={ev => { ev.currentTarget.src = '/images/event_walima.jpg' }}
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link to={`/app/events/${e.id}`} className="font-serif text-xl font-bold text-[#252A26] hover:text-[#153C32] transition">
                      {e.title}
                    </Link>
                    <span className="text-[10px] font-semibold bg-[#F3EBDD] text-[#77776D] px-2 py-0.5 rounded-full border border-[#E7E0D4]">
                      {e.type}
                    </span>
                  </div>

                  <p className="text-xs text-[#77776D] flex items-center gap-2 flex-wrap">
                    <span className="font-mono">{e.date}</span>
                    <span>·</span>
                    <span className="truncate max-w-[200px]">{e.venue || 'Lahore'}</span>
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-[#77776D]">
                      Guests: <b className="text-[#252A26]">{s.guests || 0}</b>
                    </span>
                    <span className="text-[#77776D]">
                      Received: <b className="font-serif text-[#287A50]">{pkr(s.amt)}</b>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Status Badge & Action Buttons matching reference */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#E7E0D4]">
                {/* Live or Completed Badge */}
                <div>
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#287A50] bg-[#DCE8DC] px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#287A50] animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#77776D] bg-[#F3EBDD] px-3 py-1 rounded-full border border-[#E7E0D4]">
                      Completed
                    </span>
                  )}
                </div>

                {/* View Details (pill outline) and Manage (solid forest green pill) */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/app/events/${e.id}`}
                    className="text-xs font-semibold px-4 py-2 rounded-full border border-[#E7E0D4] bg-white text-[#252A26] hover:bg-[#F3EBDD] transition shadow-xs"
                  >
                    View Details
                  </Link>

                  <button
                    onClick={() => {
                      setActiveEvent(e.id)
                      nav(`/app/events/${e.id}`)
                    }}
                    className="btn btn-p text-xs font-semibold !py-2 !px-4 rounded-full shadow-xs flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ChevronRight size={14} />
                  </button>

                  <Link
                    to={`/app/events/${e.id}/edit`}
                    className="p-2 text-[#77776D] hover:text-[#252A26] hover:bg-[#F3EBDD] rounded-full transition"
                    title="Edit event"
                  >
                    <Pencil size={15} />
                  </Link>

                  <button
                    className="p-2 text-[#77776D] hover:text-red-700 hover:bg-red-50 rounded-full transition"
                    title={e.status === 'Archived' ? 'Restore' : 'Archive'}
                    onClick={() => {
                      const isArch = e.status === 'Archived'
                      if (confirm(isArch ? 'Restore this event to active list?' : 'Archive this event? Records will remain safe.')) {
                        updateEvent(e.id, { status: isArch ? 'Active' : 'Archived' })
                      }
                    }}
                  >
                    {e.status === 'Archived' ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EventForm() {
  const { id } = useParams()
  const { events, addEvent, updateEvent } = useStore()
  const nav = useNavigate()
  const ex = events.find(e => e.id === id)

  const [f, setF] = useState(
    ex || {
      title: '',
      type: 'Walima',
      date: new Date().toISOString().split('T')[0],
      venue: ''
    }
  )

  const set = k => e => setF({ ...f, [k]: e.target.value })

  const save = e => {
    e.preventDefault()
    if (!f.title.trim()) return
    if (ex) {
      updateEvent(id, f)
    } else {
      addEvent(f)
    }
    nav('/app/events')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pop">
      <PageHead
        title={ex ? 'Edit Wedding Event' : 'Create New Wedding Event'}
        sub="Enter event details for the digital guest list and salamii ledger"
      />

      <form onSubmit={save} className="card p-6 md:p-8 bg-white shadow-card border border-[#E7E0D4] rounded-2xl grid gap-5">
        <div>
          <label className="label">Event Title *</label>
          <input
            className="input text-base"
            required
            placeholder="e.g. Ayesha & Hamza Walima"
            value={f.title}
            onChange={set('title')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Event Type</label>
            <select className="input" value={f.type} onChange={set('type')}>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t.split(' ')[0]}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Event Date *</label>
            <input type="date" className="input" required value={f.date} onChange={set('date')} />
          </div>
        </div>

        <div>
          <label className="label">Venue / Hall / Location</label>
          <input
            className="input"
            placeholder="e.g. Pearl Continental / Royal Palm, Lahore"
            value={f.venue}
            onChange={set('venue')}
          />
        </div>

        <div className="flex gap-3 pt-3 border-t border-[#E7E0D4]">
          <button type="submit" className="btn btn-p rounded-xl !py-2.5 !px-6 text-sm">
            <span>Save Event</span>
          </button>
          <button type="button" onClick={() => nav('/app/events')} className="btn rounded-xl !py-2.5 !px-5 text-sm">
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  )
}

