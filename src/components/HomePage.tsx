import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, Car, MapPin, ChevronRight, Zap, Clock, Truck, CalendarCheck, LayoutGrid } from 'lucide-react';
import { AppView, StatsData } from '../types';
import { getVehicles, refreshVehicleCache, formatExactTime, fetchStats } from '../lib/storage';

interface HomePageProps {
  onNavigate: (view: AppView) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [vehicles, setVehicles] = useState(getVehicles());
  const [stats, setStats] = useState<StatsData | null>(null);

  const latestVehicle = vehicles.length > 0
    ? vehicles.reduce((a, b) => new Date(a.updated_at || a.created_at).getTime() > new Date(b.updated_at || b.created_at).getTime() ? a : b)
    : null;

  useEffect(() => {
    refreshVehicleCache().then(setVehicles).catch(() => {});
    fetchStats().then(setStats).catch(() => {});
  }, []);

  const s = stats || { total_vehicles: vehicles.length, today_entries: 0, free_bays: 0, total_bays: 32 };

  return (
    <div className="pt-5 pb-4">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 mb-5 border border-[#DDE3EE]">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1D23]">{getGreeting()} 👋</h2>
            <p className="text-sm text-[#6B7280] mt-0.5">Chennai Yard Operations</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="relative flex h-1.5 w-1.5"><span className="live-dot-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
            <span className="text-[10px] font-semibold text-emerald-700">LIVE SESSION</span>
          </div>
        </div>
      </motion.div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Truck, color: '#0A1F44', bg: '#EEF2F8', value: s.total_vehicles, label: 'In Yard' },
          { icon: CalendarCheck, color: '#1D9E75', bg: '#ECFDF5', value: s.today_entries, label: 'Today' },
          { icon: LayoutGrid, color: '#1A6FE8', bg: '#EEF4FF', value: s.free_bays, label: 'Free Bays' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }} className="bg-white rounded-xl p-3.5 border border-[#DDE3EE] shadow-sm text-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: card.bg }}>
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-[10px] text-[#9CA3AF] font-medium mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="space-y-3 mb-5">
        {[
          { view: 'park' as AppView, icon: Camera, title: 'Park Vehicle', sub: 'Scan plate & assign bay' },
          { view: 'find' as AppView, icon: Search, title: 'Find Vehicle', sub: 'Find vehicle instantly' },
        ].map((a, i) => (
          <motion.button key={a.view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.04 }} onClick={() => onNavigate(a.view)} className="w-full press-scale">
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#DDE3EE] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#0A1F44] flex items-center justify-center shrink-0"><a.icon className="w-6 h-6 text-white" /></div>
              <div className="text-left flex-1"><h3 className="text-[15px] font-semibold text-[#1A1D23]">{a.title}</h3><p className="text-xs text-[#9CA3AF] mt-0.5">{a.sub}</p></div>
              <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Info Strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#EEF2F8] border border-[#DDE3EE]">
        <Zap className="w-4 h-4 text-[#0A1F44] shrink-0" />
        <p className="text-xs text-[#6B7280]">Scan a plate, assign a bay and find it instantly.</p>
      </motion.div>

      {/* Latest Updated */}
      {latestVehicle && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-5">
          <p className="text-xs text-[#9CA3AF] font-medium mb-2.5 px-1">LATEST UPDATED</p>
          <div className="flex items-center justify-between px-3.5 py-3 bg-white rounded-xl border border-[#DDE3EE]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] flex items-center justify-center"><Clock className="w-4 h-4 text-[#0A1F44]" /></div>
              <div>
                <span className="text-sm font-semibold text-[#1A1D23] font-mono">{latestVehicle.car_number}</span>
                <p className="text-[11px] text-[#9CA3AF]">{latestVehicle.updated_at ? 'Updated' : 'Parked'} {formatExactTime(latestVehicle.updated_at || latestVehicle.created_at)}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-white bg-[#0A1F44] px-2.5 py-1 rounded-md">{latestVehicle.bay_number}</span>
          </div>
        </motion.div>
      )}

      {/* Recent Vehicles */}
      {vehicles.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5">
          <p className="text-xs text-[#9CA3AF] font-medium mb-2.5 px-1">RECENT VEHICLES</p>
          <div className="space-y-2">
            {vehicles.slice(0, 5).map(v => (
              <div key={v.car_number} className="flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-[#DDE3EE]">
                <div>
                  <span className="text-sm font-semibold text-[#1A1D23] font-mono">{v.car_number}</span>
                  <p className="text-[11px] text-[#9CA3AF]">{formatExactTime(v.updated_at || v.created_at)}</p>
                </div>
                <span className="text-xs font-bold text-[#1A6FE8] bg-[#EEF4FF] px-2.5 py-1 rounded-[10px]">{v.bay_number}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5 text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2F8] flex items-center justify-center mx-auto mb-3"><MapPin className="w-7 h-7 text-[#9CA3AF]" /></div>
          <p className="text-sm font-medium text-[#6B7280]">No vehicles in yard</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Park a vehicle to get started.</p>
        </motion.div>
      )}
    </div>
  );
}
