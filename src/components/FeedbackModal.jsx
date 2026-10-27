import { useState, useEffect } from 'react'
import {
  X, MessageSquareText, Star, Send, AlertTriangle, Lightbulb,
  Bug, Award, CheckCircle2, Clock, Check, ShieldCheck, RefreshCw
} from 'lucide-react'
import { useStore } from '../store'

export default function FeedbackModal({ isOpen, onClose }) {
  const { auth, submitFeedback, supabase, notify } = useStore()

  const [activeTab, setActiveTab] = useState('new') // 'new' | 'history'
  const [category, setCategory] = useState('complaint') // 'complaint' | 'suggestion' | 'review' | 'bug'
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState(auth.user?.name || '')
  const [email, setEmail] = useState(auth.user?.email || '')
  const [submitting, setSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState(null)

  // User's previous feedback list
  const [myTickets, setMyTickets] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (auth.user) {
      setName(prev => prev || auth.user.name || '')
      setEmail(prev => prev || auth.user.email || '')
    }
  }, [auth.user])

  const loadHistory = async () => {
    setLoadingHistory(true)
    if (supabase && auth.user?.id) {
      try {
        const { data } = await supabase
          .from('user_feedback')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })
        if (data) setMyTickets(data)
      } catch (e) {
        console.warn('History read note:', e)
      }
    } else {
      // Local fallback
      try {
        const local = JSON.parse(localStorage.getItem('neota_user_feedback') || '[]')
        setMyTickets(local)
      } catch (e) {}
    }
    setLoadingHistory(false)
  }

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory()
    }
  }, [isOpen, activeTab])

  if (!isOpen) return null

  const handleSubmit = async e => {
    e.preventDefault()
    if (!message.trim() || !subject.trim()) {
      alert('Please fill both Subject and Message before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const res = await submitFeedback({
        category,
        subject: subject.trim(),
        message: message.trim(),
        rating,
        userName: name.trim() || 'Anonymous Host',
        userEmail: email.trim()
      })

      setSubmittedTicket(res.data)
      setSubject('')
      setMessage('')
    } catch (err) {
      alert('Error submitting: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const categoryOptions = [
    { id: 'complaint', label: 'Complaint / مسئلہ یا شکایت', icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'bug', label: 'Bug Report / تکنیکی خرابی', icon: Bug, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'suggestion', label: 'Suggestion / نئی تجویز', icon: Lightbulb, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'review', label: 'Review / تعریف و تاثرات', icon: Award, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  ]

  const ratingLabels = ['', 'Poor (ناقص)', 'Fair (مناسب)', 'Good (بہتر)', 'Very Good (بہت اچھا)', 'Excellent (شاندار)']

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-sand text-ink">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sand mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brown text-ivory flex items-center justify-center">
              <MessageSquareText size={18} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-ink">
                Help, Complaints & Reviews <span className="font-sans text-xs text-taupe font-normal">(شکایات و رائے)</span>
              </h3>
              <p className="text-[11px] text-taupe">Directly reach the support & administration team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-cream text-taupe hover:text-ink transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-cream/50 rounded-xl border border-sand mb-4 text-xs font-medium">
          <button
            onClick={() => {
              setActiveTab('new')
              setSubmittedTicket(null)
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'new' ? 'bg-white shadow-xs font-bold text-brown' : 'text-taupe hover:text-ink'}`}
          >
            Submit Feedback (نئی شکایت / رائے)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'history' ? 'bg-white shadow-xs font-bold text-brown' : 'text-taupe hover:text-ink'}`}
          >
            My Past Tickets (سابقہ ریکارڈ)
          </button>
        </div>

        {/* Tab 1: Submit New Feedback */}
        {activeTab === 'new' && (
          <>
            {submittedTicket ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-300 text-center animate-fade-in space-y-3">
                <CheckCircle2 size={40} className="mx-auto text-emerald-700" />
                <h4 className="font-serif text-lg font-bold text-emerald-950">
                  Feedback Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed max-w-sm mx-auto">
                  آپ کی شکایت / رائے موصول ہو چکی ہے اور ایڈمن پینل کو ارسال کر دی گئی ہے۔
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs font-mono text-emerald-800 inline-block">
                  Ticket Reference ID: #{submittedTicket.id?.slice(0, 8).toUpperCase() || 'NEOTA-786'}
                </div>
                <div>
                  <button
                    onClick={() => {
                      setSubmittedTicket(null)
                      setActiveTab('history')
                    }}
                    className="btn btn-p text-xs py-2 px-5 shadow-xs"
                  >
                    View Status in My Tickets
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Category Selection */}
                <div>
                  <label className="label font-bold text-ink mb-1.5 block">Select Feedback Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map(opt => {
                      const Icon = opt.icon
                      const isSelected = category === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCategory(opt.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                            isSelected
                              ? 'border-brown bg-cream/70 font-bold text-brown shadow-xs'
                              : 'border-sand bg-white hover:bg-cream/20 text-taupe'
                          }`}
                        >
                          <Icon size={15} className={isSelected ? 'text-brown' : 'text-taupe'} />
                          <span className="text-[11px] leading-tight">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Star Rating */}
                <div className="p-3 bg-cream/30 rounded-xl border border-sand flex items-center justify-between">
                  <div>
                    <span className="label !text-xs font-bold text-ink block">Your Rating</span>
                    <span className="text-[10px] text-taupe">{ratingLabels[hoverRating || rating]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition"
                      >
                        <Star
                          size={20}
                          className={star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-500' : 'text-sand'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="label font-bold text-ink">Subject / عنوان *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Issue with QR code on Counter or Suggestion for Guest List"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="input !text-xs py-2"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="label font-bold text-ink">Detailed Message / تفصیل درج کریں *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your issue, experience, or feature request in detail..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="input !text-xs py-2 w-full resize-none"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label font-semibold text-taupe">Your Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your Name"
                      className="input !text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="label font-semibold text-taupe">Email (for reply)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="input !text-xs py-1.5"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-p w-full !py-2.5 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Review & Complaint (ارسال کریں)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Tab 2: My Submitted Tickets */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-taupe pb-1">
              <span>Your previous submissions and admin replies:</span>
              <button
                onClick={loadHistory}
                disabled={loadingHistory}
                className="hover:text-ink flex items-center gap-1 font-medium"
              >
                <RefreshCw size={11} className={loadingHistory ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-taupe">
                <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-taupe" />
                <span>Loading your tickets...</span>
              </div>
            ) : myTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-taupe bg-cream/30 rounded-xl border border-sand">
                <MessageSquareText size={28} className="mx-auto text-taupe/60 mb-2" />
                <p className="font-semibold text-ink">No tickets submitted yet</p>
                <p className="text-[11px] mt-0.5">Use the first tab to submit a complaint, review, or feature suggestion.</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                {myTickets.map(ticket => (
                  <div key={ticket.id} className="p-3 bg-white rounded-xl border border-sand shadow-xs text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink truncate pr-2">{ticket.subject}</span>
                      <span className={`tag text-[10px] font-bold shrink-0 ${
                        ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                        ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ticket.status || 'Pending'}
                      </span>
                    </div>

                    <p className="text-taupe leading-relaxed text-[11px]">{ticket.message}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-sand/50 text-[10px] text-taupe">
                      <span className="capitalize font-medium text-brown">Type: {ticket.category}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>

                    {ticket.admin_notes && (
                      <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 mt-1">
                        <b>Admin Response:</b> {ticket.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
