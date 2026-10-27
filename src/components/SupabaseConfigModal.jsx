import { useState, useEffect } from 'react'
import {
  Database, ShieldCheck, X, Check, Loader2, KeyRound, ExternalLink,
  Copy, AlertCircle, Sparkles, RefreshCw, Layers
} from 'lucide-react'
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, testSupabaseConnection } from '../lib/supabase'

export default function SupabaseConfigModal({ isOpen, onClose }) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [source, setSource] = useState(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [copiedSchema, setCopiedSchema] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig()
      setUrl(config.url || '')
      setAnonKey(config.key || '')
      setSource(config.source)
      setTestResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testSupabaseConnection(url, anonKey)
    setTestResult(result)
    setTesting(false)
  }

  const handleSave = e => {
    e.preventDefault()
    if (!url || !anonKey) {
      setTestResult({ ok: false, error: 'Please enter both Supabase URL and Anon Key.' })
      return
    }

    const { ok } = saveSupabaseConfig(url, anonKey)
    if (ok) {
      onClose()
    } else {
      setTestResult({ ok: false, error: 'Failed to initialize client with provided credentials.' })
    }
  }

  const handleClear = () => {
    clearSupabaseConfig()
    setUrl('')
    setAnonKey('')
    setSource(null)
    setTestResult({ ok: true, message: 'Supabase configuration cleared. Running in local storage mode.' })
  }

  const copySqlSchema = () => {
    // Quick instructions to copy schema
    const instructions = `-- Run this in Supabase SQL Editor:
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'super_admin')),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  event_type text default 'Walima',
  event_date date default current_date,
  venue text,
  status text default 'Active',
  created_at timestamptz default now()
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  father_name text,
  phone text,
  address text,
  relation text,
  status text default 'Invited',
  created_at timestamptz default now()
);

create table if not exists public.neota_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  event_id uuid references public.events on delete cascade,
  person_id uuid not null references public.people on delete cascade,
  direction text not null check (direction in ('received', 'returned')),
  amount_pkr numeric not null default 0,
  gift_type text not null default 'cash',
  gift_description text,
  note text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.people enable row level security;
alter table public.neota_transactions enable row level security;

create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own events" on public.events for all using (owner_id = auth.uid());
create policy "own people" on public.people for all using (owner_id = auth.uid());
create policy "own transactions" on public.neota_transactions for all using (owner_id = auth.uid());
`
    navigator.clipboard.writeText(instructions)
    setCopiedSchema(true)
    setTimeout(() => setCopiedSchema(false), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sand relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sand mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-ink">Supabase Cloud Configuration</h3>
              <p className="text-xs text-taupe">Secure Authentication & Multi-User Cloud Database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-taupe hover:text-ink rounded-lg hover:bg-cream">
            <X size={18} />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="mb-4 p-3 rounded-xl bg-cream/40 border border-sand flex items-center justify-between text-xs">
          <span className="text-taupe">Active Connection:</span>
          {source ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Connected via {source === 'env' ? '.env file' : 'Custom Project'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
              <span>Offline / Local Storage Mode</span>
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="label">Project URL (VITE_SUPABASE_URL) *</label>
            <input
              className="input font-mono text-xs"
              required
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            <span className="text-[10px] text-taupe mt-1 block">Found under Project Settings &gt; API &gt; Project URL</span>
          </div>

          <div>
            <label className="label">Project Anon Public Key (VITE_SUPABASE_ANON_KEY) *</label>
            <textarea
              className="input font-mono text-xs h-20 resize-none"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
            />
            <span className="text-[10px] text-taupe mt-1 block">Public anon key only. Row Level Security protects your database.</span>
          </div>

          {/* Test connection results banner */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${testResult.ok ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
              {testResult.ok ? <Check size={16} className="text-emerald-700 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold">{testResult.ok ? 'Connection Verified!' : 'Connection Error'}</p>
                <p className="text-[11px] mt-0.5 opacity-90">{testResult.message || testResult.error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !url || !anonKey}
                className="btn text-xs py-2 px-3 border border-sand hover:bg-cream flex items-center gap-1.5 font-medium disabled:opacity-40"
              >
                {testing ? <Loader2 size={13} className="animate-spin text-taupe" /> : <RefreshCw size={13} />}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              {source === 'local' && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn text-xs py-2 px-3 text-red-700 hover:bg-red-50"
                  title="Remove custom credentials"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn text-xs py-2 px-3">
                Cancel
              </button>
              <button type="submit" className="btn btn-p text-xs py-2 px-4 shadow-sm flex items-center gap-1.5">
                <Check size={14} />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>

        {/* Quick Setup Guide Accordion */}
        <div className="mt-4 pt-3 border-t border-sand">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-xs text-taupe hover:text-ink font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-600" />
              <span>How to setup free Supabase project (2-minute guide)</span>
            </span>
            <span>{showGuide ? '▲' : '▼'}</span>
          </button>

          {showGuide && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-950 space-y-2">
              <p><b>1. Create Project:</b> Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-semibold text-emerald-800">supabase.com</a> and create a free project.</p>
              <p><b>2. Copy Credentials:</b> Open <b>Project Settings &gt; API</b>, copy your <b>Project URL</b> and <b>anon public key</b> into the boxes above.</p>
              <p><b>3. Execute SQL Schema:</b> Open <b>SQL Editor</b> in Supabase, paste our schema to enable tables & RLS.</p>

              <button
                type="button"
                onClick={copySqlSchema}
                className="mt-2 btn w-full text-xs py-1.5 bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 border border-amber-300 font-semibold flex items-center justify-center gap-1.5"
              >
                {copiedSchema ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                <span>{copiedSchema ? 'SQL Schema Copied to Clipboard!' : 'Copy SQL Schema to Clipboard'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
