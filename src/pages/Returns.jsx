import { useState } from 'react'
import { Undo2, History, Trash2, ArrowUpRight, Check, Send, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { pkr, generateWhatsAppLink } from '../data'
import { PageHead } from '../components/Layout'
import AIBadlaModal from '../components/AIBadlaModal'

export default function Returns() {
  const { events, people, tx, saveTx, deleteTx, activeEvent, t } = useStore()
  const [f, setF] = useState({ eventId: activeEvent || events[0]?.id || '', personId: '', amount: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showAIModal, setShowAIModal] = useState(false)

  const rows = tx.filter(t => t.dir === 'returned')
  const set = k => e => setF({ ...f, [k]: e.target.value })

  // Calculate prior received for selected person
  const selectedPerson = people.find(p => p.id === f.personId)
  const priorReceived = f.personId
    ? tx.filter(t => t.personId === f.personId && t.dir === 'received')
    : []
  const priorReturned = f.personId
    ? tx.filter(t => t.personId === f.personId && t.dir === 'returned')
    : []
  const totalReceivedFromPerson = priorReceived.reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const totalReturnedToPerson = priorReturned.reduce((s, t) => s + (Number(t.amount) || 0), 0)

  const submit = async e => {
    e.preventDefault()
    if (busy || !f.personId || !(Number(f.amount) > 0)) return
    setBusy(true)
    setMsg(null)

    try {
      await saveTx({
        eventId: f.eventId,
        personId: f.personId,
        amount: Number(f.amount),
        dir: 'returned',
        note: f.note
      })

      const ev = events.find(x => x.id === f.eventId)
      setMsg({
        ok: true,
        t: `Return of ${pkr(f.amount)} recorded for ${selectedPerson?.name}.`,
        waLink: generateWhatsAppLink(selectedPerson?.phone, selectedPerson?.name, ev?.title || 'Function', f.amount, 'cash', '')
      })
      setF({ ...f, personId: '', amount: '', note: '' })
    } catch {
      setMsg({ ok: false, t: 'Could not save return record. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead
        title={t('returns')}
        sub="Gifts and salamii you return (بدلہ / واپسی) at others' family weddings. Kept distinct from received ledger."
      />

      {/* Return Form */}
      <form onSubmit={submit} className="card p-5 md:p-6 mb-6 shadow-sm border border-sand bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif text-lg text-ink flex items-center gap-2">
              <ArrowUpRight size={18} className="text-brown" />
              <span>Record a Gift Return</span>
            </h3>
            <span className="text-[11px] text-taupe font-serif block ml-6">واپسی نیوتا و سلامی کا اندراج</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            className="btn text-xs py-1.5 px-3 border border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-900 flex items-center gap-1.5 shadow-sm font-semibold rounded-xl transition"
          >
            <Sparkles size={14} className="text-purple-600 animate-pulse" />
            <span>AI Badla & Inflation Predictor 🤖</span>
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4 items-end">
          <div>
            <label className="label">Event / Occasion</label>
            <select className="input font-medium" value={f.eventId} onChange={set('eventId')}>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Family Member / Guest</label>
            <select className="input font-medium" required value={f.personId} onChange={set('personId')}>
              <option value="">Select person…</option>
              {[...people]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.fatherName ? `s/o ${p.fatherName}` : ''} ({p.relation || 'Relative'})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="label">{t('amountPKR')}</label>
            <input
              className="input font-serif text-lg"
              inputMode="numeric"
              required
              placeholder="0"
              value={f.amount}
              onChange={e => setF({ ...f, amount: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div>
            <label className="label">Note / Purpose (e.g. Son's Barat)</label>
            <input
              className="input"
              placeholder="e.g. Return on their daughter wedding"
              value={f.note}
              onChange={set('note')}
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-3 mt-2">
            <button className="btn btn-p" disabled={busy}>
              <Undo2 size={16} />
              <span>{busy ? 'Saving…' : 'Record Return Gift'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Reciprocity Intelligence Banner for Selected Person */}
        {selectedPerson && (
          <div className="mt-4 rounded-xl border border-sand bg-cream/40 p-3.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-semibold text-ink">
                <History size={14} className="text-brown" />
                <span>Prior Neota History for {selectedPerson.name}:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(true)}
                className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
              >
                <Sparkles size={12} />
                <span>Calculate with AI Inflation</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-taupe mt-1">
              <span>They gave to us previously: <b className="text-sage">{pkr(totalReceivedFromPerson)}</b></span>
              <span>We already returned to them: <b className="text-brown">{pkr(totalReturnedToPerson)}</b></span>
              <span>
                Net Balance: <b className="text-ink">{pkr(totalReceivedFromPerson - totalReturnedToPerson)}</b>
                {totalReceivedFromPerson > totalReturnedToPerson
                  ? ' (We owe a return)'
                  : totalReceivedFromPerson === totalReturnedToPerson
                  ? ' (Balanced)'
                  : ' (We have given more)'}
              </span>
            </div>
            {totalReceivedFromPerson > totalReturnedToPerson && (
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setF({ ...f, amount: String(totalReceivedFromPerson - totalReturnedToPerson) })}
                  className="text-[11px] underline text-brown hover:text-ink font-medium"
                >
                  Auto-fill exact historic balance: {pkr(totalReceivedFromPerson - totalReturnedToPerson)}
                </button>
                <span className="text-taupe text-[10px]">·</span>
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="text-[11px] underline text-purple-700 hover:text-purple-900 font-medium"
                >
                  View inflation-adjusted Badla (AI recommendation)
                </button>
              </div>
            )}
          </div>
        )}

        {msg && (
          <div className={`mt-3 flex items-center justify-between rounded-lg p-3 text-xs ${msg.ok ? 'bg-sage-light text-sage border border-sage/40' : 'bg-red-50 text-red-900 border border-red-200'}`}>
            <span>{msg.t}</span>
            {msg.waLink && (
              <a href={msg.waLink} target="_blank" rel="noreferrer" className="underline font-semibold flex items-center gap-1">
                <Send size={12} />
                <span>Send WhatsApp notice</span>
              </a>
            )}
          </div>
        )}
      </form>

      {/* Returns History List */}
      <div className="card divide-y divide-sand shadow-sm border border-sand bg-white/90">
        <div className="p-4 bg-cream/30 font-medium text-sm flex justify-between items-center">
          <span>All Return Records ({rows.length})</span>
          <span className="text-xs text-taupe">Total Returned: <b>{pkr(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0))}</b></span>
        </div>

        {rows.map(t => {
          const person = people.find(p => p.id === t.personId)
          const ev = events.find(e => e.id === t.eventId)
          return (
            <div key={t.id} className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-cream/20 transition">
              <div>
                <span className="font-medium text-ink">{person?.name || 'Unknown'}</span>
                <span className="text-taupe text-xs">
                  {' '}· {ev?.title}{t.note ? ` · ${t.note}` : ''}
                </span>
                <span className="block text-[11px] text-taupe">{new Date(t.at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <b className="text-brown font-serif text-base">{pkr(t.amount)}</b>
                <button
                  onClick={() => {
                    if (confirm('Delete this return record?')) deleteTx(t.id)
                  }}
                  className="p-1 text-taupe hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}

        {!rows.length && (
          <p className="p-8 text-center text-sm text-taupe">No returns recorded yet.</p>
        )}
      </div>

      {/* AI Badla & Inflation Predictor Modal */}
      <AIBadlaModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplySuggestion={(personId, amt) => {
          if (personId) {
            setF(prev => ({ ...prev, personId, amount: String(amt) }))
          } else {
            setF(prev => ({ ...prev, amount: String(amt) }))
          }
        }}
      />
    </>
  )
}
