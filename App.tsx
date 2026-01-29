
import React, { useState, useMemo, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { NotificationTray } from './components/ui/NotificationTray';
import { 
  generateLoadData, 
  FLEET_BRANDS, 
  GRID_ZONES,
  VEHICLE_CLUSTERS,
  USER_PROFILES_GLOBAL,
  COLORS,
  CLUSTER_BEHAVIOR_MODIFIERS
} from './constants';
import { GridZone, Alert, UserType } from './types';
import { Activity, Clock, Filter } from 'lucide-react';

export default function App() {
  const [currentGridId, setCurrentGridId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(14.5);
  // Lifted state for the optimized scenario time to ensure RightPanel syncs with CenterPanel slider
  const [optimizedTime, setOptimizedTime] = useState<number>(14.5);
  
  const [selectedClusterId, setSelectedClusterId] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gridZones, setGridZones] = useState<GridZone[]>(GRID_ZONES);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
        setGridZones(prevZones => prevZones.map(zone => {
            const change = Math.floor(Math.random() * 8) - 3; 
            let newLoad = Math.max(0, Math.min(100, zone.load + change));
            if (newLoad > 92 && zone.load <= 92) {
                const newAlert: Alert = {
                    id: Date.now().toString() + zone.id,
                    type: 'critical',
                    message: `区域 ${zone.id} 负荷过载预警: 当前 ${newLoad}%`,
                    timestamp: Date.now(),
                    targetId: zone.id
                };
                setAlerts(prev => [newAlert, ...prev].slice(0, 5));
            }
            return { ...zone, load: newLoad };
        }));
        setCurrentTime((prev) => (prev >= 24 ? 0 : prev + 0.05));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeGrid = useMemo(() => gridZones.find(g => g.id === currentGridId) || null, [currentGridId, gridZones]);
  const activeCluster = useMemo(() => VEHICLE_CLUSTERS.find(c => c.id === selectedClusterId) || null, [selectedClusterId]);

  const filteredVehiclesCount = useMemo(() => {
      let count = currentGridId ? activeGrid?.vehicleCount || 10000 : 285000;
      if (selectedClusterId !== 'all' && activeCluster) {
          count = currentGridId ? Math.floor(count * 0.15) : activeCluster.count;
      }
      return count;
  }, [currentGridId, selectedClusterId, activeGrid, activeCluster]);

  const fleetUsageStats = useMemo(() => {
      const total = filteredVehiclesCount;
      if (selectedClusterId !== 'all' && activeCluster) {
          const { operational, private: pvt, logistics } = activeCluster.composition;
          const special = 1 - operational - pvt - logistics;
          return [
            { name: '运营车', value: Math.floor(total * operational), color: COLORS.blue },
            { name: '私家车', value: Math.floor(total * pvt), color: COLORS.cyan },
            { name: '物流车', value: Math.floor(total * logistics), color: COLORS.orange },
            { name: '专用车', value: Math.floor(total * Math.max(0, special)), color: COLORS.purple }
          ].filter(d => d.value > 0);
      }
      return [
        { name: '运营车', value: Math.floor(total * 0.42), color: COLORS.blue },
        { name: '私家车', value: Math.floor(total * 0.38), color: COLORS.cyan },
        { name: '物流车', value: Math.floor(total * 0.15), color: COLORS.orange },
        { name: '专用车', value: Math.floor(total * 0.05), color: COLORS.purple },
      ];
  }, [filteredVehiclesCount, selectedClusterId, activeCluster]);

  // Behavioral User Profiles Logic with Cluster Linking
  const userProfileData = useMemo(() => {
      const isTechZone = currentGridId === 'G-6' || currentGridId === 'G-11';
      // Get modifiers based on selected cluster
      const clusterModifiers = (selectedClusterId !== 'all' && CLUSTER_BEHAVIOR_MODIFIERS[selectedClusterId]) 
        ? CLUSTER_BEHAVIOR_MODIFIERS[selectedClusterId] 
        : null;

      return USER_PROFILES_GLOBAL.map(p => {
          let multiplier = 1.0;
          
          // Apply Grid/Zone logic
          if (isTechZone && p.subject === UserType.TimeSensitive) multiplier *= 1.4;
          if (currentGridId && p.subject === UserType.PriceSensitive) multiplier *= 0.9;
          
          // Apply Cluster Logic
          if (clusterModifiers) {
             const mod = clusterModifiers[p.subject] || 1.0;
             multiplier *= mod;
          }

          // Apply scaling based on grid selection size (count)
          const baseValue = p.A * multiplier;
          // Scale down if a specific grid is selected to simulate local data
          const finalValue = Math.floor(baseValue * (currentGridId ? 0.08 : 1));
          
          return { ...p, A: finalValue };
      });
  }, [currentGridId, selectedClusterId]);
  
  const fleetBrands = useMemo(() => {
    return FLEET_BRANDS.map(b => ({
      ...b, count: currentGridId ? Math.floor(b.count * 0.08) : b.count
    })).sort((a,b) => b.count - a.count);
  }, [currentGridId]);

  return (
    <div className="w-screen h-screen bg-tech-bg text-tech-text flex flex-col font-sans overflow-hidden relative">
      <NotificationTray alerts={alerts} onDismiss={(id) => setAlerts(p => p.filter(a => a.id !== id))} onAlertClick={(a) => a.targetId && setCurrentGridId(a.targetId)} />
      <header className="h-14 border-b border-tech-cyan/20 bg-tech-panel/90 backdrop-blur flex items-center justify-between px-6 z-50 relative">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-tech-cyan/20 rounded border border-tech-cyan text-tech-cyanGlow"><Activity size={20} /></div>
            <div>
                <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan to-white uppercase">深圳市电动汽车智能数据监测平台</h1>
                <div className="flex items-center gap-2 text-[10px] text-tech-dim tracking-widest uppercase">
                    <span>智能数据平台 V3.0</span><span className="w-1 h-1 bg-tech-cyan rounded-full"></span>
                    <span className="text-tech-cyanGlow font-bold">{currentGridId || '全市'} ∩ {activeCluster?.name || '全量车群'}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-tech-cyan/30">
            <Filter size={14} className="text-tech-cyan" />
            <div className="flex gap-2 font-mono text-[9px] font-bold">
                <span className={currentGridId ? 'text-tech-orange' : 'text-tech-dim'}>区域: {currentGridId || '全市'}</span>
                <span className="text-white/20">|</span>
                <span className={selectedClusterId !== 'all' ? 'text-tech-blue' : 'text-tech-dim'}>车群: {activeCluster?.name || '全量'}</span>
            </div>
        </div>
        <div className="flex items-center gap-4 text-tech-cyan font-mono text-sm">
            <span className="text-tech-dim">{new Date().toISOString().split('T')[0]}</span>
            <div className="bg-black/40 px-3 py-1 rounded border border-tech-dim/30 flex items-center gap-2">
                <Clock size={14} />
                <span className="text-white font-bold">{Math.floor(currentTime) % 24}:{Math.floor((currentTime % 1) * 60).toString().padStart(2, '0')}</span>
            </div>
        </div>
      </header>
      <main className="flex-1 flex p-4 gap-4 overflow-hidden relative">
        <section className="w-[25%] min-w-[320px] h-full">
            <LeftPanel 
                userProfileData={userProfileData} 
                fleetBrands={fleetBrands} 
                fleetUsage={fleetUsageStats} 
                currentGrid={activeGrid} 
                totalVehicles={filteredVehiclesCount} 
                selectedClusterId={selectedClusterId} 
                setSelectedClusterId={setSelectedClusterId} 
            />
        </section>
        <section className="flex-1 h-full">
          <CenterPanel 
            currentGrid={currentGridId} 
            onGridSelect={setCurrentGridId} 
            vehicles={[]} 
            time={currentTime} 
            setTime={setCurrentTime} 
            gridZones={gridZones} 
            isPlaying={isPlaying} 
            togglePlay={() => setIsPlaying(!isPlaying)} 
            selectedClusterId={selectedClusterId}
            onOptimizedTimeChange={setOptimizedTime}
          />
        </section>
        <section className="w-[25%] min-w-[320px] h-full">
          <RightPanel 
            loadData={generateLoadData(currentGridId === null)} 
            currentGridId={currentGridId} 
            selectedClusterId={selectedClusterId} 
            time={optimizedTime}
          />
        </section>
      </main>
    </div>
  );
}
