// ========================================================
// Smart Voice Recognition for Urdu, Roman Urdu & English
// Optimized for Pakistani Wedding Salamii & Neota Ledgers
// ========================================================

const urduToAscii = s => (s || '')
  .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

const AMOUNT_PATTERNS = [
  // Lakhs
  { words: ['دس لاکھ', '10 لاکھ', '10 lakh', 'das lakh', '10lakh'], val: 1000000 },
  { words: ['پانچ لاکھ', '5 لاکھ', '5 lakh', 'panch lakh', '5lakh'], val: 500000 },
  { words: ['دو لاکھ', '2 لاکھ', '2 lakh', 'do lakh', '2lakh'], val: 200000 },
  { words: ['ایک لاکھ', '1 لاکھ', 'ایک لکھ', '1 lakh', 'ek lakh', 'one lakh', 'لاکھ', 'lakh', '1lakh'], val: 100000 },

  // Thousands (Highest to Lowest)
  { words: ['پچانوے ہزار', '95 ہزار', '95 hazar', '95k', '95 thousand'], val: 95000 },
  { words: ['نوے ہزار', '90 ہزار', '90 hazar', '90k', '90 thousand'], val: 90000 },
  { words: ['پچاسی ہزار', '85 ہزار', '85 hazar', '85k', '85 thousand'], val: 85000 },
  { words: ['اسی ہزار', '80 ہزار', '80 hazar', '80k', '80 thousand'], val: 80000 },
  { words: ['پچھتر ہزار', '75 ہزار', '75 hazar', '75k', '75 thousand', 'pichehattar hazar'], val: 75000 },
  { words: ['ستر ہزار', '70 ہزار', '70 hazar', '70k', '70 thousand', 'sattar hazar'], val: 70000 },
  { words: ['پینسٹھ ہزار', '65 ہزار', '65 hazar', '65k', '65 thousand'], val: 65000 },
  { words: ['ساٹھ ہزار', '60 ہزار', '60 hazar', '60k', '60 thousand', 'saath hazar'], val: 60000 },
  { words: ['پچپن ہزار', '55 ہزار', '55 hazar', '55k', '55 thousand'], val: 55000 },
  { words: ['پچاس ہزار', '50 ہزار', '50 hazar', '50 thousand', '50k', 'fifty thousand', 'pachas hazar'], val: 50000 },
  { words: ['پینتالیس ہزار', '45 ہزار', '45 hazar', '45k', '45 thousand', 'paintalis hazar'], val: 45000 },
  { words: ['چالیس ہزار', '40 ہزار', '40 hazar', '40 thousand', '40k', 'forty thousand', 'chalis hazar'], val: 40000 },
  { words: ['پینتیس ہزار', '35 ہزار', '35 hazar', '35k', '35 thousand', 'paintis hazar'], val: 35000 },
  { words: ['تیس ہزار', '30 ہزار', '30 hazar', '30 thousand', '30k', 'thirty thousand', 'tees hazar'], val: 30000 },
  { words: ['پچیس ہزار', '25 ہزار', '25 hazar', '25 thousand', '25k', 'twenty five thousand', 'pachees hazar'], val: 25000 },
  { words: ['بیس ہزار', '20 ہزار', '20 hazar', '20 thousand', '20k', 'twenty thousand', 'bees hazar'], val: 20000 },
  { words: ['پندرہ ہزار', '15 ہزار', '15 hazar', '15 thousand', '15k', 'fifteen thousand', 'pandrah hazar'], val: 15000 },
  { words: ['چودہ ہزار', '14 ہزار', '14 hazar', '14k', '14 thousand', 'chodah hazar'], val: 14000 },
  { words: ['تیرہ ہزار', '13 ہزار', '13 hazar', '13k', '13 thousand', 'terah hazar'], val: 13000 },
  { words: ['بارہ ہزار', '12 ہزار', '12 hazar', '12k', '12 thousand', 'barah hazar'], val: 12000 },
  { words: ['گیارہ ہزار', '11 ہزار', '11 hazar', '11k', '11 thousand', 'gyarah hazar'], val: 11000 },
  { words: ['دس ہزار', '10 ہزار', '10 hazar', '10 thousand', '10k', 'ten thousand', 'das hazar'], val: 10000 },
  { words: ['نو ہزار', '9 ہزار', '9 hazar', '9 thousand', '9k', 'nine thousand', 'nau hazar'], val: 9000 },
  { words: ['آٹھ ہزار', '8 ہزار', '8 hazar', '8 thousand', '8k', 'eight thousand', 'aath hazar', 'ath hazar'], val: 8000 },
  { words: ['سات ہزار', '7 ہزار', '7 hazar', '7 thousand', '7k', 'seven thousand', 'sat hazar', 'saat hazar'], val: 7000 },
  { words: ['چھ ہزار', '6 ہزار', '6 hazar', '6 thousand', '6k', 'six thousand', 'chay hazar', 'che hazar'], val: 6000 },
  { words: ['پانچ ہزار', '5 ہزار', 'پنج ہزار', '5 hazar', '5 thousand', '5k', 'five thousand', 'panch hazar'], val: 5000 },
  { words: ['چار ہزار', '4 ہزار', '4 hazar', '4 thousand', '4k', 'four thousand', 'char hazar'], val: 4000 },
  { words: ['تین ہزار', '3 ہزار', '3 hazar', '3 thousand', '3k', 'three thousand', 'teen hazar'], val: 3000 },
  { words: ['ڈھائی ہزار', 'dhai hazar', '25 سو', 'پچیس سو', 'pachees sau'], val: 2500 },
  { words: ['اکیس سو', '21 سو', '21 sau', 'ikkees sau'], val: 2100 },
  { words: ['دو ہزار', '2 ہزار', '2 hazar', '2 thousand', '2k', 'two thousand', 'do hazar'], val: 2000 },
  { words: ['ڈیڑھ ہزار', 'dedh hazar', '15 سو', 'پندرہ سو', 'pandrah sau'], val: 1500 },
  { words: ['بارہ سو', '12 سو', '12 sau', 'barah sau'], val: 1200 },
  { words: ['گیارہ سو', '11 سو', '11 sau', 'gyarah sau'], val: 1100 },
  { words: ['ایک ہزار', '1 ہزار', '1 hazar', '1 thousand', '1k', 'one thousand', 'ek hazar', 'ہزار', 'hazar', 'thousand'], val: 1000 },

  // Hundreds
  { words: ['پانچ سو', '5 سو', '5 sau', 'panch sau', 'five hundred'], val: 500 },
  { words: ['چار سو', '4 سو', '4 sau', 'char sau', 'four hundred'], val: 400 },
  { words: ['تین سو', '3 سو', '3 sau', 'teen sau', 'three hundred'], val: 300 },
  { words: ['دو سو', '2 سو', '2 sau', 'do sau', 'two hundred'], val: 200 },
  { words: ['ایک سو', '1 سو', '1 sau', 'ek sau', 'one hundred', 'سو', 'sau', 'hundred'], val: 100 }
];

export class VoiceRecognition {
  constructor(onResult, onError, onStatusChange) {
    this.onResult = onResult
    this.onError = onError
    this.onStatusChange = onStatusChange
    this.recognition = null
    this.isListening = false

    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = false
        this.recognition.maxAlternatives = 1
        this.recognition.lang = 'ur-PK'

        this.recognition.onstart = () => {
          this.isListening = true
          this.onStatusChange?.(true)
        }

        this.recognition.onend = () => {
          this.isListening = false
          this.onStatusChange?.(false)
        }

        this.recognition.onerror = err => {
          this.isListening = false
          this.onStatusChange?.(false)
          if (err.error === 'not-allowed') {
            this.onError?.('مائیکروفون کی اجازت نہیں ملی۔ براؤزر سیٹنگز میں جا کر مائیک کو Allow کریں۔ (Microphone permission denied)')
          } else if (err.error !== 'no-speech' && err.error !== 'aborted') {
            this.onError?.(err.error || 'Speech recognition error')
          }
        }

        this.recognition.onresult = event => {
          let transcript = ''
          if (event.results && event.results.length > 0) {
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i][0]) {
                transcript += ' ' + event.results[i][0].transcript
              }
            }
          }
          const parsed = this.parseTranscript(transcript.trim())
          this.onResult?.(parsed)
        }
      }
    }
  }

  isSupported() {
    return Boolean(this.recognition)
  }

  start(lang = 'ur-PK') {
    if (!this.recognition) return false
    try {
      if (this.isListening) {
        this.recognition.stop()
      }
      this.recognition.lang = lang
      this.recognition.start()
      return true
    } catch (e) {
      console.warn('Speech recognition start failed:', e)
      return false
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
      } catch (e) {
        // ignore
      }
      this.isListening = false
      this.onStatusChange?.(false)
    }
  }

  // Parse natural spoken phrase into { name, amount, location, rawText }
  parseTranscript(rawText) {
    let clean = urduToAscii(rawText || '').trim()
    let amount = 0
    let city = ''

    // Clean currency words & salamii phrases
    clean = clean.replace(/روپے|روپیہ|روپئے|rupees|rupee|rs\.?|pkr/gi, ' ')
    clean = clean.replace(/سلامی|نیوتا|کی طرف سے|کی سلامی|نقد/gi, ' ')

    // 1. Standalone digits match first (e.g. 5000, 10000, 50,000, 1500, etc.)
    const standaloneDigitsRegex = /(?:^|\s)(\d{3,7})(?:\s|$)/
    const directMatch = clean.match(standaloneDigitsRegex)
    if (directMatch) {
      amount = Number(directMatch[1])
      clean = clean.replace(directMatch[0], ' ').trim()
    }

    // 2. Phrase matching (ordered by specificity)
    if (amount === 0) {
      for (const item of AMOUNT_PATTERNS) {
        for (const w of item.words) {
          const lowerClean = clean.toLowerCase()
          const lowerW = w.toLowerCase()
          const idx = lowerClean.indexOf(lowerW)
          if (idx !== -1) {
            const charBefore = idx > 0 ? lowerClean[idx - 1] : ' '
            const charAfter = idx + lowerW.length < lowerClean.length ? lowerClean[idx + lowerW.length] : ' '
            const isWordChar = c => /[a-z0-9]/i.test(c)

            if (!(isWordChar(charBefore) && isWordChar(lowerW[0])) && !(isWordChar(charAfter) && isWordChar(lowerW[lowerW.length - 1]))) {
              amount = item.val
              clean = (clean.slice(0, idx) + ' ' + clean.slice(idx + lowerW.length)).trim()
              break
            }
          }
        }
        if (amount > 0) break
      }
    }

    // 3. Fallback for any remaining number >= 100
    if (amount === 0) {
      const numMatch = clean.match(/(\d+)/)
      if (numMatch && Number(numMatch[1]) >= 100) {
        amount = Number(numMatch[1])
        clean = clean.replace(numMatch[0], ' ').trim()
      }
    }

    // 4. Extract common Pakistani cities if mentioned
    const cities = ['اسلام آباد', 'راولپنڈی', 'لاہور', 'گوجرانوالہ', 'فیصل آباد', 'کراچی', 'پشاور', 'ملتان', 'Islamabad', 'Rawalpindi', 'Lahore', 'Gujranwala', 'Karachi']
    for (const c of cities) {
      if (clean.toLowerCase().includes(c.toLowerCase())) {
        city = c
        clean = clean.replace(new RegExp(c, 'gi'), ' ').trim()
        break
      }
    }

    // Clean honorific title words from name
    clean = clean.replace(/صاحب|خان|صاحبہ|بھائی|انکل|چاچا|میاں|چوہدری|جناب/gi, '').replace(/\s+/g, ' ').trim()

    // If clean is empty (i.e. only amount was spoken), name is empty
    const name = clean

    return {
      name,
      amount,
      city,
      rawText
    }
  }
}
