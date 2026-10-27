import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import { Login, SignUp, Forgot, UpdatePassword } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import { Events, EventForm } from './pages/Events'
import Guests from './pages/Guests'
import QuickEntry from './pages/QuickEntry'
import { People, Profile } from './pages/People'
import Reports from './pages/Reports'
import { AdminLayout, Overview, Approvals, Users, Counters, Feedback, Analytics, Subs, System, EventsInspector, Guidelines } from './pages/Admin'
import EventDetail from './pages/EventDetail'
import Returns from './pages/Returns'
import Settings from './pages/Settings'
import CounterEntry from './pages/CounterEntry'
import CountersManager from './pages/CountersManager'
import PublicInvite from './pages/PublicInvite'

// Protected route guard: waits for session restoration to avoid double-login race conditions
const Guard = ({ admin, children }) => {
  const { auth, authLoading, systemConfig } = useStore()
  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-3 border-brown border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-taupe font-serif">Verifying secure session…</span>
        </div>
      </div>
    )
  }

  // Global Maintenance Mode Guard: Protects live database during system migrations
  if (systemConfig?.maintenance_mode && !auth.admin) {
    return (
      <div className="min-h-screen bg-ivory grid place-items-center p-5 text-center animate-fade-in">
        <div className="max-w-md w-full card p-8 bg-white border border-sand shadow-xl rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 grid place-items-center mx-auto mb-4 text-2xl font-bold shadow-xs">
            🛠️
          </div>
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Scheduled Maintenance</h2>
          <p className="text-xs text-taupe leading-relaxed mb-6 font-serif">
            {systemConfig?.maintenance_message || 'سسٹم اپ گریڈ ہو رہا ہے۔ براہِ کرم تھوڑی دیر بعد چیک کریں۔'}
          </p>
          <div className="p-3 bg-cream/60 rounded-xl text-[11px] text-taupe border border-sand/80">
            <span>NEOTA Platform engineers are conducting routine upgrades. All ledger records are 100% secure.</span>
          </div>
        </div>
      </div>
    )
  }

  return !auth.in || (admin && !auth.admin) ? <Navigate to="/login" replace /> : children
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<SignUp />} /><Route path="/forgot-password" element={<Forgot />} />
    <Route path="/update-password" element={<UpdatePassword />} />
    <Route path="/counter" element={<CounterEntry />} />
    <Route path="/invite/:id" element={<PublicInvite />} />
    <Route element={<Guard><Layout /></Guard>}>
      <Route path="/app" element={<Dashboard />} /><Route path="/app/events" element={<Events />} />
      <Route path="/app/events/new" element={<EventForm />} /><Route path="/app/events/:id/edit" element={<EventForm />} />
      <Route path="/app/guests" element={<Guests />} /><Route path="/app/people" element={<People />} /><Route path="/app/people/:id" element={<Profile />} />
      <Route path="/app/reports" element={<Reports />} /><Route path="/app/settings" element={<Settings />} />
      <Route path="/app/events/:id" element={<EventDetail />} /><Route path="/app/returns" element={<Returns />} />
      <Route path="/app/counters" element={<CountersManager />} />
      <Route path="/app/events/:id/counters" element={<CountersManager />} />
    </Route>
    <Route path="/admin" element={<Guard admin><AdminLayout /></Guard>}>
      <Route index element={<Overview />} />
      <Route path="approvals" element={<Approvals />} />
      <Route path="users" element={<Users />} />
      <Route path="events" element={<EventsInspector />} />
      <Route path="counters" element={<Counters />} />
      <Route path="subscriptions" element={<Subs />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="system" element={<System />} />
      <Route path="feedback" element={<Feedback />} />
      <Route path="guidelines" element={<Guidelines />} />
    </Route>
    <Route path="/app/quick-entry" element={<Guard><QuickEntry /></Guard>} />
  </Routes>
}
