import React, { useState } from 'react';
import { Card } from './ui/Card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { UserProfileData, FleetStat } from '../types';
import { COLORS, VEHICLE_CLUSTERS, USER_BEHAVIOR_SCORES } from '../constants';
import { PieChart as PieIcon, List, Zap, Activity, ChevronDown } from 'lucide-react';

interface LeftPanelProps {
  userProfileData: UserProfileData[];
  fleetBrands: FleetStat[];
  fleetUsage: { name: string; value: number }[]; // Added Prop
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ userProfileData, fleetBrands, fleetUsage }) => {
  const [profileViewMode, setProfileViewMode] = useState<'distribution' | 'features'>('distribution');
  const [selectedUserType, setSelectedUserType] = useState<string>('价格敏感型');
  const [clusterViewMode, setClusterViewMode] = useState<'chart' | 'list'>('list');

  // Get radar data based on selection
  const radarData = USER_BEHAVIOR_SCORES[selectedUserType] || USER_BEHAVIOR_SCORES['价格敏感型'];

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Top: User Profiling */}
      <Card 
        title="用户特征画像" 
        className="flex-[2]"
        titleRight={
            <div className="flex bg-tech-bg rounded border border-tech-dim/30 p-0.5">
                <button 
                    onClick={() => setProfileViewMode('distribution')}
                    className={`p-1 rounded ${profileViewMode === 'distribution' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    title="群体占比 (分布)"
                >
                    <PieIcon size={12} />
                </button>
                <button 
                    onClick={() => setProfileViewMode('features')}
                    className={`p-1 rounded ${profileViewMode === 'features' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    title="特征分析 (雷达)"
                >
                    <Activity size={12} />
                </button>
            </div>
        }
      >
        {profileViewMode === 'distribution' ? (
            /* Mode 1: Pie Chart for Distribution */
            <div className="flex h-full">
                <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={userProfileData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="A"
                                nameKey="subject"
                                stroke="none"
                            >
                                {userProfileData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={[COLORS.blue, COLORS.orange, COLORS.cyan, COLORS.gray][index % 4]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{backgroundColor: COLORS.grid, borderColor: COLORS.cyan, fontSize: '12px'}} 
                                itemStyle={{color: COLORS.cyanGlow}}
                                formatter={(value: number) => [`${value}%`, '占比']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="w-1/3 flex flex-col justify-center gap-2 text-xs border-l border-tech-dim/20 pl-2">
                    {userProfileData.map((u, idx) => (
                        <div key={idx} className="flex flex-col mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: [COLORS.blue, COLORS.orange, COLORS.cyan, COLORS.gray][idx % 4] }}></div>
                                <span className="text-tech-dim truncate">{u.subject}</span>
                            </div>
                            <span className="font-mono text-tech-cyan pl-4 text-sm font-bold">{u.A}%</span>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            /* Mode 2: Radar Chart for Specific Feature Scores */
            <div className="flex flex-col h-full relative">
                 {/* Type Selector Overlay */}
                 <div className="absolute top-0 right-0 z-10">
                     <div className="relative">
                        <select 
                            value={selectedUserType}
                            onChange={(e) => setSelectedUserType(e.target.value)}
                            className="bg-black/80 border border-tech-cyan/30 text-tech-cyan text-[10px] py-1 pl-2 pr-6 rounded appearance-none focus:outline-none focus:border-tech-cyanGlow cursor-pointer"
                        >
                            {Object.keys(USER_BEHAVIOR_SCORES).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1.5 text-tech-cyan pointer-events-none" />
                     </div>
                 </div>

                 {/* Radar Chart */}
                 <div className="flex-1 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textDim, fontSize: 9 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar 
                                name={selectedUserType} 
                                dataKey="A" 
                                stroke={COLORS.cyanGlow} 
                                fill={COLORS.cyan} 
                                fillOpacity={0.4} 
                            />
                            <Tooltip 
                                contentStyle={{backgroundColor: COLORS.grid, borderColor: COLORS.cyan, fontSize: '10px'}}
                                formatter={(value: number) => [`${value}分`, '评分']}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                 </div>
                 
                 {/* Current Type Label */}
                 <div className="text-center text-[10px] text-tech-dim/50 font-mono mt-[-10px]">
                    ANALYSIS: {selectedUserType}
                 </div>
            </div>
        )}
      </Card>

      {/* Bottom: Fleet/Cluster Analysis */}
      <Card 
        title="车群集群分析" 
        className="flex-[3]"
        titleRight={
            <div className="flex bg-tech-bg rounded border border-tech-dim/30 p-0.5">
                <button 
                    onClick={() => setClusterViewMode('chart')}
                    className={`p-1 rounded ${clusterViewMode === 'chart' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    title="分布图表"
                >
                    <PieIcon size={12} />
                </button>
                <button 
                    onClick={() => setClusterViewMode('list')}
                    className={`p-1 rounded ${clusterViewMode === 'list' ? 'bg-tech-cyan text-black' : 'text-tech-dim hover:text-white'}`}
                    title="集群列表"
                >
                    <List size={12} />
                </button>
            </div>
        }
      >
        {clusterViewMode === 'chart' ? (
             <div className="flex flex-col h-full">
                <div className="h-1/2 min-h-[120px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={fleetUsage}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {fleetUsage.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={[COLORS.cyan, COLORS.blue, COLORS.orange][index % 3]} />
                                ))}
                            </Pie>
                            <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={8} wrapperStyle={{fontSize:'10px'}}/>
                            <Tooltip contentStyle={{backgroundColor: COLORS.grid, borderColor: COLORS.cyan}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="h-1/2 flex flex-col px-2 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] text-tech-dim mb-1">品牌分布</p>
                    {fleetBrands.map((brand, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                             <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor: brand.color}}></div>
                             <span className="text-[10px] flex-1 truncate">{brand.name}</span>
                             <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full" style={{width: `${(brand.count/500)*100}%`, backgroundColor: brand.color}}></div>
                             </div>
                        </div>
                    ))}
                </div>
             </div>
        ) : (
            /* Cluster List View */
            <div className="flex flex-col h-full overflow-hidden">
                <div className="grid grid-cols-4 text-[9px] text-tech-dim uppercase border-b border-tech-dim/20 pb-1 mb-1 font-bold">
                    <span className="col-span-2">车群名称/区域</span>
                    <span className="col-span-1 text-center">规模/SOC</span>
                    <span className="col-span-1 text-right">调节潜力</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {VEHICLE_CLUSTERS.map((cluster) => (
                        <div key={cluster.id} className="grid grid-cols-4 items-center text-[10px] py-2 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="col-span-2 flex flex-col">
                                <span className="text-white group-hover:text-tech-cyan transition-colors font-bold truncate pr-1">{cluster.name}</span>
                                <span className="text-tech-dim text-[9px] flex items-center gap-1">
                                    <span className={`w-1 h-1 rounded-full ${cluster.type === 'Operational' ? 'bg-cyan-500' : 'bg-orange-500'}`}></span>
                                    {cluster.region}
                                </span>
                            </div>
                            <div className="col-span-1 flex flex-col items-center">
                                <span className="font-mono">{cluster.count}辆</span>
                                <div className="w-10 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                     <div className="h-full bg-green-500" style={{width: `${cluster.avgSoc}%`}}></div>
                                </div>
                            </div>
                            <div className="col-span-1 text-right">
                                <div className="flex items-center justify-end gap-1 text-tech-cyanGlow font-mono">
                                    <Zap size={10} />
                                    {cluster.regulationCapacity}
                                </div>
                                <span className="text-[8px] text-tech-dim">MW</span>
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