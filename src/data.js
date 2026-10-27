export const DEFAULT_CARD_CONFIG = {
  mode: 'template',
  customImageUrl: '',
  theme: 'mughal_gold',
  bismillahText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  quranicAyat: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
  hostParents: '',
  hostTitle: 'والدین و سرپرست',
  groomName: '',
  groomFatherName: '',
  groomTitle: 'فرزندِ ارجمند',
  brideName: '',
  brideFatherName: '',
  brideTitle: 'دخترِ گرامی',
  familyLookingForward: 'جملہ اہل خانہ و عزیز و اقارب',
  programTimeline: [
    { time: '7:30 PM', title: 'آمدِ بارات و استقبال (Arrival)' },
    { time: '8:15 PM', title: 'رسمِ نکاح و دعا (Nikkah & Dua)' },
    { time: '9:00 PM', title: 'طعامِ طعام (Royal Dinner)' },
    { time: '10:30 PM', title: 'رخصتی (Rukhsati Ceremony)' }
  ],
  rsvpContacts: '',
  enableAudioChime: true,
  enableDuaWall: true,
  enableRaastShagun: true
}

// Production initial state: Clean empty arrays (Ready to launch)
export const SAMPLE_EVENTS = []
export const SAMPLE_PEOPLE = []
export const SAMPLE_TX = []
export const SAMPLE_VENDORS = []
export const SAMPLE_TABLES = []

export const DEFAULT_DENOMINATIONS = {
  5000: 0,
  1000: 0,
  500: 0,
  100: 0,
  50: 0,
  20: 0,
  10: 0
}

export const pkr = v => 'Rs ' + Number(v || 0).toLocaleString('en-PK')

export const RELATION_OPTIONS = [
  'Uncle (چچا / ماموں)',
  'Aunt (پھوپھو / خالہ)',
  'Cousin (کزن)',
  'Brother / Sister (بھائی / بہن)',
  'Friend (دوست)',
  'Colleague (ساتھی / کولیگ)',
  'Neighbour (پڑوسی)',
  'In-Laws (سسرال)',
  'Relative (عزیز و اقارب)',
  'Other (دیگر)'
]

export const EVENT_TYPES = [
  'Walima (ولیمہ)',
  'Barat / Wedding (بارات / شادی)',
  'Mehndi (مہندی)',
  'Mayun (مائیوں)',
  'Nikkah (نکاح)',
  'Engagement (منگنی)',
  'Family Function (تقریب)'
]

// Generate friendly WhatsApp receipt link
export const generateWhatsAppLink = (phone, personName, eventTitle, amount, giftType, giftDesc) => {
  const cleanPhone = (phone || '').replace(/\D/g, '')
  const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone
  
  let giftText = pkr(amount)
  if (giftType === 'gold') giftText = `طلائی تحفہ / سونا (${giftDesc || 'Gold'})`
  else if (giftType === 'gift') giftText = `تحفہ (${giftDesc || 'Gift'})`

  const message = `السلام علیکم ${personName || 'محترم'} صاحب!\n\n` +
    `تقریب: "${eventTitle || 'شادی تقریب'}"\n` +
    `آپ کی طرف سے محبت اور سلامی/نیوتا: *${giftText}* بخیر و خوبی وصول پائی۔\n\n` +
    `اللہ تعالیٰ آپ کی تشریف آوری اور تحفے کو باعثِ برکت بنائے۔ تشریف لانے کا بے حد شکریہ!\n\n` +
    `— NEOTA Digital Ledger`

  const encoded = encodeURIComponent(message)
  return intlPhone ? `https://wa.me/${intlPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`
}

// Optional Demo Seed Data (Can be loaded on-demand from Settings for demonstration)
export const DEMO_SEED_DATA = {
  events: [
    {
      id: 'demo_e1',
      title: 'Ayesha & Hamza Walima',
      type: 'Walima',
      status: 'Active',
      date: '2026-11-14',
      venue: 'Pearl Banquet, Islamabad',
      pin: '7860',
      cardConfig: {
        ...DEFAULT_CARD_CONFIG,
        hostParents: 'چوہدری محمد طارق و اہلیہ',
        groomName: 'محمد حمزہ طارق',
        groomFatherName: 'چوہدری محمد طارق',
        brideName: 'عائشہ نور',
        brideFatherName: 'ملک محمد اسلم',
        rsvpContacts: '0300-1122334'
      },
      duas: [
        { id: 'd1', name: 'Chaudhry Farooq', message: 'ماشاء اللہ! اللہ تعالیٰ دونوں کو دنیا و آخرت کی تمام خوشیاں نصیب فرمائے۔ آمین۔', at: new Date().toISOString() }
      ]
    }
  ],
  people: [
    { id: 'demo_p1', name: 'Abdul Rehman', fatherName: 'Muhammad Aslam', relation: 'Uncle', phone: '0300-1111111', address: 'Islamabad', status: 'Invited', events: ['demo_e1'] },
    { id: 'demo_p2', name: 'Bilal Ahmed', fatherName: 'Ahmed Khan', relation: 'Friend', phone: '0333-2222222', address: 'Rawalpindi', status: 'Invited', events: ['demo_e1'] },
    { id: 'demo_p3', name: 'Nadia Iqbal', fatherName: 'Iqbal Hussain', relation: 'Cousin', phone: '0301-5555555', address: 'Lahore', status: 'Invited', events: ['demo_e1'] }
  ],
  tx: [
    { id: 'demo_t1', eventId: 'demo_e1', personId: 'demo_p1', amount: 5000, dir: 'received', giftType: 'cash', at: new Date().toISOString(), note: 'Enveloped' }
  ],
  vendors: [
    { id: 'demo_v1', eventId: 'demo_e1', name: 'Royal Catering', category: 'Catering / Food', contact: '0321-4433221', totalAmount: 450000, advancePaid: 250000, status: 'Partial', notes: 'Menu finalized' }
  ],
  tables: [
    { id: 'demo_tbl_1', eventId: 'demo_e1', number: '1', name: 'VIP Family Table', category: 'VIP', capacity: 10, guestIds: ['demo_p1'] }
  ]
}
