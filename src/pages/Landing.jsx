import { Link } from 'react-router-dom'
import {
  Zap, History, Users, Printer, Send, ShieldCheck, ArrowRight,
  Sparkles, Play, Calendar, CheckCircle2, Heart, Award, Lock, Smartphone
} from 'lucide-react'
import { Logo } from '../components/Layout'

const FEATURES = [
  {
    icon: Zap,
    title: 'Track Gifts & Cash in Real Time',
    desc: 'Record incoming salamii envelopes and digital Raast payments in seconds during high-speed wedding functions.'
  },
  {
    icon: Users,
    title: 'Manage Guests & Invitations',
    desc: 'Prepare invited guest lists with full lineage (father name, city, relationship) and track RSVP attendance.'
  },
  {
    icon: Calendar,
    title: 'Multiple Events & Functions',
    desc: 'Organize Mehndi, Barat, and Walima under one family umbrella with unified financial reconciliation.'
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable Data',
    desc: 'Local-first offline resilience ensures you never lose an entry even inside basements with zero mobile reception.'
  }
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#252A26] flex flex-col font-sans">
      {/* Top Navigation Bar matching reference */}
      <header className="sticky top-0 z-40 bg-[#FAF7F0]/90 backdrop-blur-md border-b border-[#E7E0D4] px-5 md:px-10 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Logo />

          {/* Center Navigation Links matching reference */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#77776D]">
            <a href="#home" className="text-[#153C32] font-semibold">Home</a>
            <a href="#features" className="hover:text-[#153C32] transition">Features</a>
            <a href="#pricing" className="hover:text-[#153C32] transition">Pricing</a>
            <a href="#about" className="hover:text-[#153C32] transition">About</a>
            <a href="#contact" className="hover:text-[#153C32] transition">Contact</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs md:text-sm font-semibold px-4 py-2 rounded-xl text-[#252A26] hover:bg-[#F3EBDD] transition"
            >
              Log In
            </Link>
            <Link
              to="/app"
              className="btn btn-p text-xs md:text-sm !py-2.5 !px-5 rounded-full shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Split Layout matching reference Panel 1 */}
      <section id="home" className="mx-auto max-w-7xl px-5 md:px-10 pt-8 md:pt-14 pb-16 md:pb-20 flex-1 relative overflow-hidden">
        {/* Left Botanical Vine Flourish */}
        <div className="absolute top-2 left-0 w-36 h-36 opacity-15 pointer-events-none text-[#063D32]">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M0 0 Q30 20 40 50 Q50 80 80 100" stroke="#063D32" strokeWidth="2" fill="none" />
            <path d="M20 15 C15 5 25 0 30 10 C32 15 28 20 20 15 Z" />
            <path d="M35 35 C30 25 40 20 45 30 C47 35 43 40 35 35 Z" />
            <path d="M48 65 C40 58 52 50 58 60 C60 65 56 70 48 65 Z" />
          </svg>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Column: Headline, Description & Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Badge matching reference */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D7B36A]/60 shadow-xs">
              <Sparkles size={14} className="text-[#D7B36A]" />
              <span className="text-xs font-semibold text-[#063D32]">Trusted by Families Across Pakistan</span>
            </div>

            {/* Main Headline matching reference */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#202A25] font-normal leading-[1.12] tracking-tight">
              The Smarter Way<br />
              to Manage Your<br />
              <span className="italic font-serif text-[#063D32]">Wedding Gifts & Cash</span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-[#77776E] max-w-xl leading-relaxed font-sans">
              NEOTA is a modern digital ledger for Pakistani families, helping you track gifts, cash, and guests with ease — for a stress-free and well-organized celebration.
            </p>

            {/* Action Buttons matching reference */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                to="/app"
                className="btn btn-p !py-3.5 !px-8 rounded-full text-sm font-semibold shadow-md flex items-center gap-2 bg-[#063D32] text-white hover:bg-[#082F28]"
              >
                <span>Get Started Free</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold border border-[#E8E0D1] bg-white text-[#202A25] hover:bg-[#F3EBDD] transition shadow-xs"
              >
                <span>Sign In</span>
              </Link>
            </div>

            {/* 4 Feature highlight pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-5 border-t border-[#E8E0D1]">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="p-3 rounded-xl bg-white border border-[#E8E0D1] shadow-xs">
                    <Icon size={16} className="text-[#D7B36A] mb-1.5" />
                    <span className="block text-xs font-semibold text-[#202A25] leading-snug">{f.title}</span>
                  </div>
                )
              })}
            </div>

            {/* Social Proof matching reference */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-[#77776E]">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-[#063D32] text-white text-[10px] flex items-center justify-center font-bold">AK</div>
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-[#D7B36A] text-[#063D32] text-[10px] flex items-center justify-center font-bold">FA</div>
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-[#27845B] text-white text-[10px] flex items-center justify-center font-bold">UT</div>
                </div>
                <div>
                  <span className="font-bold text-[#202A25] block">500+ Happy Families</span>
                  <span className="text-[11px] text-[#77776E]">Across Lahore, Karachi & Islamabad</span>
                </div>
              </div>
              <div className="italic text-[#77776E] border-l border-[#E8E0D1] pl-3 hidden sm:block">
                “Modern tools for meaningful celebrations”
              </div>
            </div>
          </div>

          {/* Right Column: Arched Luxury Wedding Stage & Mockup matching reference */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Arched Architectural Frame */}
            <div className="relative w-full max-w-md aspect-[4/5] rounded-t-[140px] rounded-b-3xl overflow-hidden border-2 border-[#D7B36A]/60 shadow-elevated bg-gradient-to-b from-[#F3EBDD] to-[#FAF7EF] p-2.5">
              <div className="relative w-full h-full rounded-t-[130px] rounded-b-2xl overflow-hidden">
                <img
                  src="/images/wedding_hero.jpg"
                  alt="Pakistani Luxury Wedding Stage"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#063D32]/85 via-transparent to-black/20" />

                {/* Floating Tablet Mockup Overlay Card */}
                <div className="absolute bottom-5 inset-x-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8E0D1] shadow-xl text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D1] mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#063D32] flex items-center justify-center text-white text-[10px] font-bold">
                        N
                      </div>
                      <span className="font-serif text-xs font-bold text-[#202A25]">Walima Guest Ledger</span>
                    </div>
                    <span className="text-[10px] bg-[#DCE9DE] text-[#27845B] font-bold px-2 py-0.5 rounded-full">
                      ● Live
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center py-1 border-b border-[#E8E0D1]/60">
                      <span className="text-[#202A25] font-medium">Ahmed Khan</span>
                      <span className="font-serif font-bold text-[#27845B]">Rs 50,000</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#202A25] font-medium">Fatima Ali</span>
                      <span className="font-serif font-bold text-[#27845B]">Rs 25,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof / Statistics Strip matching reference */}
      <section className="bg-white border-y border-[#E7E0D4] py-8 px-5 md:px-10">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32]">
              <Users size={22} className="text-[#C7A56A]" />
            </div>
            <div className="text-left">
              <span className="block font-serif text-2xl md:text-3xl font-bold text-[#252A26]">500+</span>
              <span className="text-xs text-[#77776D] font-medium">Happy Families</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32]">
              <Calendar size={22} className="text-[#C7A56A]" />
            </div>
            <div className="text-left">
              <span className="block font-serif text-2xl md:text-3xl font-bold text-[#252A26]">1,200+</span>
              <span className="text-xs text-[#77776D] font-medium">Events Managed</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32]">
              <Heart size={22} className="text-[#C7A56A]" />
            </div>
            <div className="text-left">
              <span className="block font-serif text-2xl md:text-3xl font-bold text-[#252A26]">50,000+</span>
              <span className="text-xs text-[#77776D] font-medium">Guests Tracked</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EBDD] flex items-center justify-center text-[#153C32]">
              <ShieldCheck size={22} className="text-[#287A50]" />
            </div>
            <div className="text-left">
              <span className="block font-serif text-2xl md:text-3xl font-bold text-[#252A26]">99.9%</span>
              <span className="text-xs text-[#77776D] font-medium">System Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive Section */}
      <section id="features" className="mx-auto max-w-7xl px-5 md:px-10 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C7A56A] block mb-2">
            DESIGNED FOR WEDDING CHAOS
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-[#252A26]">
            Every Rupee Recorded, Every Memory Preserved
          </h2>
          <p className="text-sm text-[#77776D] mt-3 leading-relaxed">
            Engineered specifically for Pakistani weddings where hundreds of envelopes exchange hands in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-7 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D4] flex items-center justify-center mb-5">
                <Zap size={22} className="text-[#153C32]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#252A26] mb-2">Lightning Quick Entry</h3>
              <p className="text-xs text-[#77776D] leading-relaxed">
                1-click amount presets (Rs 5k, 10k, 20k), smart keyboard navigation, and instant guest matching reduce entry time to under 3 seconds per envelope.
              </p>
            </div>
          </div>

          <div className="card p-7 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D4] flex items-center justify-center mb-5">
                <History size={22} className="text-[#C7A56A]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#252A26] mb-2">Reciprocity & Hisaab (بدلہ)</h3>
              <p className="text-xs text-[#77776D] leading-relaxed">
                Know instantly what relatives gave at previous family functions and automatically calculate inflation-adjusted return values years later.
              </p>
            </div>
          </div>

          <div className="card p-7 bg-white border border-[#E7E0D4] shadow-card rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D4] flex items-center justify-center mb-5">
                <Printer size={22} className="text-[#287A50]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#252A26] mb-2">Lal Jild Ceremonial Book</h3>
              <p className="text-xs text-[#77776D] leading-relaxed">
                Generate and print traditional red-bordered Lal Jild (لال جِلد) ledger sheets ready to be signed and preserved by family elders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E7E0D4] py-10 px-5 md:px-10 bg-[#FAF7F0] text-xs text-[#77776D]">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p>© {new Date().getFullYear()} NEOTA · Pakistan's Premier Digital Wedding Ledger (نیوتا و سلامی کتاب). All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-[#153C32]">Sign In</Link>
            <Link to="/app" className="hover:text-[#153C32]">Launch App</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

