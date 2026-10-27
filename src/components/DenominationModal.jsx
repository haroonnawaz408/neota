import { useState } from 'react'
import { X, Check, Calculator, Printer, Copy, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Coins } from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'

const NOTES = [5000, 1000, 500, 100, 50, 20, 10]

export default function DenominationModal({ isOpen, onClose, eventId }) {
  const { events, tx, denominations, saveDenominations } = useStore()
  const event = events.find(e => e.id === eventId) || events[0]

  const saved = (denominations && denominations[event?.id]) || {}
  const [counts, setCounts] = useState({
    5000: saved[5000] || 0,
    1000: saved[1000] || 0,
    500: saved[500] || 0,
    100: saved[100] || 0,
    50: saved[50] || 0,
    20: saved[20] || 0,
    10: saved[10] || 0
  })
  const [copied, setCopied] = useState(false)

  if (!isOpen || !event) return null

  // Calculate Total Counted Physical Cash
  const physicalTotal = NOTES.reduce((sum, note) => {
    return sum + (note * (Number(counts[note]) || 0))
  }, 0)

  // Ledger Total Cash Received for this event
  const ledgerCashTotal = tx
    .filter(t => t.eventId === event.id && t.dir === 'received' && (!t.giftType || t.giftType === 'cash') && (!t.paymentMethod || t.paymentMethod === 'cash'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const variance = physicalTotal - ledgerCashTotal

  const handleCountChange = (note, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0)
    setCounts(prev => ({ ...prev, [note]: num }))
  }

  const handleSave = () => {
    saveDenominations(event.id, counts)
    onClose()
  }

  const generateTallyText = () => {
    const lines = NOTES.map(n => `Rs ${n} x ${counts[n] || 0} = ${pkr((counts[n] || 0) * n)}`)
    return `*NEOTA CASH DRAWER TALLY*\n` +
      `Event: ${event.title} (${event.date})\n` +
      `--------------------------------\n` +
      lines.join('\n') + '\n' +
      `--------------------------------\n` +
      `Total Physical Cash: ${pkr(physicalTotal)}\n` +
      `Total Ledger Cash: ${pkr(ledgerCashTotal)}\n` +
      `Difference (Variance): ${variance === 0 ? 'BALANCED ✓' : pkr(variance)}\n` +
      `Verified by Counter Incharge.`
  }

  const copyTally = async () => {
    await navigator.clipboard?.writeText(generateTallyText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 md:p-7 shadow-2xl relative border border-sand text-ink">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sand mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-sage-light text-sage flex items-center justify-center font-bold">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">Counter Cash Drawer Tally (کاؤنٹر کیش گنتی)</h2>
              <p className="text-xs text-taupe">{event.title} · Reconcile physical drawer cash vs ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cream text-taupe hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {/* Currency Denominations Grid */}
        <div className="space-y-2 mb-5 max-h-64 overflow-y-auto pr-1">
          {NOTES.map(note => {
            const count = counts[note] || 0
            const lineTotal = note * count
            return (
              <div key={note} className="flex items-center justify-between p-2.5 rounded-xl bg-cream/30 border border-sand text-xs">
                <div className="w-24 font-mono font-bold text-ink flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${note >= 1000 ? 'bg-brown/80' : 'bg-sage/80'}`} />
                  <span>Rs {note.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-taupe">x</span>
                  <input
                    type="number"
                    min="0"
                    value={count === 0 ? '' : count}
                    placeholder="0"
                    onChange={e => handleCountChange(note, e.target.value)}
                    className="input !w-24 text-center font-mono font-bold py-1 bg-white"
                  />
                  <span className="text-taupe">=</span>
                </div>

                <div className="w-28 text-right font-serif font-bold text-ink">
                  {pkr(lineTotal)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Reconciliation Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-ivory border border-sand mb-5 text-center text-xs">
          <div>
            <span className="text-[10px] text-taupe uppercase font-medium block">Physical Cash (تھیلی)</span>
            <b className="font-serif text-base text-ink mt-0.5 block">{pkr(physicalTotal)}</b>
          </div>

          <div>
            <span className="text-[10px] text-taupe uppercase font-medium block">Ledger Cash (اندراج)</span>
            <b className="font-serif text-base text-brown mt-0.5 block">{pkr(ledgerCashTotal)}</b>
          </div>

          <div>
            <span className="text-[10px] text-taupe uppercase font-medium block">Variance (فرق)</span>
            <b className={`font-serif text-base mt-0.5 block ${variance === 0 ? 'text-sage' : variance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {variance === 0 ? 'Balanced ✓' : `${variance > 0 ? '+' : ''}${pkr(variance)}`}
            </b>
          </div>
        </div>

        {/* Variance Status Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs mb-5 ${variance === 0 ? 'bg-sage-light text-sage border-sage/40' : variance > 0 ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {variance === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span className="font-medium">
              {variance === 0
                ? 'ماشاء اللہ! کیش اور لیجر مکمل طور پر برابر ہیں۔'
                : variance > 0
                ? `تھیلی میں لیجر سے ${pkr(variance)} زائد رقم موجود ہے۔`
                : `توجہ فرمائیں: تھیلی میں ${pkr(Math.abs(variance))} کی کمی ہے۔ کوئی لفافہ چیک کریں۔`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-sand">
          <div className="flex items-center gap-2">
            <button
              onClick={copyTally}
              className="btn text-xs !py-2 hover:bg-cream border border-sand flex items-center gap-1"
            >
              <Copy size={13} />
              <span>{copied ? 'Tally Copied!' : 'Copy Breakdown'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="btn text-xs !py-2 hover:bg-cream border border-sand flex items-center gap-1"
            >
              <Printer size={13} />
              <span>Print Slip</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn text-xs !py-2">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-p text-xs !py-2 flex items-center gap-1 shadow-sm">
              <Check size={14} />
              <span>Save & Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
