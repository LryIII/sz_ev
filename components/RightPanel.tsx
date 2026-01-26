import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserProfileData, FleetStat, Vehicle } from '../types';
import { COLORS, FLEET_USAGE } from '../constants';
import { List, PieChart as PieIcon, Car, Battery } from 'lucide-react';

interface RightPanelProps {
  userProfileData: UserProfileData[];
  fleetBrands: FleetStat[];
  vehicles: Vehicle[]; // For the detail list
}

export const RightPanel: React.FC<RightPanelProps> = ({ userProfileData, fleetBrands, vehicles }) => {
  const [fleetView, setFleetView] = useState<'chart' | 'list'>('chart');
  const [analysisType, setAnalysisType] = useState<'usage' | 'soc'>('soc');
  
  // Prepare data for usage pie
  const usageData = FLEET_USAGE;

  // Prepare data for SOC distribution
  const socData = useMemo(() => {
      const buckets = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
      vehicles.forEach(v => {
          // Clamp index to 0-4
          const idx = Math.min(4, Math.max(0, Math.floor(v.soc / 20)));
          buckets[idx]++;
      });
      return [
          { name: '0-20%', count: buckets[0], fill: COLORS.red, label: '低电量' },
          { name: '20-40%', count: buckets[1], fill: COLORS.orange, label: '中低' },
          { name: '40-60%', count: buckets[2], fill: '#fbbf24', label: '中等' }, // amber-400
          { name: '60-80%', count: buckets[3], fill: COLORS.blue, label: '良好' },
          { name: '80-100%', count: buckets[4], fill: COLORS.green, label: '满电' },
      ];
  }, [vehicles]);

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
        case 'Operational': return '运营车';
        case 'Private': return '私家车';
        case 'Special': return '专用车';
        default: return type;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* 4. User Profiling */}
      <Card title="用户特征画像" className="flex-[2]">
        <div className="flex h-full">
            {/* Radar */}
            <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={userProfileData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textDim, fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="群体占比" dataKey="A" stroke={COLORS.cyanGlow} fill={COLORS.cyan} fillOpacity={0.4} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            {/* Quick Stats Legend */}
            <div className="w-1/3 flex flex-col justify-center gap-2 text-xs border-l border-tech-dim/20 pl-2">
                {userProfileData.map((u, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                        <span className="text-tech-dim truncate">{u.subject}</span>
                        <span className="font-mono text-tech-cyan">{u.A}%</span>
                    </div>
                ))}
            </div>
        </div>
      </Card>

      {/* 5. Fleet Information */}
      <Card 
        title="车辆集群分析" 
        className="flex-[3]"
        titleRight={
            <div className="flex bg-tech-bg rounded border border-tech-dim/30 p-0.5">
                <button 
                    onClick={() => setFleetView('chart')}
                    className={`p-1 rounded ${fleetView === 'chart' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    title="图表视图"
                >
                    <PieIcon size={12} />
                </button>
                <button 
                    onClick={() => setFleetView('list')}
                    className={`p-1 rounded ${fleetView === 'list' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    title="列表视图"
                >
                    <List size={12} />
                </button>
            </div>
        }
      >
        {fleetView === 'chart' ? (
            <div className="flex flex-col h-full gap-2">
                
                {/* Analysis Type Toggle */}
                <div className="flex justify-center bg-white/5 rounded p-0.5 mx-4 mt-1 border border-white/5">
                     <button 
                        onClick={() => setAnalysisType('usage')}
                        className={`flex-1 text-[10px] py-1 rounded transition-colors flex items-center justify-center gap-1 ${analysisType === 'usage' ? 'bg-tech-cyan text-black font-bold shadow-lg' : 'text-tech-dim hover:text-white'}`}
                     >
                        <Car size={10} />
                        车型用途
                     </button>
                     <button 
                        onClick={() => setAnalysisType('soc')}
                        className={`flex-1 text-[10px] py-1 rounded transition-colors flex items-center justify-center gap-1 ${analysisType === 'soc' ? 'bg-tech-cyan text-black font-bold shadow-lg' : 'text-tech-dim hover:text-white'}`}
                     >
                        <Battery size={10} />
                        电量分布
                     </button>
                </div>

                {/* Dynamic Chart Area */}
                <div className="h-1/2 flex items-center relative min-h-[140px]">
                    {analysisType === 'usage' ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={usageData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {usageData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={[COLORS.cyan, COLORS.blue, COLORS.orange][index % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: COLORS.grid, borderColor: COLORS.cyan, fontSize: '12px' }} 
                                        itemStyle={{ color: COLORS.textMain }}
                                    />
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="middle" 
                                        align="right" 
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '10px', right: 0 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text for Total */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none left-[-30px]">
                                <div className="text-center">
                                <span className="block text-[9px] text-tech-dim">总车辆</span>
                                <span className="block text-sm font-bold text-white">{vehicles.length}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={socData} margin={{top: 20, right: 10, left: -20, bottom: 5}}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                              <XAxis 
                                dataKey="name" 
                                tick={{fill: COLORS.textDim, fontSize: 8}} 
                                interval={0} 
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis 
                                tick={{fill: COLORS.textDim, fontSize: 8}} 
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip 
                                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-tech-panel border border-tech-cyan/30 p-2 text-xs shadow-lg">
                                          <p className="text-tech-cyan mb-1 font-bold">{label} ({data.label})</p>
                                          <p className="text-white">数量: {data.count} 辆</p>
                                          <p className="text-tech-dim text-[9px]">占比: {((data.count / vehicles.length) * 100).toFixed(1)}%</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                              />
                              <Bar dataKey="count" radius={[2, 2, 0, 0]} animationDuration={1000} barSize={20}>
                                {socData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Brand Distribution (Always Visible) */}
                <div className="h-1/2 w-full flex flex-col min-h-0">
                    <p className="text-[10px] text-tech-dim mb-2 uppercase tracking-wide border-t border-white/5 pt-2">品牌分布 (Top 5)</p>
                    <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                        {fleetBrands.map((brand, i) => (
                            <div key={i} className="flex flex-col gap-0.5">
                                <div className="flex justify-between text-[10px] text-tech-text">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: brand.color}}></span>
                                        {brand.name}
                                    </span>
                                    <span className="font-mono">{brand.count}</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(brand.count / (isGlobalView(fleetBrands) ? 500 : 100)) * 100}%`, backgroundColor: brand.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            /* Detailed List View */
            <div className="h-full overflow-hidden flex flex-col">
                <div className="grid grid-cols-5 text-[10px] text-tech-dim uppercase border-b border-tech-dim/20 pb-1 mb-1 font-bold">
                    <span className="col-span-2">编号/车型</span>
                    <span className="col-span-1">用途</span>
                    <span className="col-span-1 text-center">电量</span>
                    <span className="col-span-1 text-right">网格</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {vehicles.slice(0, 50).map((v) => (
                        <div key={v.id} className="grid grid-cols-5 items-center text-[10px] py-1.5 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div className="col-span-2 flex flex-col">
                                <span className="text-tech-cyan font-mono">{v.plate}</span>
                                <span className="text-tech-dim scale-90 origin-left truncate pr-1">{v.model}</span>
                            </div>
                            <div className="col-span-1 flex items-center">
                                <span className={`px-1 py-0.5 rounded text-[8px] scale-90 origin-left ${
                                    v.type === 'Operational' ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-800' : 
                                    v.type === 'Private' ? 'bg-blue-900/50 text-blue-200 border border-blue-800' : 'bg-orange-900/50 text-orange-200 border border-orange-800'
                                }`}>
                                    {getVehicleTypeLabel(v.type)}
                                </span>
                            </div>
                            <div className="col-span-1 flex flex-col items-center">
                                <div className="w-8 h-1 bg-gray-700 rounded-full mb-0.5 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${v.soc < 20 ? 'bg-red-500' : v.soc > 80 ? 'bg-green-500' : 'bg-tech-cyan'}`} 
                                        style={{ width: `${v.soc}%`}}
                                    ></div>
                                </div>
                                <span className="font-mono text-white/70">{v.soc}%</span>
                            </div>
                            <div className="col-span-1 text-right font-mono text-tech-dim">{v.gridId}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </Card>
    </div>
  );
};

// Helper to guess context for scaling progress bars
function isGlobalView(brands: FleetStat[]) {
    const max = Math.max(...brands.map(b => b.count));
    return max > 200;
}