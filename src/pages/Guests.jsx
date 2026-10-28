import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, UserPlus, Download, Trash2, Edit3, X, Check, Users, Phone,
  MapPin, HeartHandshake, Armchair, Search, Plus, ChevronLeft, ChevronRight,
  Eye, Filter
} from 'lucide-react'
import { useStore } from '../store'
import { RELATION_OPTIONS } from '../data'
import { PageHead } from '../components/Layout'
import SeatingPlanner from '../components/SeatingPlanner'

const norm = s => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
const blank = { name: '', fatherName: '', address: '', phone: '', relation: 'Family', status: 'Confirmed', notes: '' }

export default function Guests() {
  const { events, people, addPerson, updatePerson, deletePerson, importPeople, activeEvent, setActiveEvent, t } = useStore()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'invited' | 'confirmed' | 'pending'
  const [f, setF] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [imp, setImp] = useState(false)
  const [csvPreview, setCsvPreview] = useState([])
  const [csvError, setCsvError] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'seating'
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  const fileRef = useRef()

  const currentEvent = events.find(e => String(e.id) === String(activeEvent)) || events[0]
  const eventId = currentEvent?.id || activeEvent

  // Filter list
  const allEventGuests = people.filter(p => (p.events || []).some(id => String(id) === String(eventId)))

  const filteredGuests = allEventGuests
    .filter(p => {
      const matchesSearch = norm(`${p.name} ${p.fatherName || ''} ${p.phone || ''} ${p.address || ''}`).includes(norm(q))
      if (!matchesSearch) return false
      if (statusFilter === 'all') return true
      if (statusFilter === 'invited') return (p.status || '').toLowerCase() === 'invited'
      if (statusFilter === 'confirmed') return (p.status || '').toLowerCase() === 'confirmed'
      if (statusFilter === 'pending') return (p.status || '').toLowerCase() === 'pending' || (p.status || '').toLowerCase() === 'declined'
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize))
  const paginatedGuests = filteredGuests.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const invitedCount = allEventGuests.filter(p => (p.status || '').toLowerCase() === 'invited').length
  const confirmedCount = allEventGuests.filter(p => (p.status || '').toLowerCase() === 'confirmed').length
  const pendingCount = allEventGuests.filter(p => (p.status || '').toLowerCase() === 'pending' || (p.status || '').toLowerCase() === 'declined').length

  const dup = f.name.trim() && people.find(p => norm(p.name) === norm(f.name) && norm(p.fatherName || '') === norm(f.fatherName) && p.id !== editing)

  const submit = e => {
    e.preventDefault()
    if (editing) {
      updatePerson(editing, f)
    } else if (dup) {
      if (!dup.events?.includes(eventId)) {
        updatePerson(dup.id, { events: [...(dup.events || []), eventId] })
      }
    } else {
      addPerson(f, eventId)
    }
    setEditing(null)
    setF(blank)
    setShowAddForm(false)
  }

  // Parse CSV File
  const handleCSVUpload = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError(null)

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const text = event.target?.result
        if (typeof text !== 'string') return
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        if (lines.length < 2) {
          setCsvError('CSV file appears empty or missing headers.')
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
        const rows = []

        for (let i = 1; i < lines.length; i++) {
          const row = []
          let inQuote = false
          let cur = ''
          for (const char of lines[i]) {
            if (char === '"') inQuote = !inQuote
            else if (char === ',' && !inQuote) { row.push(cur.trim()); cur = '' }
            else { cur += char }
          }
          row.push(cur.trim())
          if (row.length === 0 || row.every(val => !val)) continue

          const obj = { name: '', fatherName: '', phone: '', address: '', relation: 'Relative', status: 'Invited' }
          headers.forEach((h, idx) => {
            const val = row[idx] || ''
            if (h.includes('name') && !h.includes('father')) obj.name = val
            else if (h.includes('father') || h.includes('waldiyat')) obj.fatherName = val
            else if (h.includes('phone') || h.includes('mobile')) obj.phone = val
            else if (h.includes('address') || h.includes('city') || h.includes('pata')) obj.address = val
            else if (h.includes('relation') || h.includes('rishta')) obj.relation = val
            else if (h.includes('status')) obj.status = val || 'Invited'
          })
          if (obj.name) rows.push(obj)
        }

        if (!rows.length) {
          setCsvError('No valid guest names found in CSV file.')
        } else {
          setCsvPreview(rows)
        }
      } catch (err) {
        setCsvError('Failed to parse CSV file. Please verify format.')
      }
    }
    reader.readAsText(file)
  }

  const confirmCSVImport = () => {
    if (!csvPreview.length) return
    importPeople(csvPreview, eventId)
    setCsvPreview([])
    setImp(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const downloadSampleCSV = () => {
    const csvContent = 'Name,Father Name,Phone,Address,Relationship,Status\n' +
      'Muhammad Ali,Haji Ashraf,03001234567,"G-9, Islamabad",Uncle,Invited\n' +
      'Tariq Mehmood,Bashir Ahmed,03219876543,"Satellite Town, Rawalpindi",Friend,Confirmed\n' +
      'Chaudhry Kamran,Malik Sultan,03451122334,"Lahore",Cousin,Invited'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'neota_sample_guest_list.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (events.length === 0) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto bg-white border border-[#E7E0D4] shadow-card rounded-2xl animate-pop">
        <Users size={36} className="mx-auto mb-3 text-[#C7A56A]" />
        <h3 className="font-serif text-2xl font-bold text-[#252A26] mb-1">Create an Event First</h3>
        <p className="text-xs text-[#77776D] mb-6 leading-relaxed">
          Guests are organized by wedding events (such as Walima, Barat, or Mehndi). Please create your wedding event before adding or importing guests.
        </p>
        <Link to="/app/events/new" className="btn btn-p text-xs rounded-xl inline-flex items-center gap-2">
          <UserPlus size={15} />
          <span>Create First Event</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-pop">
      {/* Page Header matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#252A26] tracking-tight">Guests</h1>
          <p className="text-xs md:text-sm text-[#77776D] mt-1 font-sans">
            Manage your guest list, invitations and attendance
          </p>
        </div>

        {/* Action Buttons matching reference: Import (pill outline) and + Add Guest (Emerald) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setImp(!imp)}
            className="text-xs md:text-sm font-semibold px-4 py-2.5 rounded-full border border-[#E8E0D1] bg-white text-[#202A25] hover:bg-[#F3EBDD] transition shadow-xs flex items-center gap-1.5"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>

          <button
            onClick={() => {
              setEditing(null)
              setF(blank)
              setShowAddForm(!showAddForm)
            }}
            className="btn btn-p text-xs md:text-sm !py-2.5 !px-5 rounded-full shadow-sm flex items-center gap-1.5 bg-[#063D32] text-white hover:bg-[#082F28]"
          >
            <Plus size={16} />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Filter Status Pills matching reference:
          All (248), Invited (240), Confirmed (160), Pending (30) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E0D1] pb-3">
        <button
          onClick={() => { setStatusFilter('all'); setCurrentPage(1) }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            statusFilter === 'all'
              ? 'bg-[#063D32] text-white shadow-xs'
              : 'bg-white border border-[#E8E0D1] text-[#77776E] hover:bg-[#F3EBDD]'
          }`}
        >
          All ({allEventGuests.length})
        </button>

        <button
          onClick={() => { setStatusFilter('invited'); setCurrentPage(1) }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            statusFilter === 'invited'
              ? 'bg-[#063D32] text-white shadow-xs'
              : 'bg-white border border-[#E8E0D1] text-[#77776E] hover:bg-[#F3EBDD]'
          }`}
        >
          Invited ({invitedCount})
        </button>

        <button
          onClick={() => { setStatusFilter('confirmed'); setCurrentPage(1) }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            statusFilter === 'confirmed'
              ? 'bg-[#063D32] text-white shadow-xs'
              : 'bg-white border border-[#E8E0D1] text-[#77776E] hover:bg-[#F3EBDD]'
          }`}
        >
          Confirmed ({confirmedCount})
        </button>

        <button
          onClick={() => { setStatusFilter('pending'); setCurrentPage(1) }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            statusFilter === 'pending'
              ? 'bg-[#153C32] text-white shadow-xs'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          Pending ({pendingCount})
        </button>

        {/* VIP Seating Toggle Pill */}
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'seating' : 'list')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ml-auto flex items-center gap-1.5 ${
            viewMode === 'seating'
              ? 'bg-[#C7A56A] text-[#0F2F28]'
              : 'bg-white border border-[#E7E0D4] text-[#77776D] hover:bg-[#F3EBDD]'
          }`}
        >
          <Armchair size={13} />
          <span>VIP Seating</span>
        </button>
      </div>

      {/* CSV Import Modal / Panel */}
      {imp && (
        <div className="card p-5 border border-[#C7A56A]/50 bg-white shadow-card rounded-2xl animate-pop">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg font-bold text-[#252A26]">Import Guests from CSV / Excel</h3>
            <button onClick={downloadSampleCSV} className="text-xs text-[#153C32] hover:underline flex items-center gap-1 font-semibold">
              <Download size={13} />
              <span>Download sample template</span>
            </button>
          </div>
          <p className="text-xs text-[#77776D] mb-4">
            Upload a spreadsheet exported as `.csv`. Expected columns: <b>Name, Father Name, Phone, Address, Relationship</b>.
          </p>

          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleCSVUpload} className="input mb-3" />

          {csvError && <p className="text-xs text-red-600 mb-3 font-medium">{csvError}</p>}

          {csvPreview.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-[#287A50] mb-2">
                ✓ Ready to import {csvPreview.length} guests into "{currentEvent?.title}":
              </p>
              <div className="max-h-40 overflow-y-auto border border-[#E7E0D4] rounded-xl p-2 text-xs divide-y divide-[#E7E0D4] bg-[#FAF7F0]">
                {csvPreview.slice(0, 8).map((row, i) => (
                  <div key={i} className="py-1 flex justify-between">
                    <span><b>{row.name}</b> {row.fatherName && `(s/o ${row.fatherName})`}</span>
                    <span className="text-[#77776D]">{[row.relation, row.phone].filter(Boolean).join(' · ')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={confirmCSVImport} className="btn btn-p text-xs rounded-xl">
                  <Check size={14} />
                  <span>Confirm & Import {csvPreview.length} Guests</span>
                </button>
                <button onClick={() => { setCsvPreview([]); if (fileRef.current) fileRef.current.value = '' }} className="btn text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest Add / Edit Form Modal/Drawer */}
      {(showAddForm || editing) && (
        <form onSubmit={submit} className="card p-5 md:p-6 border border-[#E7E0D4] bg-white shadow-card rounded-2xl animate-pop">
          <div className="flex items-center justify-between mb-4 border-b border-[#E7E0D4] pb-2">
            <span className="font-serif text-lg font-bold text-[#252A26]">
              {editing ? `Edit Guest Details` : 'Add New Guest to Event'}
            </span>
            <button
              type="button"
              onClick={() => { setEditing(null); setShowAddForm(false); setF(blank) }}
              className="text-xs text-[#77776D] hover:text-[#252A26] flex items-center gap-1"
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-6 items-end">
            <div className="sm:col-span-2">
              <label className="label">Guest Name *</label>
              <input className="input" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Ahmed Khan" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Father Name / Waldiyat</label>
              <input className="input" value={f.fatherName} onChange={e => setF({ ...f, fatherName: e.target.value })} placeholder="e.g. Haji Bashir" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Phone / Mobile</label>
              <input className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="0300-1234567" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address / City</label>
              <input className="input" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} placeholder="e.g. Lahore / Islamabad" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Relationship</label>
              <select className="input" value={f.relation} onChange={e => setF({ ...f, relation: e.target.value })}>
                {RELATION_OPTIONS.map(r => (
                  <option key={r} value={r.split(' ')[0]}>{r}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="label">Status</label>
              <select className="input" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Invited">Invited</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <button className="btn btn-p w-full !py-2.5 rounded-xl text-xs font-semibold">
                <span>{editing ? 'Update' : 'Save'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Content Area based on viewMode */}
      {viewMode === 'seating' ? (
        <SeatingPlanner eventId={eventId} />
      ) : (
        <div className="space-y-4">
          {/* Search Input matching reference */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776D]" />
            <input
              className="w-full rounded-full border border-[#E7E0D4] bg-white pl-10 pr-4 py-2.5 text-xs text-[#252A26] placeholder-[#77776D] outline-none focus:border-[#153C32] focus:ring-2 focus:ring-[#DCE8DC] transition shadow-xs"
              placeholder="Search guests by name, phone, or relation…"
              value={q}
              onChange={e => { setQ(e.target.value); setCurrentPage(1) }}
            />
          </div>

          {/* Desktop Table matching reference:
              Columns: #, Name, Phone, Relation, Status badge, Actions */}
          <div className="card overflow-x-auto shadow-card border border-[#E7E0D4] rounded-2xl bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[#77776D] border-b border-[#E7E0D4] bg-[#FAF7F0]/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5 w-12">#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Relation</th>
                  <th>Status</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D4]/70">
                {paginatedGuests.length > 0 ? (
                  paginatedGuests.map((p, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1
                    const status = (p.status || 'Confirmed').toLowerCase()

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF7F0]/60 transition">
                        <td className="p-3.5 pl-5 text-[#77776D] font-mono">{rowNumber}</td>
                        <td className="p-3.5 font-medium text-[#252A26]">
                          <Link to={`/app/people/${p.id}`} className="hover:text-[#153C32] hover:underline">
                            {p.name}
                          </Link>
                          {p.fatherName && (
                            <span className="text-[10px] text-[#77776D] block">s/o {p.fatherName}</span>
                          )}
                        </td>
                        <td className="text-[#77776D] font-mono">{p.phone || '0300-1234567'}</td>
                        <td>
                          <span className="text-[#252A26] font-medium">{p.relation || 'Family'}</span>
                        </td>
                        <td>
                          {/* Status Badge matching reference colors:
                              Confirmed: soft green, Pending: soft amber, Invited: soft blue/gray */}
                          {status === 'confirmed' ? (
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#DCE8DC] text-[#287A50]">
                              Confirmed
                            </span>
                          ) : status === 'pending' || status === 'declined' ? (
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B7791F]">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#E0E7FF] text-[#3730A3]">
                              Invited
                            </span>
                          )}
                        </td>
                        <td className="text-right pr-5">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/app/people/${p.id}`}
                              className="p-1.5 text-[#77776D] hover:text-[#252A26] hover:bg-[#F3EBDD] rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </Link>

                            <button
                              onClick={() => {
                                setEditing(p.id)
                                setF(p)
                                setShowAddForm(true)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="p-1.5 text-[#77776D] hover:text-[#252A26] hover:bg-[#F3EBDD] rounded-lg transition"
                              title="Edit Guest"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Remove ${p.name} from guests?`)) deletePerson(p.id)
                              }}
                              className="p-1.5 text-[#77776D] hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : allEventGuests.length > 0 ? (
                  /* When event has guests but search or status filter yields 0 matches */
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[#77776D]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users size={28} className="text-[#C7A56A] opacity-60" />
                        <span className="font-medium text-sm text-[#252A26]">No guests found</span>
                        <span className="text-xs text-[#77776D]">
                          {q ? `No guests match "${q}"` : 'No guests match the selected filter.'}
                        </span>
                        {(q || statusFilter !== 'all') && (
                          <button
                            onClick={() => { setQ(''); setStatusFilter('all'); setCurrentPage(1) }}
                            className="mt-2 text-xs text-[#153C32] font-semibold underline hover:opacity-80"
                          >
                            Clear search & show all guests
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* Clean Empty State when no guests added yet */
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-[#77776D]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users size={32} className="text-[#C7A56A] opacity-60" />
                        <span className="font-serif font-bold text-base text-[#252A26]">No Guests Added Yet</span>
                        <span className="text-xs text-[#77776D] max-w-sm">
                          Add your first invited relative or friend to start tracking RSVPs and salamii records.
                        </span>
                        <button
                          onClick={() => { setEditing(null); setF(blank); setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                          className="btn btn-p text-xs !py-2 !px-4 mt-2 rounded-xl inline-flex items-center gap-1.5"
                        >
                          <UserPlus size={14} />
                          <span>Add First Guest</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls matching reference */}
            <div className="p-4 border-t border-[#E7E0D4] flex flex-wrap items-center justify-between gap-3 text-xs text-[#77776D]">
              <span>
                {filteredGuests.length > 0
                  ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredGuests.length)} of ${filteredGuests.length}`
                  : 'Showing 0 guests'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-[#E7E0D4] flex items-center justify-center text-[#252A26] hover:bg-[#F3EBDD] disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>

                {[1, 2, 3, 4, 5].slice(0, Math.min(5, totalPages)).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-medium transition ${
                      currentPage === pageNum
                        ? 'bg-[#153C32] text-white font-bold'
                        : 'border border-[#E7E0D4] bg-white text-[#252A26] hover:bg-[#F3EBDD]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {totalPages > 5 && (
                  <>
                    <span className="px-1 text-[#77776D]">…</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-8 h-8 rounded-lg font-medium border border-[#E7E0D4] bg-white text-[#252A26] hover:bg-[#F3EBDD]`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg border border-[#E7E0D4] flex items-center justify-center text-[#252A26] hover:bg-[#F3EBDD] disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

