import { useState } from 'react'
import { X, Sparkles, ArrowRight, TrendingUp, History, Check, ShieldCheck, Scale, Award } from 'lucide-react'
import { useStore } from '../store'
import { pkr } from '../data'

export default function AIBadlaModal({ isOpen, onClose, selectedPersonId, onSelectAmount }) {
  const { people, tx, events } = useStore()

  const [personId, setPersonId] = useState(selectedPersonId || (people[0]?.id || ''))

  if (!isOpen) return null

  const person = people.find(p => p.id === personId) || people[0]

  // Historical received transactions from this person
  const receivedHistory = tx.filter(t => t.personId === person?.id && t.dir === 'received')
  const totalReceived = receivedHistory.reduce((s, t) => s + (Number(t.amount) || 0), 0)

  // Oldest / most prominent gift transaction
  const mainTx = receivedHistory[0] || null
  const txYear = mainTx ? new Date(mainTx.at || Date.now()).getFullYear() : 2021
  const currentYear = new Date().getFullYear()
  const yearsPassed = Math.max(1, currentYear - txYear)

  // Inflation calculations (Pakistani average ~14% compound per year)
  const baseAmount = totalReceived > 0 ? totalReceived : 5000
  const inflationMultiplier = Math.pow(1.14, yearsPassed)
  const rawAdjusted = baseAmount * inflationMultiplier

  // Round to nearest Pakistani wedding denominations (Rs 500 or Rs 1,000)
  const dignifiedBadla = Math.max(baseAmount + 1000, Math.round(rawAdjusted / 500) * 500)
  const royalShagun = dignifiedBadla >= 10000 ? dignifiedBadla + 3000 : dignifiedBadla + 2000

  const tiers = [
    {
      tier: 'Equal Base (برابر بدلہ)',
      amount: baseAmount,
      desc: 'جتنا انہوں نے دیا تھا اتنا ہی واپس کرنا۔',
      tag: 'Minimum (کم از کم)',
      badgeClass: 'bg-sand text-brown'
    },
    {
      tier: 'Dignified / Inflation-Adjusted (شائستہ بدلہ)',
      amount: dignifiedBadla,
      desc: `${yearsPassed} سال کی ملکی مہنگائی اور عزت و تکریم کے لحاظ سے بالکل مناسب۔`,
      tag: 'AI Recommended ⭐',
      badgeClass: 'bg-sage-light text-sage font-bold',
      highlight: true
    },
    {
      tier: 'Royal Shagun (شاہی شگون و عزت)',
      amount: royalShagun,
      desc: 'قریبی عزیزوں، ماموں، چچا یا سسرال کے لیے اضافی عزت و محبت کا شگون۔',
      tag: 'Generous (شاہانہ)',
      badgeClass: 'bg-amber-100 text-amber-900 font-bold'
    }
  ]

  const handlePickTier = amt => {
    if (onSelectAmount) {
      onSelectAmount(amt, person.id)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 md:p-7 shadow-2xl relative border border-sand text-ink">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sand mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold flex items-center gap-1.5">
                <span>AI Badla & Inflation Predictor</span>
              </h2>
              <p className="text-xs text-taupe">اے آئی بدلہ و مہنگائی کا حسابی مشیر</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cream text-taupe hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {/* Guest Selector */}
        <div className="mb-4">
          <label className="label">Select Relative / Guest (رشتہ دار کا انتخاب)</label>
          <select
            className="input font-medium"
            value={personId}
            onChange={e => setPersonId(e.target.value)}
          >
            {people.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.fatherName ? `s/o ${p.fatherName}` : ''} ({p.relation || 'Relative'})
              </option>
            ))}
          </select>
        </div>

        {/* Historical Context Card */}
        <div className="p-4 rounded-2xl bg-cream/30 border border-sand mb-5 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-taupe font-medium flex items-center gap-1">
              <History size={14} className="text-brown" />
              <span>ماضی کی سلامی (Historical Record):</span>
            </span>
            <b className="font-serif text-sm text-ink">{pkr(baseAmount)}</b>
          </div>

          <p className="text-taupe leading-relaxed">
            محترم <b>{person?.name}</b> نے {txYear} میں <b>{pkr(baseAmount)}</b> سلامی دی تھی ({yearsPassed} سال قبل)۔ پاکستان میں گزشتہ سالوں کی مہنگائی اور روپے کی قدر کے مطابق نیا بدلہ مندرجہ ذیل تجویز کیا جاتا ہے:
          </p>
        </div>

        {/* AI Recommendations Tier Cards */}
        <div className="space-y-2.5 mb-5">
          {tiers.map(item => (
            <div
              key={item.tier}
              onClick={() => handlePickTier(item.amount)}
              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${item.highlight ? 'border-sage bg-sage-light/20 shadow-sm hover:bg-sage-light/30' : 'border-sand bg-white hover:bg-cream/30'}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeClass}`}>
                    {item.tag}
                  </span>
                  <span className="font-semibold text-xs text-ink truncate">{item.tier}</span>
                </div>
                <p className="text-[11px] text-taupe leading-tight">{item.desc}</p>
              </div>

              <div className="text-right shrink-0">
                <b className={`font-serif text-lg block ${item.highlight ? 'text-sage' : 'text-ink'}`}>
                  {pkr(item.amount)}
                </b>
                <span className="text-[10px] text-brown font-medium flex items-center justify-end gap-0.5 hover:underline mt-0.5">
                  <span>Select</span>
                  <ArrowRight size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-sand flex items-center justify-between text-xs">
          <span className="text-taupe text-[11px]">Calculated using Pakistan compound inflation metric</span>
          <button onClick={onClose} className="btn text-xs !py-1.5">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
