import { useState } from 'react'
import { Plus, Check, Trash2, Edit3, Users, Search, UserCheck, X, Sparkles, MapPin } from 'lucide-react'
import { useStore } from '../store'

const TABLE_CATEGORIES = [
  'VIP Stage (سسرال / معززین)',
  'Elders (بزرگ و عمائدین)',
  'Immediate Family (خاندان)',
  'Friends & Youth (دوست و احباب)',
  'Ladies (خواتین)',
  'General (عام نشست)'
]

export default function SeatingPlanner({ eventId }) {
  const { events, people, tables, addTable, updateTable, deleteTable, assignGuestToTable, activeEvent } = useStore()
  const targetEventId = eventId || activeEvent
  const currentEvent = events.find(e => e.id === targetEventId) || events[0]

  const eventTables = tables.filter(t => t.eventId === targetEventId)
  const eventGuests = people.filter(p => p.events?.includes(targetEventId))

  const [isAddingTable, setIsAddingTable] = useState(false)
  const [editingTableId, setEditingTableId] = useState(null)
  const [searchGuest, setSearchGuest] = useState('')
  const [assigningTableId, setAssigningTableId] = useState(null)

  const [tableForm, setTableForm] = useState({
    number: '',
    name: '',
    category: 'VIP Stage (سسرال / معززین)',
    capacity: 10
  })

  // Guest lookup for ushers & counter helpers
  const searchedResult = searchGuest.trim()
    ? eventGuests.filter(g =>
        g.name.toLowerCase().includes(searchGuest.toLowerCase()) ||
        (g.fatherName && g.fatherName.toLowerCase().includes(searchGuest.toLowerCase()))
      )
    : []

  const handleTableSubmit = e => {
    e.preventDefault()
    if (editingTableId) {
      updateTable(editingTableId, {
        ...tableForm,
        capacity: Number(tableForm.capacity) || 10
      })
      setEditingTableId(null)
    } else {
      addTable({
        ...tableForm,
        eventId: targetEventId,
        capacity: Number(tableForm.capacity) || 10,
        guestIds: []
      })
    }
    setTableForm({ number: '', name: '', category: 'VIP Stage (سسرال / معززین)', capacity: 10 })
    setIsAddingTable(false)
  }

  const findTableForGuest = pid => {
    return eventTables.find(t => (t.guestIds || []).includes(pid))
  }

  return (
    <div className="card p-5 md:p-6 bg-white border border-sand shadow-sm rounded-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sand mb-5">
        <div>
          <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Users size={20} className="text-brown" />
            <span>Smart VIP Seating & Marquee Tables (ٹیبل و نشست کا انتظام)</span>
          </h3>
          <p className="text-xs text-taupe mt-0.5">
            Event: <b>{currentEvent?.title}</b> · Marquee layout and VIP seating management
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddingTable(!isAddingTable)
            setEditingTableId(null)
            setTableForm({ number: String(eventTables.length + 1), name: '', category: 'VIP Stage (سسرال / معززین)', capacity: 10 })
          }}
          className="btn btn-p text-xs !py-2 flex items-center gap-1.5 shadow-sm"
        >
          {isAddingTable ? <X size={15} /> : <Plus size={15} />}
          <span>{isAddingTable ? 'Close' : 'Add Marquee Table'}</span>
        </button>
      </div>

      {/* Guest Fast Finder (Usher & Entrance Lookup) */}
      <div className="p-4 rounded-2xl bg-cream/30 border border-sand mb-6">
        <label className="label flex items-center gap-1.5">
          <Search size={14} className="text-brown" />
          <span>Guest Seating Lookup (گیٹ یا کاؤنٹر پر مہمان کی ٹیبل معلوم کریں)</span>
        </label>
        <div className="relative">
          <input
            className="input"
            placeholder="Type guest name (e.g. Malik Asif, Chaudhry Farooq)…"
            value={searchGuest}
            onChange={e => setSearchGuest(e.target.value)}
          />
          {searchGuest && (
            <button
              onClick={() => setSearchGuest('')}
              className="absolute right-3 top-2.5 text-taupe hover:text-ink text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {searchGuest.trim() && (
          <div className="mt-3 divide-y divide-sand border border-sand rounded-xl bg-white p-2 text-xs">
            {searchedResult.map(g => {
              const assignedTable = findTableForGuest(g.id)
              return (
                <div key={g.id} className="py-2 px-2 flex items-center justify-between">
                  <div>
                    <b className="text-ink">{g.name}</b>
                    {g.fatherName && <span className="text-taupe text-[11px]"> s/o {g.fatherName}</span>}
                    <span className="text-taupe text-[11px] block">{g.relation || 'Guest'}</span>
                  </div>

                  <div>
                    {assignedTable ? (
                      <span className="px-2.5 py-1 rounded-full bg-sage-light text-sage font-bold font-mono text-xs border border-sage/30">
                        Table #{assignedTable.number}: {assignedTable.name}
                      </span>
                    ) : (
                      <span className="text-taupe italic">No table assigned yet</span>
                    )}
                  </div>
                </div>
              )
            })}
            {!searchedResult.length && (
              <p className="text-taupe text-center py-2">No guest matching "{searchGuest}".</p>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Table Inline Form */}
      {isAddingTable && (
        <form onSubmit={handleTableSubmit} className="p-4 rounded-2xl bg-ivory border border-sand mb-6 space-y-3 text-xs animate-fade-in">
          <b className="font-serif text-sm block text-brown">{editingTableId ? 'Edit Table' : 'Add New Marquee Table'}</b>
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Table Number *</label>
              <input
                className="input font-mono font-bold"
                required
                placeholder="1"
                value={tableForm.number}
                onChange={e => setTableForm({ ...tableForm, number: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Table Title / Description *</label>
              <input
                className="input"
                required
                placeholder="e.g. سسرال و براتی VIP"
                value={tableForm.name}
                onChange={e => setTableForm({ ...tableForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Max Capacity *</label>
              <input
                type="number"
                className="input font-mono"
                required
                min="1"
                max="50"
                value={tableForm.capacity}
                onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="input font-medium"
              value={tableForm.category}
              onChange={e => setTableForm({ ...tableForm, category: e.target.value })}
            >
              {TABLE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsAddingTable(false); setEditingTableId(null) }}
              className="btn text-xs !py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-p text-xs !py-1.5 flex items-center gap-1 shadow-sm"
            >
              <Check size={14} />
              <span>{editingTableId ? 'Save Table' : 'Create Table'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tables Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {eventTables.map(tbl => {
          const guestCount = (tbl.guestIds || []).length
          const isFull = guestCount >= tbl.capacity
          const assignedGuestList = eventGuests.filter(g => (tbl.guestIds || []).includes(g.id))

          return (
            <div key={tbl.id} className="p-4 rounded-2xl bg-white border border-sand shadow-sm space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-brown text-white font-mono font-bold flex items-center justify-center text-xs">
                      #{tbl.number}
                    </span>
                    <b className="font-serif text-sm text-ink">{tbl.name}</b>
                  </div>
                  <span className="text-[10px] text-taupe mt-1 block font-medium">{tbl.category}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isFull ? 'bg-amber-100 text-amber-900' : 'bg-sage-light text-sage'}`}>
                    {guestCount} / {tbl.capacity} Seats
                  </span>
                  <button
                    onClick={() => {
                      setEditingTableId(tbl.id)
                      setTableForm({ number: tbl.number, name: tbl.name, category: tbl.category, capacity: tbl.capacity })
                      setIsAddingTable(true)
                    }}
                    className="p-1 text-taupe hover:text-ink rounded"
                    title="Edit table"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove Table #${tbl.number}?`)) deleteTable(tbl.id)
                    }}
                    className="p-1 text-taupe hover:text-red-600 rounded"
                    title="Delete table"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-sand overflow-hidden">
                <div
                  className={`h-full rounded-full ${isFull ? 'bg-amber-600' : 'bg-sage'}`}
                  style={{ width: `${Math.min(100, Math.round((guestCount / tbl.capacity) * 100))}%` }}
                />
              </div>

              {/* Assigned Guests List */}
              <div className="bg-cream/20 p-2.5 rounded-xl border border-sand space-y-1.5">
                <span className="text-[10px] text-taupe uppercase font-medium block">Assigned Guests ({assignedGuestList.length})</span>
                <div className="flex flex-wrap gap-1">
                  {assignedGuestList.map(g => (
                    <span key={g.id} className="text-[11px] bg-white border border-sand px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>{g.name}</span>
                      <button
                        onClick={() => assignGuestToTable(null, g.id)}
                        className="text-taupe hover:text-red-600 ml-0.5"
                        title="Remove from table"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {!assignedGuestList.length && (
                    <span className="text-taupe italic text-[11px]">No guests assigned yet.</span>
                  )}
                </div>
              </div>

              {/* Quick Guest Assign Dropdown */}
              <div className="pt-1">
                <select
                  className="input !py-1 text-xs"
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      assignGuestToTable(tbl.id, e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">+ Assign Guest to Table #{tbl.number}</option>
                  {eventGuests
                    .filter(g => !(tbl.guestIds || []).includes(g.id))
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.relation || 'Guest'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )
        })}
        {!eventTables.length && (
          <div className="sm:col-span-2 p-8 text-center text-taupe bg-cream/20 rounded-2xl border border-sand">
            No tables set up yet. Click "Add Marquee Table" to configure seating.
          </div>
        )}
      </div>
    </div>
  )
}
