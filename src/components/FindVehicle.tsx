import { useState, useRef, useEffect } from 'react';
import { Search, Clock, Car, X, AlertCircle, ArrowRight, Check, Loader2, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatExactTime, refreshVehicleCache, getVehicles, findVehicleByBay } from '../lib/storage';
import { apiFindVehicle, apiDeleteVehicle, apiBayLookup } from '../lib/api';
import { VehicleRecord, AppView } from '../types';

interface FindVehicleProps {
  onNavigate?: (view: AppView) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function FindVehicle({ onNavigate, addToast }: FindVehicleProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<VehicleRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) { setResult(null); setNotFound(false); return; }
    debounceRef.current = setTimeout(() => doSearch(trimmed), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const doSearch = async (q: string) => {
    setSearching(true); setResult(null); setNotFound(false);
    try {
      // Try bay lookup first (if query looks like a bay: letter+numbers, short)
      const looksLikeBay = /^[A-Z]\d{1,2}$/.test(q);
      if (looksLikeBay) {
        try {
          const bayResp = await apiBayLookup(q);
          if (bayResp.found) {
            setResult({ car_number: bayResp.car_number || '', bay_number: bayResp.bay_number || q, created_at: bayResp.created_at || new Date().toISOString(), updated_at: bayResp.updated_at });
            setSearching(false); return;
          }
        } catch { /* fallback */ }
        // Also check cache
        const cached = findVehicleByBay(q);
        if (cached) { setResult(cached); setSearching(false); return; }
      }
      // Search by car number
      const response = await apiFindVehicle(q);
      if (response.found) {
        setResult({ car_number: response.car_number || q, bay_number: response.bay_number || '', created_at: response.created_at || new Date().toISOString(), updated_at: response.updated_at });
      } else {
        // Also check cache for bay match
        const cached = findVehicleByBay(q);
        if (cached) { setResult(cached); }
        else { setNotFound(true); }
      }
    } catch { /* silent on auto-search */ }
    finally { setSearching(false); }
  };

  const handleSearch = async () => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) { addToast?.('Please enter vehicle number', 'info'); return; }
    await doSearch(trimmed);
  };

  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); addToast?.('Copied to clipboard', 'success'); }
    catch { addToast?.('Failed to copy', 'error'); }
  };

  const handleDelete = async () => {
    if (!result) return;
    setDeleting(true);
    try {
      await apiDeleteVehicle(result.car_number);
      await refreshVehicleCache();
      addToast?.('Vehicle removed successfully', 'success');
      setResult(null); setQuery(''); setNotFound(false); setShowDeleteConfirm(false);
    } catch { addToast?.('Unable to connect to server', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="pt-5 pb-4">
      <h2 className="text-xl font-semibold text-[#1A1D23] mb-0.5">Find Vehicle</h2>
      <p className="text-sm text-[#6B7280] mb-6">Search by vehicle or bay number</p>

      <div className="relative mb-4">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Search className="w-4.5 h-4.5 text-[#9CA3AF]" /></div>
        <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Vehicle or bay number..."
          className="w-full h-14 pl-11 pr-10 rounded-xl bg-white border border-[#DDE3EE] text-[#1A1D23] font-mono text-lg font-bold placeholder-[#9CA3AF]/50 focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/10 focus:border-[#0A1F44] transition-all" />
        {query && <button onClick={() => { setQuery(''); setResult(null); setNotFound(false); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[#F4F6FA]"><X className="w-4 h-4 text-[#9CA3AF]" /></button>}
      </div>

      <button onClick={handleSearch} disabled={searching || !query.trim()}
        className="w-full h-12 rounded-xl bg-[#0A1F44] text-white font-semibold text-sm press-scale shadow-sm shadow-[#0A1F44]/20 disabled:bg-[#DDE3EE] disabled:text-[#9CA3AF] disabled:shadow-none disabled:cursor-not-allowed mb-7 transition-colors flex items-center justify-center gap-2">
        {searching ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</> : 'Find Vehicle'}
      </button>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div key="found" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: 'spring', damping: 22 }}>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center"><Check className="w-3 h-3 text-white" strokeWidth={3} /></div>
                <span className="text-xs font-semibold text-[#1D9E75] uppercase tracking-wider">Vehicle Found</span>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold font-mono text-[#1A1D23]">{result.car_number}</p>
                    <button onClick={() => handleCopy(result.car_number)} className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors"><Copy className="w-4 h-4 text-[#6B7280]" /></button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="w-3 h-3 text-[#9CA3AF]" />
                    <span className="text-[12px] text-[#9CA3AF]">{result.updated_at ? `Updated ${formatExactTime(result.updated_at)}` : `Parked ${formatExactTime(result.created_at)}`}</span>
                  </div>
                </div>
                <div className="w-[100px] h-[100px] rounded-2xl bg-[#1A6FE8] flex items-center justify-center shadow-lg shadow-[#1A6FE8]/25">
                  <span className="text-[42px] font-extrabold font-mono text-white leading-none">{result.bay_number}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 text-[14px] font-medium text-[#E24B4A] hover:text-red-600 transition-colors px-0.5">
              <Trash2 className="w-4 h-4" />Remove Vehicle
            </button>
          </motion.div>
        )}
        {notFound && (
          <motion.div key="notfound" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-6 h-6 text-[#E24B4A]" /></div>
              <h3 className="text-base font-semibold text-[#1A1D23] mb-1">Vehicle Not Found</h3>
              <p className="text-sm text-[#6B7280]">No record for <span className="font-mono font-bold text-[#E24B4A]">{query}</span></p>
            </div>
            <button onClick={() => onNavigate?.('park')} className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl bg-white border border-[#0A1F44] text-[#0A1F44] font-semibold text-sm press-scale">Park This Vehicle<ArrowRight className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !notFound && !searching && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <p className="text-xs text-[#9CA3AF] font-medium mb-2.5 px-0.5">RECENT VEHICLES</p>
          <div className="space-y-2">
            {getVehicles().slice(0, 5).map(v => (
              <button key={v.car_number} onClick={() => setQuery(v.car_number)} className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-white border border-[#DDE3EE] hover:shadow-sm transition-shadow press-scale">
                <div className="flex items-center gap-2.5"><Car className="w-4 h-4 text-[#9CA3AF]" /><span className="text-sm font-semibold text-[#1A1D23] font-mono">{v.car_number}</span></div>
                <span className="text-xs font-bold text-[#1A6FE8] bg-[#EEF4FF] px-2.5 py-1 rounded-[10px]">{v.bay_number}</span>
              </button>
            ))}
            {getVehicles().length === 0 && <div className="text-center py-6"><p className="text-xs text-[#9CA3AF]">No vehicles parked yet</p></div>}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center p-4 pb-8" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-[398px] bg-white rounded-2xl p-5 shadow-2xl">
              <h3 className="text-base font-semibold text-[#1A1D23] mb-1">Remove {result?.car_number} from yard?</h3>
              <p className="text-sm text-[#6B7280] mb-5">This will delete the record from Bay <span className="font-mono font-bold text-[#0A1F44]">{result?.bay_number}</span>.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-11 rounded-xl bg-[#F4F6FA] border border-[#DDE3EE] text-[#6B7280] font-medium text-sm press-scale">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 h-11 rounded-xl bg-[#E24B4A] text-white font-semibold text-sm press-scale flex items-center justify-center gap-2 disabled:opacity-60">
                  {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Removing...</> : 'Remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
