import { useRef, useState } from 'react'
import {
  X, Send, Download, Printer, Copy, Check, Sparkles, Image as ImageIcon,
  Loader2, Share2, ExternalLink, AlertCircle
} from 'lucide-react'
import { toBlob } from 'html-to-image'
import { pkr, generateWhatsAppLink } from '../data'

export default function DigitalSlipModal({ isOpen, onClose, transaction, person, event, hostName = 'Wedding Host' }) {
  const [copiedText, setCopiedText] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [slipMode, setSlipMode] = useState('ceremonial') // 'ceremonial' | 'thermal'
  const slipRef = useRef(null)

  if (!isOpen || !transaction || !person) return null

  const amount = Number(transaction.amount) || 0
  const giftType = transaction.giftType || 'cash'
  const giftDesc = transaction.giftDescription || ''
  const note = transaction.note || ''
  const paymentMethod = transaction.paymentMethod || 'cash'
  const eventTitle = event?.title || 'Wedding Function'
  const dateStr = new Date(transaction.at || Date.now()).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  const timeStr = new Date(transaction.at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const slipNo = transaction.id ? transaction.id.slice(-6).toUpperCase() : 'SL-01'

  const waLink = generateWhatsAppLink(
    person.phone,
    person.name,
    eventTitle,
    amount,
    giftType,
    giftDesc
  )

  const slipCaption = `*رسیدِ نیوتا و سلامی (Digital Salamii Receipt)*\n` +
    `سلپ نمبر: #${slipNo}\n` +
    `مہمان گرامی: ${person.name}${person.fatherName ? ' ولد ' + person.fatherName : ''}\n` +
    `تقریب: ${eventTitle}\n` +
    `سلامی: ${giftType === 'cash' ? pkr(amount) : `${giftDesc} (${giftType})`}\n` +
    `ادائیگی طریقہ: ${paymentMethod === 'raast' ? 'Raast QR (ڈیجیٹل)' : 'Cash (نقد)'}\n` +
    `تاریخ و وقت: ${dateStr} · ${timeStr}\n` +
    `میزبان: ${hostName}\n` +
    `حیثیت: وصول شد و تصدیق شدہ ✓`

  // Helper to generate the high-res image Blob from the slip DOM
  const generateSlipBlob = async () => {
    if (!slipRef.current) return null
    return await toBlob(slipRef.current, {
      quality: 0.98,
      pixelRatio: 2.5, // 2.5x retina clarity for crisp Urdu fonts & gold borders
      cacheBust: true,
      backgroundColor: '#FAF7F0'
    })
  }

  // 1. Share Real Slip Photo to WhatsApp (Native Mobile Web Share + Desktop Fallback)
  const handleShareWhatsAppPhoto = async () => {
    setGenerating(true)
    setFeedback(null)
    try {
      const blob = await generateSlipBlob()
      if (!blob) throw new Error('Could not render slip image')

      const fileName = `Salamii_Slip_${slipNo}_${person.name.replace(/\s+/g, '_')}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // If browser supports native Web Share with Files (Mobile Chrome, Safari on iOS/Android):
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Salamii Receipt #${slipNo}`,
          text: slipCaption
        })
        setFeedback({
          type: 'success',
          msg: 'رسید کی تصویر واٹس ایپ پر بھیج دی گئی! (Slip photo shared successfully!)'
        })
        return
      }

      // Desktop / Browser Fallback:
      // 1. Download image automatically
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)

      // 2. Try copying image to clipboard for instant Ctrl+V pasting into WhatsApp Web
      let isCopied = false
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': blob })
          ])
          isCopied = true
          setCopiedImage(true)
          setTimeout(() => setCopiedImage(false), 4000)
        } catch (e) {
          console.warn('Clipboard write image failed:', e)
        }
      }

      // 3. Open WhatsApp Web / App
      window.open(waLink, '_blank')

      setFeedback({
        type: 'info',
        msg: isCopied
          ? 'تصویر ڈاؤن لوڈ اور کلپ بورڈ پر کاپی ہو گئی ہے! واٹس ایپ چیٹ میں Ctrl+V دبائیں یا تصویر منسلک کر کے بھیج دیں۔'
          : 'تصویر ڈاؤن لوڈ ہو گئی ہے! واٹس ایپ چیٹ میں ڈاؤن لوڈ شدہ تصویر منسلک کر کے بھیج دیں۔'
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share slip photo error:', err)
        setFeedback({
          type: 'error',
          msg: 'تصویر بنانے میں مسئلہ آیا۔ برائے مہربانی "تصویر ڈاؤن لوڈ" یا "ٹیکسٹ رسید" استعمال کریں۔'
        })
      }
    } finally {
      setGenerating(false)
    }
  }

  // 2. Direct 1-Click Download of Slip Image
  const handleDownloadImage = async () => {
    setGenerating(true)
    setFeedback(null)
    try {
      const blob = await generateSlipBlob()
      if (!blob) throw new Error('Could not render image')
      const fileName = `Salamii_Slip_${slipNo}_${person.name.replace(/\s+/g, '_')}.png`
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
      setFeedback({
        type: 'success',
        msg: 'رسید کی تصویر ڈاؤن لوڈ ہو گئی! (Slip image downloaded successfully!)'
      })
    } catch (err) {
      console.error('Download error:', err)
      setFeedback({ type: 'error', msg: 'تصویر ڈاؤن لوڈ نہیں ہو سکی۔' })
    } finally {
      setGenerating(false)
    }
  }

  // 3. Copy Image to Clipboard
  const handleCopyImage = async () => {
    setGenerating(true)
    setFeedback(null)
    try {
      const blob = await generateSlipBlob()
      if (!blob) throw new Error('Could not render image')
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        setCopiedImage(true)
        setTimeout(() => setCopiedImage(false), 3000)
        setFeedback({
          type: 'success',
          msg: 'تصویر کاپی ہو گئی! واٹس ایپ یا کسی بھی چیٹ میں Ctrl+V دبائیں۔'
        })
      } else {
        throw new Error('ClipboardItem not supported in this browser')
      }
    } catch (err) {
      console.warn('Copy image error:', err)
      setFeedback({
        type: 'info',
        msg: 'براؤزر نے ڈائریکٹ کاپی سپورٹ نہیں کی۔ آپ "تصویر ڈاؤن لوڈ" بٹن استعمال کر سکتے ہیں۔'
      })
    } finally {
      setGenerating(false)
    }
  }

  // 4. Copy Plain Text Slip
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(slipCaption)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch (err) {
      console.warn('Clipboard text failed:', err)
    }
  }

  // 5. Print Slip (Supports standard and thermal)
  const handlePrintSlip = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 md:p-6 shadow-2xl relative border border-sand">
        {/* Top Controls with Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-sand mb-4 gap-2 print:hidden">
          <div className="flex items-center gap-1.5 text-brown font-semibold text-sm">
            <Sparkles size={16} />
            <div>
              <span className="block text-ink font-bold leading-tight">Salamii Receipt Slip</span>
              <span className="block text-[10px] text-taupe font-serif">سلامی رسید و شگن سلپ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-cream/70 p-0.5 rounded-lg border border-sand text-[11px]">
              <button
                type="button"
                onClick={() => setSlipMode('ceremonial')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  slipMode === 'ceremonial' ? 'bg-white text-brown shadow-2xs' : 'text-taupe hover:text-ink'
                }`}
              >
                Card View
              </button>
              <button
                type="button"
                onClick={() => setSlipMode('thermal')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  slipMode === 'thermal' ? 'bg-white text-brown shadow-2xs' : 'text-taupe hover:text-ink'
                }`}
              >
                58mm Thermal
              </button>
            </div>

            <button onClick={onClose} className="p-1 rounded-full hover:bg-cream text-taupe hover:text-ink">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div className={`mb-3 p-2.5 rounded-xl text-xs flex items-start gap-2 print:hidden ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
              : feedback.type === 'info'
              ? 'bg-blue-50 text-blue-950 border border-blue-200'
              : 'bg-red-50 text-red-950 border border-red-200'
          }`}>
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-taupe" />
            <span className="font-medium leading-relaxed">{feedback.msg}</span>
          </div>
        )}

        {/* 1. CEREMONIAL SHAGUN ENVELOPE CARD */}
        {slipMode === 'ceremonial' && (
          <div
            ref={slipRef}
            className="relative bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F4ECE1] border-2 border-[#D4AF37] rounded-xl p-5 md:p-6 text-ink shadow-md overflow-hidden"
            style={{ minWidth: '320px' }}
          >
            {/* Ornamental corner accents */}
            <div className="absolute top-1 left-1.5 text-[#D4AF37] text-xs font-serif select-none">✦</div>
            <div className="absolute top-1 right-1.5 text-[#D4AF37] text-xs font-serif select-none">✦</div>
            <div className="absolute bottom-1 left-1.5 text-[#D4AF37] text-xs font-serif select-none">✦</div>
            <div className="absolute bottom-1 right-1.5 text-[#D4AF37] text-xs font-serif select-none">✦</div>

            {/* Inner hairline border for luxury certificate look */}
            <div className="border border-[#D4AF37]/40 rounded-lg p-3.5 bg-white/40">
              {/* Header */}
              <div className="text-center mb-3">
                <p className="font-serif text-[11px] tracking-widest text-taupe mb-0.5">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[10px] font-bold text-[#8A6D3B] tracking-wider uppercase mb-1">
                  Neota Digital Receipt · نیوتا سلامی
                </div>
                <h4 className="font-serif text-xl font-bold text-ink tracking-wide">رسیدِ نیوتا و سلامی</h4>
                <p className="text-xs text-taupe font-semibold mt-0.5">{eventTitle}</p>
                <span className="inline-block mt-1 text-[10px] bg-white border border-sand px-2 py-0.5 rounded-full text-taupe font-mono shadow-2xs">
                  Slip #{slipNo}
                </span>
              </div>

              {/* Guest Information */}
              <div className="bg-white/90 rounded-lg p-3 border border-sand/80 mb-3 text-center shadow-xs">
                <span className="text-[10px] text-taupe block font-medium">محترم مہمان گرامی (Honored Guest)</span>
                <h3 className="font-serif text-lg font-bold text-ink mt-0.5 leading-snug">{person.name}</h3>
                {person.fatherName && (
                  <p className="text-xs text-taupe mt-0.5 font-medium">ولد {person.fatherName}</p>
                )}
                <p className="text-[11px] text-taupe mt-0.5">
                  {[person.relation, person.address].filter(Boolean).join(' · ')}
                </p>
              </div>

              {/* Amount / Gift Value */}
              <div className="text-center py-2.5 mb-3 border-y border-[#D4AF37]/40 bg-[#FAF6EE]/80 rounded-md">
                <span className="text-[10px] text-taupe uppercase tracking-wider block font-medium">
                  {giftType === 'cash' ? 'مبلغ سلامی (Amount Received)' : 'تحفہ / شگن (Gift Item)'}
                </span>
                <div className="font-serif text-3xl font-extrabold text-[#654B3B] mt-1 tracking-tight">
                  {giftType === 'cash' ? pkr(amount) : (giftDesc || 'Gift Item')}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-taupe font-medium">
                  <span>طریقہ ادائیگی:</span>
                  <span className="font-bold text-ink">
                    {paymentMethod === 'raast' ? 'Raast QR (ڈیجیٹل راست)' : 'Cash (نقد رقم)'}
                  </span>
                </div>
                {giftType !== 'cash' && amount > 0 && (
                  <span className="text-[11px] text-taupe block mt-0.5">Estimated Value: {pkr(amount)}</span>
                )}
                {note && <p className="text-[11px] text-taupe italic mt-1 font-serif">"{note}"</p>}
              </div>

              {/* Verification Stamp & Host signature */}
              <div className="flex items-center justify-between text-xs pt-1.5">
                <div>
                  <span className="text-[9px] text-taupe block">تاریخ و وقت (Date & Time)</span>
                  <span className="font-semibold text-ink text-[11px]">{dateStr} · {timeStr}</span>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                    ✓ تصدیق شدہ (Verified)
                  </span>
                  <span className="text-[10px] text-taupe block mt-0.5 font-medium">میزبان: {hostName}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. COMPACT 58mm / 80mm ESC/POS THERMAL RECEIPT SLIP */}
        {slipMode === 'thermal' && (
          <div
            ref={slipRef}
            className="bg-white text-black font-mono text-xs p-4 border border-dashed border-gray-400 mx-auto max-w-[260px] text-center shadow-xs select-none"
          >
            <div className="text-[11px] font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <div className="font-extrabold text-sm uppercase mt-1 tracking-wider">NEOTA DIGITAL LEDGER</div>
            <div className="text-[10px] text-gray-600 truncate">{eventTitle}</div>
            <div className="border-t border-dashed border-black/80 my-2"></div>

            <div className="text-left text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>SLIP NO:</span>
                <strong className="font-bold font-mono">#{slipNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME:</span>
                <span>{timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span>GUEST:</span>
                <strong className="truncate max-w-[150px]">{person.name}</strong>
              </div>
              {person.fatherName && (
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>S/O:</span>
                  <span>{person.fatherName}</span>
                </div>
              )}
              {person.relation && (
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>RELATION:</span>
                  <span>{person.relation}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>MODE:</span>
                <span className="uppercase font-semibold">{paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black/80 my-2"></div>

            <div className="py-1">
              <span className="text-[10px] block uppercase text-gray-600">Total Salamii Received</span>
              <span className="text-2xl font-extrabold block my-1">
                {giftType === 'cash' ? pkr(amount) : `${giftDesc} (${giftType})`}
              </span>
            </div>

            <div className="border-t border-dashed border-black/80 my-2"></div>

            <div className="text-[10px] text-center space-y-1">
              <div>COUNTER: {transaction.recordedBy || 'Desk 1'}</div>
              <div>HOST: {hostName}</div>
              <div className="font-serif text-[12px] pt-1 font-bold">تشریف لانے کا بے حد شکریہ!</div>
              <div className="text-[8px] text-gray-500 tracking-widest uppercase">*** COMPUTER VERIFIED RECORD ***</div>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-5 space-y-2 print:hidden">
          {/* Main WhatsApp Slip Photo Button */}
          <button
            onClick={handleShareWhatsAppPhoto}
            disabled={generating}
            className="w-full btn !py-3 bg-[#25D366] text-white border-transparent hover:bg-[#1EBE5D] flex items-center justify-center gap-2 shadow-sm text-sm font-bold rounded-xl transition transform active:scale-98 disabled:opacity-75"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>تصویر تیار ہو رہی ہے... (Preparing Image...)</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <div className="text-left flex flex-col items-center">
                  <span className="leading-tight">Share Slip Photo via WhatsApp</span>
                  <span className="text-[10px] opacity-90 font-serif font-normal">واٹس ایپ پر رسید کی تصویر بھیجیں</span>
                </div>
              </>
            )}
          </button>

          {/* Quick Utility Actions Row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Download Photo */}
            <button
              onClick={handleDownloadImage}
              disabled={generating}
              className="btn text-xs !py-2.5 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-cream"
              title="Download high-resolution image"
            >
              <Download size={14} className="text-brown" />
              <span className="font-medium text-[11px] leading-none">Save Photo</span>
              <span className="text-[9px] text-taupe font-serif">تصویر محفوظ کریں</span>
            </button>

            {/* Copy Photo */}
            <button
              onClick={handleCopyImage}
              disabled={generating}
              className="btn text-xs !py-2.5 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-cream"
              title="Copy image to paste into WhatsApp Web"
            >
              {copiedImage ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
              <span className="font-medium text-[11px] leading-none">
                {copiedImage ? 'Copied!' : 'Copy Photo'}
              </span>
              <span className="text-[9px] text-taupe font-serif">تصویر کاپی</span>
            </button>

            {/* Print Slip */}
            <button
              onClick={handlePrintSlip}
              className="btn text-xs !py-2.5 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-cream"
              title="Print paper receipt"
            >
              <Printer size={14} />
              <span className="font-medium text-[11px] leading-none">Print</span>
              <span className="text-[9px] text-taupe font-serif">پرنٹ سلپ</span>
            </button>
          </div>

          {/* Secondary Text Only Option */}
          <div className="pt-2 flex items-center justify-between border-t border-sand/50 text-[11px] text-taupe">
            <span>صرف تحریری میسج بھیجنا ہو تو:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="hover:text-ink underline flex items-center gap-1"
              >
                {copiedText ? <Check size={12} className="text-sage" /> : <Copy size={12} />}
                <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
              </button>
              <span>·</span>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink underline flex items-center gap-1 text-emerald-800 font-medium"
              >
                <span>Send Text Only</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-taupe print:hidden">
          موبائل پر واٹس ایپ ڈائریکٹ تصویر لے کر کھلتا ہے۔ پی سی پر تصویر کاپی اور ڈاؤن لوڈ ہو جاتی ہے۔
        </p>
      </div>
    </div>
  )
}
