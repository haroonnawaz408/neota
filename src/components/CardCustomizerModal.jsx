import { useState, useRef } from 'react'
import { X, Check, Upload, Sparkles, Image as ImageIcon, Clock, Users, MapPin, Heart, Plus, Trash2, Music, QrCode, Phone } from 'lucide-react'
import { useStore } from '../store'
import { DEFAULT_CARD_CONFIG } from '../data'

const THEMES = [
  { id: 'mughal_gold', label: 'Mughal Gold (شاہی گولڈ)', border: 'border-[#D4AF37]', bg: 'bg-[#FDFBF7]', text: 'text-[#654B3B]', accent: '#D4AF37' },
  { id: 'emerald_velvet', label: 'Emerald Green (زمردی سبز)', border: 'border-[#1C4E38]', bg: 'bg-[#F2F7F4]', text: 'text-[#1C4E38]', accent: '#1C4E38' },
  { id: 'ruby_maroon', label: 'Ruby Maroon (یاقوتی لال)', border: 'border-[#721C24]', bg: 'bg-[#FDF6F6]', text: 'text-[#721C24]', accent: '#721C24' },
  { id: 'royal_navy', label: 'Royal Navy (شاہی نیوی)', border: 'border-[#1A2E40]', bg: 'bg-[#F2F6FA]', text: 'text-[#1A2E40]', accent: '#1A2E40' }
]

export default function CardCustomizerModal({ isOpen, onClose, eventId }) {
  const { events, updateCardConfig } = useStore()
  const event = events.find(e => e.id === eventId) || events[0]
  const config = event?.cardConfig || DEFAULT_CARD_CONFIG

  const [tab, setTab] = useState('style')
  const [formData, setFormData] = useState({
    mode: config.mode || 'template',
    customImageUrl: config.customImageUrl || '',
    theme: config.theme || 'mughal_gold',
    bismillahText: config.bismillahText || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    quranicAyat: config.quranicAyat || 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
    hostParents: config.hostParents || 'چوہدری محمد طارق و اہلیہ',
    hostTitle: config.hostTitle || 'والدین و سرپرست',
    groomName: config.groomName || 'محمد حمزہ طارق',
    groomFatherName: config.groomFatherName || 'چوہدری محمد طارق',
    groomTitle: config.groomTitle || 'فرزندِ ارجمند',
    brideName: config.brideName || 'عائشہ نور',
    brideFatherName: config.brideFatherName || 'ملک محمد اسلم',
    brideTitle: config.brideTitle || 'دخترِ گرامی',
    familyLookingForward: config.familyLookingForward || 'تایا، چچا، ماموں، بھائی، اور جملہ اہل خانہ',
    venueName: event?.venue || config.venueName || 'Pearl Banquet',
    venueAddress: config.venueAddress || 'Canal Road, Islamabad',
    googleMapsUrl: config.googleMapsUrl || '',
    programTimeline: config.programTimeline?.length ? config.programTimeline : [
      { time: '7:30 PM', title: 'آمدِ بارات و استقبال (Arrival)' },
      { time: '8:15 PM', title: 'رسمِ نکاح و دعا (Nikkah & Dua)' },
      { time: '9:00 PM', title: 'طعامِ طعام (Royal Dinner)' },
      { time: '10:30 PM', title: 'رخصتی (Rukhsati Ceremony)' }
    ],
    rsvpContacts: config.rsvpContacts || 'چوہدری طارق: 0300-1122334 | بلال طارق: 0321-9988776',
    enableAudioChime: config.enableAudioChime ?? true,
    enableDuaWall: config.enableDuaWall ?? true,
    enableRaastShagun: config.enableRaastShagun ?? true
  })

  const fileInputRef = useRef()

  if (!isOpen) return null

  const handleImageUpload = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setFormData(prev => ({
        ...prev,
        mode: 'custom_image',
        customImageUrl: ev.target?.result
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleTimelineChange = (idx, field, val) => {
    const updated = [...formData.programTimeline]
    updated[idx] = { ...updated[idx], [field]: val }
    setFormData({ ...formData, programTimeline: updated })
  }

  const addTimelineItem = () => {
    setFormData({
      ...formData,
      programTimeline: [...formData.programTimeline, { time: '8:00 PM', title: 'رسم / تقریب' }]
    })
  }

  const removeTimelineItem = idx => {
    setFormData({
      ...formData,
      programTimeline: formData.programTimeline.filter((_, i) => i !== idx)
    })
  }

  const handleSave = e => {
    e.preventDefault()
    updateCardConfig(event.id, formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 md:p-7 shadow-2xl relative border border-sand text-ink max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sand mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-brown">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold">Digital Shadi Card Studio (کارڈ بلڈر)</h2>
              <p className="text-xs text-taupe">Event: <b>{event.title}</b></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream text-taupe hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-sand pb-3 mb-4 overflow-x-auto shrink-0 text-xs font-medium">
          {[
            ['style', '1. Style & Image (ڈیزائن / تصویر)'],
            ['family', '2. Family & Couple (دولہا دلہن و خاندان)'],
            ['program', '3. Timings & Venue (پروگرام و ہال)'],
            ['interactive', '4. Features & RSVP (فیچرز)']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${tab === id ? 'bg-brown text-ivory font-semibold shadow-sm' : 'bg-cream/40 text-taupe hover:bg-cream'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          {/* TAB 1: STYLE & IMAGE */}
          {tab === 'style' && (
            <div className="space-y-5">
              <div>
                <label className="label">Card Presentation Mode (کارڈ کا طریقہ کار)</label>
                <div className="grid sm:grid-cols-2 gap-3 mt-1.5">
                  <div
                    onClick={() => setFormData({ ...formData, mode: 'template' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition text-center ${formData.mode === 'template' ? 'border-brown bg-cream/40 shadow-sm' : 'border-sand hover:bg-cream/20'}`}
                  >
                    <Sparkles size={24} className="mx-auto mb-1.5 text-brown" />
                    <b className="text-sm block">Royal Digital Template</b>
                    <p className="text-[11px] text-taupe mt-1">Authentic Pakistani royal calligraphy & customizable golden cards.</p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, mode: 'custom_image' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition text-center ${formData.mode === 'custom_image' ? 'border-brown bg-cream/40 shadow-sm' : 'border-sand hover:bg-cream/20'}`}
                  >
                    <ImageIcon size={24} className="mx-auto mb-1.5 text-brown" />
                    <b className="text-sm block">Upload Custom Card Design</b>
                    <p className="text-[11px] text-taupe mt-1">Upload your own printing press / graphic designer image (PNG/JPG).</p>
                  </div>
                </div>
              </div>

              {/* Custom Image Upload Section */}
              {formData.mode === 'custom_image' && (
                <div className="p-4 rounded-2xl bg-cream/20 border border-sand">
                  <label className="label">Upload Card Image (کارڈ کی تصویر اپلوڈ کریں)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-sand rounded-2xl p-6 text-center cursor-pointer hover:bg-cream/40 transition flex flex-col items-center justify-center gap-2"
                  >
                    {formData.customImageUrl ? (
                      <div>
                        <img
                          src={formData.customImageUrl}
                          alt="Custom Card Preview"
                          className="max-h-48 rounded-xl object-contain shadow-md mx-auto mb-2"
                        />
                        <span className="btn text-xs !py-1 !px-3 bg-white border border-sand">Change Image</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="text-brown/70" />
                        <span className="font-semibold text-sm">Click to choose image or drag & drop</span>
                        <span className="text-[10px] text-taupe">Supports JPG, PNG, WEBP (Max 5MB)</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Theme Selector for Templates */}
              <div>
                <label className="label">Template Theme Palette (کارڈ کا رنگ و تھیم)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1.5">
                  {THEMES.map(th => (
                    <div
                      key={th.id}
                      onClick={() => setFormData({ ...formData, theme: th.id })}
                      className={`p-3 rounded-xl border-2 cursor-pointer text-center transition ${formData.theme === th.id ? `${th.border} ring-2 ring-brown/20 bg-cream/30 font-bold` : 'border-sand hover:bg-cream/20'}`}
                    >
                      <div className="w-6 h-6 rounded-full mx-auto mb-1.5 shadow-xs" style={{ backgroundColor: th.accent }} />
                      <span className="text-[11px] block">{th.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Religious Calligraphy Headers */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="label">Bismillah Calligraphy Header</label>
                  <input
                    className="input font-serif text-right"
                    value={formData.bismillahText}
                    onChange={e => setFormData({ ...formData, bismillahText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Quranic Ayat / Blessing</label>
                  <input
                    className="input font-serif text-right"
                    value={formData.quranicAyat}
                    onChange={e => setFormData({ ...formData, quranicAyat: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAMILY & COUPLE */}
          {tab === 'family' && (
            <div className="space-y-4">
              <div className="p-3 bg-cream/20 rounded-2xl border border-sand space-y-3">
                <span className="font-serif font-bold text-sm text-brown block">Host Family & Parents (میزبان و سرپرست)</span>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Host Parents / Family Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. چوہدری محمد طارق و اہلیہ"
                      value={formData.hostParents}
                      onChange={e => setFormData({ ...formData, hostParents: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Title / Role</label>
                    <input
                      className="input"
                      placeholder="والدین و سرپرست"
                      value={formData.hostTitle}
                      onChange={e => setFormData({ ...formData, hostTitle: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cream/20 rounded-2xl border border-sand space-y-3">
                <span className="font-serif font-bold text-sm text-brown block">Groom Details (دولہا کی تفصیلات)</span>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Groom Full Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. محمد حمزہ طارق"
                      value={formData.groomName}
                      onChange={e => setFormData({ ...formData, groomName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Groom Father Name</label>
                    <input
                      className="input"
                      placeholder="e.g. چوہدری محمد طارق"
                      value={formData.groomFatherName}
                      onChange={e => setFormData({ ...formData, groomFatherName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Groom Title</label>
                    <input
                      className="input"
                      placeholder="فرزندِ ارجمند"
                      value={formData.groomTitle}
                      onChange={e => setFormData({ ...formData, groomTitle: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cream/20 rounded-2xl border border-sand space-y-3">
                <span className="font-serif font-bold text-sm text-brown block">Bride Details (دلہن کی تفصیلات)</span>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Bride Full Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. عائشہ نور"
                      value={formData.brideName}
                      onChange={e => setFormData({ ...formData, brideName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Bride Father Name</label>
                    <input
                      className="input"
                      placeholder="e.g. ملک محمد اسلم"
                      value={formData.brideFatherName}
                      onChange={e => setFormData({ ...formData, brideFatherName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Bride Title</label>
                    <input
                      className="input"
                      placeholder="دخترِ گرامی"
                      value={formData.brideTitle}
                      onChange={e => setFormData({ ...formData, brideTitle: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Looking Forward / Family Blessings (چشم براہ و شکر گزار)</label>
                <input
                  className="input"
                  placeholder="e.g. تایا، چچا، ماموں، بھائی، اور جملہ اہل خانہ"
                  value={formData.familyLookingForward}
                  onChange={e => setFormData({ ...formData, familyLookingForward: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* TAB 3: PROGRAM TIMINGS & VENUE */}
          {tab === 'program' && (
            <div className="space-y-4">
              <div className="p-3 bg-cream/20 rounded-2xl border border-sand space-y-3">
                <span className="font-serif font-bold text-sm text-brown block">Venue & Location (مقام و پتہ)</span>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Marquee / Hall Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. Pearl Banquet Hall"
                      value={formData.venueName}
                      onChange={e => setFormData({ ...formData, venueName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Full City & Street Address</label>
                    <input
                      className="input"
                      placeholder="e.g. Canal Road, Near Expressway, Islamabad"
                      value={formData.venueAddress}
                      onChange={e => setFormData({ ...formData, venueAddress: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Google Maps Link (Optional)</label>
                  <input
                    className="input"
                    placeholder="https://maps.google.com/..."
                    value={formData.googleMapsUrl}
                    onChange={e => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Program Schedule Timeline */}
              <div className="p-3 bg-cream/20 rounded-2xl border border-sand space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-brown">Program Schedule (تقریب کا شیڈول)</span>
                  <button
                    type="button"
                    onClick={addTimelineItem}
                    className="btn text-xs !py-1 !px-2.5 bg-white border border-sand flex items-center gap-1 hover:bg-cream"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.programTimeline.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className="input !w-28 text-center font-mono font-medium"
                        value={item.time}
                        onChange={e => handleTimelineChange(idx, 'time', e.target.value)}
                        placeholder="7:30 PM"
                      />
                      <input
                        className="input flex-1"
                        value={item.title}
                        onChange={e => handleTimelineChange(idx, 'title', e.target.value)}
                        placeholder="آمدِ بارات / طعام"
                      />
                      <button
                        type="button"
                        onClick={() => removeTimelineItem(idx)}
                        className="p-2 text-taupe hover:text-red-600 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE FEATURES & RSVP */}
          {tab === 'interactive' && (
            <div className="space-y-4">
              <div>
                <label className="label">RSVP Family Contacts (رابطہ برائے تصدیق)</label>
                <input
                  className="input"
                  placeholder="e.g. چوہدری طارق: 0300-1122334 | بلال: 0321-9988776"
                  value={formData.rsvpContacts}
                  onChange={e => setFormData({ ...formData, rsvpContacts: e.target.value })}
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-sand bg-cream/20 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Music size={18} className="text-brown" />
                    <div>
                      <b className="text-xs block">Background Shehnai / Rubab Sound</b>
                      <span className="text-[11px] text-taupe">Plays gentle traditional ceremonial audio when card unfolds.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableAudioChime}
                    onChange={e => setFormData({ ...formData, enableAudioChime: e.target.checked })}
                    className="w-4 h-4 text-brown rounded accent-brown"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-sand bg-cream/20 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Heart size={18} className="text-sage" />
                    <div>
                      <b className="text-xs block">Live Dua & Wishes Guestbook Board</b>
                      <span className="text-[11px] text-taupe">Show guests' heartfelt prayers and blessings below the card.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableDuaWall}
                    onChange={e => setFormData({ ...formData, enableDuaWall: e.target.checked })}
                    className="w-4 h-4 text-sage rounded accent-sage"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-sand bg-cream/20 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <QrCode size={18} className="text-[#0A4B32]" />
                    <div>
                      <b className="text-xs block">Overseas / Distant E-Salamii via Raast</b>
                      <span className="text-[11px] text-taupe">Let relatives unable to attend transfer shagun directly via Raast QR.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableRaastShagun}
                    onChange={e => setFormData({ ...formData, enableRaastShagun: e.target.checked })}
                    className="w-4 h-4 text-brown rounded accent-brown"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-sand flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn text-xs !py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-p text-xs !py-2.5 flex items-center gap-1.5 shadow-sm"
            >
              <Check size={16} />
              <span>Save & Update Shadi Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
