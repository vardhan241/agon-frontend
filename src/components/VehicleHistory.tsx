import { useState, useEffect } from 'react';
import { Clock, ArrowRightLeft, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { HistoryRecord } from '../types';
import { apiGetHistory } from '../lib/api';
import { formatExactTime } from '../lib/storage';

interface VehicleHistoryProps {
  addToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function VehicleHistory({ addToast }: VehicleHistoryProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetHistory()
      .then(resp => { if (resp.success && resp.history) setHistory(resp.history); })
      .catch(() => addToast?.('Unable to load history', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const actionColor: Record<string, string> = {
    CREATED: 'bg-emerald-100 text-emerald-700',
    UPDATED: 'bg-blue-100 text-blue-700',
    DELETED: 'bg-red-100 text-red-700',
    MOVED: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="pt-5 pb-4">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[#1A1D23]">Vehicle History</h2>
        <p className="text-sm text-[#6B7280] mt-0.5">{loading ? 'Loading...' : `${history.length} record${history.length !== 1 ? 's' : ''}`}</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-14"><Loader2 className="w-8 h-8 text-[#0A1F44] animate-spin mb-3" /><p className="text-sm text-[#9CA3AF]">Loading history...</p></div>
      ) : history.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2F8] flex items-center justify-center mx-auto mb-3"><Clock className="w-7 h-7 text-[#9CA3AF]" /></div>
          <p className="text-sm font-medium text-[#6B7280]">No history yet</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Vehicle movements will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-white rounded-xl border border-[#DDE3EE] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold font-mono text-[#1A1D23]">{h.car_number}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${actionColor[h.action] || 'bg-gray-100 text-gray-700'}`}>{h.action}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                {h.old_bay ? (
                  <>
                    <span className="font-mono font-semibold">{h.old_bay}</span>
                    <ArrowRightLeft className="w-3 h-3 text-[#9CA3AF]" />
                    <span className="font-mono font-semibold text-[#1A6FE8]">{h.new_bay}</span>
                  </>
                ) : (
                  <span className="font-mono font-semibold text-[#1A6FE8]">Bay {h.new_bay}</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <Clock className="w-3 h-3 text-[#9CA3AF]" />
                <span className="text-[11px] text-[#9CA3AF]">{formatExactTime(h.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
