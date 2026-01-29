import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/Card';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { UserProfileData, FleetStat, GridZone, VehicleCluster } from '../types';
import { COLORS, VEHICLE_CLUSTERS, USER_BEHAVIOR_SCORES } from '../constants';
import { PieChart as PieIcon, List, Activity, ChevronDown, Car, Layers, ZapOff, TrendingUp, BarChart2, ArrowLeft, Filter } from 'lucide-react';

interface LeftPanelProps {
  userProfileData: UserProfileData[];
  fleetBrands: FleetStat[];
  fleetUsage: { name: string; value: number }[];
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
  const [profileViewMode, setProfileViewMode] = useState<'distribution' | 'features'>('distribution');
  const [selectedUserType, setSelectedUserType] = useState<string>('价格敏感型');
  const [clusterViewMode, setClusterViewMode] = useState<'chart' | 'list'>('list');
  
  const [viewingSocCluster, setViewingSocCluster] = useState<VehicleCluster | null>(null);

  useEffect(() => {
    if (selectedClusterId === 'all') {
        setViewingSocCluster(null);
    } else {
        const cluster = VEHICLE_CLUSTERS.find(c => c.id === selectedClusterId);
        if (cluster) setViewingSocCluster(cluster);
    }
  }, [selectedClusterId]);

  const stats = [
    {
      label: '实时接入车辆',
      value: currentGrid ? currentGrid.vehicleCount * 12 : totalVehicles,
      unit: '辆',
      icon: <Car size={14} className="text-tech-cyan" />,
      color: 'text-tech-cyan'
    },
    {
      label: '覆盖集群规模',
      value: currentGrid ? Math.floor(Math.random() * 3) + 2 : VEHICLE_CLUSTERS.length,
      unit: '个',
      icon: <Layers size={14} className="text-tech-blue" />,
      color: 'text-tech-blue'
    },
    {
      label: '当前区域负荷',
      value: currentGrid ? (currentGrid.load * 1.5).toFixed(1) : '842.5',
      unit: 'MW',
      icon: <TrendingUp size={14} className="text-tech-orange" />,
      color: 'text-tech-orange'
    },
    {
      label: '重过载运行率',
      value: currentGrid ? currentGrid.load : '68.5',
      unit: '%',
      icon: <ZapOff size={14} className="text-red-500" />,
      color: currentGrid && currentGrid.load > 85 ? 'text-red-500' : 'text-tech-green'
    }
  ];

  const radarData = USER_BEHAVIOR_SCORES[selectedUserType] || USER_BEHAVIOR_SCORES['价格敏感型'];

  const getSocDistribution = (avgSoc: number, count: number) => {
    const buckets = [
      { range: '0-20%', count: 0, fill: '#ef4444' },
      { range: '21-40%', count: 0, fill: '#f97316' },
      { range: '41-60%', count: 0, fill: '#eab308' },
      { range: '61-80%', count: 0, fill: '#22c55e' },
      { range: '81-100%', count: 0, fill: '#06b6d4' },
    ];
    const peakIdx = Math.min(4, Math.floor(avgSoc / 20));
    let remaining = count;
    buckets.forEach((b, i) => {
      if (i === peakIdx) b.count = Math.floor(count * 0.5);
      else if (Math.abs(i - peakIdx) === 1) b.count = Math.floor(count * 0.2);
      else b.count = Math.floor(count * 0.05);
      remaining -= b.count;
    });
    buckets[peakIdx].count += remaining;
    return buckets;
  };

  const currentSocData = useMemo(() => {
    if (!viewingSocCluster) return [];
    return getSocDistribution(viewingSocCluster.avgSoc, viewingSocCluster.count);
  }, [viewingSocCluster]);

  const totalAccessCount = fleetUsage.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 1. KPI Stats */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="bg-tech-panel/60 border border-tech-cyan/10 p-3 rounded relative overflow-hidden group hover:border-tech-cyan/40 transition-colors">
             <div className="absolute top-0 left-0 w-1 h-full bg-tech-cyan/20 group-hover:bg-tech-cyan transition-colors"></div>
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

      {/* 1.5 Cluster Selector */}
      <div className="shrink-0 flex items-center gap-2 bg-tech-panel/60 border border-tech-cyan/20 px-3 py-2 rounded-sm relative overflow-hidden">
          <Filter size={14} className="text-tech-cyan" />
          <span className="text-[10px] text-tech-dim font-bold uppercase whitespace-nowrap">筛选车群:</span>
          <div className="flex-1 relative">
                <select
                    value={selectedClusterId}
                    onChange={(e) => setSelectedClusterId(e.target.value)}
                    className="w-full bg-black/40 border border-tech-cyan/30 text-tech-cyan text-[11px] py-1 pl-2 pr-6 rounded-sm appearance-none focus:outline-none focus:border-tech-cyanGlow cursor-pointer font-bold"
                >
                    <option value="all">全部车群 (全市总体视角)</option>
                    {VEHICLE_CLUSTERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-2 text-tech-cyan pointer-events-none" />
          </div>
      </div>

      {/* 2. User Profiling */}
      <Card title="用户特征画像" className="flex-[1.5] min-h-0"
        titleRight={
            <div className="flex bg-tech-bg rounded border border-tech-dim/30 p-0.5">
                <button onClick={() => setProfileViewMode('distribution')} className={`p-1 rounded ${profileViewMode === 'distribution' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}><PieIcon size={10} /></button>
                <button onClick={() => setProfileViewMode('features')} className={`p-1 rounded ${profileViewMode === 'features' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}><Activity size={10} /></button>
            </div>
        }
      >
        {profileViewMode === 'distribution' ? (
            <div className="flex h-full">
                <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={userProfileData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={5} dataKey="A" nameKey="subject" stroke="none" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {userProfileData.map((entry, index) => <Cell key={`cell-${index}`} fill={[COLORS.blue, COLORS.orange, COLORS.cyan, COLORS.gray][index % 4]} />)}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: COLORS.grid, border: 'none', borderRadius: '4px', fontSize: '10px'}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Numeric list with enough space */}
                <div className="w-[50%] flex flex-col justify-center gap-2 text-[10px] border-l border-tech-dim/10 pl-3">
                    {userProfileData.map((u, idx) => (
                        <div key={idx} className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: [COLORS.blue, COLORS.orange, COLORS.cyan, COLORS.gray][idx % 4] }}></div>
                                <span className="text-tech-dim truncate flex-1">{u.subject}</span>
                                <div className="flex-shrink-0 min-w-[65px] text-right">
                                    <span className="font-mono text-tech-cyan text-xs font-bold leading-none">{Math.round((u.A / 100) * totalVehicles)}</span>
                                    <span className="text-[8px] ml-0.5 text-tech-dim font-normal">辆</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}><PolarGrid stroke="#334155" strokeDasharray="3 3" /><PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textDim, fontSize: 8 }} /><Radar name={selectedUserType} dataKey="A" stroke={COLORS.cyanGlow} fill={COLORS.cyan} fillOpacity={0.4} /></RadarChart></ResponsiveContainer></div>
        )}
      </Card>

      {/* 3. Fleet Analysis - ENHANCED with both Pie and Rankings */}
      <Card title={viewingSocCluster ? `${viewingSocCluster.name} - SOC分布` : "车群集群分析"} className="flex-[2.5] min-h-0"
        titleRight={
            !viewingSocCluster ? (
                <div className="flex bg-tech-bg rounded border border-tech-dim/30 p-0.5">
                    <button onClick={() => setClusterViewMode('chart')} className={`p-1 rounded ${clusterViewMode === 'chart' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}><PieIcon size={10} /></button>
                    <button onClick={() => setClusterViewMode('list')} className={`p-1 rounded ${clusterViewMode === 'list' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}><List size={10} /></button>
                </div>
            ) : (
                <button onClick={() => setSelectedClusterId('all')} className="flex items-center gap-1 text-[10px] text-tech-cyan hover:text-tech-cyanGlow"><ArrowLeft size={10} /> 返回列表</button>
            )
        }
      >
        {viewingSocCluster ? (
            <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0 pt-2"><ResponsiveContainer width="100%" height="100%"><BarChart data={currentSocData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="range" tick={{ fill: COLORS.textDim, fontSize: 8 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: COLORS.textDim, fontSize: 8 }} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '9px'}} /><Bar dataKey="count" radius={[2, 2, 0, 0]} name="车辆数">{currentSocData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div>
                <div className="mt-2 text-center text-[10px]"><span className="text-tech-dim">平均电量: </span><span className="font-mono text-tech-cyan font-bold">{viewingSocCluster.avgSoc}%</span><span className="mx-2 text-tech-dim/30">|</span><span className="text-tech-dim">样本总量: </span><span className="font-mono text-white font-bold">{viewingSocCluster.count}</span></div>
            </div>
        ) : clusterViewMode === 'chart' ? (
             <div className="flex flex-col h-full gap-4 overflow-y-auto custom-scrollbar pr-1">
                {/* Upper Section: Type Donut */}
                <div className="flex h-[45%] shrink-0">
                    <div className="w-[45%] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={fleetUsage} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={4} dataKey="value" stroke="none">
                                    {fleetUsage.map((entry, index) => <Cell key={`cell-${index}`} fill={[COLORS.cyan, COLORS.blue, COLORS.orange, COLORS.purple][index % 4]} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[7px] text-tech-dim leading-none uppercase">Total</span>
                            <span className="text-[12px] font-mono font-bold text-tech-cyanGlow">{totalAccessCount}</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-wrap content-center gap-x-3 gap-y-1 pl-2">
                        {fleetUsage.map((u, i) => (
                            <div key={i} className="flex items-center gap-1.5 min-w-[70px]">
                                <div className="w-1.5 h-1.5 rounded-sm shrink-0" style={{backgroundColor: [COLORS.cyan, COLORS.blue, COLORS.orange, COLORS.purple][i % 4]}}></div>
                                <span className="text-[10px] text-tech-dim font-bold truncate">{u.name}</span>
                                <span className="text-[10px] font-mono text-white ml-auto">{u.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lower Section: Brand Ranking Rankings - RESTORED & ENHANCED */}
                <div className="flex-1 flex flex-col gap-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-tech-cyan font-bold flex items-center gap-1 uppercase tracking-wider">
                           <Activity size={10} /> 品牌入网排行
                        </span>
                        <span className="text-[8px] text-tech-dim uppercase">TOP 5 Ranking</span>
                    </div>
                    {fleetBrands.map((brand, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-tech-dim w-3">{i+1}</span>
                                    <span className="text-[11px] text-white font-bold tracking-tight">{brand.name}</span>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-tech-cyanGlow shadow-tech-cyan">
                                    {brand.count} <span className="text-[8px] text-tech-dim font-normal italic ml-0.5">接入</span>
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                                    style={{
                                        width: `${(brand.count / 450) * 100}%`, 
                                        backgroundColor: brand.color,
                                        boxShadow: `0 0 10px ${brand.color}66`
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        ) : (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="grid grid-cols-12 text-[8px] text-tech-dim uppercase border-b border-tech-dim/20 pb-1 mb-1 font-bold">
                    <span className="col-span-5">车群/区域</span>
                    <span className="col-span-3 text-center">规模</span>
                    <span className="col-span-2 text-center">容量</span>
                    <span className="col-span-2 text-right uppercase">查看</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {VEHICLE_CLUSTERS.map((cluster) => (
                        <div key={cluster.id} className="grid grid-cols-12 items-center text-[9px] py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <div className="col-span-5 flex flex-col overflow-hidden">
                                <span className="text-white font-bold text-[10px] truncate pr-1 leading-tight">{cluster.name}</span>
                                <span className="text-tech-dim text-[8px] truncate">{cluster.region}</span>
                            </div>
                            <div className="col-span-3 flex flex-col items-center">
                                <span className="font-mono text-[12px] font-bold text-white leading-none tracking-tighter">{cluster.count}</span>
                                <div className="w-8 h-0.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-green-500" style={{width: `${cluster.avgSoc}%`}}></div></div>
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="text-tech-cyan font-mono text-[12px] font-bold tracking-tighter">{cluster.regulationCapacity}</span>
                            </div>
                            <div className="col-span-2 text-right">
                                <button onClick={() => setSelectedClusterId(cluster.id)} className={`p-1.5 rounded hover:bg-tech-cyan/20 transition-colors ${selectedClusterId === cluster.id ? 'text-tech-cyanGlow bg-tech-cyan/10' : 'text-tech-dim hover:text-tech-cyan'}`}><BarChart2 size={14} /></button>
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