
import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { UserProfileData, FleetStat, GridZone, VehicleCluster, UserType } from '../types';
import { COLORS, VEHICLE_CLUSTERS, USER_BEHAVIOR_SCORES } from '../constants';
import { PieChart as PieIcon, List, Activity, ChevronDown, Car, Layers, ZapOff, TrendingUp, BarChart2, ArrowLeft, Filter, AlignLeft, Grid as GridIcon } from 'lucide-react';

interface LeftPanelProps {
  userProfileData: UserProfileData[];
  fleetBrands: FleetStat[];
  fleetUsage: { name: string; value: number; color: string }[];
  currentGrid?: GridZone | null;
  totalVehicles: number;
  selectedClusterId: string;
  setSelectedClusterId: (id: string) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ 
  userProfileData, 
  fleetBrands, 
  fleetUsage,
  currentGrid, 
  totalVehicles,
  selectedClusterId,
  setSelectedClusterId
}) => {
  const [profileViewMode, setProfileViewMode] = useState<'distribution' | 'features'>('features');
  const [selectedUserType, setSelectedUserType] = useState<string>(UserType.PriceSensitive);
  const [fleetViewMode, setFleetViewMode] = useState<'stats' | 'clusters'>('stats');
  const [detailedClusterId, setDetailedClusterId] = useState<string | null>(null);

  const activeSocCluster = useMemo(() => {
    if (!detailedClusterId) return null;
    return VEHICLE_CLUSTERS.find(c => c.id === detailedClusterId) || null;
  }, [detailedClusterId]);

  const stats = [
    { label: '实时接入车辆', value: totalVehicles.toLocaleString(), unit: '辆', icon: <Car size={14} className="text-tech-cyan" />, color: 'text-tech-cyan' },
    { label: '覆盖集群规模', value: currentGrid ? Math.floor(Math.random() * 2) + 2 : VEHICLE_CLUSTERS.length, unit: '个', icon: <Layers size={14} className="text-tech-blue" />, color: 'text-tech-blue' },
    { label: '当前区域负荷', value: currentGrid ? (currentGrid.load * 4.5).toFixed(1) : '8425.5', unit: 'MW', icon: <TrendingUp size={14} className="text-tech-orange" />, color: 'text-tech-orange' },
    { label: '重过载运行率', value: currentGrid ? currentGrid.load : '68.5', unit: '%', icon: <ZapOff size={14} className="text-red-500" />, color: currentGrid && currentGrid.load > 85 ? 'text-red-500' : 'text-tech-green' }
  ];

  const radarData = USER_BEHAVIOR_SCORES[selectedUserType] || USER_BEHAVIOR_SCORES[UserType.PriceSensitive];

  const getSocDistribution = (avgSoc: number, count: number) => {
    const buckets = [
      { range: '0-20%', count: Math.floor(count * 0.1), fill: '#ef4444' },
      { range: '21-40%', count: Math.floor(count * 0.2), fill: '#f97316' },
      { range: '41-60%', count: Math.floor(count * 0.4), fill: '#eab308' },
      { range: '61-80%', count: Math.floor(count * 0.2), fill: '#22c55e' },
      { range: '81-100%', count: Math.floor(count * 0.1), fill: '#06b6d4' },
    ];
    return buckets;
  };

  const currentSocData = useMemo(() => {
    if (!activeSocCluster) return [];
    return getSocDistribution(activeSocCluster.avgSoc, activeSocCluster.count);
  }, [activeSocCluster]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-tech-panel/60 border border-tech-cyan/10 p-3 rounded relative overflow-hidden group hover:border-tech-cyan/40 transition-colors">
             <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan/20 group-hover:bg-tech-cyan"></div>
             <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-[10px] text-tech-dim font-bold uppercase tracking-tighter">{stat.label}</span>
             </div>
             <div className="flex items-baseline gap-1">
                <span className={`text-xl font-mono font-bold tracking-tighter ${stat.color}`}>{stat.value}</span>
                <span className="text-[9px] text-tech-dim font-bold">{stat.unit}</span>
             </div>
          </div>
        ))}
      </div>

      {/* Cluster Selector - Global Filter */}
      <div className="shrink-0 flex items-center gap-2 bg-tech-panel/60 border border-tech-cyan/20 px-3 py-2 rounded-sm">
          <Filter size={14} className="text-tech-cyan" />
          <span className="text-[10px] text-tech-dim font-bold uppercase whitespace-nowrap">全域车群筛选:</span>
          <div className="flex-1 relative">
                <select
                    value={selectedClusterId}
                    onChange={(e) => setSelectedClusterId(e.target.value)}
                    className="w-full bg-black/40 border border-tech-cyan/30 text-tech-cyan text-[11px] py-1 pl-2 pr-6 rounded-sm appearance-none focus:outline-none focus:border-tech-cyanGlow cursor-pointer font-bold"
                >
                    <option value="all">显示全部车群</option>
                    {VEHICLE_CLUSTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-2.5 text-tech-cyan pointer-events-none" />
          </div>
      </div>

      {/* 2. User Behavioral Profiling (Subjective) */}
      <Card title="用户行为画像 (主观维度)" className="flex-[2] min-h-0"
        titleRight={
            <div className="flex bg-tech-bg rounded border border-tech-dim/30 p-0.5">
                <button onClick={() => setProfileViewMode('distribution')} className={`p-1 rounded ${profileViewMode === 'distribution' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`} title="偏好占比"><PieIcon size={10} /></button>
                <button onClick={() => setProfileViewMode('features')} className={`p-1 rounded ${profileViewMode === 'features' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`} title="特征维度"><Activity size={10} /></button>
            </div>
        }
      >
        {profileViewMode === 'distribution' ? (
            <div className="flex h-full">
                <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={userProfileData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={5} dataKey="A" nameKey="subject" stroke="none">
                                {userProfileData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '4px', fontSize: '10px'}} itemStyle={{color: '#e2e8f0'}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-[50%] flex flex-col justify-center gap-1.5 text-[10px] border-l border-tech-dim/10 pl-3">
                    {userProfileData.map((u, idx) => (
                        <div key={idx} className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: u.color }}></div>
                                <span className="text-tech-dim truncate flex-1">{u.subject}</span>
                                <span className="font-mono text-tech-cyan text-[11px] font-bold">{(u.A / 1000).toFixed(1)}k</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="flex flex-col h-full">
                <div className="flex justify-end mb-1">
                    <select 
                        value={selectedUserType}
                        onChange={(e) => setSelectedUserType(e.target.value)}
                        className="bg-tech-panel border border-tech-cyan/40 text-tech-cyan text-[10px] py-0.5 px-1 rounded-sm appearance-none cursor-pointer focus:outline-none font-bold"
                    >
                        {Object.values(UserType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                            <Radar name={selectedUserType} dataKey="A" stroke={COLORS.cyanGlow} fill={COLORS.cyan} fillOpacity={0.4} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}
      </Card>

      {/* 3. Fleet Analysis - Objective Stats vs Clusters */}
      <Card 
        title={detailedClusterId ? `${activeSocCluster?.name} - 详情` : (fleetViewMode === 'stats' ? "车辆客观属性 (物理维度)" : "车群空间分布 (集群)")} 
        className="flex-[2.5] min-h-0"
        titleRight={
            detailedClusterId ? (
                <button onClick={() => setDetailedClusterId(null)} className="flex items-center gap-1 text-[10px] text-tech-cyan hover:text-tech-cyanGlow"><ArrowLeft size={10} /> 返回列表</button>
            ) : (
                <div className="flex bg-tech-bg rounded border border-tech-dim/30 p-0.5 scale-90 origin-right">
                    <button 
                        onClick={() => setFleetViewMode('stats')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${fleetViewMode === 'stats' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    >
                        <PieIcon size={10} /> 类型/品牌
                    </button>
                    <button 
                        onClick={() => setFleetViewMode('clusters')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${fleetViewMode === 'clusters' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    >
                        <AlignLeft size={10} /> 车群分布
                    </button>
                </div>
            )
        }
      >
        {detailedClusterId ? (
            // Detail View (SOC Distribution)
            <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0 pt-2"><ResponsiveContainer width="100%" height="100%"><BarChart data={currentSocData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 8 }} /><YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} /><Tooltip contentStyle={{backgroundColor: '#0f172a', fontSize: '9px'}} /><Bar dataKey="count" radius={[2, 2, 0, 0]}>{currentSocData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div>
                <div className="mt-2 text-center text-[10px] bg-black/30 p-2 border border-tech-cyan/10 rounded"><span className="text-tech-dim">平均电量: </span><span className="font-mono text-tech-cyan font-bold">{activeSocCluster?.avgSoc}%</span></div>
            </div>
        ) : fleetViewMode === 'stats' ? (
            // VIEW A: Objective Stats (Usage Types & Brands)
            <div className="flex flex-col h-full gap-2 overflow-hidden">
                {/* 1. Usage Type Pie */}
                <div className="flex-[1.2] min-h-0 flex relative border-b border-white/5 pb-2">
                    <div className="flex-1 min-w-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={fleetUsage} cx="40%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                                    {fleetUsage.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '4px', fontSize: '10px'}} itemStyle={{color: '#e2e8f0'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-[45%] flex flex-col justify-center gap-1.5 text-[9px] border-l border-tech-dim/10 pl-2">
                         <span className="text-tech-dim/60 font-bold mb-1 uppercase">用途分类</span>
                         {fleetUsage.map((item, i) => (
                             <div key={i} className="flex justify-between items-center pr-2">
                                 <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-tech-text">{item.name}</span>
                                 </div>
                                 <span className="font-mono text-tech-dim">{(item.value/1000).toFixed(1)}k</span>
                             </div>
                         ))}
                    </div>
                </div>

                {/* 2. Brands Bar List */}
                <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar">
                     <span className="text-[9px] text-tech-dim mb-1 font-bold uppercase sticky top-0 bg-tech-panel z-10">TOP 品牌分布</span>
                     <div className="flex flex-col gap-1.5 pr-2">
                         {fleetBrands.slice(0, 5).map((brand, i) => (
                             <div key={i} className="flex flex-col gap-0.5">
                                 <div className="flex justify-between text-[9px]">
                                     <span className="text-tech-text">{brand.name}</span>
                                     <span className="font-mono text-tech-cyan">{(brand.count/1000).toFixed(1)}k</span>
                                 </div>
                                 <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${(brand.count / fleetBrands[0].count) * 100}%`, backgroundColor: brand.color }}
                                     ></div>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        ) : (
            // VIEW B: Spatial Clusters List
            <div className="flex flex-col h-full overflow-hidden">
                <div className="grid grid-cols-12 text-[8px] text-tech-dim uppercase border-b border-tech-dim/20 pb-1 mb-1 font-bold">
                    <span className="col-span-5">车群/成分</span>
                    <span className="col-span-3 text-center">规模</span>
                    <span className="col-span-2 text-center">容量</span>
                    <span className="col-span-2 text-right">SOC</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {VEHICLE_CLUSTERS.map((cluster) => (
                        <div 
                          key={cluster.id} 
                          className={`grid grid-cols-12 items-center text-[9px] py-2 border-b border-white/5 cursor-pointer ${selectedClusterId === cluster.id ? 'bg-tech-cyan/10' : 'hover:bg-white/5'}`}
                          onClick={() => setSelectedClusterId(cluster.id)}
                        >
                            <div className="col-span-5 flex flex-col gap-1 pr-1">
                                <span className={`font-bold text-[10px] truncate ${selectedClusterId === cluster.id ? 'text-tech-cyanGlow' : 'text-white'}`}>{cluster.name}</span>
                                <div className="flex h-1 rounded-full overflow-hidden bg-gray-800">
                                    <div className="h-full bg-tech-cyan" style={{width: `${cluster.composition.private*100}%`}} title="私家车"></div>
                                    <div className="h-full bg-tech-blue" style={{width: `${cluster.composition.operational*100}%`}} title="运营车"></div>
                                    <div className="h-full bg-tech-orange" style={{width: `${cluster.composition.logistics*100}%`}} title="物流车"></div>
                                </div>
                            </div>
                            <div className="col-span-3 text-center font-mono font-bold">{(cluster.count/1000).toFixed(1)}k</div>
                            <div className="col-span-2 text-center font-mono text-tech-cyan">{cluster.regulationCapacity}</div>
                            <div className="col-span-2 text-right pr-1">
                                <button onClick={(e) => { e.stopPropagation(); setDetailedClusterId(cluster.id); }} className="p-1 hover:text-tech-cyan"><BarChart2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </Card>
    </div>
  );
};
