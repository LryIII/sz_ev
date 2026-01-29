
import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, ComposedChart, Line, Legend } from 'recharts';
import { AlertTriangle, ArrowRight, TrendingDown, ChevronDown, Coins, Activity } from 'lucide-react';
import { LoadDataPoint, VehicleCluster } from '../types';
import { COLORS, getTransferData, VEHICLE_CLUSTERS } from '../constants';

interface RightPanelProps {
  loadData: LoadDataPoint[];
  currentGridId: string | null;
  selectedClusterId: string;
  time: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-tech-bg border border-tech-cyan/50 p-2 text-xs shadow-[0_0_10px_#00ffff44]">
        <p className="font-mono text-tech-cyanGlow mb-1">{label}</p>
        {payload.map((p: any, idx: number) => {
          if (p.name === '调节范围' && Array.isArray(p.value)) {
              return (
                 <div key={idx} className="flex justify-between gap-4" style={{ color: p.color }}>
                    <span>{p.name}:</span>
                    <span className="font-mono font-bold">
                        {p.value[0].toFixed(1)} - {p.value[1].toFixed(1)} MW
                    </span>
                 </div>
              )
          }
          return (
            <p key={idx} style={{ color: p.color }} className="flex justify-between gap-4">
                <span>{p.name}:</span>
                <span className="font-mono font-bold">
                    {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} MW
                </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export const RightPanel: React.FC<RightPanelProps> = ({ 
  loadData, 
  currentGridId,
  selectedClusterId,
  time
}) => {
  const [priceIncentive, setPriceIncentive] = useState<number>(1.5);

  const transferData = useMemo(() => {
    if (!currentGridId) return [];
    
    // Dynamic transfer data based on current optimized time
    const baseData = getTransferData(currentGridId, time);
    
    let clusterFactor = 1.0;
    if (selectedClusterId !== 'all') {
        const idNum = parseInt(selectedClusterId.replace(/\D/g, '') || '5');
        clusterFactor = 0.2 + ((idNum % 5) * 0.1); 
    }

    const priceFactor = 0.5 + (Math.pow(priceIncentive, 1.2) / 2.5);

    return baseData.map(item => ({
        ...item,
        amount: parseFloat((item.amount * clusterFactor * priceFactor).toFixed(1))
    }));
  }, [currentGridId, selectedClusterId, priceIncentive, time]);

  const rangeData = loadData.map(d => ({
      ...d,
      regulationRange: [d.lowerBound || 0, d.upperBound || 0]
  }));

  const totalTransfer = transferData.reduce((acc, curr) => acc + curr.amount, 0).toFixed(1);
  const projectedCostReduction = (priceIncentive * 8.5).toFixed(1);
  const transferRatio = (25 + priceIncentive * 11).toFixed(1);

  const formatTime = (t: number) => {
    const h = Math.floor(t) % 24;
    const m = Math.floor((t % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      
      <Card 
        title="区域/总体负荷趋势预测" 
        className="flex-[3] min-h-0" 
        titleRight={<span className="text-tech-dim text-[10px]">{currentGridId ? `区域: ${currentGridId}` : '全市范围'}</span>}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={loadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: COLORS.textDim, fontSize: 10 }} interval={4} />
            <YAxis tick={{ fill: COLORS.textDim, fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} iconSize={8} />
            
            <Area 
              type="monotone" 
              dataKey="forecast" 
              stroke={COLORS.cyan} 
              fill="url(#colorLoad)" 
              name="预测负荷" 
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke={COLORS.orange} 
              strokeWidth={2} 
              dot={false}
              name="实时负荷" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card 
        title="调节能力范围分析" 
        className="flex-[3] min-h-0"
      >
        <div className="w-full h-full relative flex flex-col">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: COLORS.textDim, fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: COLORS.textDim, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} iconSize={8} />
                
                <Area 
                    type="monotone" 
                    dataKey="regulationRange" 
                    stroke="none"
                    fill={COLORS.blue} 
                    fillOpacity={0.3}
                    name="调节范围"
                />

                <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke={COLORS.textMain} 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    dot={false}
                    name="基线参考"
                    isAnimationActive={false}
                />
                
                <ReferenceLine x="14:00" stroke="white" strokeDasharray="3 3" strokeOpacity={0.3} />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card 
        title="车群区域转移能力分析" 
        className="flex-[4] min-h-0"
        titleRight={
            selectedClusterId !== 'all' ? (
                <span className="text-tech-cyan text-[10px] font-bold border border-tech-cyan/30 px-2 py-0.5 rounded bg-tech-cyan/5">
                    当前聚焦: {VEHICLE_CLUSTERS.find(c => c.id === selectedClusterId)?.name || selectedClusterId}
                </span>
            ) : <span className="text-tech-dim text-[10px]">全市视角</span>
        }
      >
        <div className="flex flex-col h-full gap-2">
            
            <div className="bg-tech-bg/40 border border-tech-cyan/20 p-2 rounded shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:8px_8px]"></div>
                
                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 text-tech-text">
                            <Coins size={14} className="text-tech-orange" />
                            <span className="text-xs font-bold text-tech-dim">激励定价调控</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[10px] text-tech-dim">当前:</span>
                            <span className="font-mono text-xl leading-none text-tech-orange font-bold text-shadow-orange">{priceIncentive.toFixed(1)}</span>
                            <span className="text-[9px] text-tech-dim">元/kWh</span>
                        </div>
                    </div>

                    <input
                        type="range"
                        min="0.0"
                        max="5.0"
                        step="0.1"
                        value={priceIncentive}
                        onChange={(e) => setPriceIncentive(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer mt-1 mb-1 focus:outline-none focus:ring-1 focus:ring-tech-orange/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-tech-orange [&::-webkit-slider-thumb]:shadow-[0_0_10px_#ff4500] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                    />

                    <div className="flex justify-between text-[9px] text-tech-dim/70 font-mono">
                        <span>0.0</span>
                        <span className="flex items-center gap-1 text-tech-cyan">
                           <Activity size={8} />
                           预计响应率: {Math.min(100, Math.floor(20 + priceIncentive * 15))}%
                        </span>
                        <span>5.0</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-start gap-2 overflow-y-auto custom-scrollbar pr-1 pt-1">
                {currentGridId ? (
                    transferData.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs shrink-0 group">
                            <div className="w-16 flex items-center justify-end gap-1.5 font-mono">
                                <span className="text-tech-orange text-[10px]">{currentGridId}</span>
                                <span className="text-[9px] text-tech-dim bg-white/5 px-1 rounded">{formatTime(time)}</span>
                            </div>
                            <div className="flex-1 h-5 bg-gray-800/50 rounded flex items-center relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 text-tech-cyan">
                                    <ArrowRight size={8} /> <ArrowRight size={8} />
                                </div>
                                <div 
                                    className="h-full bg-gradient-to-r from-tech-orange/50 to-tech-cyan/50 transition-all duration-300" 
                                    style={{ width: `${Math.min(100, (t.amount / 20) * 100)}%` }}
                                ></div>
                                <span className="absolute right-2 text-[9px] text-white font-bold text-shadow-sm group-hover:scale-105 transition-transform">{t.amount} MW</span>
                            </div>
                            <span className="w-10 font-mono text-tech-cyan text-[10px]">{t.target}</span>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-tech-dim opacity-50">
                        <TrendingDown size={24} className="mb-2" />
                        <p className="text-[10px]">请在地图上选择区域查看转移潜力</p>
                    </div>
                )}
            </div>
            
            <div className="flex items-center justify-between text-[9px] text-tech-dim border-t border-white/5 pt-2 shrink-0">
                <div className="flex items-baseline">
                    <span>总可转移容量:</span>
                    <span className="text-tech-cyan text-sm font-bold ml-1 font-mono">{totalTransfer}</span> 
                    <span className="text-[8px] ml-0.5">MW</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-baseline">
                        <span>比例:</span>
                        <span className="text-tech-orange ml-1 font-mono font-bold">{transferRatio}%</span>
                    </div>
                    <div className="flex items-baseline">
                        <span>预计成本降低:</span>
                        <span className="text-tech-green ml-1 font-mono font-bold">{projectedCostReduction}%</span>
                    </div>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};
