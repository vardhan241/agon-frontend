import { useState, useEffect } from 'react';
import { Shield, Lock, Download, Trash2, History, Eye, Loader2, AlertTriangle, BarChart3, Car, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView, StatsData, VehicleRecord } from '../types';
import { getVehicles, refreshVehicleCache, downloadCSV, fetchStats } from '../lib/storage';
import { apiClearYard, apiDeleteVehicle } from '../lib/api';

interface AdminPanelProps {
  onNavigate?: (view: AppView) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ADMIN_PASSWORD = 'everest2024';

export default function AdminPanel({ onNavigate, addToast }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authenticated) {
      setVehicles(getVehicles());
      fetchStats().then(setStats).catch(() => {});
    }
  }, [authenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleClearYard = async () => {
    setClearing(true);
    try {
      await apiClearYard();
      await refreshVehicleCache();
      setVehicles(getVehicles());
      setShowClearConfirm(false);
      addToast?.('Yard cleared successfully', 'success');
    } catch { addToast?.('Unable to connect to server', 'error'); }
    finally { setClearing(false); }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDeleteVehicle(deleteTarget.car_number);
      await refreshVehicleCache();
      setVehicles(getVehicles());
      setDeleteTarget(null);
      addToast?.('Vehicle removed successfully', 'success');
    } catch { addToast?.('Unable to connect to server', 'error'); }
    finally { setDeleting(false); }
  };

  if (!authenticated) {
    return (
      <div className="pt-5 pb-4">
        <div className="flex flex-col items-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-[#0A1F44] flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-[#1A1D23] mb-1">Admin Panel</h2>
          <p className="text-sm text-[#6B7280] mb-6">Enter password to continue</p>

          <div className="w-full max-w-xs">
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className="w-full h-12 px-4 rounded-xl bg-white border border-[#DDE3EE] text-[#1A1D23] text-sm placeholder-[#9CA3AF]/60 focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/10 focus:border-[#0A1F44] transition-all text-center font-mono" />
            {passwordError && <p className="text-xs text-[#E24B4A] text-center mt-2">{passwordError}</p>}
            <button onClick={handleLogin} className="w-full h-12 mt-4 rounded-xl bg-[#0A1F44] text-white font-semibold text-sm press-scale shadow-sm shadow-[#0A1F44]/20">Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  const s = stats || { total_vehicles: vehicles.length, today_entries: 0, free_bays: 0, total_bays: 32 };

  return (
    <div className="pt-5 pb-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#0A1F44] flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
        <div><h2 className="text-xl font-semibold text-[#1A1D23]">Admin Panel</h2><p className="text-xs text-[#9CA3AF]">Everest Fleet • Chennai Yard</p></div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl p-4 border border-[#DDE3EE] shadow-sm">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-[#0A1F44]" /><span className="text-[10px] text-[#9CA3AF] font-medium uppercase">Vehicles</span></div>
          <p className="text-2xl font-bold text-[#0A1F44]">{s.total_vehicles}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#DDE3EE] shadow-sm">
          <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-[#1A6FE8]" /><span className="text-[10px] text-[#9CA3AF] font-medium uppercase">Free Bays</span></div>
          <p className="text-2xl font-bold text-[#1A6FE8]">{s.free_bays}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 mb-5">
        <button onClick={() => { downloadCSV(vehicles); addToast?.('Report downloaded', 'success'); }} className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#DDE3EE] press-scale hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-[#EEF2F8] flex items-center justify-center"><Download className="w-4 h-4 text-[#0A1F44]" /></div>
          <div className="text-left"><p className="text-sm font-semibold text-[#1A1D23]">Export Report</p><p className="text-[11px] text-[#9CA3AF]">Download CSV of all vehicles</p></div>
        </button>

        <button onClick={() => onNavigate?.('history')} className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#DDE3EE] press-scale hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] flex items-center justify-center"><History className="w-4 h-4 text-[#1A6FE8]" /></div>
          <div className="text-left"><p className="text-sm font-semibold text-[#1A1D23]">View History</p><p className="text-[11px] text-[#9CA3AF]">Vehicle movement log</p></div>
        </button>

        <button onClick={() => setShowClearConfirm(true)} className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#DDE3EE] press-scale hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 className="w-4 h-4 text-[#E24B4A]" /></div>
          <div className="text-left"><p className="text-sm font-semibold text-[#E24B4A]">Clear Yard</p><p className="text-[11px] text-[#9CA3AF]">Remove all vehicles</p></div>
        </button>
      </div>

      {/* Vehicle List with Delete */}
      <p className="text-xs text-[#9CA3AF] font-medium mb-2.5 px-0.5">ALL VEHICLES ({vehicles.length})</p>
      <div className="bg-white rounded-2xl border border-[#DDE3EE] overflow-hidden">
        {vehicles.length === 0 ? (
          <div className="text-center py-8"><p className="text-sm text-[#9CA3AF]">No vehicles in yard</p></div>
        ) : vehicles.map((v, i) => (
          <div key={v.car_number}>
            <div className="flex items-center justify-between px-4 py-3 hover:bg-[#F4F6FA] transition-colors">
              <div className="flex items-center gap-3"><Car className="w-4 h-4 text-[#9CA3AF]" /><div><p className="text-sm font-semibold font-mono text-[#1A1D23]">{v.car_number}</p><p className="text-[11px] text-[#9CA3AF]">{v.bay_number}</p></div></div>
              <button onClick={() => setDeleteTarget(v)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-[#E24B4A]" /></button>
            </div>
            {i < vehicles.length - 1 && <div className="h-px bg-[#DDE3EE] ml-11" />}
          </div>
        ))}
      </div>

      {/* Clear Yard Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center p-4 pb-8" onClick={() => setShowClearConfirm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-[398px] bg-white rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle className="w-4.5 h-4.5 text-[#E24B4A]" /></div><h3 className="text-base font-semibold text-[#1A1D23]">Clear Entire Yard?</h3></div>
              <p className="text-sm text-[#6B7280] mb-5">This will remove all <span className="font-bold text-[#1A1D23]">{vehicles.length}</span> vehicles. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 h-11 rounded-xl bg-[#F4F6FA] border border-[#DDE3EE] text-[#6B7280] font-medium text-sm press-scale">Cancel</button>
                <button onClick={handleClearYard} disabled={clearing} className="flex-1 h-11 rounded-xl bg-[#E24B4A] text-white font-semibold text-sm press-scale flex items-center justify-center gap-2 disabled:opacity-60">
                  {clearing ? <><Loader2 className="w-4 h-4 animate-spin" />Clearing...</> : 'Clear Yard'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Single Vehicle Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center p-4 pb-8" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-[398px] bg-white rounded-2xl p-5 shadow-2xl">
              <h3 className="text-base font-semibold text-[#1A1D23] mb-1">Remove {deleteTarget.car_number} from yard?</h3>
              <p className="text-sm text-[#6B7280] mb-5">From Bay <span className="font-mono font-bold text-[#0A1F44]">{deleteTarget.bay_number}</span>.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 h-11 rounded-xl bg-[#F4F6FA] border border-[#DDE3EE] text-[#6B7280] font-medium text-sm press-scale">Cancel</button>
                <button onClick={handleDeleteVehicle} disabled={deleting} className="flex-1 h-11 rounded-xl bg-[#E24B4A] text-white font-semibold text-sm press-scale flex items-center justify-center gap-2 disabled:opacity-60">
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
