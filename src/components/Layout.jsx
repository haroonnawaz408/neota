import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, BookUser, BarChart3, Settings,
  Zap, Plus, ShieldCheck, LogOut, Undo2, Globe, WifiOff, CheckCircle2,
  AlertCircle, KeyRound, Smartphone, MessageSquareText, Search, Bell,
  ChevronDown, Calendar, Check, Coins, Clock, Sparkles
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../store'
import FeedbackModal from './FeedbackModal'

// Premium Floral Botanical Logo Emblem
export const Logo = ({ light = false, className = '' }) => (
  <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="NEOTA home">
    <div className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill={light ? "#0F2F28" : "#153C32"} stroke="#C7A56A" strokeWidth="1.2" />
        {/* Intricate Luxury Botanical Petal Emblem */}
        <circle cx="16" cy="16" r="3" fill="#C7A56A" />
        <path d="M16 6C16 11 13 14 10 14C13 14 16 17 16 22C16 17 19 14 22 14C19 14 16 11 16 6Z" fill="#FAF7F0" fillOpacity="0.9" />
        <path d="M9 9C12 12 14 15 14 18C14 15 17 12 20 9" stroke="#C7A56A" strokeWidth="1" strokeLinecap="round" />
        <circle cx="16" cy="7" r="1.2" fill="#C7A56A" />
        <circle cx="16" cy="25" r="1.2" fill="#C7A56A" />
        <circle cx="7" cy="16" r="1.2" fill="#C7A56A" />
        <circle cx="25" cy="16" r="1.2" fill="#C7A56A" />
      </svg>
    </div>
    <span className={`font-serif text-2xl tracking-[0.2em] font-normal ${light ? 'text-[#FAF7F0]' : 'text-[#153C32]'}`}>
      NEOTA
    </span>
  </Link>
)

export default function Layout() {
  const {
    auth, logoutUser, language, setLanguage, t, toast, isOnline,
    offlineQueue, flushOfflineQueue, events = [], activeEvent, setActiveEvent,
    systemConfig, impersonatedUser, exitImpersonation, tx = [], people = []
  } = useStore()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotifs, setReadNotifs] = useState(() => new Set())
  const nav = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = e => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const currentEvent = events.find(e => String(e.id) === String(activeEvent)) || events[0]

  const items = [
    ['/app', t('dashboard'), LayoutDashboard, true],
    ['/app/events', t('events'), CalendarDays],
    ['/app/guests', t('guests'), Users],
    ['/app/people', t('people'), BookUser],
    ['/app/reports', t('reports'), BarChart3],
    ['/app/returns', t('returns'), Undo2],
    ['/app/counters', language === 'ur' ? 'کاؤنٹرز و ٹیم' : 'Counters & Team', KeyRound],
    ['/app/settings', t('settings'), Settings]
  ]

  // Desktop sidebar link style matching reference:
  // Active state is a warm cream/ivory pill with dark green text and forest green icon!
  const cls = ({ isActive }) =>
    `flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
      isActive
        ? 'bg-[#FAF7F0] text-[#153C32] font-semibold shadow-sm'
        : 'text-[#B6C9C0] hover:text-white hover:bg-white/10'
    }`

  const mcls = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] transition-colors ${
      isActive ? 'text-[#153C32] font-bold' : 'text-[#77776D] hover:text-[#252A26]'
    }`

  const handleGlobalSearch = e => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    // Navigate to guests with query parameter or focus search
    nav(`/app/guests?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const userName = auth.user?.name || auth.user?.email?.split('@')[0] || 'Haroon'
  const userRole = auth.admin ? 'Admin' : 'Host'

  const recentGifts = tx.filter(t => t.dir === 'received').slice(-4).reverse()
  const notificationsList = [
    ...(offlineQueue && offlineQueue.length > 0 ? [{
      id: 'offline_queue',
      type: 'warning',
      title: `${offlineQueue.length} Offline Transactions Pending`,
      desc: 'Entries stored locally in browser and waiting to sync.',
      time: 'Just now',
      link: '/app/settings'
    }] : []),
    ...(isOnline ? [{
      id: 'cloud_sync',
      type: 'sync',
      title: 'Cloud Ledger Active & Synchronized',
      desc: 'End-to-end encrypted backup active with Supabase cloud.',
      time: 'Live',
      link: '/app/settings'
    }] : []),
    ...recentGifts.map(t => {
      const p = people.find(x => x.id === t.personId)
      return {
        id: `tx_${t.id}`,
        type: 'gift',
        title: `Rs ${Number(t.amount || 0).toLocaleString()} Salamii Recorded`,
        desc: `Received from ${p?.name || 'Guest'} ${p?.relation ? `(${p.relation})` : ''}`,
        time: t.at ? new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        link: '/app/reports'
      }
    }),
    ...(currentEvent ? [{
      id: `ev_${currentEvent.id}`,
      type: 'event',
      title: `${currentEvent.title} is Active`,
      desc: `${currentEvent.venue || 'Banquet Hall'} · ${currentEvent.date || 'Live now'}`,
      time: 'Event',
      link: `/app/events/${currentEvent.id}`
    }] : [])
  ]

  const unreadCount = notificationsList.filter(n => !readNotifs.has(n.id)).length

  return (
    <div className={`min-h-screen bg-[#FAF7F0] md:flex ${language === 'ur' ? 'font-sans' : ''}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-pop flex items-center gap-2.5 rounded-2xl bg-[#153C32] text-white px-4 py-3 shadow-elevated text-sm border border-[#C7A56A]/30">
          {toast.type === 'error' ? <AlertCircle size={18} className="text-red-400" /> : <CheckCircle2 size={18} className="text-[#C7A56A]" />}
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Desktop Sidebar: Deep Forest Green Luxury */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[#082F28] bg-[#063D32] p-5 sticky top-0 h-screen select-none relative overflow-hidden z-20 shadow-xl">
        {/* Exquisite Botanical Floral Illustration in Bottom Left matching reference */}
        <div className="absolute -bottom-6 -left-6 w-48 h-48 pointer-events-none opacity-20 text-[#D7B36A] z-0">
          <svg viewBox="0 0 200 200" fill="currentColor">
            {/* Main flower blossom */}
            <circle cx="65" cy="140" r="14" fill="#D7B36A" />
            <circle cx="65" cy="140" r="7" fill="#063D32" />
            <path d="M65 116 C70 125 70 132 65 140 C60 132 60 125 65 116 Z" />
            <path d="M65 164 C70 155 70 148 65 140 C60 148 60 155 65 164 Z" />
            <path d="M41 140 C50 145 57 145 65 140 C57 135 50 135 41 140 Z" />
            <path d="M89 140 C80 145 73 145 65 140 C73 135 80 135 89 140 Z" />
            {/* Diagonal petals */}
            <path d="M48 123 C56 128 62 133 65 140 C58 137 53 131 48 123 Z" />
            <path d="M82 157 C74 152 68 147 65 140 C72 143 77 149 82 157 Z" />
            <path d="M82 123 C77 131 72 137 65 140 C68 133 74 128 82 123 Z" />
            <path d="M48 157 C53 149 58 143 65 140 C62 147 56 152 48 157 Z" />
            {/* Elegant curving stems and leaves */}
            <path d="M65 140 Q100 110 130 60 Q145 35 165 15" stroke="#D7B36A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M65 140 Q85 160 115 175" stroke="#D7B36A" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Leaves along upper stem */}
            <path d="M95 110 C90 95 105 85 115 90 C110 105 100 108 95 110 Z" />
            <path d="M112 85 C125 78 135 88 130 98 C120 95 115 90 112 85 Z" />
            <path d="M130 60 C125 45 140 38 148 45 C142 58 135 59 130 60 Z" />
            <path d="M145 38 C158 32 165 42 160 50 C152 46 148 42 145 38 Z" />
            {/* Small decorative bud */}
            <circle cx="165" cy="15" r="4.5" />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 pb-2 relative z-10">
          <Logo light />
          <button
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white/90 hover:bg-white/20 transition font-medium"
            title="Switch Language"
          >
            <Globe size={12} className="text-[#D7B36A]" />
            <span>{language === 'en' ? 'اردو' : 'EN'}</span>
          </button>
        </div>

        {/* Offline / Pending Queue Indicator */}
        {!isOnline ? (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-200 text-xs border border-amber-500/30 relative z-10">
            <WifiOff size={14} />
            <span>Offline (Saved locally)</span>
          </div>
        ) : offlineQueue && offlineQueue.length > 0 ? (
          <div className="mb-3 flex items-center justify-between gap-1 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs border border-emerald-500/30 relative z-10">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Syncing {offlineQueue.length} entries…</span>
            </span>
            <button onClick={flushOfflineQueue} className="underline font-bold text-[10px] text-white">Sync</button>
          </div>
        ) : null}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 py-1 relative z-10">
          {items.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} className={cls}>
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-[#063D32]' : 'text-[#D7B36A]'} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {auth.admin && (
            <div className="pt-2 mt-2 border-t border-white/10">
              <NavLink to="/admin" className={cls}>
                {({ isActive }) => (
                  <>
                    <ShieldCheck size={18} className={isActive ? 'text-[#063D32]' : 'text-[#D7B36A]'} />
                    <span>Super Admin</span>
                  </>
                )}
              </NavLink>
            </div>
          )}
        </nav>

        {/* Bottom Sidebar Footer */}
        <div className="mt-auto pt-3 border-t border-white/10 flex flex-col gap-2.5 relative z-10">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-[#B6C9C0] hover:text-white hover:bg-white/10 transition font-medium w-full text-left"
          >
            <MessageSquareText size={15} className="text-[#D7B36A]" />
            <span>Help & Feedback</span>
          </button>

          {/* User Account / Profile Details matching reference */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-black/20 border border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#D7B36A] text-[#063D32] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-white truncate leading-tight">Haroon Nawaz</span>
                <span className="block text-[10px] text-[#D7B36A] font-medium truncate">Admin</span>
              </div>
            </div>
            <button
              onClick={async () => {
                await logoutUser()
                nav('/')
              }}
              title={t('signOut')}
              className="p-1.5 text-[#B6C9C0] hover:text-red-300 hover:bg-white/10 rounded-lg transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Support Impersonation Inspection Banner */}
        {impersonatedUser && (
          <div className="bg-[#B7791F] text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs sticky top-0 z-40">
            <span className="flex items-center gap-2">
              <span className="font-bold">⚠️ Support Inspection Mode:</span>
              <span>Viewing as <strong>{impersonatedUser.full_name || impersonatedUser.email}</strong>. (Read-Only)</span>
            </span>
            <button
              onClick={exitImpersonation}
              className="bg-black/30 hover:bg-black/40 px-2.5 py-1 rounded text-[11px] font-semibold transition"
            >
              Exit Support Mode
            </button>
          </div>
        )}

        {/* Global Broadcast Announcement Banner */}
        {systemConfig?.broadcast_banner?.enabled && systemConfig.broadcast_banner.message && (
          <div className="bg-[#153C32] text-[#FAF7F0] px-4 py-2 text-xs font-medium border-b border-[#C7A56A]/30 flex items-center justify-center gap-2">
            <span className="font-bold text-[10px] uppercase tracking-wider bg-[#C7A56A] text-[#0F2F28] px-2 py-0.5 rounded-full font-sans">
              Announcement
            </span>
            <span>{systemConfig.broadcast_banner.message}</span>
          </div>
        )}

        {/* Topbar: Warm Ivory Canvas with Search, Notifications, Event Selector & Profile Pill */}
        <header className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E7E0D4] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Mobile Logo on small screens */}
          <div className="md:hidden flex items-center gap-2">
            <Logo />
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleGlobalSearch} className="w-full relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776D]" />
              <input
                type="text"
                placeholder="Search guests, events, or anything..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[#E7E0D4] bg-white pl-10 pr-4 py-2 text-xs text-[#252A26] placeholder-[#77776D] outline-none focus:border-[#153C32] focus:ring-2 focus:ring-[#DCE8DC] transition shadow-xs"
              />
            </form>
          </div>

          {/* Topbar Right Controls */}
          <div className="flex items-center gap-2.5 md:gap-3.5 ml-auto">
            {/* Active Event Selector Pill matching reference:
                Displays "Walima", date, and "● Live" badge */}
            {events.length > 0 && currentEvent && (
              <div className="relative">
                <button
                  onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E7E0D4] text-xs hover:border-[#153C32]/40 transition shadow-xs"
                >
                  <span className="font-semibold text-[#252A26]">{currentEvent.title}</span>
                  {currentEvent.date && (
                    <span className="hidden sm:inline text-[#77776D] text-[11px] border-l border-[#E7E0D4] pl-2 font-mono">
                      {currentEvent.date}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#287A50] bg-[#DCE8DC] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#287A50] animate-pulse" />
                    Live
                  </span>
                  <ChevronDown size={13} className="text-[#77776D]" />
                </button>

                {eventDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white border border-[#E7E0D4] shadow-elevated py-2 z-50 animate-pop">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#77776D] tracking-wider border-b border-[#E7E0D4]">
                      Select Active Event
                    </div>
                    {events.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => {
                          setActiveEvent(ev.id)
                          setEventDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F0] transition ${
                          String(ev.id) === String(currentEvent.id) ? 'font-bold text-[#153C32] bg-[#FAF7F0]' : 'text-[#252A26]'
                        }`}
                      >
                        <div>
                          <div className="truncate">{ev.title}</div>
                          <div className="text-[10px] text-[#77776D] font-mono">{ev.date} · {ev.type}</div>
                        </div>
                        {String(ev.id) === String(currentEvent.id) && (
                          <Check size={14} className="text-[#153C32]" />
                        )}
                      </button>
                    ))}
                    <div className="pt-1 mt-1 border-t border-[#E7E0D4] px-2">
                      <Link
                        to="/app/events/new"
                        onClick={() => setEventDropdownOpen(false)}
                        className="w-full text-center py-1.5 text-xs text-[#153C32] font-semibold flex items-center justify-center gap-1 hover:underline"
                      >
                        <Plus size={13} />
                        <span>Create New Event</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell Icon & Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-9 h-9 rounded-full bg-white border border-[#E7E0D4] flex items-center justify-center text-[#252A26] hover:bg-[#F3EBDD] transition shadow-xs relative"
                title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C7A56A] animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E7E0D4] shadow-elevated z-50 animate-pop overflow-hidden">
                    <div className="px-4 py-3 bg-[#FAF7F0] border-b border-[#E7E0D4] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={15} className="text-[#153C32]" />
                        <span className="font-serif font-bold text-sm text-[#252A26]">Notifications (اطلاعات)</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#153C32] text-white text-[10px] font-bold">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => setReadNotifs(new Set(notificationsList.map(n => n.id)))}
                          className="text-[11px] font-medium text-[#153C32] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E7E0D4]/60">
                      {notificationsList.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#77776D]">
                          No notifications at the moment
                        </div>
                      ) : (
                        notificationsList.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setReadNotifs(prev => new Set([...prev, n.id]))
                              if (n.link) {
                                nav(n.link)
                                setNotificationsOpen(false)
                              }
                            }}
                            className={`p-3.5 hover:bg-[#FAF7F0] transition cursor-pointer flex items-start gap-3 ${
                              !readNotifs.has(n.id) ? 'bg-[#FAF7F0]/40 font-medium' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#DCE8DC] text-[#287A50] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              {n.type === 'gift' ? <Coins size={15} /> : n.type === 'sync' ? <ShieldCheck size={15} /> : <Sparkles size={15} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-[#252A26] truncate">{n.title}</span>
                                <span className="text-[10px] text-[#77776D] font-mono shrink-0">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-[#77776D] leading-snug mt-0.5 truncate">{n.desc}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-[#FAF7F0] border-t border-[#E7E0D4] text-center">
                      <Link
                        to="/app/reports"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-semibold text-[#153C32] hover:underline inline-flex items-center gap-1"
                      >
                        <span>View Detailed Reports</span>
                        <span>&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Pill matching reference */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <div className="w-8 h-8 rounded-full bg-[#153C32] text-[#FAF7F0] font-bold text-xs flex items-center justify-center border border-[#C7A56A] shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-semibold text-[#252A26] leading-tight">{userName}</span>
                <span className="block text-[10px] text-[#77776D] font-medium">{userRole}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Application Canvas */}
        <main className="flex-1 min-w-0 p-4 md:p-8 pb-28 md:pb-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation: Clean luxury bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t border-[#E7E0D4] bg-white/95 backdrop-blur-md px-1 py-1.5 shadow-elevated">
        {[items[0], items[1]].map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} className={mcls}>
            <Icon size={20} />
            <span className="truncate max-w-[55px]">{label}</span>
          </NavLink>
        ))}

        {/* Center Quick Entry Action Floating Button */}
        <Link to="/app/quick-entry" className="flex flex-col items-center -mt-5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#153C32] text-[#FAF7F0] shadow-elevated border-2 border-[#FAF7F0] active:scale-95 transition">
            <Zap size={22} className="text-[#C7A56A]" />
          </span>
          <span className="text-[11px] font-bold text-[#153C32] mt-0.5">{t('quickEntry')}</span>
        </Link>

        {[items[2], items[4]].map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className={mcls}>
            <Icon size={20} />
            <span className="truncate max-w-[55px]">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export const PageHead = ({ title, sub, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
    <div>
      <h1 className="text-2xl md:text-3xl font-serif text-[#252A26] tracking-tight">{title}</h1>
      {sub && <p className="text-xs md:text-sm text-[#77776D] mt-1 font-sans">{sub}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-2.5">{children}</div>
  </div>
)

export const Sample = ({ children }) => (
  <div className="mb-4 flex items-center justify-between rounded-xl border border-[#E7E0D4] bg-[#F3EBDD]/60 px-4 py-2.5 text-xs text-[#77776D]">
    <span>{children}</span>
  </div>
)

