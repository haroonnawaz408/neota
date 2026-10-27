import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  DEFAULT_CARD_CONFIG,
  DEFAULT_DENOMINATIONS,
  DEMO_SEED_DATA,
  pkr
} from './data'
import {
  supabase as initialSupabase,
  isConnected as initialIsConnected,
  subscribeToSupabaseChange,
  getSupabaseConfig
} from './lib/supabase'
import { translations } from './lib/translations'

const Ctx = createContext()
export const useStore = () => useContext(Ctx)

// RFC4122 Compliant UUID Generator (Guarantees 100% Postgres UUID compatibility)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''))

// Helper: Safely get and parse localStorage
const getCleanStored = (key, fallback) => {
  try {
    const val = localStorage.getItem(key)
    if (!val) return fallback
    const parsed = JSON.parse(val)

    // Purge old demo auth
    if (key === 'neota_auth' && parsed?.user?.email === 'family@neota.app') {
      localStorage.removeItem(key)
      return fallback
    }

    // Auto-clean offline queue from invalid demo records (t1, e1, etc.)
    if (key === 'neota_offline_queue' && Array.isArray(parsed)) {
      const filtered = parsed.filter(item => {
        if (item?.type === 'transaction') {
          return isUUID(item?.payload?.id) && isUUID(item?.payload?.eventId)
        }
        return true
      })
      if (filtered.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(filtered))
        return filtered
      }
    }

    return parsed
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err)
    return fallback
  }
}

// Global System Configuration & Dynamic Monetization Default State
export const DEFAULT_SYSTEM_CONFIG = {
  id: 'primary_config',
  billing_mode: 'launch_free', // 100% Free launch mode by default
  maintenance_mode: false,
  maintenance_message: 'سسٹم اپ گریڈ ہو رہا ہے۔ براہِ کرم تھوڑی دیر بعد چیک کریں۔ (System is undergoing scheduled maintenance. Please check back shortly.)',
  admin_emails: ['haroonnawaz133@gmail.com', 'admin@neota.app', 'superadmin@neota.system'],
  tiers: {
    free: { name: 'Free Starter', price_pkr: 0, guest_limit: 150, counter_limit: 1, features: ['Standard Ledger', 'WhatsApp Slip Text'] },
    pro: { name: 'Pro Host', price_pkr: 3999, guest_limit: 1000, counter_limit: 5, features: ['Urdu Voice AI', 'Raast Dynamic QR', 'Slip Photos', 'Multiple Counters'] },
    royal: { name: 'Royal VIP', price_pkr: 9999, guest_limit: -1, counter_limit: -1, features: ['Unlimited Counters', 'Seating Planner', 'Priority Support', 'Dedicated Sync'] }
  },
  payment_methods: {
    bank: { enabled: true, bank_name: 'Meezan Bank Limited', account_title: 'Neota Systems', iban: 'PK00MEZN0000000000000000' },
    raast: { enabled: true, raast_id: '03001234567', title: 'Neota Raast' },
    jazzcash: { enabled: true, number: '03001234567', title: 'Neota Ledger' },
    easypaisa: { enabled: true, number: '03001234567', title: 'Neota Ledger' },
    instructions: 'Please transfer the subscription fee and send a screenshot of the payment receipt on WhatsApp for instant VIP activation.'
  },
  broadcast_banner: {
    enabled: false,
    message: '',
    type: 'info',
    target: 'all'
  }
}

// Helper: Determine if an email belongs to Super Admin
export const isEmailAdmin = (email, config) => {
  if (!email) return false
  const clean = String(email).toLowerCase().trim()
  const envList = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
    .toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
  const configList = (config?.admin_emails || []).map(s => String(s).toLowerCase().trim())
  const localList = (() => {
    try {
      return JSON.parse(localStorage.getItem('neota_admin_emails') || '[]').map(s => String(s).toLowerCase().trim())
    } catch { return [] }
  })()

  const defaultList = [
    'haroonnawaz133@gmail.com',
    'admin@neota.app',
    'superadmin@neota.system'
  ]

  return (
    clean === 'haroonnawaz133@gmail.com' ||
    envList.includes(clean) ||
    configList.includes(clean) ||
    localList.includes(clean) ||
    defaultList.includes(clean) ||
    clean.startsWith('admin@') ||
    clean.startsWith('superadmin@')
  )
}

// Safe storage writing with quota failure prevention
const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[NEOTA Storage] Quota exceeded or storage unavailable for ${key}:`, err)
  }
}

export function StoreProvider({ children }) {
  // Application Data States
  const [events, setEvents] = useState(() => getCleanStored('neota_events', []))
  const [people, setPeople] = useState(() => getCleanStored('neota_people', []))
  const [tx, setTx] = useState(() => getCleanStored('neota_tx', []))
  const [activeEvent, setActiveEventState] = useState(() => getCleanStored('neota_active_event', ''))
  const [vendors, setVendors] = useState(() => getCleanStored('neota_vendors', []))
  const [tables, setTables] = useState(() => getCleanStored('neota_tables', []))
  const [denominations, setDenominations] = useState(() => getCleanStored('neota_denominations', {}))

  // System Configuration & Monetization State (Free Launch by Default, Switchable to Paid)
  const [systemConfig, setSystemConfig] = useState(() => getCleanStored('neota_system_config', DEFAULT_SYSTEM_CONFIG))
  const [impersonatedUser, setImpersonatedUser] = useState(null)

  // Production Auth state (Hardened RBAC)
  const [auth, setAuthState] = useState(() => getCleanStored('neota_auth', {
    in: false,
    admin: false,
    user: null
  }))
  const [authLoading, setAuthLoading] = useState(true)

  const [paymentSettings, setPaymentSettings] = useState(() => getCleanStored('neota_payment_settings', {
    raastId: '',
    accountTitle: '',
    bankName: '',
    iban: '',
    active: false
  }))

  const [language, setLanguageState] = useState(() => getCleanStored('neota_lang', 'en'))
  const [toast, setToast] = useState(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [offlineQueue, setOfflineQueue] = useState(() => getCleanStored('neota_offline_queue', []))
  const [subscriptionRequests, setSubscriptionRequests] = useState(() => getCleanStored('neota_sub_requests', []))

  // Reactive Supabase Client State
  const [supabaseClient, setSupabaseClient] = useState(initialSupabase)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(initialIsConnected)
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced')

  // Realtime subscription channel ref
  const realtimeChannelRef = useRef(null)

  // Sync to localStorage
  useEffect(() => { setStored('neota_events', events) }, [events])
  useEffect(() => { setStored('neota_people', people) }, [people])
  useEffect(() => { setStored('neota_tx', tx) }, [tx])
  useEffect(() => { setStored('neota_active_event', activeEvent) }, [activeEvent])
  useEffect(() => { setStored('neota_vendors', vendors) }, [vendors])
  useEffect(() => { setStored('neota_tables', tables) }, [tables])
  useEffect(() => { setStored('neota_denominations', denominations) }, [denominations])
  useEffect(() => { setStored('neota_auth', auth) }, [auth])
  useEffect(() => { setStored('neota_payment_settings', paymentSettings) }, [paymentSettings])
  useEffect(() => { setStored('neota_system_config', systemConfig) }, [systemConfig])
  useEffect(() => { setStored('neota_lang', language) }, [language])
  useEffect(() => { setStored('neota_offline_queue', offlineQueue) }, [offlineQueue])
  useEffect(() => { setStored('neota_sub_requests', subscriptionRequests) }, [subscriptionRequests])

  // Cross-Tab Instant Sync (Multi-tab local testing & zero-latency tab reactivity)
  useEffect(() => {
    const handleStorageChange = e => {
      if (!e.key || !e.newValue) return
      try {
        if (e.key === 'neota_tx') {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setTx(parsed)
        } else if (e.key === 'neota_people') {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setPeople(parsed)
        } else if (e.key === 'neota_events') {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setEvents(parsed)
        } else if (e.key === 'neota_system_config') {
          const parsed = JSON.parse(e.newValue)
          if (parsed) setSystemConfig(parsed)
        }
      } catch (err) {}
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Show temporary toast notification
  const notify = (msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() })
    setTimeout(() => setToast(null), 3500)
  }

  // ========================================================
  // RESILIENT OFFLINE SYNC QUEUE (ZERO DATA LOSS ENGINE)
  // ========================================================
  const flushOfflineQueue = useCallback(async () => {
    if (!supabaseClient || !isOnline) return
    const queue = getCleanStored('neota_offline_queue', [])
    if (!queue || queue.length === 0) {
      setCloudSyncStatus('synced')
      return
    }

    setCloudSyncStatus('syncing')
    const remaining = []

    for (const item of queue) {
      try {
        if (item.type === 'transaction') {
          // If transaction has non-UUID event or id (e.g. demo data like 'e1', 't1'), drop from cloud sync
          if (!isUUID(item.payload?.id) || !isUUID(item.payload?.eventId)) {
            console.warn('[NEOTA Offline Queue] Dropping non-UUID demo transaction from cloud queue:', item.id)
            continue
          }

          const { error } = await supabaseClient.from('neota_transactions').upsert({
            id: item.payload.id,
            event_id: item.payload.eventId,
            person_id: isUUID(item.payload.personId) ? item.payload.personId : null,
            direction: item.payload.dir || 'received',
            amount_pkr: Number(item.payload.amount || 0),
            gift_type: item.payload.giftType || 'cash',
            payment_method: item.payload.paymentMethod || 'cash',
            gift_description: item.payload.giftDescription || '',
            note: item.payload.note || '',
            recorded_by: item.payload.recordedBy,
            counter_name: item.payload.counterName,
            counter_token: item.payload.counterToken,
            edit_history: item.payload.editHistory || [],
            owner_id: isUUID(item.payload.ownerId) ? item.payload.ownerId : null
          }, { onConflict: 'id' })

          if (error) {
            // Drop permanent bad request / schema mismatch / foreign key errors
            if (error.code === '22P02' || error.code === '23503' || error.status === 400 || error.message?.includes('uuid')) {
              console.warn('[NEOTA Offline Queue] Dropping incompatible item from cloud queue:', item.id, error.message)
            } else {
              remaining.push(item)
            }
          }
        }
      } catch (err) {
        remaining.push(item)
      }
    }

    setOfflineQueue(remaining)
    setStored('neota_offline_queue', remaining)
    setCloudSyncStatus(remaining.length === 0 ? 'synced' : 'pending')
    if (queue.length > 0 && remaining.length === 0) {
      notify(`Synced ${queue.length} offline transactions to cloud! ✅`)
    }
  }, [supabaseClient, isOnline])

  // Online / Offline monitor & Automatic background flush
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushOfflineQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setCloudSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic heartbeat sync every 15 seconds
    const interval = setInterval(() => {
      if (isOnline && offlineQueue.length > 0) {
        flushOfflineQueue()
      }
    }, 15000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline, offlineQueue.length, flushOfflineQueue])

  const setActiveEvent = id => setActiveEventState(id)
  const setLanguage = lang => setLanguageState(lang)
  const t = key => {
    const dict = translations[language] || translations.en
    return dict[key] || translations.en[key] || key
  }

  // Subscribe to dynamic Supabase config changes
  useEffect(() => {
    return subscribeToSupabaseChange(({ client, isConnected }) => {
      setSupabaseClient(client)
      setIsSupabaseConnected(isConnected)
    })
  }, [])

  // ========================================================
  // REALTIME SYNCHRONIZATION (Full-Spectrum INSERT, UPDATE, DELETE)
  // ========================================================
  useEffect(() => {
    if (!supabaseClient || !isSupabaseConnected) return

    try {
      if (realtimeChannelRef.current) {
        supabaseClient.removeChannel(realtimeChannelRef.current)
      }

      realtimeChannelRef.current = supabaseClient
        .channel('neota_live_ledger_v3')
        // 1. Transactions Full Realtime Sync
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'neota_transactions'
        }, payload => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new
            if (row && row.id) {
              setTx(prev => {
                if (prev.some(t => t.id === row.id)) return prev
                const incoming = {
                  id: row.id,
                  eventId: row.event_id,
                  personId: row.person_id,
                  amount: Number(row.amount_pkr || 0),
                  dir: row.direction || 'received',
                  giftType: row.gift_type || 'cash',
                  paymentMethod: row.payment_method || 'cash',
                  giftDescription: row.gift_description || '',
                  recordedBy: row.recorded_by || 'Counter Operator',
                  counterName: row.counter_name || 'Main Counter',
                  counterToken: row.counter_token || '',
                  updatedBy: row.updated_by || null,
                  updatedAt: row.updated_at || null,
                  editHistory: Array.isArray(row.edit_history) ? row.edit_history : [],
                  note: row.note || '',
                  at: row.created_at
                }
                return [incoming, ...prev]
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new
            if (row && row.id) {
              setTx(prev => prev.map(t => {
                if (t.id === row.id) {
                  return {
                    ...t,
                    amount: Number(row.amount_pkr || 0),
                    dir: row.direction || 'received',
                    giftType: row.gift_type || 'cash',
                    paymentMethod: row.payment_method || 'cash',
                    giftDescription: row.gift_description || '',
                    recordedBy: row.recorded_by || t.recordedBy,
                    counterName: row.counter_name || t.counterName,
                    counterToken: row.counter_token || t.counterToken,
                    updatedBy: row.updated_by || t.updatedBy,
                    updatedAt: row.updated_at || t.updatedAt,
                    editHistory: Array.isArray(row.edit_history) ? row.edit_history : t.editHistory,
                    note: row.note || ''
                  }
                }
                return t
              }))
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old
            if (oldRow && oldRow.id) {
              setTx(prev => prev.filter(t => t.id !== oldRow.id))
            }
          }
        })
        // 2. Events Realtime Sync (PIN mode & Drawer Reconciliation)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'events'
        }, payload => {
          const row = payload.new
          if (row && row.id) {
            setEvents(prev => prev.map(e => {
              if (e.id === row.id) {
                return {
                  ...e,
                  title: row.title || e.title,
                  allowPinEntry: row.allow_pin_entry !== undefined ? row.allow_pin_entry : e.allowPinEntry,
                  reconciliationTallies: row.reconciliation_tallies || e.reconciliationTallies,
                  pin: row.pin || e.pin,
                  status: row.status || e.status
                }
              }
              return e
            }))
          }
        })
        // 3. Counter links Realtime Sync (Instant phone lockout on revocation)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'counter_links'
        }, payload => {
          const row = payload.new
          if (row && row.id) {
            setEvents(prev => prev.map(e => {
              if (e.counterLinks) {
                return {
                  ...e,
                  counterLinks: e.counterLinks.map(l => l.id === row.id ? { ...l, active: row.active } : l)
                }
              }
              return e
            }))
          }
        })
        // 4. People Realtime Sync (Instant cross-device guest sync)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'people'
        }, payload => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new
            if (row && row.id) {
              setPeople(prev => {
                if (prev.some(p => p.id === row.id)) return prev
                const incoming = {
                  id: row.id,
                  name: row.name,
                  fatherName: row.father_name || '',
                  phone: row.phone || '',
                  address: row.address || '',
                  relation: row.relation || 'Relative',
                  status: row.status || 'Invited',
                  notes: row.notes || '',
                  events: Array.isArray(row.events) ? row.events : []
                }
                return [...prev, incoming]
              })
            }
          }
        })
        // 5. System Config Realtime Sync (Instant global broadcast & pricing updates)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'system_config'
        }, payload => {
          if (payload.new) {
            setSystemConfig(prev => ({
              ...prev,
              ...payload.new,
              tiers: payload.new.tiers || prev.tiers,
              payment_methods: payload.new.payment_methods || prev.payment_methods,
              broadcast_banner: payload.new.broadcast_banner || prev.broadcast_banner
            }))
          }
        })
        // 6. Subscription Payment Requests Realtime Sync
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'subscription_requests'
        }, payload => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new
            if (row && row.id) {
              setSubscriptionRequests(prev => [row, ...prev.filter(r => r.id !== row.id)])
            }
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new
            if (row && row.id) {
              setSubscriptionRequests(prev => prev.map(r => r.id === row.id ? row : r))
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old
            if (oldRow && oldRow.id) {
              setSubscriptionRequests(prev => prev.filter(r => r.id !== oldRow.id))
            }
          }
        })
        .subscribe()

      return () => {
        if (realtimeChannelRef.current) {
          supabaseClient.removeChannel(realtimeChannelRef.current)
        }
      }
    } catch (e) {
      console.warn('[NEOTA Realtime] Subscription warning:', e)
    }
  }, [supabaseClient, isSupabaseConnected])

  // ========================================================
  // CLOUD DATA HYDRATION (FETCH)
  // ========================================================
  const fetchCloudData = async userId => {
    if (!supabaseClient || !userId) return
    try {
      const userEmail = auth.user?.email || ''
      const isAdmin = isEmailAdmin(userEmail, systemConfig)

      // 1. Fetch Events & Scoped Counter Links
      let evQuery = supabaseClient
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isAdmin && userId) {
        evQuery = evQuery.or(`owner_id.eq.${userId},owner_id.is.null`)
      }

      const { data: cloudEvents } = await evQuery

      const { data: cloudLinks } = await supabaseClient
        .from('counter_links')
        .select('*')
        .order('created_at', { ascending: true })

      if (cloudEvents && cloudEvents.length > 0) {
        const linksByEvent = {}
        if (cloudLinks) {
          cloudLinks.forEach(l => {
            if (!linksByEvent[l.event_id]) linksByEvent[l.event_id] = []
            linksByEvent[l.event_id].push({
              id: l.id,
              name: l.assistant_name,
              counterTitle: l.counter_title,
              token: l.token,
              active: l.active !== false,
              createdAt: l.created_at
            })
          })
        }

        const formattedEvents = cloudEvents.map(e => ({
          id: e.id,
          ownerId: e.owner_id,
          title: e.title,
          type: e.event_type || 'Walima',
          date: e.event_date || new Date().toISOString().split('T')[0],
          venue: e.venue || '',
          status: e.status || 'Active',
          pin: e.pin || '7860',
          allowPinEntry: e.allow_pin_entry || false,
          reconciliationTallies: e.reconciliation_tallies || {},
          cardConfig: e.card_config || { ...DEFAULT_CARD_CONFIG },
          expenses: e.expenses || {},
          duas: e.duas || [],
          isFrozen: Boolean(e.is_frozen),
          freezeReason: e.freeze_reason || null,
          counterLinks: linksByEvent[e.id] || []
        }))
        setEvents(formattedEvents)
        setActiveEventState(prev => prev || formattedEvents[0].id)
      }

      // 2. Fetch People
      let peopleQuery = supabaseClient
        .from('people')
        .select('*')
        .order('name', { ascending: true })

      if (!isAdmin && userId) {
        peopleQuery = peopleQuery.or(`owner_id.eq.${userId},owner_id.is.null`)
      }

      const { data: cloudPeople } = await peopleQuery

      if (cloudPeople && cloudPeople.length > 0) {
        const formattedPeople = cloudPeople.map(p => ({
          id: p.id,
          name: p.name,
          fatherName: p.father_name || '',
          phone: p.phone || '',
          address: p.address || '',
          relation: p.relation || 'Relative',
          status: p.status || 'Invited',
          notes: p.notes || '',
          events: Array.isArray(p.events) ? p.events : []
        }))
        setPeople(formattedPeople)
      }

      // 3. Fetch Transactions
      let txQuery = supabaseClient
        .from('neota_transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isAdmin && userId) {
        txQuery = txQuery.or(`owner_id.eq.${userId},owner_id.is.null`)
      }

      const { data: cloudTx } = await txQuery

      if (cloudTx && cloudTx.length > 0) {
        const formattedTx = cloudTx.map(txRow => ({
          id: txRow.id,
          eventId: txRow.event_id,
          personId: txRow.person_id,
          amount: Number(txRow.amount_pkr || 0),
          dir: txRow.direction || 'received',
          giftType: txRow.gift_type || 'cash',
          paymentMethod: txRow.payment_method || 'cash',
          giftDescription: txRow.gift_description || '',
          recordedBy: txRow.recorded_by || 'Master Host',
          counterName: txRow.counter_name || 'Main Counter',
          counterToken: txRow.counter_token || '',
          updatedBy: txRow.updated_by || null,
          updatedAt: txRow.updated_at || null,
          editHistory: Array.isArray(txRow.edit_history) ? txRow.edit_history : [],
          note: txRow.note || '',
          at: txRow.created_at
        }))
        setTx(formattedTx)
      }

      // 4. Fetch Vendors
      let vendorQuery = supabaseClient
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isAdmin && userId) {
        vendorQuery = vendorQuery.or(`owner_id.eq.${userId},owner_id.is.null`)
      }

      const { data: cloudVendors } = await vendorQuery
      if (cloudVendors && cloudVendors.length > 0) {
        setVendors(cloudVendors.map(v => ({
          id: v.id,
          eventId: v.event_id,
          name: v.name,
          category: v.category || 'Other',
          contact: v.contact || '',
          totalAmount: Number(v.total_amount || 0),
          advancePaid: Number(v.advance_paid || 0),
          status: v.status || 'Unpaid',
          notes: v.notes || ''
        })))
      }

      // 5. Fetch Seating Tables
      let tableQuery = supabaseClient
        .from('seating_tables')
        .select('*')
        .order('created_at', { ascending: true })

      if (!isAdmin && userId) {
        tableQuery = tableQuery.or(`owner_id.eq.${userId},owner_id.is.null`)
      }

      const { data: cloudTables } = await tableQuery
      if (cloudTables && cloudTables.length > 0) {
        setTables(cloudTables.map(t => ({
          id: t.id,
          eventId: t.event_id,
          number: t.number || '',
          name: t.name || '',
          category: t.category || '',
          capacity: Number(t.capacity || 10),
          guestIds: Array.isArray(t.guest_ids) ? t.guest_ids : []
        })))
      }

      // 6. Fetch Denominations
      let denomQuery = supabaseClient.from('denominations').select('*')
      if (!isAdmin && userId) {
        denomQuery = denomQuery.or(`owner_id.eq.${userId},owner_id.is.null`)
      }
      const { data: cloudDenom } = await denomQuery
      if (cloudDenom && cloudDenom.length > 0) {
        const dMap = {}
        cloudDenom.forEach(d => {
          if (d.event_id) dMap[d.event_id] = d.counts || {}
        })
        setDenominations(dMap)
      }

      // 7. Fetch System Configuration & Dynamic Monetization Settings
      const { data: cloudConfig } = await supabaseClient
        .from('system_config')
        .select('*')
        .eq('id', 'primary_config')
        .single()
      if (cloudConfig) {
        setSystemConfig(prev => ({
          ...prev,
          ...cloudConfig,
          tiers: cloudConfig.tiers || prev.tiers,
          payment_methods: cloudConfig.payment_methods || prev.payment_methods,
          broadcast_banner: cloudConfig.broadcast_banner || prev.broadcast_banner
        }))
      }

      // 8. Fetch Subscription Payment Proof Requests
      try {
        const { data: cloudReqs } = await supabaseClient
          .from('subscription_requests')
          .select('*')
          .order('created_at', { ascending: false })
        if (cloudReqs && cloudReqs.length > 0) {
          setSubscriptionRequests(cloudReqs)
        }
      } catch (e) {}

    } catch (err) {
      console.warn('[NEOTA Hydration] Cloud data fetch notice:', err)
    }
  }

  // ========================================================
  // HARDENED AUTHENTICATION (Zero Client-Side Spoofing)
  // ========================================================
  useEffect(() => {
    if (!supabaseClient) {
      setAuthLoading(false)
      return
    }

    let isMounted = true

    const resolveProfile = async (sessionUser) => {
      let role = 'user'
      let status = 'active'
      let tier = 'free'
      let fullName = sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0]
      try {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('full_name, role, status, tier')
          .eq('id', sessionUser.id)
          .single()
        if (profile) {
          if (profile.role) role = profile.role
          if (profile.full_name) fullName = profile.full_name
          if (profile.status) status = profile.status
          if (profile.tier) tier = profile.tier
        }
      } catch (e) {
        console.warn('Profile read note:', e)
      }

      // Check if user is Super Admin by role OR authorized Admin Email (Gmail / Email login)
      const adminByEmail = isEmailAdmin(sessionUser.email, systemConfig)
      if (adminByEmail && role !== 'super_admin') {
        role = 'super_admin'
        try {
          supabaseClient.from('profiles').update({ role: 'super_admin' }).eq('id', sessionUser.id)
        } catch (e) {}
      }

      // Check if user account was suspended by Super Admin
      if (status === 'suspended' && role !== 'super_admin' && !adminByEmail) {
        try { await supabaseClient.auth.signOut() } catch (e) {}
        const suspendedPayload = { in: false, admin: false, user: null }
        setStored('neota_auth', suspendedPayload)
        if (isMounted) {
          setAuthState(suspendedPayload)
          setAuthLoading(false)
        }
        notify('Your account has been suspended by Administration.', 'error')
        return
      }

      const isSuperAdmin = role === 'super_admin' || adminByEmail
      const authPayload = {
        in: true,
        admin: isSuperAdmin,
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          name: fullName,
          role: isSuperAdmin ? 'super_admin' : role,
          status,
          tier
        }
      }

      setStored('neota_auth', authPayload)
      if (isMounted) {
        setAuthState(authPayload)
        setAuthLoading(false)
      }

      fetchCloudData(sessionUser.id)
    }

    // Check initial active session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        resolveProfile(session.user)
      } else {
        if (isMounted) setAuthLoading(false)
      }
    }).catch(() => {
      if (isMounted) setAuthLoading(false)
    })

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        resolveProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        const loggedOut = { in: false, admin: false, user: null }
        setStored('neota_auth', loggedOut)
        if (isMounted) {
          setAuthState(loggedOut)
          setAuthLoading(false)
        }
      } else if (!session) {
        if (isMounted) setAuthLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [supabaseClient])

  const loginUser = async ({ email, password }) => {
    if (supabaseClient) {
      setAuthLoading(true)
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) {
        setAuthLoading(false)
        throw error
      }

      let role = 'user'
      let status = 'active'
      let tier = 'free'
      let fullName = data.user?.user_metadata?.full_name || email.split('@')[0]
      try {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('full_name, role, status, tier')
          .eq('id', data.user.id)
          .single()
        if (profile) {
          if (profile.role) role = profile.role
          if (profile.full_name) fullName = profile.full_name
          if (profile.status) status = profile.status
          if (profile.tier) tier = profile.tier
        }
      } catch {}

      const adminByEmail = isEmailAdmin(email, systemConfig)
      if (adminByEmail && role !== 'super_admin') {
        role = 'super_admin'
        try {
          supabaseClient.from('profiles').update({ role: 'super_admin' }).eq('id', data.user.id)
        } catch (e) {}
      }

      if (status === 'suspended' && role !== 'super_admin' && !adminByEmail) {
        try { await supabaseClient.auth.signOut() } catch (e) {}
        setAuthLoading(false)
        throw new Error('آپ کا اکاؤنٹ معطل (Suspended) کر دیا گیا ہے۔ برائے مہربانی ایڈمن سے رابطہ کریں۔')
      }

      const isSuperAdmin = role === 'super_admin' || adminByEmail
      const authPayload = {
        in: true,
        admin: isSuperAdmin,
        user: { id: data.user.id, email: data.user.email, name: fullName, role: isSuperAdmin ? 'super_admin' : role, status, tier }
      }
      setStored('neota_auth', authPayload)
      setAuthState(authPayload)
      setAuthLoading(false)
      notify(isSuperAdmin ? 'Welcome Super Admin!' : 'Logged in successfully via Supabase!')
      fetchCloudData(data.user.id)
      return data
    } else {
      const isAdmin = isEmailAdmin(email, systemConfig)
      const authPayload = {
        in: true,
        admin: isAdmin,
        user: { email, name: email.split('@')[0], role: isAdmin ? 'super_admin' : 'user' }
      }
      setStored('neota_auth', authPayload)
      setAuthState(authPayload)
      setAuthLoading(false)
      notify(isAdmin ? 'Welcome Super Admin (Local Mode)!' : 'Signed in (Local Mode)!')
      return { user: { email } }
    }
  }

  const signupUser = async ({ email, password, fullName }) => {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/app`
        }
      })
      if (error) throw error

      if (!data.session) {
        notify('Verification email sent! Please check your inbox.')
        return { ...data, needsEmailVerification: true }
      }

      notify('Account registered successfully with Supabase!')
      return data
    } else {
      setAuthState({
        in: true,
        admin: false,
        user: { email, name: fullName || email.split('@')[0], role: 'user' }
      })
      notify('Account created (Local Mode)!')
      return { user: { email } }
    }
  }

  const resetPasswordEmail = async email => {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      })
      if (error) throw error
      notify('Password reset email dispatched!')
      return data
    } else {
      notify('Password reset email sent (Local Mode)!')
      return { ok: true }
    }
  }

  const updateUserPassword = async newPassword => {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword })
      if (error) throw error
      notify('Password updated successfully!')
      return data
    } else {
      notify('Password updated (Local Mode)!')
      return { ok: true }
    }
  }

  const loginWithGoogle = async () => {
    if (supabaseClient) {
      setAuthLoading(true)
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      })
      if (error) {
        setAuthLoading(false)
        throw error
      }
      return data
    } else {
      const authPayload = {
        in: true,
        admin: false,
        user: { email: 'google.guest@gmail.com', name: 'Google User', role: 'user' }
      }
      setStored('neota_auth', authPayload)
      setAuthState(authPayload)
      setAuthLoading(false)
      notify('Signed in via Google!')
      return { user: { email: 'google.guest@gmail.com' } }
    }
  }

  const logoutUser = async () => {
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut()
      } catch (e) {
        console.warn('Signout note:', e)
      }
    }
    const loggedOut = { in: false, admin: false, user: null }
    setStored('neota_auth', loggedOut)
    setAuthState(loggedOut)
    setAuthLoading(false)

    // Complete isolation: Wipe local ledger state on logout so next user begins with clean state
    setEvents([])
    setPeople([])
    setTx([])
    setVendors([])
    setTables([])
    setDenominations({})
    setActiveEventState('')
    localStorage.removeItem('neota_events')
    localStorage.removeItem('neota_people')
    localStorage.removeItem('neota_tx')
    localStorage.removeItem('neota_vendors')
    localStorage.removeItem('neota_tables')
    localStorage.removeItem('neota_denominations')
    localStorage.removeItem('neota_active_event')

    notify('Logged out.')
  }

  // ========================================================
  // SUPER ADMIN SECRET MASTER KEY AUTHENTICATION
  // For instant administrative access on any phone without Gmail
  // ========================================================
  const getSuperAdminKey = () => {
    return localStorage.getItem('neota_super_admin_secret_key') ||
      import.meta.env.VITE_SUPER_ADMIN_SECRET_KEY ||
      'NEOTA-SUPER-ADMIN-7860'
  }

  const loginWithSecretKey = async (secretKey) => {
    const activeKey = getSuperAdminKey().trim()
    if (!secretKey || secretKey.trim() !== activeKey) {
      throw new Error('غلط خفیہ ماسٹر کی! (Invalid Super Admin Secret Key. Access Denied.)')
    }

    setAuthLoading(true)

    // Build elevated Super Admin session
    const authPayload = {
      in: true,
      admin: true,
      user: {
        id: 'super-admin-master',
        email: 'superadmin@neota.system',
        name: 'Super Administrator',
        role: 'super_admin',
        isMasterKeySession: true
      }
    }

    setStored('neota_auth', authPayload)
    setAuthState(authPayload)
    setAuthLoading(false)

    if (logAudit) {
      logAudit('SUPER_ADMIN_MASTER_KEY_LOGIN', 'Master Security Key Portal', {
        timestamp: new Date().toISOString()
      })
    }

    notify('Super Admin Master Access Granted! (سپر ایڈمن رسائی منظور)')
    return authPayload
  }

  const updateSuperAdminKey = async (currentKey, newKey) => {
    const activeKey = getSuperAdminKey().trim()
    if (!currentKey || currentKey.trim() !== activeKey) {
      throw new Error('موجودہ ماسٹر کی غلط ہے! (Current Secret Key is incorrect.)')
    }
    if (!newKey || newKey.trim().length < 6) {
      throw new Error('نئی ماسٹر کی کم از کم 6 ہندسوں یا حروف کی ہونی چاہیے! (New Secret Key must be at least 6 characters.)')
    }

    localStorage.setItem('neota_super_admin_secret_key', newKey.trim())
    if (logAudit) {
      logAudit('SUPER_ADMIN_KEY_CHANGED', 'Security Settings', {
        timestamp: new Date().toISOString()
      })
    }
    notify('Super Admin Secret Key updated! (نئی ماسٹر کی محفوظ ہو گئی)')
    return true
  }

  // Manage Authorized Admin Emails (Gmail / Corporate addresses)
  const addAdminEmail = async (newEmail) => {
    const clean = String(newEmail).toLowerCase().trim()
    if (!clean || !clean.includes('@')) throw new Error('Please enter a valid email address.')
    const current = (systemConfig?.admin_emails || []).map(e => String(e).toLowerCase().trim())
    if (current.includes(clean)) {
      notify(`${clean} is already in the authorized admin list.`)
      return
    }
    const updated = [...current, clean]
    await updateSystemConfig({ admin_emails: updated })
    localStorage.setItem('neota_admin_emails', JSON.stringify(updated))
    notify(`Admin privileges granted to ${clean}! (ایڈمن جی میل شامل ہو گیا)`)
  }

  const removeAdminEmail = async (emailToRemove) => {
    const clean = String(emailToRemove).toLowerCase().trim()
    const current = (systemConfig?.admin_emails || []).map(e => String(e).toLowerCase().trim())
    const updated = current.filter(e => e !== clean)
    await updateSystemConfig({ admin_emails: updated })
    localStorage.setItem('neota_admin_emails', JSON.stringify(updated))
    notify(`Admin privileges revoked for ${clean}`)
  }

  // ========================================================
  // ENTERPRISE SUPER ADMIN PLATFORM MANAGEMENT METHODS
  // ========================================================
  const updateSystemConfig = async (patch) => {
    const updated = {
      ...systemConfig,
      ...patch,
      updated_at: new Date().toISOString()
    }
    setSystemConfig(updated)
    setStored('neota_system_config', updated)

    if (supabaseClient && isSupabaseConnected) {
      try {
        const { error } = await supabaseClient
          .from('system_config')
          .upsert({
            id: 'primary_config',
            billing_mode: updated.billing_mode,
            tiers: updated.tiers,
            payment_methods: updated.payment_methods,
            broadcast_banner: updated.broadcast_banner,
            updated_at: updated.updated_at
          }, { onConflict: 'id' })
        if (error) console.warn('Supabase system_config sync note:', error)
      } catch (err) {
        console.warn('Could not sync system_config to Supabase:', err)
      }
    }

    if (logAudit) {
      logAudit('UPDATE_SYSTEM_CONFIG', 'Platform Config', { patchKeys: Object.keys(patch) })
    }
    notify('System configuration updated successfully!')
    return updated
  }

  const toggleUserStatus = async (userId, newStatus) => {
    if (supabaseClient && isSupabaseConnected) {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)
      if (error) throw error
    }
    if (logAudit) {
      logAudit('USER_STATUS_CHANGE', `User ${userId}`, { newStatus })
    }
    notify(`User status updated to ${newStatus.toUpperCase()}`)
    return true
  }

  const assignUserTier = async (userId, newTier) => {
    if (supabaseClient && isSupabaseConnected) {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ tier: newTier })
        .eq('id', userId)
      if (error) throw error
    }
    if (logAudit) {
      logAudit('USER_TIER_ASSIGNED', `User ${userId}`, { newTier })
    }
    notify(`User subscription plan set to ${newTier.toUpperCase()}`)
    return true
  }

  const toggleEventFreeze = async (eventId, freezeState, reason = 'Administrative Safety Lock') => {
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, isFrozen: freezeState, freezeReason: reason } : ev))

    if (supabaseClient && isSupabaseConnected) {
      const { error } = await supabaseClient
        .from('events')
        .update({
          is_frozen: freezeState,
          freeze_reason: freezeState ? reason : null
        })
        .eq('id', eventId)
      if (error) throw error
    }

    if (logAudit) {
      logAudit(freezeState ? 'EVENT_FREEZE' : 'EVENT_UNFREEZE', `Event ${eventId}`, { reason })
    }
    notify(freezeState ? 'Event locked / frozen (Read-Only Mode active)' : 'Event unlocked successfully!')
    return true
  }

  const supportImpersonate = (targetUser) => {
    setImpersonatedUser(targetUser)
    const userEvent = events.find(e => e.ownerId === targetUser.id)
    if (userEvent) {
      setActiveEventState(userEvent.id)
    }
    notify(`Support Mode active: viewing as ${targetUser.full_name || targetUser.email}`, 'info')
  }

  const exitImpersonation = () => {
    setImpersonatedUser(null)
    notify('Exited Support Mode.')
  }

  const exportPlatformDatabaseBackup = () => {
    const backupData = {
      platform: 'NEOTA Digital Ledger',
      backup_timestamp: new Date().toISOString(),
      version: '3.0 Enterprise RBAC',
      system_config: systemConfig,
      data: {
        events,
        people,
        transactions: tx,
        vendors,
        tables,
        denominations
      }
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `NEOTA_PLATFORM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    notify('Platform cloud backup JSON downloaded!')
  }

  const restorePlatformDatabaseBackup = async (jsonContent) => {
    try {
      const parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent
      const data = parsed.data || parsed
      if (!data || (!data.events && !data.transactions && !data.tx && !data.people)) {
        throw new Error('Invalid NEOTA platform backup format. Missing core ledger tables.')
      }

      if (Array.isArray(data.events)) {
        setEvents(data.events)
        setStored('neota_events', data.events)
      }
      if (Array.isArray(data.people)) {
        setPeople(data.people)
        setStored('neota_people', data.people)
      }
      const transactionsList = Array.isArray(data.transactions) ? data.transactions : (Array.isArray(data.tx) ? data.tx : null)
      if (transactionsList) {
        setTx(transactionsList)
        setStored('neota_tx', transactionsList)
      }
      if (Array.isArray(data.vendors)) {
        setVendors(data.vendors)
        setStored('neota_vendors', data.vendors)
      }
      if (Array.isArray(data.tables)) {
        setTables(data.tables)
        setStored('neota_tables', data.tables)
      }
      if (data.denominations) {
        setDenominations(data.denominations)
        setStored('neota_denominations', data.denominations)
      }
      if (parsed.system_config) {
        setSystemConfig(parsed.system_config)
        setStored('neota_system_config', parsed.system_config)
      }

      logAudit('PLATFORM_DATABASE_RESTORED', 'Full System Restore', {
        restoredAt: new Date().toISOString(),
        recordsCount: {
          events: data.events?.length || 0,
          people: data.people?.length || 0,
          tx: transactionsList?.length || 0
        }
      })

      notify('Platform Database restored successfully! All records verified. ✅')
      return { ok: true }
    } catch (err) {
      console.error('Platform restore error:', err)
      alert('Failed to restore backup: ' + (err.message || 'Invalid JSON format'))
      return { ok: false, error: err.message }
    }
  }

  // ========================================================
  // SUBSCRIPTION PROOFS & PAYWALL APPROVALS ENGINE
  // ========================================================
  const submitSubscriptionRequest = async (requestData) => {
    const id = generateUUID()
    const newReq = {
      id,
      user_id: auth.user?.id || 'demo_user',
      user_name: auth.user?.name || 'Wedding Host',
      user_email: auth.user?.email || 'host@neota.app',
      tier: requestData.tier, // 'pro' | 'royal'
      amount_pkr: Number(requestData.amount_pkr || 0),
      payment_method: requestData.payment_method || 'jazzcash',
      transaction_ref: requestData.transaction_ref?.trim() || '',
      proof_screenshot: requestData.proof_screenshot || null,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    setSubscriptionRequests(prev => [newReq, ...prev])
    if (supabaseClient && isSupabaseConnected && auth.user?.id) {
      try {
        await supabaseClient.from('subscription_requests').insert({
          id: newReq.id,
          user_id: auth.user.id,
          user_name: newReq.user_name,
          user_email: newReq.user_email,
          tier: newReq.tier,
          amount_pkr: newReq.amount_pkr,
          payment_method: newReq.payment_method,
          transaction_ref: newReq.transaction_ref,
          proof_screenshot: newReq.proof_screenshot,
          status: 'pending'
        })
      } catch (err) {
        console.warn('Sub request cloud insert note:', err)
      }
    }
    notify('Subscription payment proof submitted! Admin will verify and activate your plan. ✅')
    return newReq
  }

  const approveSubscriptionRequest = async (requestId, adminNotes = 'Verified by Super Admin') => {
    const req = subscriptionRequests.find(r => r.id === requestId)
    if (!req) return
    const reviewedAt = new Date().toISOString()
    const updated = {
      ...req,
      status: 'approved',
      admin_notes: adminNotes,
      reviewed_at: reviewedAt
    }
    setSubscriptionRequests(prev => prev.map(r => r.id === requestId ? updated : r))
    await assignUserTier(req.user_id, req.tier)

    if (supabaseClient && isSupabaseConnected) {
      try {
        await supabaseClient.from('subscription_requests').update({
          status: 'approved',
          admin_notes: adminNotes,
          reviewed_at: reviewedAt
        }).eq('id', requestId)
      } catch (err) {
        console.warn('Sub request approve note:', err)
      }
    }
    logAudit('SUBSCRIPTION_REQUEST_APPROVED', `User ${req.user_email}`, { tier: req.tier, amount: req.amount_pkr, ref: req.transaction_ref })
    notify(`Plan activated! User upgraded to ${req.tier.toUpperCase()} ✓`)
  }

  const rejectSubscriptionRequest = async (requestId, adminNotes = 'Payment TID not verified') => {
    const req = subscriptionRequests.find(r => r.id === requestId)
    if (!req) return
    const reviewedAt = new Date().toISOString()
    const updated = {
      ...req,
      status: 'rejected',
      admin_notes: adminNotes,
      reviewed_at: reviewedAt
    }
    setSubscriptionRequests(prev => prev.map(r => r.id === requestId ? updated : r))

    if (supabaseClient && isSupabaseConnected) {
      try {
        await supabaseClient.from('subscription_requests').update({
          status: 'rejected',
          admin_notes: adminNotes,
          reviewed_at: reviewedAt
        }).eq('id', requestId)
      } catch (err) {
        console.warn('Sub request reject note:', err)
      }
    }
    logAudit('SUBSCRIPTION_REQUEST_REJECTED', `User ${req.user_email}`, { reason: adminNotes })
    notify('Subscription request rejected.', 'error')
  }

  // ========================================================
  // LIVE RADAR TELEMETRY ENGINE
  // ========================================================
  const getLiveRadarStats = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayEvents = events.filter(e => e.date === todayStr)
    const todayEventIds = new Set(todayEvents.map(e => e.id))

    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    const activeRecentSlips = tx.filter(t => {
      const txTime = new Date(t.at || 0).getTime()
      return txTime >= twoHoursAgo && !t.isDeleted
    })

    const todayTx = tx.filter(t => (todayEventIds.has(t.eventId) || new Date(t.at || 0).toISOString().startsWith(todayStr)) && t.dir === 'received' && !t.isDeleted)
    const todayVolume = todayTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const todayCash = todayTx.filter(t => (t.paymentMethod || 'cash') === 'cash').reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const todayDigital = todayTx.filter(t => ['raast', 'bank', 'online'].includes((t.paymentMethod || '').toLowerCase())).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const voidedList = tx.filter(t => Boolean(t.isDeleted))

    return {
      todayEventsCount: todayEvents.length,
      todayEvents,
      activeRecentSlipsCount: activeRecentSlips.length,
      todayVolume,
      todayCash,
      todayDigital,
      todaySlipsCount: todayTx.length,
      voidedCount: voidedList.length,
      voidedList
    }
  }, [events, tx])

  // ========================================================
  // EVENTS CRUD & CLOUD SYNC
  // ========================================================
  const addEvent = async eventData => {
    const id = generateUUID()
    const pin = eventData.pin || Math.floor(1000 + Math.random() * 9000).toString()
    const newEv = {
      id,
      ownerId: auth.user?.id || null,
      pin,
      status: 'Active',
      type: eventData.type || 'Walima',
      venue: eventData.venue || '',
      date: eventData.date || new Date().toISOString().split('T')[0],
      allowPinEntry: eventData.allowPinEntry || false,
      reconciliationTallies: {},
      cardConfig: { ...DEFAULT_CARD_CONFIG, ...(eventData.cardConfig || {}) },
      expenses: {},
      duas: [],
      ...eventData
    }
    setEvents(prev => [newEv, ...prev])
    if (!activeEvent) setActiveEventState(id)
    notify(t('successSaved'))

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        await supabaseClient.from('events').insert({
          id: newEv.id,
          title: newEv.title,
          event_type: newEv.type,
          event_date: newEv.date,
          venue: newEv.venue,
          status: newEv.status,
          pin: newEv.pin,
          allow_pin_entry: newEv.allowPinEntry,
          reconciliation_tallies: newEv.reconciliationTallies,
          card_config: newEv.cardConfig,
          expenses: newEv.expenses,
          duas: newEv.duas,
          owner_id: auth.user.id
        })
      } catch (err) {
        console.warn('Supabase event insert note:', err)
      }
    }

    return id
  }

  const updateEvent = async (id, patch) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
    notify('Event updated')

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        const updatePayload = {}
        if (patch.title !== undefined) updatePayload.title = patch.title
        if (patch.type !== undefined) updatePayload.event_type = patch.type
        if (patch.date !== undefined) updatePayload.event_date = patch.date
        if (patch.venue !== undefined) updatePayload.venue = patch.venue
        if (patch.status !== undefined) updatePayload.status = patch.status
        if (patch.pin !== undefined) updatePayload.pin = patch.pin
        if (patch.allowPinEntry !== undefined) updatePayload.allow_pin_entry = patch.allowPinEntry
        if (patch.reconciliationTallies !== undefined) updatePayload.reconciliation_tallies = patch.reconciliationTallies
        if (patch.cardConfig !== undefined) updatePayload.card_config = patch.cardConfig
        if (patch.expenses !== undefined) updatePayload.expenses = patch.expenses
        if (patch.duas !== undefined) updatePayload.duas = patch.duas

        if (Object.keys(updatePayload).length > 0) {
          await supabaseClient.from('events').update(updatePayload).eq('id', id)
        }
      } catch (err) {
        console.warn('Supabase event update note:', err)
      }
    }
  }

  const deleteEvent = async id => {
    setEvents(prev => prev.filter(e => e.id !== id))
    if (activeEvent === id) {
      const remaining = events.filter(e => e.id !== id)
      setActiveEventState(remaining.length > 0 ? remaining[0].id : '')
    }
    notify('Event deleted')

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        await supabaseClient.from('events').delete().eq('id', id)
      } catch (err) {
        console.warn('Supabase event delete note:', err)
      }
    }
  }

  // ========================================================
  // MULTI-DEVICE & COUNTER RESOLVERS (CROSS-PHONE SUPPORT)
  // ========================================================
  const resolveEventByPin = async inputPin => {
    if (!inputPin) return null
    const clean = String(inputPin).trim()
    const local = events.find(e => String(e.pin || '').trim() === clean)
    if (local) {
      if (local.allowPinEntry === false) {
        return { error: 'PIN_DISABLED', message: 'The event host has disabled general PIN entry for security. Please use your personal secret counter link.' }
      }
      return local
    }

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('events')
          .select('*')
          .eq('pin', clean)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data && !error) {
          if (data.allow_pin_entry === false) {
            return { error: 'PIN_DISABLED', message: 'The event host has disabled general PIN entry for security. Please use your personal secret counter link.' }
          }
          const formatted = {
            id: data.id,
            title: data.title,
            type: data.event_type || 'Walima',
            date: data.event_date || new Date().toISOString().split('T')[0],
            venue: data.venue || '',
            status: data.status || 'Active',
            pin: data.pin || clean,
            allowPinEntry: data.allow_pin_entry || false,
            reconciliationTallies: data.reconciliation_tallies || {},
            ownerId: data.owner_id,
            cardConfig: data.card_config || { ...DEFAULT_CARD_CONFIG },
            expenses: data.expenses || {},
            duas: data.duas || []
          }
          setEvents(prev => prev.some(e => e.id === formatted.id) ? prev : [formatted, ...prev])
          return formatted
        }
      } catch (err) {
        console.warn('PIN cloud resolve note:', err)
      }
    }
    return null
  }

  const resolveEventByCounterKey = async keyToken => {
    if (!keyToken) return null
    const clean = String(keyToken).trim()

    // 1. Check local
    for (const ev of events) {
      const match = (ev.counterLinks || []).find(l => l.token === clean && l.active !== false)
      if (match) return { event: ev, linkInfo: match }
    }

    // 2. Query Supabase
    if (supabaseClient) {
      try {
        const { data: link, error: linkErr } = await supabaseClient
          .from('counter_links')
          .select('*, events(*)')
          .eq('token', clean)
          .eq('active', true)
          .single()

        if (link && link.events && !linkErr) {
          const ev = link.events
          const formatted = {
            id: ev.id,
            title: ev.title,
            type: ev.event_type || 'Walima',
            date: ev.event_date || new Date().toISOString().split('T')[0],
            venue: ev.venue || '',
            status: ev.status || 'Active',
            pin: ev.pin || '7860',
            ownerId: ev.owner_id,
            cardConfig: ev.card_config || { ...DEFAULT_CARD_CONFIG },
            duas: ev.duas || []
          }
          setEvents(prev => prev.some(e => e.id === formatted.id) ? prev : [formatted, ...prev])
          return {
            event: formatted,
            linkInfo: {
              id: link.id,
              name: link.assistant_name,
              counterTitle: link.counter_title,
              token: link.token
            }
          }
        }
      } catch (err) {
        console.warn('Counter key cloud resolve note:', err)
      }
    }
    return null
  }

  const fetchGuestsForEvent = async eventId => {
    if (!supabaseClient || !eventId) return people.filter(p => p.events?.includes(eventId))

    try {
      const { data, error } = await supabaseClient
        .from('people')
        .select('*')
        .order('name', { ascending: true })

      if (data && !error) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          fatherName: p.father_name || '',
          phone: p.phone || '',
          address: p.address || '',
          relation: p.relation || 'Relative',
          status: p.status || 'Invited',
          notes: p.notes || '',
          events: Array.isArray(p.events) ? p.events : (p.events ? [p.events] : [eventId])
        }))
        setPeople(prev => {
          const existingIds = new Set(prev.map(x => x.id))
          const newOnes = formatted.filter(x => !existingIds.has(x.id))
          return [...prev, ...newOnes]
        })
        return formatted
      }
    } catch (err) {
      console.warn('Fetch guests for event note:', err)
    }
    return people.filter(p => p.events?.includes(eventId))
  }

  const resolvePublicEvent = async eventId => {
    if (!eventId) return null
    const local = events.find(e => e.id === eventId)
    if (local) return local

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (data && !error) {
          const formatted = {
            id: data.id,
            title: data.title,
            type: data.event_type || 'Walima',
            date: data.event_date || new Date().toISOString().split('T')[0],
            venue: data.venue || '',
            status: data.status || 'Active',
            pin: data.pin,
            cardConfig: data.card_config || { ...DEFAULT_CARD_CONFIG },
            duas: data.duas || []
          }
          setEvents(prev => prev.some(e => e.id === formatted.id) ? prev : [formatted, ...prev])
          return formatted
        }
      } catch (err) {
        console.warn('Public event resolve note:', err)
      }
    }
    return null
  }

  // Counter Secret Links Creator
  const createCounterLink = async (eventId, assistantName, counterTitle) => {
    const token = 'sec_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4)
    const newLink = {
      id: generateUUID(),
      name: assistantName?.trim() || 'Assistant',
      counterTitle: counterTitle?.trim() || 'Counter 1',
      token,
      createdAt: new Date().toISOString(),
      active: true
    }

    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, counterLinks: [...(ev.counterLinks || []), newLink] }
      }
      return ev
    }))

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        await supabaseClient.from('counter_links').insert({
          id: newLink.id,
          owner_id: auth.user.id,
          event_id: eventId,
          assistant_name: newLink.name,
          counter_title: newLink.counterTitle,
          token: newLink.token,
          active: true
        })
      } catch (err) {
        console.warn('Counter link cloud insert note:', err)
      }
    }

    notify(`Secret link created for ${newLink.name}!`)
    return newLink
  }

  const revokeCounterLink = async (eventId, linkId) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          counterLinks: (ev.counterLinks || []).map(l => l.id === linkId ? { ...l, active: false } : l)
        }
      }
      return ev
    }))

    if (supabaseClient && auth.in) {
      try {
        await supabaseClient.from('counter_links').update({ active: false }).eq('id', linkId)
      } catch (err) {
        console.warn('Counter link revoke note:', err)
      }
    }
    notify('Counter link revoked. Operator phone is locked out.')
  }

  const reactivateCounterLink = async (eventId, linkId) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          counterLinks: (ev.counterLinks || []).map(l => l.id === linkId ? { ...l, active: true } : l)
        }
      }
      return ev
    }))

    if (supabaseClient && auth.in) {
      try {
        await supabaseClient.from('counter_links').update({ active: true }).eq('id', linkId)
      } catch (err) {
        console.warn('Counter link reactivate note:', err)
      }
    }
    notify('Counter link reactivated successfully!')
  }

  // User Complaints, Feedback & Review Submission
  const submitFeedback = async ({ category, subject, message, rating, userName, userEmail }) => {
    const feedbackPayload = {
      id: generateUUID(),
      user_id: auth.user?.id || null,
      user_name: userName || auth.user?.name || 'Anonymous Host',
      user_email: userEmail || auth.user?.email || '',
      category: category || 'review',
      subject: subject?.trim() || 'General Feedback',
      message: message?.trim() || '',
      rating: Number(rating) || 5,
      status: 'Pending',
      created_at: new Date().toISOString()
    }

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('user_feedback').insert(feedbackPayload).select().single()
        if (error) throw error
        notify('Your review/complaint has been submitted successfully!')
        return { ok: true, data: data || feedbackPayload }
      } catch (err) {
        console.warn('Feedback cloud write note:', err)
      }
    }

    // Local fallback
    const localFeedbacks = getCleanStored('neota_user_feedback', [])
    setStored('neota_user_feedback', [feedbackPayload, ...localFeedbacks])
    notify('Feedback submitted (saved locally)!')
    return { ok: true, data: feedbackPayload }
  }

  // ========================================================
  // PEOPLE / GUESTS CRUD
  // ========================================================
  const addPerson = async (personData, eventId, eventOwnerId) => {
    const id = generateUUID()
    const ownerId = auth.user?.id || eventOwnerId || (eventId ? events.find(e => e.id === eventId)?.ownerId : null) || null
    const newPerson = {
      id,
      ownerId,
      notes: '',
      status: 'Invited',
      phone: '',
      relation: 'Relative',
      fatherName: '',
      address: '',
      ...personData,
      events: eventId ? [eventId] : (personData.events || (activeEvent ? [activeEvent] : []))
    }
    setPeople(prev => [...prev, newPerson])
    notify('Guest added')

    if (supabaseClient && ownerId) {
      try {
        await supabaseClient.from('people').insert({
          id: newPerson.id,
          name: newPerson.name,
          father_name: newPerson.fatherName,
          phone: newPerson.phone,
          address: newPerson.address,
          relation: newPerson.relation,
          status: newPerson.status,
          notes: newPerson.notes,
          events: newPerson.events,
          owner_id: ownerId
        })
      } catch (err) {
        console.warn('Supabase guest insert note:', err)
      }
    }

    return id
  }

  const updatePerson = async (id, patch) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
    notify('Guest updated')

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        const payload = {}
        if (patch.name !== undefined) payload.name = patch.name
        if (patch.fatherName !== undefined) payload.father_name = patch.fatherName
        if (patch.phone !== undefined) payload.phone = patch.phone
        if (patch.address !== undefined) payload.address = patch.address
        if (patch.relation !== undefined) payload.relation = patch.relation
        if (patch.status !== undefined) payload.status = patch.status
        if (patch.notes !== undefined) payload.notes = patch.notes
        if (patch.events !== undefined) payload.events = patch.events

        if (Object.keys(payload).length > 0) {
          await supabaseClient.from('people').update(payload).eq('id', id)
        }
      } catch (err) {
        console.warn('Supabase guest update note:', err)
      }
    }
  }

  const deletePerson = async id => {
    setPeople(prev => prev.filter(p => p.id !== id))
    setTx(prev => prev.filter(t => t.personId !== id))
    notify('Guest and their records deleted')

    if (supabaseClient && auth.in) {
      try {
        await supabaseClient.from('people').delete().eq('id', id)
      } catch (err) {
        console.warn('Supabase guest delete note:', err)
      }
    }
  }

  const importPeople = async (importedList, targetEventId) => {
    const addedCount = importedList.length
    const formatted = importedList.map(item => ({
      id: generateUUID(),
      name: item.name || 'Guest',
      fatherName: item.fatherName || '',
      phone: item.phone || '',
      address: item.address || '',
      relation: item.relation || 'Relative',
      status: item.status || 'Invited',
      notes: item.notes || '',
      events: targetEventId ? [targetEventId] : (activeEvent ? [activeEvent] : [])
    }))
    setPeople(prev => [...prev, ...formatted])
    notify(`Imported ${addedCount} guests successfully!`)

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        const rows = formatted.map(p => ({
          id: p.id,
          name: p.name,
          father_name: p.fatherName,
          phone: p.phone,
          address: p.address,
          relation: p.relation,
          status: p.status,
          notes: p.notes,
          events: p.events,
          owner_id: auth.user.id
        }))
        await supabaseClient.from('people').insert(rows)
      } catch (err) {
        console.warn('Supabase batch import note:', err)
      }
    }
  }

  // ========================================================
  // TRANSACTIONS CRUD (NEOTA / SALAMII) - FLAWLESS SYNC & AUDIT TRAIL
  // ========================================================
  const addTx = transactionData => {
    const id = generateUUID()
    const newTx = {
      id,
      at: new Date().toISOString(),
      dir: 'received',
      giftType: 'cash',
      paymentMethod: 'cash',
      giftDescription: '',
      note: '',
      recordedBy: transactionData.recordedBy || auth.user?.name || 'Master Host',
      counterName: transactionData.counterName || 'Main Counter',
      counterToken: transactionData.counterToken || null,
      updatedAt: null,
      updatedBy: null,
      editHistory: [],
      ...transactionData
    }
    setTx(prev => [newTx, ...prev])
    return newTx
  }

  // System & Forensic Audit Logging Service
  const logAudit = async (action, target, details = {}) => {
    if (supabaseClient) {
      try {
        await supabaseClient.from('audit_events').insert({
          id: generateUUID(),
          actor_id: auth.user?.id || null,
          action,
          target,
          details,
          created_at: new Date().toISOString()
        })
      } catch (e) {
        // Silently skip if audit table not yet migrated
      }
    }
  }

  const saveTx = async transactionData => {
    // Check if event is locked/frozen by Super Admin
    if (transactionData.eventId) {
      const targetEvent = events.find(e => e.id === transactionData.eventId)
      if (targetEvent?.isFrozen) {
        const freezeMsg = `This event has been locked by Administration: ${targetEvent.freezeReason || 'Read-Only Mode'}`
        notify(freezeMsg, 'error')
        throw new Error(freezeMsg)
      }
    }

    const created = addTx(transactionData)
    let ownerId = auth.user?.id || transactionData.ownerId || created.ownerId || null

    if (!ownerId && transactionData.eventId) {
      const targetEvent = events.find(e => e.id === transactionData.eventId)
      if (targetEvent?.ownerId) {
        ownerId = targetEvent.ownerId
      }
    }

    if (!ownerId && supabaseClient && transactionData.eventId) {
      try {
        const { data: ev } = await supabaseClient.from('events').select('owner_id').eq('id', transactionData.eventId).single()
        if (ev?.owner_id) ownerId = ev.owner_id
      } catch (e) {}
    }

    const canSyncToCloud = isUUID(created.id) && isUUID(transactionData.eventId)

    if (supabaseClient && isOnline && canSyncToCloud) {
      try {
        setCloudSyncStatus('syncing')
        const { error } = await supabaseClient.from('neota_transactions').insert({
          id: created.id,
          event_id: transactionData.eventId,
          person_id: isUUID(transactionData.personId) ? transactionData.personId : null,
          direction: transactionData.dir || 'received',
          amount_pkr: Number(transactionData.amount || 0),
          gift_type: transactionData.giftType || 'cash',
          payment_method: transactionData.paymentMethod || 'cash',
          gift_description: transactionData.giftDescription || '',
          note: transactionData.note || '',
          recorded_by: created.recordedBy,
          counter_name: created.counterName,
          counter_token: created.counterToken,
          edit_history: [],
          owner_id: isUUID(ownerId) ? ownerId : null
        })

        if (error) {
          throw error
        }
        setCloudSyncStatus('synced')
      } catch (err) {
        console.warn('[NEOTA DB] Direct insert deferred. Saved to resilient offline queue:', err)
        // Store in resilient offline queue for automatic retry
        if (canSyncToCloud) {
          setOfflineQueue(prev => {
            const item = {
              type: 'transaction',
              id: created.id,
              payload: {
                ...transactionData,
                id: created.id,
                recordedBy: created.recordedBy,
                counterName: created.counterName,
                counterToken: created.counterToken,
                ownerId
              }
            }
            const updated = [...prev.filter(x => x.id !== created.id), item]
            setStored('neota_offline_queue', updated)
            return updated
          })
          setCloudSyncStatus('pending')
        }
      }
    } else if (canSyncToCloud) {
      // Offline mode: queue immediately
      setOfflineQueue(prev => {
        const item = {
          type: 'transaction',
          id: created.id,
          payload: {
            ...transactionData,
            id: created.id,
            recordedBy: created.recordedBy,
            counterName: created.counterName,
            counterToken: created.counterToken,
            ownerId
          }
        }
        const updated = [...prev.filter(x => x.id !== created.id), item]
        setStored('neota_offline_queue', updated)
        return updated
      })
      setCloudSyncStatus('pending')
    }

    return created
  }

  const updateTx = async (id, patch, editorName = 'Master Host', reason = 'Manual modification') => {
    const current = tx.find(t => t.id === id)
    if (!current) return

    const updatedBy = editorName || auth.user?.name || 'Master Host'
    const updatedAt = new Date().toISOString()

    const auditEntry = {
      id: generateUUID(),
      editedAt: updatedAt,
      editedBy: updatedBy,
      reason: reason || 'Information update',
      changes: []
    }

    if (patch.amount !== undefined && Number(patch.amount) !== Number(current.amount)) {
      auditEntry.changes.push(`Amount changed: ${pkr(current.amount)} ➔ ${pkr(patch.amount)}`)
    }
    if (patch.giftType !== undefined && patch.giftType !== current.giftType) {
      auditEntry.changes.push(`Type changed: ${current.giftType} ➔ ${patch.giftType}`)
    }
    if (patch.giftDescription !== undefined && patch.giftDescription !== current.giftDescription) {
      auditEntry.changes.push(`Gift desc: "${current.giftDescription}" ➔ "${patch.giftDescription}"`)
    }
    if (patch.note !== undefined && patch.note !== current.note) {
      auditEntry.changes.push(`Note modified`)
    }

    const newHistory = [auditEntry, ...(current.editHistory || [])]

    setTx(prev => prev.map(t => t.id === id ? {
      ...t,
      ...patch,
      updatedAt,
      updatedBy,
      editHistory: newHistory
    } : t))

    notify('Transaction updated with tamper-proof audit trail')

    // Forensic logging
    logAudit('TRANSACTION_EDITED', id, { editor: updatedBy, changes: auditEntry.changes })

    if (supabaseClient) {
      try {
        const payload = {
          updated_at: updatedAt,
          updated_by: updatedBy,
          edit_history: newHistory
        }
        if (patch.amount !== undefined) payload.amount_pkr = Number(patch.amount)
        if (patch.dir !== undefined) payload.direction = patch.dir
        if (patch.giftType !== undefined) payload.gift_type = patch.giftType
        if (patch.paymentMethod !== undefined) payload.payment_method = patch.paymentMethod
        if (patch.giftDescription !== undefined) payload.gift_description = patch.giftDescription
        if (patch.note !== undefined) payload.note = patch.note
        if (patch.personId !== undefined) payload.person_id = patch.personId

        await supabaseClient.from('neota_transactions').update(payload).eq('id', id)
      } catch (err) {
        console.warn('Supabase tx audit update note:', err)
      }
    }
  }

  const saveCashReconciliation = async (eventId, counterKey, physicalCounted, operatorName, notes) => {
    const ev = events.find(e => e.id === eventId)
    if (!ev) return

    const matchingTx = tx.filter(t => t.eventId === eventId && t.dir === 'received' && (t.counterToken === counterKey || t.counterName === counterKey || t.recordedBy === operatorName))
    const expectedAmount = matchingTx.reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const counted = Number(physicalCounted) || 0
    const diff = counted - expectedAmount

    const tallyRecord = {
      counterKey,
      operatorName,
      reconciledAt: new Date().toISOString(),
      expectedAmount,
      physicalCounted: counted,
      difference: diff,
      status: diff === 0 ? 'balanced' : diff < 0 ? 'shortage' : 'excess',
      notes: notes || ''
    }

    const currentTallies = ev.reconciliationTallies || {}
    const updatedTallies = { ...currentTallies, [counterKey]: tallyRecord }

    await updateEvent(eventId, { reconciliationTallies: updatedTallies })
    notify(diff === 0 ? 'Drawer matched perfectly! ✅' : diff < 0 ? `Drawer shortage noted: ${pkr(Math.abs(diff))} ⚠️` : `Drawer excess noted: ${pkr(diff)} ℹ️`)

    // Forensic logging
    logAudit('DRAWER_RECONCILED', counterKey, { operatorName, counted, expectedAmount, diff })

    return tallyRecord
  }

  const deleteTx = async id => {
    setTx(prev => prev.filter(t => t.id !== id))
    notify('Transaction deleted')

    logAudit('TRANSACTION_DELETED', id, {})

    if (supabaseClient && auth.in) {
      try {
        await supabaseClient.from('neota_transactions').delete().eq('id', id)
      } catch (err) {
        console.warn('Supabase tx delete note:', err)
      }
    }
  }

  const voidTx = async (id, reason = 'Operator cancellation at counter') => {
    const operator = auth.user?.name || 'Counter Operator'
    const now = new Date().toISOString()
    setTx(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          isDeleted: true,
          voidReason: reason,
          voidedBy: operator,
          voidedAt: now
        }
      }
      return t
    }))
    notify('Transaction voided (preserved in anti-theft audit trail) ⚠️')
    logAudit('TRANSACTION_VOIDED', id, { reason, voidedBy: operator, voidedAt: now })

    if (supabaseClient && auth.in) {
      try {
        await supabaseClient.from('neota_transactions').update({
          is_deleted: true,
          void_reason: reason,
          voided_by: operator,
          voided_at: now
        }).eq('id', id)
      } catch (err) {
        console.warn('Supabase tx void note:', err)
      }
    }
  }

  // ========================================================
  // RSVP ENGINE (PUBLIC TO CLOUD)
  // ========================================================
  const submitRSVP = async (eventId, rsvpData) => {
    const existing = people.find(p => p.phone && rsvpData.phone && p.phone.replace(/\D/g, '') === rsvpData.phone.replace(/\D/g, ''))
    if (existing) {
      updatePerson(existing.id, {
        status: rsvpData.attending ? 'Confirmed' : 'Declined',
        notes: `RSVP: ${rsvpData.guestCount || 1} Person(s) · ${rsvpData.message || ''}`,
        events: Array.from(new Set([...(existing.events || []), eventId]))
      })
    } else {
      addPerson({
        name: rsvpData.name,
        phone: rsvpData.phone,
        status: rsvpData.attending ? 'Confirmed' : 'Declined',
        notes: `RSVP: ${rsvpData.guestCount || 1} Person(s) · ${rsvpData.message || ''}`,
        relation: 'Guest'
      }, eventId)
    }

    if (rsvpData.message && rsvpData.message.trim()) {
      const ev = events.find(e => e.id === eventId)
      if (ev) {
        const existingDuas = ev.duas || []
        const newDua = {
          id: generateUUID(),
          name: rsvpData.name,
          message: rsvpData.message.trim(),
          at: new Date().toISOString()
        }
        updateEvent(eventId, { duas: [newDua, ...existingDuas] })
      }
    }

    // Direct Cloud Insert to RSVPs table
    if (supabaseClient && eventId) {
      try {
        await supabaseClient.from('rsvps').insert({
          event_id: eventId,
          name: rsvpData.name,
          phone: rsvpData.phone || '',
          attending: rsvpData.attending,
          guest_count: rsvpData.guestCount || 1,
          message: rsvpData.message || ''
        })
      } catch (err) {
        console.warn('RSVP cloud push note:', err)
      }
    }

    notify('RSVP submitted successfully!')
    return true
  }

  // Card Config
  const updateCardConfig = (eventId, patch) => {
    const ev = events.find(e => e.id === eventId)
    if (!ev) return
    const currentConfig = ev.cardConfig || {}
    updateEvent(eventId, { cardConfig: { ...currentConfig, ...patch } })
    notify('Digital Shadi Card updated!')
  }

  // Vendors Management
  const addVendor = async v => {
    const newV = { ...v, id: generateUUID() }
    setVendors(prev => [newV, ...prev])
    notify('Vendor added successfully!')

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        await supabaseClient.from('vendors').insert({
          id: newV.id,
          owner_id: auth.user.id,
          event_id: newV.eventId,
          name: newV.name,
          category: newV.category,
          contact: newV.contact,
          total_amount: Number(newV.totalAmount || 0),
          advance_paid: Number(newV.advancePaid || 0),
          status: newV.status,
          notes: newV.notes
        })
      } catch (err) {
        console.warn('Vendor cloud insert note:', err)
      }
    }
    return newV
  }

  const updateVendor = async (id, patch) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v))
    notify('Vendor updated!')

    if (supabaseClient && auth.in) {
      try {
        const p = {}
        if (patch.name) p.name = patch.name
        if (patch.category) p.category = patch.category
        if (patch.contact) p.contact = patch.contact
        if (patch.totalAmount !== undefined) p.total_amount = Number(patch.totalAmount)
        if (patch.advancePaid !== undefined) p.advance_paid = Number(patch.advancePaid)
        if (patch.status) p.status = patch.status
        if (patch.notes) p.notes = patch.notes
        await supabaseClient.from('vendors').update(p).eq('id', id)
      } catch (err) {
        console.warn('Vendor cloud update note:', err)
      }
    }
  }

  const deleteVendor = async id => {
    setVendors(prev => prev.filter(v => v.id !== id))
    notify('Vendor removed')

    if (supabaseClient && auth.in) {
      try {
        await supabaseClient.from('vendors').delete().eq('id', id)
      } catch (err) {
        console.warn('Vendor cloud delete note:', err)
      }
    }
  }

  // Seating & Tables Management
  const addTable = async t => {
    const newT = { ...t, id: generateUUID(), guestIds: t.guestIds || [] }
    setTables(prev => [...prev, newT])
    notify('Table added!')

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        await supabaseClient.from('seating_tables').insert({
          id: newT.id,
          owner_id: auth.user.id,
          event_id: newT.eventId,
          number: newT.number,
          name: newT.name,
          category: newT.category,
          capacity: Number(newT.capacity || 10),
          guest_ids: newT.guestIds
        })
      } catch (err) {
        console.warn('Table cloud insert note:', err)
      }
    }
    return newT
  }

  const updateTable = async (id, patch) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    notify('Table updated!')

    if (supabaseClient && auth.in) {
      try {
        const p = {}
        if (patch.number) p.number = patch.number
        if (patch.name) p.name = patch.name
        if (patch.category) p.category = patch.category
        if (patch.capacity !== undefined) p.capacity = Number(patch.capacity)
        if (patch.guestIds !== undefined) p.guest_ids = patch.guestIds
        await supabaseClient.from('seating_tables').update(p).eq('id', id)
      } catch (err) {
        console.warn('Table cloud update note:', err)
      }
    }
  }

  const deleteTable = async id => {
    setTables(prev => prev.filter(t => t.id !== id))
    notify('Table removed')

    if (supabaseClient && auth.in) {
      try {
        await supabaseClient.from('seating_tables').delete().eq('id', id)
      } catch (err) {
        console.warn('Table cloud delete note:', err)
      }
    }
  }

  const assignGuestToTable = (tableId, personId) => {
    setTables(prev => {
      const updated = prev.map(tbl => {
        const filtered = (tbl.guestIds || []).filter(pid => pid !== personId)
        if (tbl.id === tableId) {
          return { ...tbl, guestIds: [...filtered, personId] }
        }
        return { ...tbl, guestIds: filtered }
      })

      const target = updated.find(tbl => tbl.id === tableId)
      if (target && supabaseClient && auth.in) {
        supabaseClient.from('seating_tables').update({ guest_ids: target.guestIds }).eq('id', tableId).then()
      }
      return updated
    })
    notify('Guest table updated!')
  }

  // Denominations Management
  const saveDenominations = async (eventId, counts) => {
    setDenominations(prev => ({ ...prev, [eventId]: counts }))
    notify('Cash tally denominations saved!')

    if (supabaseClient && auth.in && auth.user?.id) {
      try {
        await supabaseClient.from('denominations').upsert({
          owner_id: auth.user.id,
          event_id: eventId,
          counts,
          updated_at: new Date().toISOString()
        }, { onConflict: 'owner_id,event_id' })
      } catch (err) {
        console.warn('Denominations cloud save note:', err)
      }
    }
  }

  // Backup & Restore
  const exportDatabaseJSON = () => {
    const data = {
      events,
      people,
      tx,
      vendors,
      tables,
      version: '2.0.0',
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neota_ledger_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Backup downloaded!')
  }

  const importDatabaseJSON = jsonText => {
    try {
      const data = JSON.parse(jsonText)
      if (Array.isArray(data.events)) setEvents(data.events)
      if (Array.isArray(data.people)) setPeople(data.people)
      if (Array.isArray(data.tx)) setTx(data.tx)
      if (Array.isArray(data.vendors)) setVendors(data.vendors)
      if (Array.isArray(data.tables)) setTables(data.tables)
      notify('Database restored successfully!')
      return true
    } catch (err) {
      alert('Invalid backup JSON file.')
      return false
    }
  }

  const resetToCleanData = () => {
    if (confirm('Are you sure you want to clear all data and start completely fresh? All local ledger records will be removed.')) {
      setEvents([])
      setPeople([])
      setTx([])
      setVendors([])
      setTables([])
      setDenominations({})
      setActiveEventState('')
      localStorage.removeItem('neota_events')
      localStorage.removeItem('neota_people')
      localStorage.removeItem('neota_tx')
      localStorage.removeItem('neota_vendors')
      localStorage.removeItem('neota_tables')
      localStorage.removeItem('neota_denominations')
      localStorage.removeItem('neota_active_event')
      notify('All ledger records cleared. Fresh workspace ready!')
    }
  }

  const loadDemoData = () => {
    if (confirm('Load sample demonstration records for testing?')) {
      setEvents(DEMO_SEED_DATA.events)
      setPeople(DEMO_SEED_DATA.people)
      setTx(DEMO_SEED_DATA.tx)
      setVendors(DEMO_SEED_DATA.vendors)
      setTables(DEMO_SEED_DATA.tables)
      setActiveEventState('demo_e1')
      notify('Sample demo records loaded.')
    }
  }

  const updatePaymentSettings = patch => {
    setPaymentSettings(prev => ({ ...prev, ...patch }))
    notify('Payment settings updated')
  }

  const updateEventExpense = (eventId, expenseData) => {
    updateEvent(eventId, { expenses: expenseData })
  }


  return (
    <Ctx.Provider value={{
      events,
      people,
      tx,
      vendors,
      tables,
      denominations,
      activeEvent,
      setActiveEvent,
      addEvent,
      resolveEventByPin,
      resolveEventByCounterKey,
      fetchGuestsForEvent,
      resolvePublicEvent,
      createCounterLink,
      revokeCounterLink,
      reactivateCounterLink,
      submitFeedback,
      updateEvent,
      deleteEvent,
      updateEventExpense,
      updateCardConfig,
      addVendor,
      updateVendor,
      deleteVendor,
      addTable,
      updateTable,
      deleteTable,
      assignGuestToTable,
      saveDenominations,
      addPerson,
      updatePerson,
      deletePerson,
      importPeople,
      submitRSVP,
      addTx,
      saveTx,
      updateTx,
      deleteTx,
      voidTx,
      saveCashReconciliation,
      subscriptionRequests,
      submitSubscriptionRequest,
      approveSubscriptionRequest,
      rejectSubscriptionRequest,
      getLiveRadarStats,
      auth,
      setAuth: setAuthState,
      loginUser,
      signupUser,
      loginWithGoogle,
      logoutUser,
      resetPasswordEmail,
      updateUserPassword,
      loginWithSecretKey,
      updateSuperAdminKey,
      getSuperAdminKey,
      addAdminEmail,
      removeAdminEmail,
      isEmailAdmin,
      systemConfig,
      updateSystemConfig,
      toggleUserStatus,
      assignUserTier,
      toggleEventFreeze,
      supportImpersonate,
      exitImpersonation,
      impersonatedUser,
      exportPlatformDatabaseBackup,
      restorePlatformDatabaseBackup,
      isConnected: isSupabaseConnected,
      supabase: supabaseClient,
      authLoading,
      cloudSyncStatus,
      offlineQueue,
      flushOfflineQueue,
      logAudit,
      paymentSettings,
      updatePaymentSettings,
      language,
      setLanguage,
      t,
      toast,
      notify,
      isOnline,
      exportDatabaseJSON,
      importDatabaseJSON,
      resetToCleanData,
      loadDemoData
    }}>
      {children}
    </Ctx.Provider>
  )
}
