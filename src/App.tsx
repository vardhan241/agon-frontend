import { useState, useEffect } from 'react';
import { AppView } from './types';
import { seedSampleData, refreshVehicleCache } from './lib/storage';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ParkVehicle from './components/ParkVehicle';
import FindVehicle from './components/FindVehicle';
import VehicleList from './components/VehicleList';
import AdminPanel from './components/AdminPanel';
import VehicleHistory from './components/VehicleHistory';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');

  useEffect(() => {
    seedSampleData();
    refreshVehicleCache().catch(() => {});
  }, []);

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'home' && <HomePage onNavigate={setCurrentView} />}
      {currentView === 'park' && <ParkVehicle onNavigate={setCurrentView} />}
      {currentView === 'find' && <FindVehicle onNavigate={setCurrentView} />}
      {currentView === 'list' && <VehicleList onNavigate={setCurrentView} />}
      {currentView === 'admin' && <AdminPanel onNavigate={setCurrentView} />}
      {currentView === 'history' && <VehicleHistory />}
    </Layout>
  );
}
