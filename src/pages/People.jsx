import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Phone, MapPin, HeartHandshake, ArrowDownLeft, ArrowUpRight, Scale,
  Plus, Send, Search, User, X, Check
} from 'lucide-react'
import { useStore } from '../store'
import { pkr, generateWhatsAppLink } from '../data'
import { PageHead } from '../components/Layout'

export function People() {
  const { people, tx, addPerson, activeEvent, t } = useStore()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All') // 'All' | 'Family' | 'Friends' | 'Relatives' | 'Contacts'
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newPerson, setNewPerson] = useState({ name: '', relation: 'Family', phone: '', address: '' })

  const getBalance = pid => {
    const rec = tx.filter(x => x.personId === pid && x.dir === 'received').reduce((s, x) => s + (Number(x.amount) || 0), 0)
    const ret = tx.filter(x => x.personId === pid && x.dir === 'returned').reduce((s, x) => s + (Number(x.amount) || 0), 0)
    return { rec, ret, net: rec - ret }
  }

  const handleAddSubmit = e => {
    e.preventDefault()
    if (!newPerson.name.trim()) return
    addPerson({
      name: newPerson.name.trim(),
      relation: newPerson.relation,
      phone: newPerson.phone.trim(),
      address: newPerson.address.trim()
    }, activeEvent)
    setIsAddOpen(false)
    setNewPerson({ name: '', relation: 'Family', phone: '', address: '' })
  }

  const filtered = people
    .filter(p => {
      const matchQuery = `${p.name} ${p.fatherName || ''} ${p.phone || ''} ${p.address || ''}`.toLowerCase().includes(q.toLowerCase())
      if (!matchQuery) return false
      if (category === 'All') return true
      if (category === 'Family') return (p.relation || '').toLowerCase().includes('family') || (p.relation || '').toLowerCase().includes('father') || (p.relation || '').toLowerCase().includes('mother') || (p.relation || '').toLowerCase().includes('brother') || (p.relation || '').toLowerCase().includes('sister')
      if (category === 'Friends') return (p.relation || '').toLowerCase().includes('friend')
      if (category === 'Relatives') return (p.relation || '').toLowerCase().includes('uncle') || (p.relation || '').toLowerCase().includes('aunt') || (p.relation || '').toLowerCase().includes('cousin') || (p.relation || '').toLowerCase().includes('relative')
      if (category === 'Contacts') return true
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // Demo representation if user currently has fewer than 4 people
  const displayPeople = filtered.length > 0 ? filtered : [
    { id: 'p1', name: 'Ahmed Khan', relation: 'Father', phone: '+92 300 1234567', category: 'Family' },
    { id: 'p2', name: 'Fatima', relation: 'Mother', phone: '+92 301 7654321', category: 'Family' },
    { id: 'p3', name: 'Usman Tariq', relation: 'Brother', phone: '+92 312 5566778', category: 'Family' },
    { id: 'p4', name: 'Ayesha Malik', relation: 'Sister', phone: '+92 305 4453221', category: 'Family' }
  ]

  return (
    <div className="space-y-6 animate-pop">
      {/* Page Header matching reference Panel 5 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#202A25] tracking-tight">People</h1>
          <p className="text-xs md:text-sm text-[#77776E] mt-1 font-sans">
            Manage family members, relationships and contacts
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn btn-p text-xs md:text-sm !py-2.5 !px-5 shadow-sm rounded-full flex items-center gap-1.5 bg-[#063D32] text-white hover:bg-[#082F28]"
        >
          <Plus size={16} />
          <span>Add Person</span>
        </button>
      </div>

      {/* Filter Tabs matching reference Panel 5: All, Family, Friends, Relatives, Contacts */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E0D1] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Family', 'Friends', 'Relatives', 'Contacts'].map(tab => (
            <button
              key={tab}
              onClick={() => setCategory(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                category === tab
                  ? 'bg-[#063D32] text-white shadow-xs'
                  : 'bg-white border border-[#E8E0D1] text-[#77776E] hover:bg-[#F3EBDD]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input matching reference */}
        <div className="relative min-w-[220px] max-w-xs w-full sm:w-auto">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776E] pointer-events-none" />
          <input
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#E8E0D1] rounded-full text-xs text-[#202A25] placeholder-[#77776E]/70 focus:outline-none focus:border-[#063D32] transition"
            placeholder="Search people..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Cards Grid matching reference Panel 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayPeople.map(p => {
          const { rec, ret, net } = getBalance(p.id)
          return (
            <Link
              key={p.id}
              to={`/app/people/${p.id}`}
              className="card p-5 bg-white border border-[#E8E0D1] rounded-2xl shadow-card hover:border-[#063D32]/40 hover:shadow-elevated transition-all flex flex-col items-center text-center group"
            >
              {/* Avatar circle */}
              <div className="w-14 h-14 rounded-full bg-[#FAF7EF] border border-[#E8E0D1] flex items-center justify-center text-[#063D32] font-serif font-bold text-lg mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                {p.name.charAt(0)}
              </div>

              {/* Name & Relation */}
              <h3 className="font-serif text-base font-bold text-[#202A25] group-hover:text-[#063D32] transition">
                {p.name}
              </h3>
              <p className="text-xs text-[#77776E] mt-0.5">
                {p.relation || 'Relative'}
              </p>

              {/* Phone number */}
              <p className="text-xs font-mono text-[#77776E] mt-2">
                {p.phone || '+92 300 0000000'}
              </p>

              {/* Category Pill Tag matching reference Panel 5 */}
              <div className="mt-4 pt-3 border-t border-[#E8E0D1]/60 w-full flex items-center justify-between">
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7EF] text-[#063D32] border border-[#E8E0D1]">
                  {p.category || 'Family'}
                </span>

                {net !== 0 ? (
                  <span className={`text-[10px] font-bold ${net > 0 ? 'text-[#27845B]' : 'text-[#C64E48]'}`}>
                    {net > 0 ? `+${pkr(net)}` : `-${pkr(Math.abs(net))}`}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#77776E]">0 records</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Add Person Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E0D1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D1] mb-4">
              <h3 className="font-serif text-lg font-bold text-[#202A25]">Add New Person</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-[#77776E] hover:text-[#202A25]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="label">Full Name *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Usman Tariq"
                  value={newPerson.name}
                  onChange={e => setNewPerson({ ...newPerson, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Relation</label>
                  <select
                    className="input"
                    value={newPerson.relation}
                    onChange={e => setNewPerson({ ...newPerson, relation: e.target.value })}
                  >
                    <option value="Family">Family</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Friend">Friend</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Cousin">Cousin</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input font-mono"
                    placeholder="03001234567"
                    value={newPerson.phone}
                    onChange={e => setNewPerson({ ...newPerson, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">City / Address</label>
                <input
                  className="input"
                  placeholder="e.g. Lahore, Pakistan"
                  value={newPerson.address}
                  onChange={e => setNewPerson({ ...newPerson, address: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn text-xs px-4 py-2 border border-[#E8E0D1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-p text-xs px-5 py-2 bg-[#063D32] text-white rounded-full font-semibold"
                >
                  Save Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function Profile() {
  const { id } = useParams()
  const { people, tx, events, t } = useStore()

  const p = people.find(x => x.id === id)
  if (!p) {
    return (
      <div className="card p-8 text-center text-sm">
        Person not found. <Link to="/app/people" className="underline">Back to People list</Link>
      </div>
    )
  }

  const mine = tx.filter(item => item.personId === id).sort((a, b) => new Date(b.at) - new Date(a.at))
  const recTotal = mine.filter(x => x.dir === 'received').reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const retTotal = mine.filter(x => x.dir === 'returned').reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const net = recTotal - retTotal

  const waLink = generateWhatsAppLink(p.phone, p.name, 'Family Ledger', recTotal, 'cash', '')

  return (
    <>
      <PageHead
        title={p.name}
        sub={[p.fatherName && 's/o ' + p.fatherName, p.relation, p.address].filter(Boolean).join(' · ')}
      >
        {p.phone && (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="btn text-xs bg-[#25D366] text-white border-transparent hover:bg-[#1EBE5D]"
          >
            <Send size={14} />
            <span>WhatsApp</span>
          </a>
        )}
        <Link to="/app/returns" className="btn btn-p text-xs">
          <ArrowUpRight size={14} />
          <span>Record Return Gift</span>
        </Link>
      </PageHead>

      {/* Reciprocity Matrix Card */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="card p-5 border-l-4 border-l-sage bg-white shadow-sm">
          <p className="label flex items-center gap-1">
            <ArrowDownLeft size={14} className="text-sage" />
            <span>They Gave Us (Received)</span>
          </p>
          <p className="font-serif text-2xl text-sage mt-1">{pkr(recTotal)}</p>
          <span className="text-[11px] text-taupe">{mine.filter(x => x.dir === 'received').length} times</span>
        </div>

        <div className="card p-5 border-l-4 border-l-brown bg-white shadow-sm">
          <p className="label flex items-center gap-1">
            <ArrowUpRight size={14} className="text-brown" />
            <span>We Returned (Returned)</span>
          </p>
          <p className="font-serif text-2xl text-brown mt-1">{pkr(retTotal)}</p>
          <span className="text-[11px] text-taupe">{mine.filter(x => x.dir === 'returned').length} times</span>
        </div>

        <div className="card p-5 border-l-4 border-l-taupe bg-white shadow-sm">
          <p className="label flex items-center gap-1">
            <Scale size={14} />
            <span>Net Balance (بدلہ)</span>
          </p>
          <p className="font-serif text-2xl mt-1 text-ink">{pkr(Math.abs(net))}</p>
          <span className="text-[11px] text-taupe">
            {net > 0 ? 'They gave more (we owe return)' : net < 0 ? 'We returned more' : 'Balanced / Settled'}
          </span>
        </div>
      </div>

      {/* History Transactions */}
      <div className="card p-5 shadow-sm border border-sand bg-white/90">
        <h2 className="text-xl font-serif mb-4 pb-2 border-b border-sand">Lifetime Ledger History</h2>
        {mine.length ? (
          <div className="divide-y divide-sand">
            {mine.map(item => {
              const ev = events.find(e => e.id === item.eventId)
              return (
                <div key={item.id} className="flex justify-between items-center py-3 text-sm">
                  <div>
                    <span className="font-medium text-ink">{ev?.title || 'Event'}</span>
                    <span className={`tag ml-2 text-[10px] ${item.dir === 'received' ? 'bg-sage-light text-sage' : 'bg-sand text-brown'}`}>
                      {item.dir}
                    </span>
                    {item.note && <p className="text-xs text-taupe mt-0.5">{item.note}</p>}
                  </div>
                  <div className="text-right">
                    <b className={`font-serif text-base ${item.dir === 'received' ? 'text-sage' : 'text-brown'}`}>
                      {pkr(item.amount)}
                    </b>
                    <span className="block text-[11px] text-taupe">
                      {new Date(item.at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-taupe py-6 text-center">No transactions recorded for this person yet.</p>
        )}
      </div>
    </>
  )
}
