
import React, { useState, useMemo, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { NotificationTray } from './components/ui/NotificationTray';
import { 
  generateLoadData, 
  PRICING_DATA, 
  USER_PROFILES_GLOBAL, 
  USER_PROFILES_LOCAL, 
  FLEET_BRANDS, 
  generateVehicles,
  GRID_ZONES
} from './constants';
import { GridZone, Alert } from './types';
import { Activity, Clock } from 'lucide-react';

export default function App() {
  // --- Global State ---
  const [currentGridId, setCurrentGridId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(14.5); // 14:30 start
  const [selectedClusterId, setSelectedClusterId] = useState<string>('all');
  
  // Simulation State
  const [isPlaying, setIsPlaying] = useState(false);

  // Real-time State
  const [gridZones, setGridZones] = useState<GridZone[]>(GRID_ZONES);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // --- Alert & Simulation Loop ---
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
        setGridZones(prevZones => {
            return prevZones.map(zone => {
                const change = Math.floor(Math.random() * 10) - 4; 
                let newLoad = Math.max(0, Math.min(100, zone.load + change));
                if (Math.random() > 0.995) newLoad = 95;
                if (Math.random() > 0.995) newLoad = 30;
                if (newLoad > 92 && zone.load <= 92) {
                    addAlert({
                        id: Date.now().toString() + zone.id,
                        type: 'critical',
                        message: `区域 ${zone.id} 负荷过载预警`,
                        timestamp: Date.now(),
                        targetId: zone.id
                    });
                }
                return { ...zone, load: newLoad };
            });
        });
        setCurrentTime((prev) => (prev >= 24 ? 0 : prev + 0.05));
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const addAlert = (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
  };

  const removeAlert = (id: string) => {
      setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleAlertClick = (alert: Alert) => {
      if (alert.targetId) {
          setCurrentGridId(alert.targetId);
      }
  };

  // --- Derived Data ---
  const isGlobal = currentGridId === null;
  const activeGrid = useMemo(() => gridZones.find(g => g.id === currentGridId) || null, [currentGridId, gridZones]);

  const vehicles = useMemo(() => {
      const allVehicles = generateVehicles(isGlobal ? 450 : 30, currentGridId || undefined);
      return allVehicles;
  }, [isGlobal, currentGridId]);

  const fleetUsageStats = useMemo(() => {
      const operational = vehicles.filter(v => v.type === 'Operational').length;
      const privateVehicles = vehicles.filter(v => v.type === 'Private').length;
      const special = vehicles.filter(v => v.type === 'Special').length;
      const logistics = vehicles.filter(v => v.type === 'Logistics').length;

      return [
        { name: '运营车', value: operational },
        { name: '私家车', value: privateVehicles },
        { name: '专用车', value: special },
        { name: '物流车', value: logistics },
      ];
  }, [vehicles]);

  const userProfileData = isGlobal ? USER_PROFILES_GLOBAL : USER_PROFILES_LOCAL;
  
  const fleetBrands = useMemo(() => {
    return FLEET_BRANDS.map(b => ({
      ...b,
      count: isGlobal ? b.count : Math.floor(b.count * 0.2)
    })).sort((a,b) => b.count - a.count);
  }, [isGlobal]);

  const dateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="w-screen h-screen bg-tech-bg text-tech-text flex flex-col font-sans overflow-hidden relative">
      <NotificationTray alerts={alerts} onDismiss={removeAlert} onAlertClick={handleAlertClick} />
      <header className="h-14 border-b border-tech-cyan/20 bg-tech-panel/90 backdrop-blur flex items-center justify-between px-6 z-50 shadow-lg relative">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-tech-cyan/20 rounded border border-tech-cyan text-tech-cyanGlow">
                <Activity size={20} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan to-white uppercase">
                    深圳市电动汽车智能数据监测平台
                </h1>
                <p className="text-[10px] text-tech-dim tracking-widest">智能数据平台 V3.0</p>
            </div>
        </div>
        <div className="flex-1 mx-10 h-full flex items-center justify-center gap-1 opacity-50">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-tech-cyan to-transparent"></div>
            <div className="w-2 h-2 bg-tech-cyan rotate-45"></div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-tech-cyan to-transparent"></div>
        </div>
        <div className="flex items-center gap-4 text-tech-cyan font-mono text-sm">
            <span className="text-tech-dim">{dateStr}</span>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-tech-dim/30">
                <Clock size={14} />
                <span>
                   {Math.floor(currentTime) % 24}:{Math.floor((currentTime % 1) * 60).toString().padStart(2, '0')}
                </span>
            </div>
        </div>
      </header>
      <main className="flex-1 flex p-4 gap-4 overflow-hidden relative z-0">
        <section className="w-[25%] min-w-[320px] h-full">
            <LeftPanel 
                userProfileData={userProfileData}
                fleetBrands={fleetBrands}
                fleetUsage={fleetUsageStats}
                currentGrid={activeGrid}
                totalVehicles={isGlobal ? 2450 : vehicles.length}
                selectedClusterId={selectedClusterId}
                setSelectedClusterId={setSelectedClusterId}
            />
        </section>
        <section className="flex-1 min-w-[500px] h-full flex flex-col gap-4">
            <CenterPanel currentGrid={currentGridId} onGridSelect={setCurrentGridId} vehicles={vehicles} time={currentTime} setTime={setCurrentTime} gridZones={gridZones} isPlaying={isPlaying} togglePlay={() => setIsPlaying(!isPlaying)} />
        </section>
        <section className="w-[25%] min-w-[320px] h-full">
            <RightPanel loadData={generateLoadData(isGlobal)} currentGridId={currentGridId} selectedClusterId={selectedClusterId} />
        </section>
      </main>
    </div>
  );
}
