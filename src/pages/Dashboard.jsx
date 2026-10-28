import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Plus, UserPlus, Undo2, Printer, ArrowRight, TrendingUp, Users,
  Calendar, Award, Sparkles, Gift, ArrowDownLeft, ArrowUpRight, Wallet,
  CheckCircle2, Clock, KeyRound, BarChart3, ChevronRight, FileText
} from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'

export default function Dashboard() {
  const { events, people, tx, activeEvent, setActiveEvent, t, auth } = useStore()

  const currentEvent = events.find(e => String(e.id) === String(activeEvent)) || events[0]
  const eventId = currentEvent?.id || activeEvent
  const rec = tx.filter(t => String(t.eventId) === String(eventId) && t.dir === 'received')
  const returns = tx.filter(t => t.dir === 'returned')
  const guests = people.filter(p => (p.events || []).some(id => String(id) === String(eventId)))

  const totalReceived = rec.reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const totalReturned = returns.reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const netCashFlow = totalReceived - totalReturned

  // Real today calculations
  const todayStr = new Date().toISOString().split('T')[0]
  const todayRec = rec.filter(t => (t.at || '').startsWith(todayStr))
  const todayGuests = guests.filter(p => (p.createdAt || '').startsWith(todayStr))
  const todayReturned = returns.filter(t => (t.at || '').startsWith(todayStr))
  const todayRecAmount = todayRec.reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const todayRetAmount = todayReturned.reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const todayNet = todayRecAmount - todayRetAmount

  // Ensure activeEvent state is initialized safely
  useEffect(() => {
    if (!activeEvent && currentEvent?.id) {
      setActiveEvent(currentEvent.id)
    }
  }, [activeEvent, currentEvent?.id, setActiveEvent])

  const userName = auth.user?.name?.split(' ')[0] || auth.user?.email?.split('@')[0] || 'Haroon'

  // Completion calculation
  const totalCapacity = currentEvent?.capacity || (guests.length > 0 ? guests.length : 100)
  const completionPct = guests.length > 0 ? Math.min(Math.round((rec.length / guests.length) * 100), 100) : 0

  if (events.length === 0) {
    return (
      <div className="card p-10 md:p-14 mb-8 bg-white border border-[#E7E0D4] shadow-card rounded-3xl text-center max-w-2xl mx-auto animate-pop">
        <div className="w-16 h-16 rounded-2xl bg-[#F3EBDD] border border-[#E7E0D4] text-[#153C32] flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Sparkles size={30} className="text-[#C7A56A]" />
        </div>

        <h2 className="font-serif text-3xl text-[#252A26] font-normal mb-2">
          Welcome to NEOTA Digital Ledger
        </h2>
        <p className="text-sm font-serif text-[#77776D] mb-6 max-w-md mx-auto">
          نیوتا و سلامی ڈیجیٹل کتاب — آپ کا محفوظ فیملی لیجر تیار ہے۔
        </p>

        <p className="text-xs text-[#77776D] leading-relaxed max-w-lg mx-auto mb-8">
          Create your first wedding or family function to begin recording invited guests, managing digital shadi cards, and tracking live event-day salamii gifts.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 text-left mb-8 max-w-xl mx-auto">
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D4]">
            <span className="w-6 h-6 rounded-full bg-[#153C32] text-white font-semibold text-xs grid place-items-center mb-2">1</span>
            <h4 className="font-serif font-bold text-[#252A26] text-sm">Create Event</h4>
            <p className="text-[11px] text-[#77776D] mt-1">Set date, venue, and pin for your wedding function.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D4]">
            <span className="w-6 h-6 rounded-full bg-[#153C32] text-white font-semibold text-xs grid place-items-center mb-2">2</span>
            <h4 className="font-serif font-bold text-[#252A26] text-sm">Add Guests</h4>
            <p className="text-[11px] text-[#77776D] mt-1">Add invited relatives or import from Excel/CSV.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D4]">
            <span className="w-6 h-6 rounded-full bg-[#153C32] text-white font-semibold text-xs grid place-items-center mb-2">3</span>
            <h4 className="font-serif font-bold text-[#252A26] text-sm">Record Salamii</h4>
            <p className="text-[11px] text-[#77776D] mt-1">Lightning-fast entry with automatic WhatsApp receipts.</p>
          </div>
        </div>

        <Link to="/app/events/new" className="btn btn-p !py-3 !px-7 text-sm shadow-md inline-flex items-center gap-2 rounded-xl">
          <Plus size={16} />
          <span>Create Your First Wedding Event</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-pop">
      {/* Top Greeting Section matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#252A26] tracking-tight">
            Good Morning, {userName}! 👋
          </h1>
          <p className="text-xs md:text-sm text-[#77776D] mt-1 font-sans">
            Here's what's happening with your wedding event today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/quick-entry"
            className="btn btn-p text-xs md:text-sm !py-2.5 !px-5 shadow-sm rounded-xl flex items-center gap-2"
          >
            <Zap size={15} className="text-[#C7A56A]" />
            <span>Record Gift</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Stat Cards matching reference:
          Total Guests, Total Received, Total Returned, Net Cash Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* 1. Total Guests */}
        <div className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between hover:border-[#153C32]/30 transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#77776D] block">Total Guests</span>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#252A26] mt-1">
                {guests.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32] shrink-0">
              <Users size={20} className="text-[#C7A56A]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#287A50]">
            <span>{todayGuests.length > 0 ? `↑ ${todayGuests.length} today` : `${guests.length} total registered`}</span>
          </div>
        </div>

        {/* 2. Total Received */}
        <div className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between hover:border-[#153C32]/30 transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#77776D] block">Total Received</span>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#252A26] mt-1">
                {pkr(totalReceived)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32] shrink-0">
              <Gift size={20} className="text-[#C7A56A]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#287A50]">
            <span>{todayRecAmount > 0 ? `↑ ${pkr(todayRecAmount)} today` : `${rec.length} gifts recorded`}</span>
          </div>
        </div>

        {/* 3. Total Returned */}
        <div className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between hover:border-[#153C32]/30 transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#77776D] block">Total Returned</span>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#252A26] mt-1">
                {pkr(totalReturned)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32] shrink-0">
              <Undo2 size={20} className="text-[#C7A56A]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#77776D]">
            <span>{todayRetAmount > 0 ? `↑ ${pkr(todayRetAmount)} today` : `${returns.length} returns recorded`}</span>
          </div>
        </div>

        {/* 4. Net Cash Flow */}
        <div className="card p-5 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between hover:border-[#153C32]/30 transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#77776D] block">Net Cash Flow</span>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#252A26] mt-1">
                {pkr(netCashFlow)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32] shrink-0">
              <Wallet size={20} className="text-[#C7A56A]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#287A50]">
            <span>{todayNet > 0 ? `↑ ${pkr(todayNet)} today` : 'Reconciled ledger'}</span>
          </div>
        </div>
      </div>

      {/* Event Progress Card */}
      <div className="card p-5 md:p-6 bg-white border border-[#E7E0D4] shadow-card rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-bold text-[#252A26]">Event Progress</h3>
          <span className="text-xs font-bold text-[#252A26]">{completionPct}% Completed</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#FAF7F0] h-2.5 rounded-full overflow-hidden border border-[#E7E0D4]/70 mb-5">
          <div
            className="h-full bg-gradient-to-r from-[#153C32] to-[#287A50] rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* 4 Sub-metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F0] border border-[#E7E0D4]">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E0D4] flex items-center justify-center text-[#153C32] shrink-0 font-bold text-xs">
              ✉
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] text-[#77776D] truncate">Invitations</span>
              <b className="font-serif text-sm text-[#252A26]">{guests.length} / {totalCapacity}</b>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F0] border border-[#E7E0D4]">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E0D4] flex items-center justify-center text-[#153C32] shrink-0">
              <Users size={15} className="text-[#C7A56A]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] text-[#77776D] truncate">Guests</span>
              <b className="font-serif text-sm text-[#252A26]">{guests.length} / {totalCapacity}</b>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F0] border border-[#E7E0D4]">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E0D4] flex items-center justify-center text-[#153C32] shrink-0">
              <Gift size={15} className="text-[#C7A56A]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] text-[#77776D] truncate">Gifts & Cash</span>
              <b className="font-serif text-sm text-[#252A26] truncate block">{pkr(totalReceived)}</b>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F0] border border-[#E7E0D4]">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E0D4] flex items-center justify-center text-[#153C32] shrink-0">
              <CheckCircle2 size={15} className="text-[#287A50]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] text-[#77776D] truncate">Reconciliation</span>
              <b className="font-serif text-sm text-[#252A26]">{rec.length > 0 ? 'Active' : 'Awaiting gifts'}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Grid below: Recent Activity (left) and Quick Actions + Promo banner (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity List matching reference */}
        <div className="lg:col-span-2 card p-5 md:p-6 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D4] mb-4">
            <h3 className="font-serif text-lg font-bold text-[#252A26]">Recent Activity</h3>
            <Link to="/app/reports" className="text-xs font-semibold text-[#153C32] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {rec.length > 0 ? (
            <div className="divide-y divide-[#E7E0D4]/70 flex-1">
              {rec.slice(0, 5).map(t => {
                const person = people.find(x => x.id === t.personId)
                const guestName = person?.name || 'Guest'
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#FAF7F0] border border-[#E7E0D4] flex items-center justify-center text-[#153C32] font-serif font-bold shrink-0">
                        {guestName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#252A26] truncate">
                          <span className="font-bold">{guestName}</span> added a gift entry – <b className="font-serif font-bold text-[#287A50]">{pkr(t.amount)}</b>
                        </p>
                        <span className="text-[11px] text-[#77776D] block mt-0.5">
                          {[person?.relation || 'Family', t.counterName || 'Main Counter'].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#77776D] font-mono shrink-0">
                      {new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-[#77776D] flex-1">
              <Gift size={32} className="text-[#C7A56A] opacity-60 mb-2" />
              <p className="font-serif text-sm font-bold text-[#252A26]">No Gift Entries Recorded Yet</p>
              <p className="text-xs text-[#77776D] mt-1 max-w-xs">
                When gifts and salamii are entered at the counter or quick entry, live transactions will appear here.
              </p>
              <Link
                to="/app/quick-entry"
                className="btn btn-p text-xs !py-2 !px-4 mt-3 rounded-xl inline-flex items-center gap-1.5"
              >
                <Zap size={13} />
                <span>Record First Gift</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions + Luxury Promo Card */}
        <div className="space-y-5">
          {/* Quick Actions Card matching reference */}
          <div className="card p-5 md:p-6 bg-white border border-[#E7E0D4] shadow-card rounded-2xl">
            <h3 className="font-serif text-lg font-bold text-[#252A26] mb-3 pb-2 border-b border-[#E7E0D4]">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/app/guests"
                className="btn !py-2.5 !px-3 rounded-xl border border-[#E7E0D4] bg-[#FAF7F0] hover:bg-[#F3EBDD] text-xs font-semibold text-[#252A26] flex items-center justify-center gap-2 transition"
              >
                <UserPlus size={15} className="text-[#C7A56A]" />
                <span>Add Guest</span>
              </Link>

              <Link
                to="/app/quick-entry"
                className="btn !py-2.5 !px-3 rounded-xl border border-[#E7E0D4] bg-[#FAF7F0] hover:bg-[#F3EBDD] text-xs font-semibold text-[#252A26] flex items-center justify-center gap-2 transition"
              >
                <Zap size={15} className="text-[#153C32]" />
                <span>Record Gift</span>
              </Link>

              <Link
                to="/app/counters"
                className="btn !py-2.5 !px-3 rounded-xl border border-[#E7E0D4] bg-[#FAF7F0] hover:bg-[#F3EBDD] text-xs font-semibold text-[#252A26] flex items-center justify-center gap-2 transition"
              >
                <KeyRound size={15} className="text-[#C7A56A]" />
                <span>Counter Entry</span>
              </Link>

              <Link
                to="/app/reports"
                className="btn !py-2.5 !px-3 rounded-xl border border-[#E7E0D4] bg-[#FAF7F0] hover:bg-[#F3EBDD] text-xs font-semibold text-[#252A26] flex items-center justify-center gap-2 transition"
              >
                <BarChart3 size={15} className="text-[#153C32]" />
                <span>View Reports</span>
              </Link>
            </div>
          </div>

          {/* Luxury Banner Card matching reference Panel 2:
              "Small details make great celebrations" */}
          <div className="relative rounded-2xl overflow-hidden shadow-card border border-[#E8E0D1] min-h-[200px] flex flex-col justify-between p-6 bg-gradient-to-b from-[#082F28] via-[#063D32] to-[#082F28] text-white">
            {/* Background luxury floral decor */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
              style={{ backgroundImage: `url('/images/event_walima.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#063D32] via-[#063D32]/60 to-transparent" />

            <div className="relative z-10">
              <h4 className="font-serif text-xl md:text-2xl font-normal text-[#FAF7EF] leading-snug">
                Small details<br />make great<br />celebrations
              </h4>
            </div>

            <div className="relative z-10 pt-4 flex items-center justify-between border-t border-white/10">
              <span className="font-serif text-sm tracking-[0.25em] text-[#D7B36A] font-light">
                NEOTA
              </span>
              <div className="w-5 h-5 rounded-full bg-[#D7B36A]/20 flex items-center justify-center text-[#D7B36A]">
                <Sparkles size={11} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

