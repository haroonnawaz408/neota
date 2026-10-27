import { useState, useRef, useMemo } from 'react'
import { Database, Download, Upload, RefreshCw, Check, Globe, Shield, User, HardDrive, QrCode, Printer, Copy, Sparkles, ExternalLink, Cloud, Loader2, Image as ImageIcon, Trash2, CreditCard, Send, CheckCircle2, Clock } from 'lucide-react'
import { useStore } from '../store'
import { PageHead } from '../components/Layout'
import { buildRaastEMVCoQR, getRaastQRImageUrl } from '../utils/raastQR'
import { pkr } from '../data'

export default function Settings() {
  const { auth, setAuth, paymentSettings, updatePaymentSettings, language, setLanguage, t, exportDatabaseJSON, importDatabaseJSON, resetToCleanData, loadDemoData, notify, isConnected, syncWithCloud, cloudSyncStatus, systemConfig, subscriptionRequests = [], submitSubscriptionRequest } = useStore()
  const [name, setName] = useState(auth.user?.name || '')
  const [email, setEmail] = useState(auth.user?.email || '')
  const fileRef = useRef()

  // Subscription upgrade states
  const [selectedPlanTier, setSelectedPlanTier] = useState('pro')
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('jazzcash')
  const [tidInput, setTidInput] = useState('')
  const [submittingProof, setSubmittingProof] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState('')

  const userTier = auth.user?.tier || 'free'
  const isFreeLaunch = systemConfig?.billing_mode === 'launch_free'

  const myPendingRequest = useMemo(() => {
    return subscriptionRequests.find(r => r.user_email === auth.user?.email && r.status === 'pending')
  }, [subscriptionRequests, auth.user?.email])

  const saveProfile = e => {
    e.preventDefault()
    setAuth({
      ...auth,
      user: {
        ...(auth.user || {}),
        name: name.trim(),
        email: email.trim()
      }
    })
    notify('Profile details saved successfully!')
  }

  const handleUpgradeSubmit = async e => {
    e.preventDefault()
    if (!tidInput.trim()) {
      alert('Please enter your Transaction Reference ID (TID)')
      return
    }
    setSubmittingProof(true)
    try {
      const price = selectedPlanTier === 'royal'
        ? (systemConfig?.tiers?.royal?.price_pkr || 9999)
        : (systemConfig?.tiers?.pro?.price_pkr || 3999)

      await submitSubscriptionRequest({
        tier: selectedPlanTier,
        amount_pkr: price,
        payment_method: selectedPaymentMode,
        transaction_ref: tidInput.trim()
      })
      setTidInput('')
    } finally {
      setSubmittingProof(false)
    }
  }

  const handleRestoreFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const content = ev.target?.result
      if (typeof content === 'string') {
        importDatabaseJSON(content)
      }
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const [activeSettingsTab, setActiveSettingsTab] = useState('general') // 'general' | 'event' | 'notifications' | 'security' | 'backup'
  const [selectedTheme, setSelectedTheme] = useState('classic')
  const [timeFormat, setTimeFormat] = useState('12')
  const [eventName, setEventName] = useState('Walima')
  const [eventDate, setEventDate] = useState('2026-10-25')
  const [locationName, setLocationName] = useState('Lahore')
  const [currencyVal, setCurrencyVal] = useState('pkr')

  return (
    <div className="space-y-6 animate-pop pb-16">
      {/* Page Header matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#252A26] tracking-tight">Settings</h1>
          <p className="text-xs md:text-sm text-[#77776D] mt-1 font-sans">
            Manage your account, event and system preferences
          </p>
        </div>
      </div>

      {/* Tabs matching reference: General, Event Settings, Notifications, Security, Backup */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E0D4] pb-3">
        {[
          ['general', 'General'],
          ['event', 'Event Settings'],
          ['notifications', 'Notifications'],
          ['security', 'Security'],
          ['backup', 'Backup']
        ].map(([tabKey, tabLabel]) => (
          <button
            key={tabKey}
            onClick={() => setActiveSettingsTab(tabKey)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              activeSettingsTab === tabKey
                ? 'bg-[#153C32] text-white shadow-xs'
                : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
            }`}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {/* General & Event Preferences Card matching reference */}
      {(activeSettingsTab === 'general' || activeSettingsTab === 'event') && (
        <div className="card p-6 md:p-8 bg-white border border-[#E7E0D4] shadow-card rounded-2xl max-w-4xl">
          <form
            onSubmit={e => {
              e.preventDefault()
              notify('Settings saved successfully!')
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Form Fields */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-[#252A26] pb-2 border-b border-[#E7E0D4]">
                  General Settings
                </h3>

                <div>
                  <label className="label">Event Name</label>
                  <input
                    className="input"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    placeholder="Walima"
                  />
                </div>

                <div>
                  <label className="label">Event Date</label>
                  <input
                    type="date"
                    className="input"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Location</label>
                  <input
                    className="input"
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                    placeholder="Lahore"
                  />
                </div>

                <div>
                  <label className="label">Currency</label>
                  <select
                    className="input"
                    value={currencyVal}
                    onChange={e => setCurrencyVal(e.target.value)}
                  >
                    <option value="pkr">PKR (Rs)</option>
                    <option value="usd">USD ($)</option>
                    <option value="aed">AED (د.إ)</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Event Theme & Formats */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-[#202A25] pb-2 border-b border-[#E8E0D1]">
                  Event Theme
                </h3>

                {/* 4 Theme Cards matching reference: Classic, Royal, Modern, Floral */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'classic', name: 'Classic', img: '/images/event_walima.jpg' },
                    { id: 'royal', name: 'Royal', img: '/images/event_barat.jpg' },
                    { id: 'modern', name: 'Modern', img: '/images/event_nikkah.jpg' },
                    { id: 'floral', name: 'Floral', img: '/images/event_mehndi.jpg' }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition ${
                        selectedTheme === theme.id
                          ? 'border-[#063D32] ring-2 ring-[#D7B36A]/50 bg-[#FAF7EF]'
                          : 'border-[#E8E0D1] hover:bg-[#FAF7EF]'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-[#E8E0D1]">
                        <img src={theme.img} alt={theme.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#202A25]">{theme.name}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="label">Language</label>
                  <select
                    className="input"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="ur">اردو (Urdu)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Time Format</label>
                  <select
                    className="input"
                    value={timeFormat}
                    onChange={e => setTimeFormat(e.target.value)}
                  >
                    <option value="12">12 Hour (e.g. 8:30 PM)</option>
                    <option value="24">24 Hour (e.g. 20:30)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E0D4] flex items-center justify-between">
              <button
                type="submit"
                className="btn btn-p rounded-xl !py-2.5 !px-6 text-xs font-semibold shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="max-w-2xl grid gap-6">
        {/* Profile Settings Card */}
        <form onSubmit={saveProfile} className="card p-6 bg-white shadow-sm border border-sand">
          <h2 className="text-lg font-serif mb-4 flex items-center gap-2 text-ink">
            <User size={18} className="text-brown" />
            <span>Host & Profile Settings</span>
          </h2>

          <div className="grid gap-3">
            <div>
              <label className="label">Host / Family Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-p w-fit mt-2">
              <Check size={16} />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>

        {/* Subscription Plan & VIP Upgrade Card */}
        <div className="card p-6 bg-white shadow-sm border border-sand">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-lg font-serif flex items-center gap-2 text-ink">
                <CreditCard size={18} className="text-purple-700" />
                <span>Subscription Plan & VIP Status (منصوبہ اور رکنیت)</span>
              </h2>
              <span className="text-[11px] text-taupe font-serif block ml-6">شادی لیجر کا پلان اور اضافی خصوصیات</span>
            </div>
            <div>
              <span className={`tag text-xs font-bold uppercase tracking-wider ${
                userTier === 'royal' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                userTier === 'pro' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                'bg-sand/60 text-brown'
              }`}>
                {isFreeLaunch ? 'Launch Mode: 100% Free VIP' : `${userTier.toUpperCase()} PLAN`}
              </span>
            </div>
          </div>

          <p className="text-xs text-taupe leading-relaxed mb-4">
            {isFreeLaunch
              ? 'NEOTA is currently operating in 100% Free Launch Mode! All hosts enjoy unlimited guests, multiple live counters, and Urdu Voice AI without any charges.'
              : `Aap ka mojooda plan "${userTier.toUpperCase()}" hai. Agar aap zyada mehmaan aur multiple live counters active karna chahte hain to plan upgrade karein.`}
          </p>

          {/* Pending Approval Notice if any */}
          {myPendingRequest && (
            <div className="p-3 mb-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2 animate-fade-in">
              <Clock size={16} className="text-amber-700 shrink-0" />
              <div>
                <span className="font-bold block">Upgrade Request Pending Admin Approval:</span>
                <span>Requested: {myPendingRequest.tier?.toUpperCase()} Plan ({pkr(myPendingRequest.amount_pkr)}) via {myPendingRequest.payment_method?.toUpperCase()} · TID: {myPendingRequest.transaction_ref}</span>
              </div>
            </div>
          )}

          {!isFreeLaunch && userTier !== 'royal' && (
            <form onSubmit={handleUpgradeSubmit} className="space-y-4 pt-2 border-t border-sand/70 text-xs">
              <h3 className="font-serif font-bold text-ink text-sm">Upgrade My Wedding Ledger</h3>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedPlanTier === 'pro' ? 'border-purple-600 bg-purple-50/50' : 'border-sand hover:bg-cream/40'
                }`}>
                  <input
                    type="radio"
                    name="planTier"
                    value="pro"
                    checked={selectedPlanTier === 'pro'}
                    onChange={() => setSelectedPlanTier('pro')}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-purple-900">Pro Host Plan</span>
                    <span className="tag bg-purple-100 text-purple-800 font-bold font-mono">
                      {pkr(systemConfig?.tiers?.pro?.price_pkr || 3999)}
                    </span>
                  </div>
                  <p className="text-[11px] text-taupe">Up to 1,000 guests, 5 live counters, WhatsApp receipt slips & Voice AI.</p>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedPlanTier === 'royal' ? 'border-amber-600 bg-amber-50/50' : 'border-sand hover:bg-cream/40'
                }`}>
                  <input
                    type="radio"
                    name="planTier"
                    value="royal"
                    checked={selectedPlanTier === 'royal'}
                    onChange={() => setSelectedPlanTier('royal')}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-950">Royal VIP Plan 👑</span>
                    <span className="tag bg-amber-100 text-amber-900 font-bold font-mono">
                      {pkr(systemConfig?.tiers?.royal?.price_pkr || 9999)}
                    </span>
                  </div>
                  <p className="text-[11px] text-taupe">Unlimited guests, unlimited counters, seating planner & dedicated sync.</p>
                </label>
              </div>

              {/* Pakistani Payment Methods Display */}
              <div className="p-3 bg-cream/40 rounded-xl border border-sand">
                <span className="font-bold text-ink block mb-2">Step 1: Transfer fee to official NEOTA account:</span>
                <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {systemConfig?.payment_methods?.jazzcash?.number && (
                    <div className="p-2 bg-white rounded-lg border border-sand flex justify-between items-center">
                      <span>JazzCash: <strong>{systemConfig.payment_methods.jazzcash.number}</strong> ({systemConfig.payment_methods.jazzcash.title || 'Neota'})</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(systemConfig.payment_methods.jazzcash.number)
                          setCopiedAccount('jazzcash')
                          setTimeout(() => setCopiedAccount(''), 2000)
                        }}
                        className="text-taupe hover:text-ink text-[10px]"
                      >
                        {copiedAccount === 'jazzcash' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {systemConfig?.payment_methods?.easypaisa?.number && (
                    <div className="p-2 bg-white rounded-lg border border-sand flex justify-between items-center">
                      <span>EasyPaisa: <strong>{systemConfig.payment_methods.easypaisa.number}</strong> ({systemConfig.payment_methods.easypaisa.title || 'Neota'})</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(systemConfig.payment_methods.easypaisa.number)
                          setCopiedAccount('easypaisa')
                          setTimeout(() => setCopiedAccount(''), 2000)
                        }}
                        className="text-taupe hover:text-ink text-[10px]"
                      >
                        {copiedAccount === 'easypaisa' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {systemConfig?.payment_methods?.raast?.raast_id && (
                    <div className="p-2 bg-white rounded-lg border border-sand flex justify-between items-center">
                      <span>Raast ID: <strong>{systemConfig.payment_methods.raast.raast_id}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(systemConfig.payment_methods.raast.raast_id)
                          setCopiedAccount('raast')
                          setTimeout(() => setCopiedAccount(''), 2000)
                        }}
                        className="text-taupe hover:text-ink text-[10px]"
                      >
                        {copiedAccount === 'raast' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {systemConfig?.payment_methods?.bank?.iban && (
                    <div className="p-2 bg-white rounded-lg border border-sand flex justify-between items-center">
                      <span>{systemConfig.payment_methods.bank.bank_name || 'Bank'}: <strong>{systemConfig.payment_methods.bank.iban}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(systemConfig.payment_methods.bank.iban)
                          setCopiedAccount('bank')
                          setTimeout(() => setCopiedAccount(''), 2000)
                        }}
                        className="text-taupe hover:text-ink text-[10px]"
                      >
                        {copiedAccount === 'bank' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Enter Transaction ID */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Payment Gateway Used</label>
                  <select
                    className="input font-medium"
                    value={selectedPaymentMode}
                    onChange={e => setSelectedPaymentMode(e.target.value)}
                  >
                    <option value="jazzcash">JazzCash Mobile Account</option>
                    <option value="easypaisa">EasyPaisa Mobile Account</option>
                    <option value="raast">Raast Instant Transfer</option>
                    <option value="bank">Direct Bank Transfer / IBAN</option>
                  </select>
                </div>

                <div>
                  <label className="label">Transaction Reference ID (TID) *</label>
                  <input
                    type="text"
                    required
                    className="input font-mono"
                    placeholder="e.g. 029384729102"
                    value={tidInput}
                    onChange={e => setTidInput(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingProof || !tidInput.trim()}
                className="btn btn-p text-xs !py-2.5 font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Send size={14} />
                <span>{submittingProof ? 'Submitting Verification...' : 'Submit Payment Proof for Approval'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Digital Payment & Raast Settings with Live QR Generator */}
        <div className="card p-6 bg-white shadow-sm border border-sand">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-lg font-serif flex items-center gap-2 text-ink">
                <QrCode size={18} className="text-brown" />
                <span>Digital Salamii & Raast QR Generator</span>
              </h2>
              <span className="text-[11px] text-taupe font-serif block ml-6">بینکنگ، راست کیو آر کوڈ اور ڈیجیٹل سلامی</span>
            </div>
            <span className="text-[11px] font-medium bg-sage-light text-sage px-2 py-0.5 rounded-full">
              Live QR Ready
            </span>
          </div>
          <p className="text-xs text-taupe mb-5">
            Apna Raast Mobile Number aur Bank account details save karein. NEOTA foran live QR Code generate karta hai jo counter par scan karne ke liye tayar hai.
          </p>

          <div className="grid md:grid-cols-5 gap-6 items-start">
            {/* Input Form */}
            <form
              onSubmit={e => {
                e.preventDefault()
                const fd = new FormData(e.target)
                updatePaymentSettings({
                  raastId: fd.get('raastId'),
                  accountTitle: fd.get('accountTitle'),
                  bankName: fd.get('bankName'),
                  iban: fd.get('iban')
                })
              }}
              className="md:col-span-3 grid gap-3 text-xs"
            >
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Raast ID / Registered Mobile *</label>
                  <input
                    name="raastId"
                    className="input font-mono"
                    placeholder="e.g. 03001234567"
                    required
                    defaultValue={paymentSettings?.raastId || ''}
                  />
                </div>
                <div>
                  <label className="label">Account Title (Name on Bank) *</label>
                  <input
                    name="accountTitle"
                    className="input"
                    placeholder="e.g. Muhammad Tariq"
                    required
                    defaultValue={paymentSettings?.accountTitle || auth.user?.name || ''}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Bank Name *</label>
                  <input
                    name="bankName"
                    className="input"
                    placeholder="e.g. Meezan Bank / HBL / SadaPay"
                    required
                    defaultValue={paymentSettings?.bankName || ''}
                  />
                </div>
                <div>
                  <label className="label">IBAN Number (Recommended)</label>
                  <input
                    name="iban"
                    className="input font-mono"
                    defaultValue={paymentSettings?.iban || ''}
                    placeholder="PK45MEZN0001234567890123"
                  />
                </div>
              </div>

              {/* Upload Optional Native Bank QR Code (SadaPay, Nayapay, JazzCash, etc.) */}
              <div className="p-3 bg-cream/30 rounded-xl border border-sand">
                <label className="label flex items-center justify-between">
                  <span>Upload Official Bank QR Screenshot (Optional)</span>
                  {paymentSettings?.customQrImage && (
                    <button
                      type="button"
                      onClick={() => updatePaymentSettings({ customQrImage: '' })}
                      className="text-red-700 hover:text-red-900 flex items-center gap-1 font-semibold text-[10px]"
                    >
                      <Trash2 size={11} />
                      <span>Remove Uploaded QR</span>
                    </button>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = ev => {
                      if (typeof ev.target?.result === 'string') {
                        updatePaymentSettings({ customQrImage: ev.target.result })
                        notify('Official Bank QR Code image uploaded successfully!')
                      }
                    }
                    reader.readAsDataURL(file)
                  }}
                  className="input !text-xs !py-1.5 bg-white"
                />
                <span className="text-[10px] text-taupe block mt-1">
                  If you have a native SadaPay, Nayapay, or JazzCash QR screenshot from your banking app, upload it here.
                </span>
              </div>

              <button className="btn btn-p w-fit mt-1 text-xs">
                <Check size={14} />
                <span>Save Payment Settings</span>
              </button>
            </form>

            {/* Generated QR Card Preview */}
            <div className="md:col-span-2 p-4 rounded-xl border border-sand bg-cream/30 flex flex-col items-center text-center">
              <span className="text-[11px] font-semibold text-brown mb-2 flex items-center gap-1">
                <Sparkles size={13} />
                <span>Verified Raast QR Standee</span>
              </span>

              {paymentSettings?.raastId || paymentSettings?.accountTitle || paymentSettings?.customQrImage ? (
                <>
                  <div className="bg-white p-2.5 rounded-xl border border-sand shadow-sm mb-3">
                    <img
                      src={
                        paymentSettings?.customQrImage ||
                        getRaastQRImageUrl(
                          buildRaastEMVCoQR({
                            raastId: paymentSettings?.raastId,
                            iban: paymentSettings?.iban,
                            accountTitle: paymentSettings?.accountTitle,
                            amount: 0
                          }),
                          240
                        )
                      }
                      alt="Official Raast Payment QR Code"
                      className="w-36 h-36 object-contain rounded-lg"
                    />
                  </div>

                  <div className="text-[11px] text-ink font-medium leading-tight mb-3">
                    <p className="font-bold">{paymentSettings?.accountTitle || 'Wedding Host'}</p>
                    {paymentSettings?.raastId && <p className="text-taupe font-mono mt-0.5">{paymentSettings.raastId}</p>}
                    <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                      {paymentSettings?.customQrImage ? 'Official Bank QR Image' : 'EMVCo Interoperable (pk.raast)'}
                    </p>
                    {paymentSettings?.iban && (
                      <p className="text-[9px] text-taupe font-mono mt-0.5">{paymentSettings.iban}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center w-full">
                    <a
                      href={
                        paymentSettings?.customQrImage ||
                        getRaastQRImageUrl(
                          buildRaastEMVCoQR({
                            raastId: paymentSettings?.raastId,
                            iban: paymentSettings?.iban,
                            accountTitle: paymentSettings?.accountTitle,
                            amount: 0
                          }),
                          600
                        )
                      }
                      target="_blank"
                      download="neota_raast_official_qr.png"
                      rel="noreferrer"
                      className="btn text-xs !py-1.5 !px-3 bg-white hover:bg-cream border border-sand shadow-sm flex items-center gap-1"
                    >
                      <Download size={13} />
                      <span>Download QR</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn text-xs !py-1.5 !px-3 hover:bg-cream border border-sand shadow-sm flex items-center gap-1"
                      title="Print Counter Standee"
                    >
                      <Printer size={13} />
                      <span>Print Standee</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-6 px-3 text-center text-xs text-taupe">
                  <QrCode size={36} className="mx-auto text-taupe/60 mb-2" />
                  <p className="font-semibold text-ink mb-1">No Raast Account Set</p>
                  <p className="text-[11px]">Enter your real mobile number and account title on the left to generate your live wedding QR standee.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Language Preferences Card */}
        <div className="card p-6 bg-white shadow-sm border border-sand">
          <h2 className="text-lg font-serif mb-1 flex items-center gap-2 text-ink">
            <Globe size={18} className="text-brown" />
            <span>Language & Region</span>
          </h2>
          <span className="text-[11px] text-taupe font-serif block ml-6 mb-3">زبان اور علاقائی ترتیبات کا انتخاب</span>
          <p className="text-xs text-taupe mb-4">Choose your preferred ledger interface language.</p>

          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('en')}
              className={`btn ${language === 'en' ? 'btn-p' : 'hover:bg-cream'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ur')}
              className={`btn ${language === 'ur' ? 'btn-p font-medium' : 'hover:bg-cream'}`}
            >
              اردو (Urdu)
            </button>
          </div>
        </div>

        {/* Database Backup & Restore */}
        <div className="card p-6 bg-white shadow-sm border border-sand">
          <h2 className="text-lg font-serif mb-2 flex items-center gap-2 text-ink">
            <HardDrive size={18} className="text-brown" />
            <span>{t('backupDatabase')}</span>
          </h2>
          <p className="text-xs text-taupe mb-4">
            Download your complete ledger (all events, guests, salamii records, returns) to a single JSON file. You can restore it on any computer or mobile browser.
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={exportDatabaseJSON} className="btn hover:bg-cream">
              <Download size={16} />
              <span>Download JSON Backup</span>
            </button>

            <button onClick={() => fileRef.current?.click()} className="btn hover:bg-cream">
              <Upload size={16} />
              <span>Restore from Backup File</span>
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleRestoreFile} className="hidden" />

            <button onClick={resetToCleanData} className="btn text-taupe hover:text-red-700 hover:bg-red-50 border border-sand">
              <RefreshCw size={15} />
              <span>Clear All Ledger Data</span>
            </button>

            <button onClick={loadDemoData} className="btn text-taupe hover:text-ink hover:bg-cream border border-sand">
              <Sparkles size={15} className="text-amber-600" />
              <span>Load Sample Demo Data</span>
            </button>
          </div>
        </div>

        {/* Cloud Synchronization Card */}
        <div className="card p-6 bg-white shadow-sm border border-sand">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-lg font-serif flex items-center gap-2 text-ink">
                <Cloud size={18} className="text-brown" />
                <span>Cloud Backup & Synchronization</span>
              </h2>
              <span className="text-[11px] text-taupe font-serif block ml-6">کلاؤڈ سسٹمز اور لائیو ڈیٹا سنک</span>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="tag bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 py-1 px-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Cloud Active ✓</span>
                </span>
              ) : (
                <span className="tag bg-cream text-taupe font-medium text-xs py-1 px-2.5">
                  Offline Local Mode
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-taupe leading-relaxed mb-4">
            {isConnected
              ? 'Aap ka family wedding ledger cloud ke saath mukammal tor par mehfooz aur synced hai. Har entry 256-bit TLS aur Row Level Security ke tehat cloud par save hoti hai.'
              : 'Application offline local mode mein kaam kar rahi hai. Internet connect hote hi records mehfooz rahenge.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={syncWithCloud}
              disabled={cloudSyncStatus === 'syncing'}
              className="btn btn-p text-xs py-2.5 px-4 flex flex-col items-center justify-center rounded-xl shadow-sm"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                {cloudSyncStatus === 'syncing' ? <Loader2 size={14} className="animate-spin text-white" /> : <Cloud size={14} />}
                <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Now with Cloud'}</span>
              </span>
              <span className="text-[10px] opacity-80 font-serif">کلاؤڈ کے ساتھ سنک کریں</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
