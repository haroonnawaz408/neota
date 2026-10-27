import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  X, QrCode, Copy, Check, Smartphone, Building, ShieldCheck,
  AlertTriangle, Settings as SettingsIcon, Image as ImageIcon,
  ExternalLink, Sparkles, RefreshCw, Info, HelpCircle
} from 'lucide-react'
import { pkr } from '../data'
import { buildRaastEMVCoQR, getRaastQRImageUrl, formatRaastShareText } from '../utils/raastQR'

export default function RaastQRModal({ isOpen, onClose, onConfirm, amount = 0, paymentSettings, guestName }) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedIban, setCopiedIban] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [activeTab, setActiveTab] = useState('emvco') // 'emvco' | 'custom' | 'manual'
  const [qrMode, setQrMode] = useState('static') // 'static' (universal P2P) | 'dynamic' (with amount)
  const [showTroubleshoot, setShowTroubleshoot] = useState(false)

  if (!isOpen) return null

  // Check if owner has configured authentic payment settings
  const hasConfigured = Boolean(
    paymentSettings &&
    (paymentSettings.raastId?.trim() || paymentSettings.iban?.trim() || paymentSettings.accountTitle?.trim() || paymentSettings.customQrImage)
  )

  const settings = {
    raastId: paymentSettings?.raastId?.trim() || '',
    accountTitle: paymentSettings?.accountTitle?.trim() || 'Wedding Host',
    bankName: paymentSettings?.bankName?.trim() || 'Raast P2P Banking',
    iban: paymentSettings?.iban?.trim() || '',
    customQrImage: paymentSettings?.customQrImage || ''
  }

  // 1. Generate State Bank of Pakistan EMVCo-compliant Raast QR String
  // (Static mode is universally accepted by all P2P personal banking apps)
  const emvcoPayload = useMemo(() => {
    if (!hasConfigured) return ''
    return buildRaastEMVCoQR({
      raastId: settings.raastId,
      iban: settings.iban,
      accountTitle: settings.accountTitle,
      amount: Number(amount) || 0,
      isDynamic: qrMode === 'dynamic'
    })
  }, [hasConfigured, settings, amount, qrMode])

  // 2. High-reliability QR Code image URL
  const qrImageUrl = useMemo(() => {
    if (!emvcoPayload) return ''
    return getRaastQRImageUrl(emvcoPayload, 260)
  }, [emvcoPayload])

  const copyText = (text, setFlag) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setFlag(true)
    setTimeout(() => setFlag(false), 2000)
  }

  const copyAllDetails = () => {
    const text = formatRaastShareText({
      accountTitle: settings.accountTitle,
      raastId: settings.raastId,
      iban: settings.iban,
      bankName: settings.bankName,
      amount
    })
    copyText(text, setCopiedAll)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative border border-sand text-ink">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sand mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A4B32] text-white flex items-center justify-center font-bold text-xs tracking-wider">
              RAAST
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-ink">Digital Salamii QR</h3>
              <p className="text-[10px] text-taupe">SBP Raast Network (0% Transfer Fee)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-cream text-taupe hover:text-ink transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount to pay */}
        <div className="text-center py-2 px-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 mb-3">
          <span className="text-[10px] text-emerald-800 block font-medium">Paying for {guestName || 'Guest'}</span>
          <b className="font-serif text-2xl text-emerald-950">{amount > 0 ? pkr(amount) : 'Open Salamii Amount'}</b>
        </div>

        {/* Not Configured Warning */}
        {!hasConfigured ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 mb-4 text-center">
            <AlertTriangle size={28} className="mx-auto text-amber-700 mb-2" />
            <h4 className="font-serif text-sm font-bold text-amber-950 mb-1">
              Payment Details Not Configured
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed mb-3">
              The event host has not entered their real Raast Mobile ID or Bank IBAN in Settings yet.
            </p>
            <Link
              to="/app/settings"
              onClick={onClose}
              className="btn btn-p text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-xs"
            >
              <SettingsIcon size={13} />
              <span>Configure Raast in Settings</span>
            </Link>
          </div>
        ) : (
          <>
            {/* View Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-cream/70 rounded-xl mb-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('emvco')}
                className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'emvco' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-taupe hover:text-ink'
                }`}
              >
                <QrCode size={13} />
                <span>Raast QR (Scan)</span>
              </button>

              {settings.customQrImage ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'custom' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-taupe hover:text-ink'
                  }`}
                >
                  <ImageIcon size={13} />
                  <span>Bank QR Image</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'manual' ? 'bg-white text-ink shadow-xs font-semibold' : 'text-taupe hover:text-ink'
                  }`}
                >
                  <Copy size={13} />
                  <span>1-Tap Transfer</span>
                </button>
              )}
            </div>

            {/* TAB 1: Authentic EMVCo Raast QR Code */}
            {activeTab === 'emvco' && (
              <div className="flex flex-col items-center justify-center p-3 bg-white border border-sand rounded-2xl mb-3 shadow-xs">
                {/* QR Image Container */}
                <div className="relative p-2 bg-white rounded-xl shadow-xs border border-sand/60">
                  <img
                    src={qrImageUrl}
                    alt="Authentic SBP Raast EMVCo Payment QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      const fb = document.getElementById('qr-modal-fallback')
                      if (fb) fb.style.display = 'flex'
                    }}
                  />
                  <div
                    id="qr-modal-fallback"
                    className="hidden w-44 h-44 bg-ivory rounded-lg flex-col items-center justify-center p-4 text-center text-xs text-taupe border border-sand"
                  >
                    <QrCode size={36} className="text-taupe mb-1" />
                    <span>Copy Raast details below for manual transfer</span>
                  </div>
                </div>

                {/* Sub-mode selector (Static Universal vs Dynamic Locked) */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[10px] text-taupe font-medium">Mode:</span>
                  <button
                    type="button"
                    onClick={() => setQrMode('static')}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                      qrMode === 'static'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                        : 'bg-white text-taupe border-sand'
                    }`}
                    title="Universal P2P Mode (Recommended: Bank prompts to confirm amount)"
                  >
                    Static P2P ✓
                  </button>
                  {amount > 0 && (
                    <button
                      type="button"
                      onClick={() => setQrMode('dynamic')}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                        qrMode === 'dynamic'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                          : 'bg-white text-taupe border-sand'
                      }`}
                      title="Locked Amount Mode"
                    >
                      Preset {pkr(amount)}
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-taupe text-center mt-1">
                  Scan via SadaPay, Nayapay, Meezan, Easypaisa, JazzCash, HBL
                </p>
              </div>
            )}

            {/* TAB 2: Host's Official Bank QR Image (If uploaded in Settings) */}
            {activeTab === 'custom' && settings.customQrImage && (
              <div className="flex flex-col items-center justify-center p-3 bg-white border border-sand rounded-2xl mb-3 shadow-xs">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-sand/60 max-w-full">
                  <img
                    src={settings.customQrImage}
                    alt="Host Official Bank QR"
                    className="w-44 h-44 object-contain rounded-lg mx-auto"
                  />
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-taupe font-medium">
                  <Building size={11} />
                  <span>Host's Verified Bank QR Screenshot</span>
                </div>
              </div>
            )}

            {/* Why payment might fail hint */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowTroubleshoot(prev => !prev)}
                className="w-full text-left text-[11px] text-brown hover:text-ink flex items-center justify-between p-1.5 bg-amber-50/60 rounded-lg border border-amber-200/60"
              >
                <span className="flex items-center gap-1 font-medium">
                  <HelpCircle size={12} className="text-amber-700" />
                  <span>Payment failing after scan? (پیمنٹ نہ ہونے کی وجوہات)</span>
                </span>
                <span className="text-[10px] underline">{showTroubleshoot ? 'Hide' : 'Show Help'}</span>
              </button>

              {showTroubleshoot && (
                <div className="mt-1.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1.5 leading-relaxed">
                  <p>
                    <b>1. Real vs Dummy Account:</b> اگر سیٹنگز میں فرضی نمبر درج ہو تو بینکنگ سوئچ فیل کر دے گا۔ ضروری ہے کہ اصل ایکٹیو راست موبائل نمبر یا IBAN دیا گیا ہو۔
                  </p>
                  <p>
                    <b>2. Static P2P Mode:</b> کچھ بینکنگ ایپس (جیسے ایزی پیسہ یا سادہ پے) فکسڈ رقم والی ڈائنامک کیو آر مسترد کر دیتی ہیں۔ اوپر <b>Static P2P</b> منتخب کریں۔
                  </p>
                  <p>
                    <b>3. 1-Tap Copy:</b> اگر اسکینر میں مسئلہ ہو تو نیچے سے راست نمبر کاپی کر کے اپنی بینکنگ ایپ کے <b>"Send via Raast"</b> میں پیسٹ کریں، یہ 100% فوراً کام کرتا ہے۔
                  </p>
                </div>
              )}
            </div>

            {/* TAB 3 / Details Section: Clean Copyable Details */}
            <div className="space-y-1.5 mb-3 text-xs">
              {settings.raastId && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-ivory border border-sand">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-taupe block font-medium">Raast ID (Mobile)</span>
                    <b className="font-mono text-sm text-ink truncate block">{settings.raastId}</b>
                  </div>
                  <button
                    onClick={() => copyText(settings.raastId, setCopiedId)}
                    className="p-1.5 rounded-lg hover:bg-cream text-taupe hover:text-ink transition shrink-0 bg-white border border-sand/70"
                    title="Copy Raast Mobile ID"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-700 font-bold" /> : <Copy size={14} />}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-2 rounded-xl bg-ivory border border-sand">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-taupe block font-medium">Account Title & Bank</span>
                  <span className="font-semibold text-ink block truncate">{settings.accountTitle}</span>
                  <span className="text-[10px] text-taupe block truncate">{settings.bankName}</span>
                </div>
                {settings.iban && (
                  <button
                    onClick={() => copyText(settings.iban, setCopiedIban)}
                    className="p-1.5 rounded-lg hover:bg-cream text-taupe hover:text-ink transition shrink-0 bg-white border border-sand/70"
                    title="Copy Bank IBAN"
                  >
                    {copiedIban ? <Check size={14} className="text-emerald-700 font-bold" /> : <Copy size={14} />}
                  </button>
                )}
              </div>

              {settings.iban && (
                <div className="p-2 rounded-xl bg-ivory border border-sand flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-taupe block font-medium">IBAN</span>
                    <span className="font-mono text-[11px] text-ink block truncate">{settings.iban}</span>
                  </div>
                  <button
                    onClick={() => copyText(settings.iban, setCopiedIban)}
                    className="p-1.5 rounded-lg hover:bg-cream text-taupe hover:text-ink transition shrink-0 bg-white border border-sand/70"
                    title="Copy Bank IBAN"
                  >
                    {copiedIban ? <Check size={14} className="text-emerald-700 font-bold" /> : <Copy size={14} />}
                  </button>
                </div>
              )}

              {/* Quick Copy All Details Button */}
              <button
                onClick={copyAllDetails}
                className="w-full text-xs py-1.5 px-3 rounded-lg border border-sand hover:bg-cream text-taupe hover:text-ink flex items-center justify-center gap-1.5 transition font-medium bg-cream/40"
              >
                {copiedAll ? <Check size={13} className="text-emerald-700 font-bold" /> : <Copy size={13} />}
                <span>{copiedAll ? 'All Details Copied!' : 'Copy All Details for WhatsApp / SMS'}</span>
              </button>
            </div>
          </>
        )}

        {/* Action Confirm Button */}
        <button
          onClick={() => {
            onConfirm('raast')
            onClose()
          }}
          className="btn btn-p w-full !py-3 text-xs font-semibold shadow-sm flex items-center justify-center gap-2 rounded-xl"
        >
          <ShieldCheck size={15} />
          <span>Confirm Raast Salamii Received (محفوظ کریں)</span>
        </button>

        <p className="mt-2 text-center text-[10px] text-taupe">
          Instant 0% fee transfer via State Bank of Pakistan Raast switch.
        </p>
      </div>
    </div>
  )
}
