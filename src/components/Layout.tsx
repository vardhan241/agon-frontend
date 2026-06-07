import React, { useState, useCallback } from 'react';
import { AppView, Toast as ToastType } from '../types';
import { Car, Camera, Search, List, ArrowLeft, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from './Toast';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export default function Layout({ currentView, onNavigate, children }: LayoutProps) {
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const showBack = currentView !== 'home';
  const isSubView = currentView === 'admin' || currentView === 'history';

  const addToast = useCallback((message: string, type: ToastType['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[#DDE3EE] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-[#F4F6FA] relative overflow-hidden shadow-2xl shadow-black/10">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0A1F44] h-[60px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => onNavigate(isSubView ? 'list' : 'home')}
                className="p-1.5 -ml-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1A3563] flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-[13px] font-semibold text-white leading-tight">YardLocator</h1>
                <p className="text-[10px] text-white/60 leading-tight">Everest Fleet • Chennai Yard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 border border-white/20">
              <span className="relative flex h-2 w-2">
                <span className="live-dot-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-semibold text-white/80">LIVE</span>
            </div>
            <button
              onClick={() => onNavigate('admin')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-white/50" />
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white/20">
              <span className="text-[11px] font-bold text-white">EX</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 pb-[80px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child as React.ReactElement<any>, { addToast });
                }
                return child;
              })}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        {!isSubView && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-white border-t border-[#DDE3EE]" style={{ height: '64px' }}>
            <div className="flex items-center h-full px-2">
              {[
                { view: 'home' as AppView, icon: Car, label: 'Home' },
                { view: 'park' as AppView, icon: Camera, label: 'Park' },
                { view: 'find' as AppView, icon: Search, label: 'Find' },
                { view: 'list' as AppView, icon: List, label: 'List' },
              ].map(({ view, icon: Icon, label }) => {
                const isActive = currentView === view;
                return (
                  <button key={view} onClick={() => onNavigate(view)} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative press-scale">
                    {isActive && (
                      <motion.div layoutId="nav-indicator" className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#0A1F44]" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                    )}
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#0A1F44]' : 'text-[#9CA3AF]'}`} />
                    <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#0A1F44]' : 'text-[#9CA3AF]'}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Toast Container */}
        <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 w-full max-w-[398px] z-40 flex flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {toasts.map((toast) => (
              <Toast key={toast.id} toast={toast} onDone={removeToast} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
