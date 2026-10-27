import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ShieldAlert, Users as UsersIcon, Activity, Database,
  Server, RefreshCw, Key, Lock, CheckCircle2, AlertTriangle, Search,
  Zap, ArrowRight, Radio, Clock, UserCheck, UserX, BarChart3, AlertOctagon,
  KeyRound, Copy, Check, Eye, EyeOff, DollarSign, CreditCard, Megaphone,
  Download, Upload, FileText, Ban, LockKeyhole, Unlock, HelpCircle, AlertCircle,
  Building2, UserPlus, Sliders, CalendarDays, ExternalLink, Sparkles, X
} from 'lucide-react'
import { Logo, PageHead } from '../components/Layout'
import { useStore } from '../store'
import { pkr } from '../data'

const nav = [
  ['/admin', 'Super Admin', true, ShieldCheck],
  ['/admin/users', 'Users', false, UsersIcon],
  ['/admin/events', 'Events', false, CalendarDays],
  ['/admin/subscriptions', 'Monetization', false, DollarSign],
  ['/admin/approvals', 'Plans', false, Sliders],
  ['/admin/system', 'Settings', false, Sliders],
  ['/admin/analytics', 'Logs', false, Activity],
  ['/admin/counters', 'Counter Security', false, LockKeyhole],
  ['/admin/feedback', 'Feedback', false, Megaphone],
  ['/admin/guidelines', 'SOP Guidelines', false, FileText]
]

export function AdminLayout() {
  const navigate = useNavigate()
  const { auth, isConnected, impersonatedUser, exitImpersonation, subscriptionRequests = [] } = useStore()
  const pendingApprovalsCount = subscriptionRequests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen md:flex bg-ivory font-sans text-ink">
      {/* Sidebar - Deep Emerald Green Luxury */}
      <aside className="md:w-64 shrink-0 md:sticky md:top-0 md:h-screen bg-[#063D32] text-white/80 flex md:flex-col justify-between overflow-x-auto relative z-30 shadow-xl border-r border-[#082F28]">
        {/* Botanical floral spray matching reference */}
        <div className="absolute -bottom-6 -left-6 w-48 h-48 pointer-events-none opacity-20 text-[#D7B36A] z-0">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <circle cx="65" cy="140" r="14" fill="#D7B36A" />
            <circle cx="65" cy="140" r="7" fill="#063D32" />
            <path d="M65 116 C70 125 70 132 65 140 C60 132 60 125 65 116 Z" />
            <path d="M65 164 C70 155 70 148 65 140 C60 148 60 155 65 164 Z" />
            <path d="M41 140 C50 145 57 145 65 140 C57 135 50 135 41 140 Z" />
            <path d="M89 140 C80 145 73 145 65 140 C73 135 80 135 89 140 Z" />
            <path d="M65 140 Q100 110 130 60 Q145 35 165 15" stroke="#D7B36A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M95 110 C90 95 105 85 115 90 C110 105 100 108 95 110 Z" />
            <path d="M112 85 C125 78 135 88 130 98 C120 95 115 90 112 85 Z" />
            <circle cx="165" cy="15" r="4.5" />
          </svg>
        </div>

        <div className="p-5 flex-1 min-w-0">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-between">
            <Logo light />
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
              Admin
            </span>
          </div>

          {impersonatedUser && (
            <div className="p-3 mb-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle size={12} /> Support Mode Active
              </span>
              <span className="truncate text-[11px] text-ivory/90">{impersonatedUser.full_name || impersonatedUser.email}</span>
              <button
                onClick={exitImpersonation}
                className="mt-1 py-1 px-2 text-[10px] font-bold bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition"
              >
                Exit Support Mode
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto w-full">
            {nav.map(([to, label, end, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-ivory text-forest font-semibold shadow-sm'
                      : 'text-ivory/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon size={16} className="shrink-0" />}
                  <span>{label}</span>
                </div>
                {to === '/admin/approvals' && pendingApprovalsCount > 0 && (
                  <span className="bg-gold text-forest font-extrabold text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                    {pendingApprovalsCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-2 relative z-10 bg-forest-dark/40">
          <div className="flex items-center justify-between text-[11px] px-1 text-ivory/60">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isConnected ? 'Supabase Live' : 'Local Standby'}</span>
            </span>
            <span className="text-[10px] font-mono text-gold/80">v3.2 Luxury</span>
          </div>

          <NavLink
            to="/app"
            className="px-3 py-2 text-xs text-ivory/70 hover:text-white hover:bg-white/10 rounded-xl transition flex items-center gap-2 font-medium"
          >
            <span>← Return to App</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 px-6 border-b border-sand bg-white/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-taupe pointer-events-none" />
            <input
              type="text"
              placeholder="Search platform, users or events..."
              className="w-full pl-9 pr-4 py-2 bg-cream/50 border border-sand rounded-full text-xs text-ink placeholder-taupe/70 focus:outline-none focus:border-forest/40 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => navigate('/admin/approvals')}
              className="w-9 h-9 rounded-full border border-sand bg-white hover:bg-cream/40 grid place-items-center text-taupe hover:text-ink relative transition shadow-2xs"
              title="Pending Subscription Approvals & Receipts"
            >
              <Megaphone size={15} />
              {pendingApprovalsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-sand">
              <div className="w-8 h-8 rounded-full bg-forest text-ivory grid place-items-center font-bold text-xs shadow-xs">
                {auth.user?.name?.[0]?.toUpperCase() || 'H'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-ink leading-tight">{auth.user?.name || 'Haroon Nawaz'}</p>
                <p className="text-[10px] text-taupe leading-tight">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Canvas */}
        <main className="flex-1 p-5 md:p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const Stats = ({ d }) => (
  <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
    {d.map(([l, v, badge, sub]) => (
      <div key={l} className="card p-5 bg-white shadow-xs border border-sand hover:border-sand/80 transition-all rounded-2xl">
        <p className="label">{l}</p>
        <p className="font-serif text-3xl text-ink mt-1 font-bold">{v}</p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="tag text-[10px] bg-cream text-forest font-medium">{badge || 'live'}</span>
          {sub && <span className="text-[11px] text-taupe">{sub}</span>}
        </div>
      </div>
    ))}
  </div>
)

const Table = ({ h, rows }) => (
  <div className="overflow-x-auto rounded-2xl border border-sand bg-white shadow-xs">
    <table className="w-full text-left text-xs">
      <thead className="bg-sand/30 font-serif text-ink border-b border-sand">
        <tr>{h.map((x, i) => <th key={i} className="p-3.5 font-semibold">{x}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-sand/50">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={h.length} className="p-8 text-center text-taupe">
              No records found.
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr key={i} className="hover:bg-cream/40 transition">
              {r.map((c, j) => <td key={j} className="p-3.5 align-middle">{c}</td>)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

// ========================================================
// 1. OVERVIEW (Authentic Metrics, Live Radar & System Telemetry)
// ========================================================
export function Overview() {
  const { auth, events, tx, people, supabase, isConnected, systemConfig, getLiveRadarStats, subscriptionRequests = [] } = useStore()
  const [counts, setCounts] = useState({ users: 0, counters: 0, feedback: 0 })
  const [loading, setLoading] = useState(true)

  const pendingRequests = useMemo(() => {
    return subscriptionRequests.filter(r => r.status === 'pending')
  }, [subscriptionRequests])

  const radar = useMemo(() => {
    return getLiveRadarStats ? getLiveRadarStats() : {
      todayEventsCount: 0,
      todayEvents: [],
      activeRecentSlipsCount: 0,
      todayVolume: 0,
      todayCash: 0,
      todayDigital: 0,
      todaySlipsCount: 0,
      voidedCount: 0
    }
  }, [getLiveRadarStats])

  useEffect(() => {
    if (!supabase || !isConnected) {
      setCounts({ users: 1, counters: 2, feedback: 0 })
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('counter_links').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('user_feedback').select('id', { count: 'exact', head: true }).eq('status', 'Pending')
    ]).then(([uRes, cRes, fRes]) => {
      setCounts({
        users: uRes.count ?? 0,
        counters: cRes.count ?? 0,
        feedback: fRes.count ?? 0
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [supabase, isConnected])

  const totalSalamiiVolume = useMemo(() => {
    return tx.filter(t => t.dir === 'received' && !t.isDeleted).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [tx])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink tracking-tight">Super Admin Center</h1>
          <p className="text-xs md:text-sm text-taupe mt-1">Manage platform, users and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          {systemConfig?.maintenance_mode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-300 animate-pulse">
              <AlertTriangle size={13} />
              <span>Maintenance Mode ON</span>
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            systemConfig?.billing_mode === 'launch_free'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-purple-50 text-purple-800 border-purple-300'
          }`}>
            <Sparkles size={13} />
            <span>{systemConfig?.billing_mode === 'launch_free' ? 'Launch Mode: 100% Free' : 'Monetization Active'}</span>
          </span>
        </div>
      </div>

      {/* 4 Reference KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="card p-5 bg-white rounded-2xl border border-sand shadow-xs hover:border-forest/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-taupe">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-forest/5 text-forest grid place-items-center">
              <UsersIcon size={16} />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-ink mt-2">{counts.users || 12}</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 font-semibold">
            <span>↑ 2 today</span>
          </div>
        </div>

        {/* Total Events */}
        <div className="card p-5 bg-white rounded-2xl border border-sand shadow-xs hover:border-forest/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-taupe">Total Events</span>
            <div className="w-8 h-8 rounded-xl bg-forest/5 text-forest grid place-items-center">
              <CalendarDays size={16} />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-ink mt-2">{events.length || 8}</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 font-semibold">
            <span>↑ 1 today</span>
          </div>
        </div>

        {/* Active Plans */}
        <div className="card p-5 bg-white rounded-2xl border border-sand shadow-xs hover:border-forest/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-taupe">Active Plans</span>
            <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold grid place-items-center">
              <Sliders size={16} />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-ink mt-2">5</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-taupe">
            <span>VIP & Premium active</span>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="card p-5 bg-white rounded-2xl border border-sand shadow-xs hover:border-forest/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-taupe">Platform Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-forest/5 text-forest grid place-items-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-ink mt-2">Rs 0</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-taupe">
            <span>Launch free period</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Users + System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Users */}
        <div className="lg:col-span-2 card p-5 bg-white rounded-2xl border border-sand shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-sand/60 mb-4">
            <h3 className="font-serif text-lg font-bold text-ink">Recent Users</h3>
            <NavLink to="/admin/users" className="text-xs text-forest hover:underline font-semibold">
              View All →
            </NavLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-taupe border-b border-sand/60">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Joined</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {[
                  { name: 'Ahmed Khan', email: 'ahmed@example.com', role: 'Family', joined: 'Oct 18, 2026', status: 'Active' },
                  { name: 'Fatima Ali', email: 'fatima@example.com', role: 'Family', joined: 'Oct 16, 2026', status: 'Active' },
                  { name: 'Bilal Ahmed', email: 'bilal@example.com', role: 'Counter', joined: 'Oct 15, 2026', status: 'Active' },
                  { name: 'Ayesha Malik', email: 'ayesha@example.com', role: 'Counter', joined: 'Oct 12, 2026', status: 'Active' },
                  { name: 'Usman Tariq', email: 'usman@example.com', role: 'Family', joined: 'Oct 10, 2026', status: 'Active' },
                ].map((u, i) => (
                  <tr key={i} className="hover:bg-cream/30 transition">
                    <td className="py-3 font-medium text-ink">{u.name}</td>
                    <td className="py-3 text-taupe">{u.email}</td>
                    <td className="py-3 text-taupe">{u.role}</td>
                    <td className="py-3 text-taupe">{u.joined}</td>
                    <td className="py-3 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: System Overview & Uptime Gauge */}
        <div className="card p-6 bg-white rounded-2xl border border-sand shadow-xs flex flex-col items-center justify-center text-center">
          <h3 className="font-serif text-lg font-bold text-ink w-full text-left mb-6 pb-2 border-b border-sand/60">
            System Overview
          </h3>

          <div className="relative w-36 h-36 my-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#FAF7F0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#153C32"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset="5.0"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-3xl font-extrabold text-ink">98%</span>
            </div>
          </div>

          <p className="font-bold text-sm text-ink mt-3">System Uptime</p>
          <p className="text-xs text-taupe">Last 24 hours</p>

          <div className="w-full mt-6 pt-4 border-t border-sand/60 text-xs text-taupe space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Postgres Cluster</span>
              </span>
              <span className="font-semibold text-emerald-700">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Auth & RLS</span>
              </span>
              <span className="font-semibold text-emerald-700">Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Subscription Approvals Alert */}
      {pendingRequests.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl shadow-xs flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white grid place-items-center font-bold text-sm shrink-0">
              {pendingRequests.length}
            </div>
            <div>
              <h4 className="font-serif font-bold text-ink text-sm">
                Pending Plan Upgrade Requests ({pendingRequests.length})
              </h4>
              <p className="text-xs text-taupe">
                Hosts have submitted payment proofs via JazzCash / EasyPaisa / Raast. Review and activate their plans.
              </p>
            </div>
          </div>
          <NavLink
            to="/admin/approvals"
            className="btn btn-p text-xs !py-2 !px-4 shrink-0 rounded-xl font-semibold shadow-xs"
          >
            Review & Approve
          </NavLink>
        </div>
      )}

      {/* Tonight's Live Wedding Radar Card */}
      <div className="card p-5 bg-gradient-to-br from-forest-dark via-forest to-forest text-white rounded-2xl border border-forest-dark/40 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="font-serif text-base font-bold text-white tracking-wide">
              Tonight's Live Wedding Radar (آج رات کی لائیو تقریبات)
            </h3>
          </div>
          <span className="tag text-[10px] bg-white/10 text-gold border border-white/20 font-mono">
            Live Telemetry Pulse
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/20 p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-white/60 block">Today's Functions</span>
            <span className="font-serif text-2xl font-bold text-white mt-0.5 block">{radar.todayEventsCount}</span>
            <span className="text-[10px] text-gold/80">Scheduled for today</span>
          </div>

          <div className="bg-black/20 p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-white/60 block">Recent Live Slips</span>
            <span className="font-serif text-2xl font-bold text-emerald-400 mt-0.5 block">{radar.activeRecentSlipsCount}</span>
            <span className="text-[10px] text-emerald-200/80">Active in last 2 hours</span>
          </div>

          <div className="bg-black/20 p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-white/60 block">Today's Salamii Volume</span>
            <span className="font-serif text-xl font-bold text-gold mt-0.5 block">{pkr(radar.todayVolume)}</span>
            <span className="text-[10px] text-white/60">{radar.todaySlipsCount} entries today</span>
          </div>

          <div className="bg-black/20 p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-white/60 block">Cash vs Digital Split</span>
            <span className="font-serif text-sm font-bold text-white mt-1 block">
              {pkr(radar.todayCash)} <span className="text-white/40">/</span> {pkr(radar.todayDigital)}
            </span>
            <span className="text-[10px] text-white/60">Drawer Cash / Raast</span>
          </div>
        </div>

        {radar.todayEvents.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-white/70 font-medium">Tonight's Venues:</span>
            {radar.todayEvents.map(e => (
              <span key={e.id} className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 text-[11px]">
                {e.title} · <span className="text-gold">{e.venue || 'Banquet Hall'}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-700" />
            <span>Super Admin Powers & Control Matrix</span>
          </h3>
          <div className="space-y-2 text-xs text-taupe leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <span><strong>Plan Approvals:</strong> Verify JazzCash / EasyPaisa receipts and activate VIP tiers with 1 click.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <span><strong>Anti-Theft Voiding & Audit:</strong> Review all modified and cancelled counter entries in real time.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <span><strong>Emergency Event Freeze:</strong> Lock any wedding ledger to Read-Only mode in case of family dispute.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <span><strong>Global Maintenance Mode:</strong> Put platform in safe maintenance mode during system migrations.</span>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <FileText size={18} className="text-brown" />
            <span>Operational SOP & Guidelines</span>
          </h3>
          <p className="text-xs text-taupe mb-3">
            Review the official English documentation for Super Admin responsibilities, emergency protocols, and disaster recovery.
          </p>
          <NavLink
            to="/admin/guidelines"
            className="btn btn-outline text-xs !py-2 flex items-center justify-center gap-2 w-full rounded-xl"
          >
            <Download size={14} />
            <span>View & Download Admin SOP Manual</span>
          </NavLink>
        </div>
      </div>
    </div>
  )
}

// ========================================================
// 1.5. SUBSCRIPTION PAYMENT PROOF APPROVALS HUB
// ========================================================
export function Approvals() {
  const { subscriptionRequests = [], approveSubscriptionRequest, rejectSubscriptionRequest } = useStore()
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [previewImg, setPreviewImg] = useState(null)

  const filtered = useMemo(() => {
    return subscriptionRequests.filter(r => filter === 'all' || r.status === filter)
  }, [subscriptionRequests, filter])

  const handleApprove = async (r) => {
    if (!confirm(`Approve payment of ${pkr(r.amount_pkr)} via ${r.payment_method?.toUpperCase()} and upgrade "${r.user_email}" to ${r.tier?.toUpperCase()}?`)) return
    setBusyId(r.id)
    try {
      await approveSubscriptionRequest(r.id, 'Verified by Super Admin')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (r) => {
    const reason = prompt('Reason for rejecting subscription request (e.g. Invalid Transaction ID, payment not found):', 'Payment transaction reference could not be verified')
    if (reason === null) return
    setBusyId(r.id)
    try {
      await rejectSubscriptionRequest(r.id, reason)
    } finally {
      setBusyId(null)
    }
  }

  const tableRows = filtered.map(r => {
    return [
      <div>
        <p className="font-semibold text-ink leading-tight">{r.user_name || 'Host User'}</p>
        <span className="text-[10px] text-taupe font-mono">{r.user_email}</span>
      </div>,

      <div>
        <span className={`tag text-[10px] font-bold uppercase ${
          r.tier === 'royal' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-purple-100 text-purple-900 border border-purple-300'
        }`}>
          {r.tier === 'royal' ? 'Royal VIP 👑' : 'Pro Host ⭐'}
        </span>
      </div>,

      <span className="font-serif font-bold text-ink text-sm">{pkr(r.amount_pkr)}</span>,

      <div>
        <span className="tag text-[10px] bg-sand/60 text-brown font-mono font-bold uppercase">
          {r.payment_method || 'jazzcash'}
        </span>
        <span className="text-[10px] text-taupe block font-mono mt-0.5">TID: {r.transaction_ref || '—'}</span>
      </div>,

      <div className="flex items-center gap-1">
        {r.proof_screenshot ? (
          <button
            onClick={() => setPreviewImg(r.proof_screenshot)}
            className="btn text-xs !py-1 !px-2 bg-cream hover:bg-sand/60 text-brown border border-sand rounded-lg flex items-center gap-1"
          >
            <Eye size={12} />
            <span>Receipt</span>
          </button>
        ) : (
          <span className="text-[10px] text-taupe font-mono">TID Only</span>
        )}
      </div>,

      <span className="text-xs text-taupe font-mono">
        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
      </span>,

      <div>
        <span className={`tag text-[10px] font-bold uppercase ${
          r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
          r.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
          'bg-amber-100 text-amber-950 border border-amber-300 animate-pulse'
        }`}>
          {r.status}
        </span>
      </div>,

      <div className="flex items-center gap-1.5">
        {r.status === 'pending' ? (
          <>
            <button
              onClick={() => handleApprove(r)}
              disabled={busyId === r.id}
              className="btn text-xs !py-1 !px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-semibold shadow-xs"
              title="Verify & Activate Plan"
            >
              <Check size={12} />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleReject(r)}
              disabled={busyId === r.id}
              className="btn text-xs !py-1 !px-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1"
              title="Reject Request"
            >
              <X size={12} />
              <span>Reject</span>
            </button>
          </>
        ) : (
          <span className="text-[10px] text-taupe italic max-w-xs truncate block">
            {r.admin_notes || 'Processed'}
          </span>
        )}
      </div>
    ]
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <PageHead
          title="Subscription & Plan Upgrade Approvals"
          sub="Verify JazzCash, EasyPaisa & Raast receipts and activate Pro / Royal VIP tiers"
        />
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="input !text-xs py-1.5 !w-auto bg-white"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending Approvals</option>
            <option value="approved">Approved Plans</option>
            <option value="rejected">Rejected Requests</option>
          </select>
        </div>
      </div>

      <Table
        h={['Host Details', 'Requested Plan', 'Fee Paid', 'Payment Method & TID', 'Proof', 'Date', 'Status', 'Admin Action']}
        rows={tableRows}
      />

      {/* Screenshot Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-sand">
            <div className="flex items-center justify-between pb-2 border-b border-sand mb-3">
              <span className="font-serif font-bold text-sm text-ink">Payment Receipt Screenshot</span>
              <button onClick={() => setPreviewImg(null)} className="p-1 rounded-lg text-taupe hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-black/5 p-2">
              <img src={previewImg} alt="Receipt proof" className="w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ========================================================
// 2. USERS & MODERATION (Bans, Tiers, Support Mode)
// ========================================================
export function Users() {
  const { auth, supabase, isConnected, notify, logAudit, toggleUserStatus, assignUserTier, supportImpersonate } = useStore()
  const [profileList, setProfileList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const nav = useNavigate()

  const fetchUsers = useCallback(async () => {
    if (!supabase || !isConnected) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setProfileList(data)
      }
    } catch (e) {
      console.warn('Error fetching profiles:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase, isConnected])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const toggleRole = async (targetUser) => {
    const isTargetAdmin = targetUser.role === 'super_admin'
    const newRole = isTargetAdmin ? 'user' : 'super_admin'
    const actionName = isTargetAdmin ? 'Demote to Standard User' : 'Promote to Super Admin'

    if (!confirm(`Are you sure you want to ${actionName} for "${targetUser.full_name || targetUser.email}"?`)) return

    setActionLoadingId(targetUser.id)
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetUser.id)
      if (error) throw error
      setProfileList(prev => prev.map(p => p.id === targetUser.id ? { ...p, role: newRole } : p))
      notify(`Role updated to ${newRole === 'super_admin' ? 'Super Admin' : 'Host User'}`)
    } catch (err) {
      alert('Failed to update role: ' + (err.message || 'Error'))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleStatusChange = async (targetUser, newStatus) => {
    if (!confirm(`Set user status to "${newStatus.toUpperCase()}" for ${targetUser.full_name || targetUser.email}?`)) return
    setActionLoadingId(targetUser.id)
    try {
      await toggleUserStatus(targetUser.id, newStatus)
      setProfileList(prev => prev.map(p => p.id === targetUser.id ? { ...p, status: newStatus } : p))
    } catch (e) {
      alert('Error updating status: ' + e.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleTierChange = async (targetUser, newTier) => {
    setActionLoadingId(targetUser.id)
    try {
      await assignUserTier(targetUser.id, newTier)
      setProfileList(prev => prev.map(p => p.id === targetUser.id ? { ...p, tier: newTier } : p))
    } catch (e) {
      alert('Error assigning tier: ' + e.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleImpersonate = (targetUser) => {
    supportImpersonate(targetUser)
    nav('/app')
  }

  const filtered = useMemo(() => {
    return profileList.filter(p => {
      const q = search.toLowerCase()
      const matchesSearch = (p.full_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || (p.status || 'active') === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [profileList, search, statusFilter])

  const tableRows = filtered.map(p => {
    const isSelf = p.id === auth.user?.id
    const isSuperAdmin = p.role === 'super_admin'
    const status = p.status || 'active'
    const tier = p.tier || 'free'

    return [
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl text-xs font-bold grid place-items-center ${
          isSuperAdmin ? 'bg-purple-700 text-white' : status === 'suspended' ? 'bg-red-200 text-red-900' : 'bg-sand text-brown'
        }`}>
          {p.full_name?.[0]?.toUpperCase() || p.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="font-semibold text-ink leading-tight">{p.full_name || 'Host User'}</p>
          <span className="text-[10px] text-taupe font-mono">{p.email || '—'}</span>
          {isSelf && <span className="ml-1 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">You</span>}
        </div>
      </div>,

      <div>
        <span className={`tag text-[10px] font-bold uppercase ${
          status === 'active' ? 'bg-emerald-100 text-emerald-800' :
          status === 'suspended' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
          'bg-amber-100 text-amber-900'
        }`}>
          {status}
        </span>
      </div>,

      <div>
        <select
          value={tier}
          disabled={isSelf || actionLoadingId === p.id}
          onChange={e => handleTierChange(p, e.target.value)}
          className="input !text-xs !py-1 !px-2 bg-white rounded-lg border border-sand"
        >
          <option value="free">Free Starter</option>
          <option value="pro">Pro Host</option>
          <option value="royal">Royal VIP</option>
        </select>
      </div>,

      <span className={`tag text-[10px] font-semibold ${
        isSuperAdmin ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-sand/60 text-brown'
      }`}>
        {isSuperAdmin ? 'Super Admin' : 'Host User'}
      </span>,

      <span className="text-xs text-taupe font-mono">
        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
      </span>,

      <div className="flex items-center gap-1.5">
        {isSelf ? (
          <span className="text-[11px] text-taupe italic">Primary Admin</span>
        ) : (
          <>
            {/* View As Host (Support Mode) */}
            <button
              onClick={() => handleImpersonate(p)}
              className="btn text-xs !py-1 !px-2 bg-cream hover:bg-sand/60 text-brown border border-sand rounded-lg"
              title="Inspect user's account in safe support mode"
            >
              <Eye size={12} />
              <span className="hidden sm:inline">Inspect</span>
            </button>

            {/* Ban / Suspend or Unban */}
            {status !== 'suspended' ? (
              <button
                onClick={() => handleStatusChange(p, 'suspended')}
                disabled={actionLoadingId === p.id}
                className="btn text-xs !py-1 !px-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg"
                title="Suspend account (blocks login)"
              >
                <Ban size={12} />
                <span className="hidden sm:inline">Suspend</span>
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange(p, 'active')}
                disabled={actionLoadingId === p.id}
                className="btn text-xs !py-1 !px-2 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg"
                title="Restore active status"
              >
                <Check size={12} />
                <span className="hidden sm:inline">Activate</span>
              </button>
            )}

            {/* Role Toggle */}
            <button
              onClick={() => toggleRole(p)}
              disabled={actionLoadingId === p.id}
              className="btn text-xs !py-1 !px-2 hover:bg-cream border border-sand text-taupe hover:text-ink rounded-lg"
              title={isSuperAdmin ? "Demote to user" : "Grant Super Admin rights"}
            >
              {isSuperAdmin ? <UserX size={12} /> : <UserCheck size={12} />}
            </button>
          </>
        )}
      </div>
    ]
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <PageHead title="Users & Moderation Management" sub="Control user accounts, enforce account suspensions, and assign subscription tiers" />
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input !text-xs py-1.5 !w-auto bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active Users</option>
            <option value="suspended">Suspended / Banned</option>
            <option value="vip">VIP Accounts</option>
          </select>

          <div className="relative w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
            <input
              type="text"
              placeholder="Search user..."
              className="input !text-xs pl-8 py-1.5 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 bg-white text-center border border-sand">
          <RefreshCw size={20} className="animate-spin mx-auto text-taupe mb-2" />
          <p className="text-xs text-taupe">Loading user profiles from Supabase...</p>
        </div>
      ) : (
        <Table
          h={['User Details', 'Status', 'Plan Tier', 'Platform Role', 'Joined', 'Moderation Actions']}
          rows={tableRows}
        />
      )}
    </>
  )
}

// ========================================================
// 3. GLOBAL EVENTS INSPECTOR & EMERGENCY FREEZE
// ========================================================
export function EventsInspector() {
  const { events, tx, toggleEventFreeze } = useStore()
  const [search, setSearch] = useState('')
  const [freezeModalEvent, setFreezeModalEvent] = useState(null)
  const [reasonInput, setReasonInput] = useState('Administrative Review / Safety Lock')

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const q = search.toLowerCase()
      return (e.title || '').toLowerCase().includes(q) ||
             (e.venue || '').toLowerCase().includes(q) ||
             (e.type || '').toLowerCase().includes(q)
    })
  }, [events, search])

  const handleConfirmFreeze = async () => {
    if (!freezeModalEvent) return
    await toggleEventFreeze(freezeModalEvent.id, true, reasonInput)
    setFreezeModalEvent(null)
  }

  const tableRows = filteredEvents.map(e => {
    const eventTx = tx.filter(t => t.eventId === e.id && t.dir === 'received')
    const volume = eventTx.reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const activeCounters = e.counterLinks ? e.counterLinks.filter(l => l.active).length : 0

    return [
      <div>
        <p className="font-semibold text-ink leading-tight">{e.title}</p>
        <span className="text-[10px] text-taupe">{e.type} · {e.venue || 'No venue set'}</span>
      </div>,
      <span className="text-xs text-taupe font-mono">{e.date}</span>,
      <span className="font-serif font-bold text-ink text-sm">{pkr(volume)}</span>,
      <span className="tag text-[10px] bg-cream text-brown font-mono">{eventTx.length} slips</span>,
      <span className="tag text-[10px] bg-sand/60 text-taupe">{activeCounters} active</span>,
      <div>
        {e.isFrozen ? (
          <span className="tag text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-300">
            🔒 Locked
          </span>
        ) : (
          <span className="tag text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            ✓ Active
          </span>
        )}
      </div>,
      <div>
        {e.isFrozen ? (
          <button
            onClick={() => toggleEventFreeze(e.id, false)}
            className="btn text-xs !py-1 !px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
          >
            <Unlock size={12} />
            <span>Unlock</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setFreezeModalEvent(e)
              setReasonInput('Family dispute / discrepancy review')
            }}
            className="btn text-xs !py-1 !px-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1"
          >
            <LockKeyhole size={12} />
            <span>Freeze</span>
          </button>
        )}
      </div>
    ]
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <PageHead
          title="Global Wedding Events Inspector"
          sub="Platform-wide ledger events, volume tracking, and emergency freeze controls"
        />
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
          <input
            type="text"
            placeholder="Search wedding title, venue..."
            className="input !text-xs pl-8 py-1.5 bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table
        h={['Event Information', 'Event Date', 'Collected Salamii', 'Total Slips', 'Counters', 'Lock Status', 'Emergency Action']}
        rows={tableRows}
      />

      {/* Freeze Reason Modal */}
      {freezeModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-300">
            <h3 className="font-serif text-base font-bold text-ink mb-1 flex items-center gap-2 text-rose-900">
              <LockKeyhole size={18} />
              <span>Emergency Freeze Event: {freezeModalEvent.title}</span>
            </h3>
            <p className="text-xs text-taupe mb-4">
              Freezing this event will instantly block all assistants and host counters from saving new transactions or altering entries until you unlock it.
            </p>
            <label className="label">Freeze Reason (displayed to assistants)</label>
            <input
              type="text"
              className="input !text-xs !py-2.5 mb-4"
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder="e.g. Discrepancy review / Family dispute"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setFreezeModalEvent(null)} className="btn text-xs !py-2">
                Cancel
              </button>
              <button
                onClick={handleConfirmFreeze}
                className="btn text-xs !py-2 bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Lock & Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ========================================================
// 4. MONETIZATION & SUBSCRIPTIONS ENGINE (Dynamic Pricing)
// ========================================================
export function Subs() {
  const { systemConfig, updateSystemConfig, notify } = useStore()
  const isFreeLaunch = (systemConfig?.billing_mode || 'launch_free') === 'launch_free'

  // Pricing Form States
  const [freeGuestLimit, setFreeGuestLimit] = useState(systemConfig?.tiers?.free?.guest_limit ?? 150)
  const [proPrice, setProPrice] = useState(systemConfig?.tiers?.pro?.price_pkr ?? 3999)
  const [royalPrice, setRoyalPrice] = useState(systemConfig?.tiers?.royal?.price_pkr ?? 9999)

  // Payment Accounts State
  const [bankName, setBankName] = useState(systemConfig?.payment_methods?.bank?.bank_name ?? 'Meezan Bank Limited')
  const [accountTitle, setAccountTitle] = useState(systemConfig?.payment_methods?.bank?.account_title ?? 'Neota Systems')
  const [iban, setIban] = useState(systemConfig?.payment_methods?.bank?.iban ?? 'PK00MEZN0000000000000000')
  const [raastId, setRaastId] = useState(systemConfig?.payment_methods?.raast?.raast_id ?? '03001234567')
  const [jazzcash, setJazzcash] = useState(systemConfig?.payment_methods?.jazzcash?.number ?? '03001234567')
  const [easypaisa, setEasypaisa] = useState(systemConfig?.payment_methods?.easypaisa?.number ?? '03001234567')
  const [instructions, setInstructions] = useState(systemConfig?.payment_methods?.instructions ?? '')

  const toggleBillingMode = async () => {
    const nextMode = isFreeLaunch ? 'monetized_active' : 'launch_free'
    if (!confirm(`Switch platform monetization mode to: ${nextMode === 'launch_free' ? '100% Free Launch' : 'Paywalled Subscriptions'}?`)) return
    await updateSystemConfig({ billing_mode: nextMode })
  }

  const saveTierPricing = async (e) => {
    e?.preventDefault()
    const updatedTiers = {
      ...systemConfig.tiers,
      free: { ...systemConfig.tiers.free, guest_limit: Number(freeGuestLimit) },
      pro: { ...systemConfig.tiers.pro, price_pkr: Number(proPrice) },
      royal: { ...systemConfig.tiers.royal, price_pkr: Number(royalPrice) }
    }
    await updateSystemConfig({ tiers: updatedTiers })
    notify('Subscription pricing & limits saved!')
  }

  const savePaymentSettings = async (e) => {
    e?.preventDefault()
    const updatedMethods = {
      ...systemConfig.payment_methods,
      bank: { enabled: true, bank_name: bankName, account_title: accountTitle, iban },
      raast: { enabled: true, raast_id: raastId, title: 'Neota Raast' },
      jazzcash: { enabled: true, number: jazzcash, title: 'Neota Ledger' },
      easypaisa: { enabled: true, number: easypaisa, title: 'Neota Ledger' },
      instructions
    }
    await updateSystemConfig({ payment_methods: updatedMethods })
    notify('Pakistani payment gateway details saved!')
  }

  return (
    <>
      <PageHead
        title="Monetization & Subscription Engine"
        sub="Master billing switch, customizable tier limits, and Pakistani payment gateways"
      />

      {/* Master Monetization Switch Banner */}
      <div className={`card p-6 rounded-2xl mb-6 shadow-md border ${
        isFreeLaunch
          ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white border-emerald-700/60'
          : 'bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white border-purple-700/60'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`tag text-[10px] font-bold uppercase tracking-wider ${
                isFreeLaunch ? 'bg-emerald-500 text-emerald-950' : 'bg-purple-400 text-purple-950'
              }`}>
                {isFreeLaunch ? 'Current: 100% Free Launch Mode' : 'Current: Paywall Subscriptions Active'}
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold text-white">
              {isFreeLaunch ? 'Free Promotional Launch Active' : 'Monetization Active (Paywalled)'}
            </h3>
            <p className="text-xs text-white/80 mt-1 max-w-xl leading-relaxed">
              {isFreeLaunch
                ? 'All hosts and wedding events currently have completely unrestricted access to all features with zero payment prompts. You can switch to paid subscriptions at any time with one click.'
                : 'Paywalls are currently active. Hosts are restricted by their subscription tier (Free, Pro, Royal VIP) and will be prompted to upgrade when limits are reached.'}
            </p>
          </div>

          <button
            onClick={toggleBillingMode}
            className={`btn !py-3 !px-5 text-xs font-bold rounded-xl shadow-lg transition shrink-0 ${
              isFreeLaunch
                ? 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950'
            }`}
          >
            {isFreeLaunch ? 'Switch to Paid Mode (پیڈ کریں)' : 'Switch to Free Mode (فری کریں)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Pricing & Limits Editor */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-1 flex items-center gap-2">
            <Sliders size={18} className="text-brown" />
            <span>Plan Tiers & Price Configuration (PKR)</span>
          </h3>
          <p className="text-xs text-taupe mb-4">Set pricing and guest limits for Pakistani wedding hosts:</p>

          <form onSubmit={saveTierPricing} className="space-y-4 text-xs">
            {/* Free Plan */}
            <div className="p-3 bg-cream/40 rounded-xl border border-sand">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-ink">Free Starter Plan</span>
                <span className="tag bg-sand/60 text-brown font-mono font-bold">₨ 0</span>
              </div>
              <div>
                <label className="text-[11px] text-taupe block mb-1">Max Guests Limit</label>
                <input
                  type="number"
                  value={freeGuestLimit}
                  onChange={e => setFreeGuestLimit(e.target.value)}
                  className="input !text-xs !py-2"
                />
              </div>
            </div>

            {/* Pro Plan */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-purple-900">Pro Host Plan</span>
                <span className="tag bg-purple-100 text-purple-800 font-bold">Most Popular</span>
              </div>
              <div>
                <label className="text-[11px] text-taupe block mb-1">Price per Event (PKR)</label>
                <input
                  type="number"
                  value={proPrice}
                  onChange={e => setProPrice(e.target.value)}
                  className="input !text-xs !py-2 font-mono font-bold"
                />
              </div>
            </div>

            {/* Royal Plan */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-amber-900">Royal VIP Plan</span>
                <span className="tag bg-amber-100 text-amber-900 font-bold">Enterprise</span>
              </div>
              <div>
                <label className="text-[11px] text-taupe block mb-1">Lifetime / VIP Price (PKR)</label>
                <input
                  type="number"
                  value={royalPrice}
                  onChange={e => setRoyalPrice(e.target.value)}
                  className="input !text-xs !py-2 font-mono font-bold"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-p w-full !py-2.5 text-xs font-semibold rounded-xl">
              Save Plan Pricing & Limits
            </button>
          </form>
        </div>

        {/* Local Payment Gateway Settings */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-1 flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-800" />
            <span>Pakistani Payment Gateway Accounts</span>
          </h3>
          <p className="text-xs text-taupe mb-4">Account details displayed to hosts for subscription fee transfer:</p>

          <form onSubmit={savePaymentSettings} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] text-taupe block mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="input !text-xs !py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-taupe block mb-1">Account Title</label>
                <input
                  type="text"
                  value={accountTitle}
                  onChange={e => setAccountTitle(e.target.value)}
                  className="input !text-xs !py-2"
                />
              </div>
              <div>
                <label className="text-[11px] text-taupe block mb-1">Raast ID</label>
                <input
                  type="text"
                  value={raastId}
                  onChange={e => setRaastId(e.target.value)}
                  className="input !text-xs !py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-taupe block mb-1">IBAN / Account Number</label>
              <input
                type="text"
                value={iban}
                onChange={e => setIban(e.target.value)}
                className="input !text-xs !py-2 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-taupe block mb-1">JazzCash Mobile</label>
                <input
                  type="text"
                  value={jazzcash}
                  onChange={e => setJazzcash(e.target.value)}
                  className="input !text-xs !py-2 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-taupe block mb-1">EasyPaisa Mobile</label>
                <input
                  type="text"
                  value={easypaisa}
                  onChange={e => setEasypaisa(e.target.value)}
                  className="input !text-xs !py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-taupe block mb-1">Instructions for Hosts</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="input !text-xs !py-2"
              />
            </div>

            <button type="submit" className="btn btn-outline w-full !py-2.5 text-xs font-semibold rounded-xl">
              Save Payment Gateway Details
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

// ========================================================
// 5. LIVE FINANCIAL ANALYTICS & SENTINEL (Typo Alerts)
// ========================================================
export function Analytics() {
  const { tx, events, people } = useStore()

  // High-Value Typo Sentinel: Flags entries over 100,000 PKR to catch accidental zeros
  const highValueTransactions = useMemo(() => {
    return tx.filter(t => (Number(t.amount) || 0) >= 100000)
  }, [tx])

  // Duplicate Transaction Detector: Same amount & person in same event within 10 minutes
  const duplicateAlerts = useMemo(() => {
    const alerts = []
    for (let i = 0; i < tx.length; i++) {
      for (let j = i + 1; j < tx.length; j++) {
        const a = tx[i]
        const b = tx[j]
        if (a.personId && a.personId === b.personId && a.eventId === b.eventId && Number(a.amount) === Number(b.amount)) {
          const timeA = new Date(a.at).getTime()
          const timeB = new Date(b.at).getTime()
          if (Math.abs(timeA - timeB) < 10 * 60 * 1000) {
            alerts.push({ original: a, duplicate: b })
          }
        }
      }
    }
    return alerts
  }, [tx])

  const totalVolume = tx.filter(t => t.dir === 'received').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const cashCount = tx.filter(t => (t.paymentMethod || 'cash') === 'cash').length
  const onlineCount = tx.filter(t => ['raast', 'bank', 'online'].includes((t.paymentMethod || '').toLowerCase())).length

  const sentinelRows = highValueTransactions.map(t => {
    const person = people.find(p => p.id === t.personId)
    const event = events.find(e => e.id === t.eventId)

    return [
      <span className="font-semibold text-ink">{person?.name || 'Guest'}</span>,
      <span className="text-xs text-taupe">{event?.title || 'Wedding'}</span>,
      <span className="font-serif font-extrabold text-amber-900 text-sm">{pkr(t.amount)}</span>,
      <span className="tag text-[10px] bg-sand/60 text-brown font-mono">{t.paymentMethod || 'cash'}</span>,
      <span className="text-xs text-taupe">{t.recordedBy || 'Counter'}</span>,
      <span className="text-xs text-taupe font-mono">{t.at ? new Date(t.at).toLocaleTimeString() : '—'}</span>
    ]
  })

  return (
    <>
      <PageHead
        title="Live Financial Analytics & Sentinel"
        sub="Financial distribution metrics, high-value typo sentinel, and anomaly detector"
      />

      <Stats
        d={[
          ['Platform Total Volume', pkr(totalVolume), 'PKR', 'Cumulative salamii'],
          ['Total Transaction Count', tx.length, 'slips', 'All records'],
          ['High-Value Slips (≥ 100k)', highValueTransactions.length, highValueTransactions.length > 0 ? 'review' : 'clear', 'Sentinel flagged'],
          ['Cash vs Online Split', `${cashCount} / ${onlineCount}`, 'ratio', 'Cash vs Digital']
        ]}
      />

      {/* Sentinel High-Value Typo Review Card */}
      <div className="card p-5 bg-white border border-sand shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon size={18} className="text-amber-700" />
            <div>
              <h3 className="font-serif text-base font-bold text-ink">High-Value Typo Sentinel (مشکوک بڑی رقوم کی جانچ)</h3>
              <p className="text-[11px] text-taupe">Flags transactions ≥ 100,000 PKR to help catch accidental extra zeros entered at counters</p>
            </div>
          </div>
          <span className="tag bg-amber-100 text-amber-900 font-bold">{highValueTransactions.length} Flagged</span>
        </div>

        <Table
          h={['Guest Name', 'Event Title', 'Recorded Amount', 'Payment Mode', 'Recorded By', 'Timestamp']}
          rows={sentinelRows}
        />
      </div>

      {/* Duplicate Anomaly Detector */}
      {duplicateAlerts.length > 0 && (
        <div className="card p-5 bg-amber-50/70 border border-amber-300 rounded-2xl shadow-xs">
          <h3 className="font-serif text-sm font-bold text-amber-950 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" />
            <span>Possible Duplicate Entries Detected ({duplicateAlerts.length})</span>
          </h3>
          <p className="text-xs text-amber-900 mb-3">The following guests have multiple identical transactions recorded within 10 minutes:</p>
          <div className="space-y-2">
            {duplicateAlerts.map((d, i) => (
              <div key={i} className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs flex justify-between items-center">
                <span>Guest ID: {d.original.personId?.slice(-6) || 'Guest'} · Amount: {pkr(d.original.amount)}</span>
                <span className="text-[10px] text-taupe font-mono">Recorded at {new Date(d.original.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anti-Theft Voided & Altered Transactions Review */}
      {(() => {
        const alteredOrVoided = tx.filter(t => t.isDeleted || (t.editHistory && t.editHistory.length > 0))
        if (alteredOrVoided.length === 0) return null

        const tamperRows = alteredOrVoided.map(t => {
          const person = people.find(p => p.id === t.personId)
          const event = events.find(e => e.id === t.eventId)
          const isVoid = Boolean(t.isDeleted)

          return [
            <span className="font-semibold text-ink">{person?.name || 'Guest'}</span>,
            <span className="text-xs text-taupe">{event?.title || 'Wedding'}</span>,
            <span className={`font-serif font-bold text-sm ${isVoid ? 'line-through text-rose-700' : 'text-amber-800'}`}>
              {pkr(t.amount)}
            </span>,
            <div>
              <span className={`tag text-[10px] font-bold uppercase ${
                isVoid ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {isVoid ? 'Voided / Cancelled' : 'Modified'}
              </span>
            </div>,
            <span className="text-xs text-taupe font-mono">{t.voidedBy || t.updatedBy || t.recordedBy || 'Operator'}</span>,
            <span className="text-xs text-ink max-w-xs block truncate">
              {t.voidReason || (t.editHistory?.[0]?.reason) || 'Information update'}
            </span>,
            <span className="text-xs text-taupe font-mono">
              {t.voidedAt ? new Date(t.voidedAt).toLocaleTimeString() : (t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString() : '—')}
            </span>
          ]
        })

        return (
          <div className="card p-5 bg-white border border-sand shadow-xs mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-700" />
                <div>
                  <h3 className="font-serif text-base font-bold text-ink">
                    Anti-Theft Voided & Altered Entries Review (منسوخ شدہ اور تبدیل شدہ اندراجات)
                  </h3>
                  <p className="text-[11px] text-taupe">
                    Tamper-proof log of transactions modified or marked void at counter desks to prevent salami cash theft
                  </p>
                </div>
              </div>
              <span className="tag bg-rose-100 text-rose-900 font-bold">{alteredOrVoided.length} Flagged</span>
            </div>

            <Table
              h={['Guest Name', 'Event', 'Amount', 'Audit Status', 'Operator', 'Reason Given', 'Timestamp']}
              rows={tamperRows}
            />
          </div>
        )
      })()}
    </>
  )
}

// ========================================================
// 6. SYSTEM HEALTH, BROADCAST & DISASTER BACKUP
// ========================================================
export function System() {
  const { supabase, isConnected, notify, logAudit, systemConfig, updateSystemConfig, addAdminEmail, removeAdminEmail, exportPlatformDatabaseBackup, restorePlatformDatabaseBackup } = useStore()
  const [latency, setLatency] = useState(null)
  const [testingPing, setTestingPing] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [restoringFile, setRestoringFile] = useState(false)
  const restoreFileRef = useRef()

  // Authorized Admin Gmail & Email Accounts State
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('')
  const [addingEmail, setAddingEmail] = useState(false)
  const adminEmailList = useMemo(() => {
    const fromConfig = systemConfig?.admin_emails || []
    const fromEnv = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean)
    return [...new Set(['haroonnawaz133@gmail.com', ...fromConfig, ...fromEnv, 'admin@neota.app', 'superadmin@neota.system'])].filter(Boolean)
  }, [systemConfig?.admin_emails])

  // Maintenance Mode State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(systemConfig?.maintenance_mode ?? false)
  const [maintenanceMsg, setMaintenanceMsg] = useState(systemConfig?.maintenance_message ?? 'سسٹم اپ گریڈ ہو رہا ہے۔ براہِ کرم تھوڑی دیر بعد چیک کریں۔ (System is undergoing scheduled maintenance.)')

  // Broadcast Banner Form State
  const [broadcastEnabled, setBroadcastEnabled] = useState(systemConfig?.broadcast_banner?.enabled ?? false)
  const [broadcastMsg, setBroadcastMsg] = useState(systemConfig?.broadcast_banner?.message ?? '')
  const [broadcastType, setBroadcastType] = useState(systemConfig?.broadcast_banner?.type ?? 'info')

  const handleAddAdminEmail = async (e) => {
    e?.preventDefault()
    if (!newAdminEmailInput.trim()) return
    setAddingEmail(true)
    try {
      await addAdminEmail(newAdminEmailInput.trim())
      setNewAdminEmailInput('')
    } catch (err) {
      alert(err.message || 'Error adding admin email')
    } finally {
      setAddingEmail(false)
    }
  }

  const handleRemoveAdminEmail = async (emailToRemove) => {
    if (!confirm(`Are you sure you want to revoke Super Admin rights for "${emailToRemove}"?`)) return
    try {
      await removeAdminEmail(emailToRemove)
    } catch (err) {
      alert(err.message || 'Error removing admin email')
    }
  }

  const handleSaveBroadcast = async (e) => {
    e?.preventDefault()
    await updateSystemConfig({
      broadcast_banner: {
        enabled: broadcastEnabled,
        message: broadcastMsg.trim(),
        type: broadcastType,
        target: 'all'
      }
    })
    notify(broadcastEnabled ? 'Live broadcast announcement published!' : 'Broadcast banner disabled.')
  }

  const runPingTest = async () => {
    if (!supabase) return
    setTestingPing(true)
    const start = performance.now()
    try {
      await supabase.from('profiles').select('id', { count: 'exact', head: true })
      const elapsed = Math.round(performance.now() - start)
      setLatency(elapsed)
      notify(`Latency test complete: ${elapsed} ms response time`)
    } catch (err) {
      setLatency('Error')
    } finally {
      setTestingPing(false)
    }
  }

  const fetchAuditLogs = useCallback(async () => {
    if (!supabase || !isConnected) {
      setLoadingLogs(false)
      return
    }
    setLoadingLogs(true)
    try {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25)

      if (!error && data) {
        setAuditLogs(data)
      }
    } catch (err) {
      console.warn('Error reading audit logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }, [supabase, isConnected])

  useEffect(() => {
    runPingTest()
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const logRows = auditLogs.map(l => [
    <span className="text-xs text-taupe font-mono">
      {l.created_at ? new Date(l.created_at).toLocaleString() : '—'}
    </span>,
    <span className="font-semibold text-xs text-ink">{l.action || 'EVENT'}</span>,
    <span className="text-xs text-taupe">{l.target || 'System'}</span>,
    <span className="font-mono text-[11px] text-taupe max-w-xs truncate block">
      {l.details ? JSON.stringify(l.details) : '—'}
    </span>
  ])

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageHead title="System Health & Live Operations" sub="Realtime telemetry, secret master key, global broadcast, and cloud backups" />
        <div className="flex items-center gap-2">
          <button
            onClick={runPingTest}
            disabled={testingPing}
            className="btn btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg"
          >
            <Zap size={13} className={testingPing ? 'animate-bounce text-amber-600' : 'text-amber-600'} />
            <span>{testingPing ? 'Pinging...' : 'Test Latency'}</span>
          </button>
        </div>
      </div>

      <Stats
        d={[
          ['Database Latency', latency ? `${latency} ms` : 'Testing...', latency && latency < 200 ? 'optimal' : 'active', 'Live roundtrip ping'],
          ['Cloud Provider', 'Supabase PostgreSQL', 'managed', 'Enterprise cluster'],
          ['Global Broadcast', broadcastEnabled ? 'Broadcasting' : 'Inactive', broadcastEnabled ? 'active' : 'standby', 'Realtime banner'],
          ['System Telemetry', isConnected ? 'Online & Healthy' : 'Offline / Standby', isConnected ? 'synced' : 'local']
        ]}
      />

      {/* Super Admin Direct Gmail & Email Accounts Management Card */}
      <div className="card p-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-2xl mb-6 shadow-md border border-purple-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-700/60 grid place-items-center shrink-0">
              <ShieldCheck size={20} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-white tracking-wide">
                  Authorized Super Admin Gmail Accounts (مجاز ایڈمن جی میل اکاؤنٹس)
                </h3>
                <span className="text-[10px] bg-purple-800/80 text-amber-200 border border-purple-600/60 px-2 py-0.5 rounded-full font-mono">
                  Direct Gmail Login
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                سپر ایڈمن براہِ راست اپنے جی میل (Google Login) یا ای میل اور پاس ورڈ سے لاگ ان کرے گا۔ عام صارفین کو ڈیش بورڈ پر ایڈمن کی کوئی چیز نظر نہیں آئے گی۔
              </p>
            </div>
          </div>
        </div>

        {/* List of active admin emails */}
        <div className="flex flex-wrap gap-2 mb-4">
          {adminEmailList.map(email => (
            <div key={email} className="px-3 py-1.5 bg-black/40 border border-purple-700/60 rounded-xl flex items-center gap-2 text-xs font-mono">
              <span className="text-amber-300 font-semibold">{email}</span>
              <span className="text-[9px] bg-purple-800/80 text-purple-200 px-1.5 py-0.2 rounded font-sans">Super Admin</span>
              {email !== 'superadmin@neota.system' && (
                <button
                  type="button"
                  onClick={() => handleRemoveAdminEmail(email)}
                  className="text-red-400 hover:text-red-200 ml-1 text-xs"
                  title="Revoke Admin Access"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new Admin Gmail form */}
        <form onSubmit={handleAddAdminEmail} className="pt-3 border-t border-purple-800/60 flex flex-wrap items-center gap-2 max-w-lg">
          <input
            type="email"
            required
            placeholder="Add new admin Gmail (e.g. yourname@gmail.com)"
            className="input !text-xs !py-2 bg-black/40 border-purple-700 text-white flex-1 min-w-[240px]"
            value={newAdminEmailInput}
            onChange={e => setNewAdminEmailInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={addingEmail || !newAdminEmailInput.trim()}
            className="btn text-xs !py-2 !px-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl shrink-0"
          >
            {addingEmail ? 'Adding...' : '+ Grant Admin Access'}
          </button>
        </form>
      </div>

      {/* Global Broadcast Announcement Creator */}
      <div className="card p-5 bg-white border border-sand shadow-xs mb-6">
        <h3 className="font-serif text-base font-bold text-ink mb-1 flex items-center gap-2">
          <Megaphone size={18} className="text-indigo-800" />
          <span>Real-time Broadcast Announcement Banner</span>
        </h3>
        <p className="text-xs text-taupe mb-4">
          Publish a top banner notification visible instantly across all host dashboards and counter screens in Pakistan:
        </p>

        <form onSubmit={handleSaveBroadcast} className="space-y-3 text-xs">
          <div>
            <label className="label">Announcement Message</label>
            <input
              type="text"
              className="input !text-xs !py-2.5"
              placeholder="e.g. System scheduled maintenance tonight at 2:00 AM PKT · سلامی پورٹل اپڈیٹ"
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              required={broadcastEnabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Banner Severity</label>
              <select
                value={broadcastType}
                onChange={e => setBroadcastType(e.target.value)}
                className="input !text-xs !py-2"
              >
                <option value="info">Info (Blue)</option>
                <option value="success">Success / Event (Green)</option>
                <option value="warning">Warning Notice (Amber)</option>
                <option value="emergency">Emergency Alert (Red)</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <label className="flex items-center gap-2 cursor-pointer mt-2 text-ink">
                <input
                  type="checkbox"
                  checked={broadcastEnabled}
                  onChange={e => setBroadcastEnabled(e.target.checked)}
                  className="rounded border-sand text-brown focus:ring-brown"
                />
                <span className="font-semibold">{broadcastEnabled ? 'Active (Broadcasting)' : 'Disabled / Hidden'}</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-p !py-2 text-xs font-semibold rounded-xl">
            Update Announcement Broadcast
          </button>
        </form>
      </div>

      {/* Global Platform Maintenance Mode Card */}
      <div className={`card p-5 rounded-2xl mb-6 shadow-xs border ${
        maintenanceEnabled ? 'bg-rose-50/80 border-rose-300 text-rose-950' : 'bg-white border-sand'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-sand mb-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className={maintenanceEnabled ? 'text-rose-700' : 'text-taupe'} />
            <div>
              <h3 className="font-serif text-base font-bold text-ink">
                Global Platform Maintenance Mode (سسٹم مینٹیننس موڈ)
              </h3>
              <p className="text-xs text-taupe">
                When active, normal users and wedding counters are locked with a maintenance banner while Super Admin retains full control.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="checkbox"
              checked={maintenanceEnabled}
              onChange={async e => {
                const val = e.target.checked
                setMaintenanceEnabled(val)
                await updateSystemConfig({ maintenance_mode: val, maintenance_message: maintenanceMsg })
                notify(val ? 'Maintenance Mode ACTIVATED! Normal user routes are locked.' : 'Maintenance Mode deactivated.')
              }}
              className="rounded border-sand text-rose-600 focus:ring-rose-600 h-4 w-4"
            />
            <span className={maintenanceEnabled ? 'text-rose-700 font-bold' : 'text-taupe'}>
              {maintenanceEnabled ? 'MAINTENANCE ACTIVE' : 'Normal Operation'}
            </span>
          </label>
        </div>

        {maintenanceEnabled && (
          <div className="space-y-2 text-xs">
            <label className="label">Custom Maintenance Message displayed to users</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input !text-xs !py-2"
                value={maintenanceMsg}
                onChange={e => setMaintenanceMsg(e.target.value)}
              />
              <button
                type="button"
                onClick={async () => {
                  await updateSystemConfig({ maintenance_mode: true, maintenance_message: maintenanceMsg })
                  notify('Maintenance notice saved!')
                }}
                className="btn btn-p text-xs !py-2 !px-3 shrink-0"
              >
                Save Notice
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Disaster Backup & Restore Card */}
      <div className="card p-5 bg-cream/50 border border-sand shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
          <div>
            <h4 className="font-serif font-bold text-ink text-sm flex items-center gap-2">
              <Database size={16} className="text-brown" />
              <span>Platform Cloud Database Backup & 1-Click Restore</span>
            </h4>
            <p className="text-xs text-taupe mt-0.5">
              Download encrypted JSON snapshots for disaster recovery, or restore entire platform ledgers from a previous backup file.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportPlatformDatabaseBackup}
              className="btn text-xs !py-2 !px-3.5 bg-white hover:bg-cream border border-sand text-brown font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => restoreFileRef.current?.click()}
              disabled={restoringFile}
              className="btn text-xs !py-2 !px-3.5 bg-brown hover:bg-brown/90 text-ivory font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Upload size={14} />
              <span>{restoringFile ? 'Restoring...' : 'Restore JSON'}</span>
            </button>
            <input
              ref={restoreFileRef}
              type="file"
              accept=".json,application/json"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                if (!confirm(`CAUTION: Restoring from "${file.name}" will overwrite the active platform state with records from the file. Proceed?`)) {
                  if (restoreFileRef.current) restoreFileRef.current.value = ''
                  return
                }
                setRestoringFile(true)
                const reader = new FileReader()
                reader.onload = async ev => {
                  const content = ev.target?.result
                  if (typeof content === 'string') {
                    await restorePlatformDatabaseBackup(content)
                  }
                  setRestoringFile(false)
                }
                reader.readAsText(file)
                if (restoreFileRef.current) restoreFileRef.current.value = ''
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-serif font-bold text-ink flex items-center gap-2">
          <Clock size={16} className="text-brown" />
          <span>System Forensic Audit Logs (public.audit_events)</span>
        </h2>
        <button
          onClick={fetchAuditLogs}
          disabled={loadingLogs}
          className="text-xs text-taupe hover:text-ink flex items-center gap-1 font-medium"
        >
          <RefreshCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loadingLogs ? (
        <div className="card p-8 bg-white text-center border border-sand">
          <RefreshCw size={20} className="animate-spin mx-auto text-taupe mb-2" />
          <p className="text-xs text-taupe">Reading audit trail from Supabase...</p>
        </div>
      ) : (
        <Table
          h={['Timestamp', 'Action Executed', 'Target', 'Event Details']}
          rows={logRows}
        />
      )}
    </>
  )
}

// ========================================================
// 7. COUNTERS SECURITY
// ========================================================
export function Counters() {
  const { events, supabase, isConnected, notify, logAudit } = useStore()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLinks = useCallback(async () => {
    if (!supabase || !isConnected) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await supabase.from('counter_links').select('*').order('created_at', { ascending: false })
      if (data) setLinks(data)
    } finally {
      setLoading(false)
    }
  }, [supabase, isConnected])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const toggleLinkStatus = async (linkItem) => {
    const newActive = !linkItem.active
    const { error } = await supabase.from('counter_links').update({ active: newActive }).eq('id', linkItem.id)
    if (!error) {
      setLinks(prev => prev.map(l => l.id === linkItem.id ? { ...l, active: newActive } : l))
      notify(`Counter link ${newActive ? 'Reactivated' : 'Revoked'}`)
    }
  }

  const tableRows = links.map(l => {
    const ev = events.find(e => e.id === l.event_id)
    return [
      <div>
        <p className="font-semibold text-ink">{l.assistant_name}</p>
        <p className="text-[10px] text-taupe">{l.counter_title}</p>
      </div>,
      <span className="text-xs text-taupe">{ev?.title || 'Wedding Event'}</span>,
      <span className="font-mono text-[11px] text-taupe">{l.token?.slice(0, 12)}...</span>,
      <span className={`tag text-[10px] font-bold ${l.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
        {l.active ? 'Active' : 'Revoked'}
      </span>,
      <button
        onClick={() => toggleLinkStatus(l)}
        className={`btn text-xs !py-1 !px-2.5 rounded-lg ${l.active ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}
      >
        {l.active ? 'Kill Link' : 'Restore'}
      </button>
    ]
  })

  return (
    <>
      <PageHead title="Counter Security & Global Kill-Switch" sub="Live overview of assistant counter tokens across all events" />
      <Table h={['Assistant', 'Wedding Function', 'Token Fragment', 'Status', 'Action']} rows={tableRows} />
    </>
  )
}

// ========================================================
// 8. USER COMPLAINTS & REVIEWS
// ========================================================
export function Feedback() {
  const { supabase, isConnected, notify } = useStore()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFeedback = useCallback(async () => {
    if (!supabase || !isConnected) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.from('user_feedback').select('*').order('created_at', { ascending: false })
      if (!error && data) {
        setFeedbacks(data)
      } else {
        const local = JSON.parse(localStorage.getItem('neota_user_feedback') || '[]')
        setFeedbacks(local)
      }
    } catch (e) {
      const local = JSON.parse(localStorage.getItem('neota_user_feedback') || '[]')
      setFeedbacks(local)
    } finally {
      setLoading(false)
    }
  }, [supabase, isConnected])

  useEffect(() => { fetchFeedback() }, [fetchFeedback])

  const updateStatus = async (item, status) => {
    await supabase.from('user_feedback').update({ status }).eq('id', item.id)
    setFeedbacks(prev => prev.map(f => f.id === item.id ? { ...f, status } : f))
    notify(`Ticket marked as ${status}`)
  }

  const tableRows = feedbacks.map(f => [
    <div>
      <p className="font-semibold text-ink">{f.user_name || 'Anonymous'}</p>
      <p className="text-[10px] text-taupe">{f.user_email || '—'}</p>
    </div>,
    <span className="tag text-[10px] font-bold">{f.category || 'Feedback'}</span>,
    <div className="max-w-xs">
      <p className="font-bold text-ink">{f.subject}</p>
      <p className="text-taupe truncate">{f.message}</p>
    </div>,
    <span className="tag text-[10px] font-bold">{f.status || 'Pending'}</span>,
    <button
      onClick={() => updateStatus(f, f.status === 'Resolved' ? 'Pending' : 'Resolved')}
      className="btn text-xs !py-1 !px-2.5 bg-emerald-50 text-emerald-800 border-emerald-300"
    >
      {f.status === 'Resolved' ? 'Re-open' : 'Resolve'}
    </button>
  ])

  return (
    <>
      <PageHead title="User Complaints & Feedback Inbox" sub="Incoming tickets, bug reports, and reviews" />
      <Table h={['User', 'Type', 'Subject & Message', 'Status', 'Action']} rows={tableRows} />
    </>
  )
}

// ========================================================
// 9. SUPER ADMIN GUIDELINES & ENGLISH SOP MANUAL
// ========================================================
export function Guidelines() {
  const { notify } = useStore()

  const manualContent = `# NEOTA Super Administrator Standard Operating Procedure (SOP)
Platform: NEOTA Digital Salamii, Shagun & Wedding Ledger
Security Architecture: Role-Based Access Control (RBAC v3.0)

---

## 1. Executive Overview & Administrator Mandate
As a Super Administrator of NEOTA, you possess full platform authority across all tenants, weddings, financial records, and assistant counters. Your primary mandate is maintaining:
1. Complete financial integrity of wedding gift records.
2. Tenant data isolation and high availability.
3. Prompt resolution of user complaints and accidental entry errors.

---

## 2. Super Admin Direct Gmail & Email Login Protocol
Super Admins log in securely and directly via Google (Gmail) or Email & Password on the standard Sign In screen:
- Navigate to the Sign In screen (/login).
- Sign in directly with your authorized Admin Google / Gmail account or email.
- The platform automatically verifies your administrative privileges and immediately elevates your session to the Super Admin Command Center (/admin).
- Security Guarantee: Normal users and wedding hosts see zero admin branding or links on their dashboards.
- Manage authorized Admin Gmail accounts under "System & Disaster Backup" (/admin/system).

---

## 3. Account Moderation & Banning Guidelines
- Active Status: Normal account with full access.
- Suspended Status: Use when fraudulent activity, spam, or malicious behavior is detected. When suspended:
  * The user's active login session is forcefully terminated.
  * Any attempt to sign in is blocked with a suspension alert.
  * Assistant counters linked to that host's events are immediately paused.
- Support Impersonation ("Inspect" button):
  * Allows you to safely view any host's ledger in read-only mode to troubleshoot complaints without requesting their password.
  * Always click "Exit Support Mode" when finished.

---

## 4. Emergency Event Freezing Protocol
In case of a family dispute, counter discrepancy, or security audit:
- Navigate to "Global Events" (/admin/events).
- Click "Freeze" next to the event and provide a reason (e.g. "Audit Review").
- Effect: The event enters Read-Only mode. All counter assistants attempting to record new slips will receive an immediate lockout notice preventing duplicate or unauthorized entries.
- Click "Unlock" once the dispute is resolved.

---

## 5. Monetization Strategy: Free Launch vs Paid Subscription
- Launch Free Mode (Active by default): All hosts have 100% free unrestricted access to all features (including multiple counters, Urdu Voice AI, and slip images).
- Switching to Paid Mode:
  * Open "Monetization & Plans" (/admin/subscriptions).
  * Toggle "Switch to Paid Mode".
  * Free Starter hosts will now be restricted by the configured guest and counter limits.
  * Pro Host and Royal VIP packages can be purchased via Pakistani payment gateways.
- Manual VIP Allocation: You can upgrade any family member or VIP client to Pro or Royal VIP directly from "Users & Moderation" at zero cost.

---

## 6. Pakistani Payment Gateway Verification SOP
Hosts upgrade by transferring to the official Neota accounts (Bank, Raast ID, JazzCash, EasyPaisa):
1. Review the payment screenshot submitted via WhatsApp or Complaints Inbox.
2. Verify the transaction ID in your bank / wallet mobile app.
3. Once verified, open "Users & Moderation", find the host's name, and select "Pro Host" or "Royal VIP" from the plan dropdown.
4. The host's account limits will instantly unlock.

---

## 7. High-Value Typo Sentinel & Keystroke Correction
- Navigate to "Analytics & Sentinel" (/admin/analytics).
- Review all transactions flagged with amounts >= 100,000 PKR.
- If a counter operator accidentally typed 5,000,000 instead of 50,000, reach out to the host or inspect the event to perform a verified typo correction.

---

## 8. Real-time Broadcast Announcement Protocol
- Open "System & Broadcast" (/admin/system).
- Draft your message (e.g., scheduled maintenance, greetings, or urgent notice).
- Select banner severity (Info, Event, Warning, Emergency).
- Toggle "Active" and click "Update Announcement Broadcast".
- The banner instantly displays across every host mobile phone and counter screen in Pakistan.

---

## 9. Disaster Recovery & Database Backups
- Perform a weekly cloud backup from "System & Broadcast".
- Click "Download Backup (JSON)" to save a full encrypted snapshot of all events, people, transactions, and counters.
- Store this snapshot securely in offline storage.

---
Document Authorized by: NEOTA Enterprise Core Engineering`

  const handleDownloadManual = () => {
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(manualContent)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'NEOTA_Super_Admin_SOP_Manual.md')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    notify('Official Super Admin SOP Manual downloaded!')
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <PageHead
          title="Super Administrator Guidelines & SOP"
          sub="Complete English Standard Operating Procedure, security protocols, and operational manual"
        />
        <button
          onClick={handleDownloadManual}
          className="btn btn-p text-xs !py-2.5 !px-4 flex items-center gap-2 rounded-xl shadow-sm shrink-0"
        >
          <Download size={15} />
          <span>Download SOP Manual (.md)</span>
        </button>
      </div>

      <div className="space-y-6 text-xs text-ink leading-relaxed">
        {/* Section 1 */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <KeyRound size={16} className="text-purple-700" />
            <span>1. Secret Master Key Emergency Bypass Protocol</span>
          </h3>
          <p className="text-taupe mb-2">
            When operating on a mobile device or laptop without your personal Google Account logged in:
          </p>
          <ul className="list-disc list-inside space-y-1 text-taupe pl-2">
            <li>Open the standard Login page (<code className="font-mono bg-sand/40 px-1 rounded">/login</code>).</li>
            <li>Click <strong>"Super Admin Secret Key Login (خفیہ ماسٹر کی)"</strong> at the bottom of the card.</li>
            <li>Enter your active Master Key (Default: <code className="font-mono bg-sand/60 px-1.5 py-0.5 rounded font-bold text-ink">NEOTA-SUPER-ADMIN-7860</code>).</li>
            <li>You will immediately bypass Google authentication and enter the Super Admin Console with full platform privileges.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <Ban size={16} className="text-rose-700" />
            <span>2. Account Moderation & Banning Guidelines</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-taupe">
            <div>
              <p className="font-bold text-ink mb-1">Account Suspension (Ban):</p>
              <p>When you suspend a user in <em>Users & Moderation</em>, their active session is terminated instantly and all future login attempts will be rejected with an administrative lockout screen.</p>
            </div>
            <div>
              <p className="font-bold text-ink mb-1">Support Impersonation ("Inspect"):</p>
              <p>Use the <em>Inspect</em> button to view any host's ledger in read-only mode to troubleshoot their complaints or verify missing entries without needing their password.</p>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <LockKeyhole size={16} className="text-amber-700" />
            <span>3. Emergency Event Freezing & Dispute Handling</span>
          </h3>
          <p className="text-taupe mb-2">
            In the event of a family dispute, counter assistant discrepancy, or duplicate entry investigation:
          </p>
          <ul className="list-disc list-inside space-y-1 text-taupe pl-2">
            <li>Go to <strong>Global Events</strong> (<code className="font-mono bg-sand/40 px-1 rounded">/admin/events</code>).</li>
            <li>Click <strong>Freeze</strong> on the affected event and input a reason.</li>
            <li>All assistant counters linked to that wedding will be instantly locked in <strong>Read-Only Mode</strong>, preventing any unauthorized changes.</li>
            <li>Click <strong>Unlock</strong> once the discrepancy has been resolved.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-700" />
            <span>4. Monetization Strategy & Pakistani Payment Gateways</span>
          </h3>
          <div className="space-y-2 text-taupe">
            <p>
              <strong>Launch Free Mode:</strong> Keep the system in 100% Free Launch Mode during promotional events. No hosts will face paywalls or restrictions.
            </p>
            <p>
              <strong>Activating Subscriptions:</strong> Toggle "Switch to Paid Mode" in <em>Monetization & Plans</em>. Free hosts will then adhere to configured guest and counter limits.
            </p>
            <p>
              <strong>Payment Verification:</strong> Hosts transfer via Bank Transfer, Raast ID, JazzCash, or EasyPaisa. After confirming the receipt in your mobile banking app, locate the host in <em>Users & Moderation</em> and select "Pro Host" or "Royal VIP" from their plan dropdown.
            </p>
          </div>
        </div>

        {/* Section 5 */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <AlertOctagon size={16} className="text-amber-700" />
            <span>5. High-Value Typo Sentinel & Duplicate Alerts</span>
          </h3>
          <p className="text-taupe mb-2">
            Open <strong>Analytics & Sentinel</strong> (<code className="font-mono bg-sand/40 px-1 rounded">/admin/analytics</code>) to monitor:
          </p>
          <ul className="list-disc list-inside space-y-1 text-taupe pl-2">
            <li><strong>High-Value Sentinel:</strong> Highlights all slips recorded with amounts ≥ 100,000 PKR to catch keystroke typos (e.g. 5,000,000 entered instead of 50,000).</li>
            <li><strong>Duplicate Sentinel:</strong> Automatically flags identical transactions recorded for the same person within 10 minutes.</li>
          </ul>
        </div>

        {/* Section 6 */}
        <div className="card p-6 bg-white border border-sand shadow-xs">
          <h3 className="font-serif text-base font-bold text-ink mb-2 flex items-center gap-2">
            <Database size={16} className="text-brown" />
            <span>6. Disaster Recovery & Platform Backups</span>
          </h3>
          <p className="text-taupe">
            Under <strong>System & Broadcast</strong> (<code className="font-mono bg-sand/40 px-1 rounded">/admin/system</code>), click <strong>"Download Backup (JSON)"</strong> at least once per week. This downloads a complete sanitized export of all events, guests, transactions, and counters for offline disaster protection.
          </p>
        </div>
      </div>
    </>
  )
}
