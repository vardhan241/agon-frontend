import { useState, useEffect } from 'react';
import { Clock, Trash2, Search, Car, X, Loader2, Download, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVehicles, refreshVehicleCache, formatExactTime, downloadCSV } from '../lib/storage';
import { apiDeleteVehicle } from '../lib/api';
import { VehicleRecord, AppView } from '../types';

interface VehicleListProps {
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (view: AppView) => void;
}

export default function VehicleList({ addToast, onNavigate }: VehicleListProps) {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(getVehicles());
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VehicleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshVehicleCache().then(fresh => { setVehicles(fresh); setLoading(false); }).catch(() => { setVehicles(getVehicles()); setLoading(false); });
  }, []);

  // Sort newest first
  const sorted = [...vehicles].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

  const filtered = sorted.filter(v =>
    v.car_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.bay_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (carNumber: string) => {
    setDeleting(true);
    try {
      await apiDeleteVehicle(carNumber);
      await refreshVehicleCache();
      setVehicles(getVehicles());
      setDeleteTarget(null);
      addToast?.('Vehicle removed successfully', 'success');
    } catch { addToast?.('Unable to connect to server', 'error'); }
    finally { setDeleting(false); }
  };

  const handleDownloadCSV = () => {
    downloadCSV(sorted);
    addToast?.('Report downloaded', 'success');
  };

  return (
    <div className="pt-5 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1D23]">All Vehicles</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{loading ? 'Loading...' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} in yard`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate?.('history')} className="p-2 rounded-lg bg-white border border-[#DDE3EE] hover:bg-[#F4F6FA] transition-colors" title="View History">
            <History className="w-4 h-4 text-[#6B7280]" />
          </button>
          <button onClick={handleDownloadCSV} className="p-2 rounded-lg bg-white border border-[#DDE3EE] hover:bg-[#F4F6FA] transition-colors" title="Download CSV">
            <Download className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>
      </div>

      {vehicles.length > 0 && (
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2"><Search className="w-4 h-4 text-[#9CA3AF]" /></div>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter by car or bay number..."
            className="w-full h-10 pl-9 pr-9 rounded-xl bg-white border border-[#DDE3EE] text-[#1A1D23] text-sm placeholder-[#9CA3AF]/60 focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/10 focus:border-[#0A1F44] transition-all" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-[#9CA3AF]" /></button>}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-14"><Loader2 className="w-8 h-8 text-[#0A1F44] animate-spin mb-3" /><p className="text-sm text-[#9CA3AF]">Loading vehicles...</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#DDE3EE] overflow-hidden">
          <AnimatePresence>
            {filtered.map((vehicle, index) => (
              <motion.div key={vehicle.car_number} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ delay: index * 0.02, duration: 0.2 }}>
                <div className="group flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F6FA] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#F4F6FA] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors"><Car className="w-4 h-4 text-[#9CA3AF]" /></div>
                    <div className="min-w-0">
                      <p className="font-semibold font-mono text-sm text-[#1A1D23] truncate">{vehicle.car_number}</p>
                      <div className="flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3 text-[#9CA3AF]" /><span className="text-[11px] text-[#9CA3AF]">{vehicle.updated_at ? formatExactTime(vehicle.updated_at) : formatExactTime(vehicle.created_at)}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-[#1A6FE8] bg-[#EEF4FF] px-3 py-1.5 rounded-[10px]">{vehicle.bay_number}</span>
                    <button onClick={() => setDeleteTarget(vehicle)} className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5 text-[#E24B4A]" /></button>
                  </div>
                </div>
                {index < filtered.length - 1 && <div className="h-px bg-[#DDE3EE] ml-16 mr-4" />}
              </motion.div>
            ))}
          </AnimatePresence>
          {vehicles.length === 0 && (
            <div className="text-center py-14"><div className="w-14 h-14 rounded-2xl bg-[#EEF2F8] flex items-center justify-center mx-auto mb-3"><Car className="w-7 h-7 text-[#9CA3AF]" /></div><p className="text-sm font-medium text-[#6B7280]">No vehicles parked yet</p><p className="text-xs text-[#9CA3AF] mt-1">Park a vehicle to get started.</p></div>
          )}
          {vehicles.length > 0 && filtered.length === 0 && <div className="text-center py-8"><p className="text-sm text-[#9CA3AF]">No matching vehicles</p></div>}
        </div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center p-4 pb-8" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-[398px] bg-white rounded-2xl p-5 shadow-2xl">
              <h3 className="text-base font-semibold text-[#1A1D23] mb-1">Remove {deleteTarget.car_number} from yard?</h3>
              <p className="text-sm text-[#6B7280] mb-5">This will delete the record from Bay <span className="font-mono font-bold text-[#0A1F44]">{deleteTarget.bay_number}</span>.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 h-11 rounded-xl bg-[#F4F6FA] border border-[#DDE3EE] text-[#6B7280] font-medium text-sm press-scale">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget.car_number)} disabled={deleting} className="flex-1 h-11 rounded-xl bg-[#E24B4A] text-white font-semibold text-sm press-scale flex items-center justify-center gap-2 disabled:opacity-60">
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
