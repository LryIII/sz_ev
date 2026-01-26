import React from 'react';
import { Card } from './ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar, Line, Legend } from 'recharts';
import { Zap, Cloud, Thermometer, AlertTriangle } from 'lucide-react';
import { LoadDataPoint, PricingDataPoint, ClusterLoadPoint, UserType } from '../types';
import { COLORS } from '../constants';

interface LeftPanelProps {
  loadData: LoadDataPoint[];
  pricingData: PricingDataPoint[];
  clusterLoadData: ClusterLoadPoint[];
  isGlobal: boolean;
  currentGridLoad?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-tech-bg border border-tech-cyan/50 p-2 text-xs shadow-[0_0_10px_#00ffff44]">
        <p className="font-mono text-tech-cyanGlow mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ color: p.color }} className="flex justify-between gap-4">
            <span>{p.name}:</span>
            <span className="font-mono font-bold">{p.value} MW</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const LeftPanel: React.FC<LeftPanelProps> = ({ 
  loadData, 
  pricingData, 
  clusterLoadData,
  isGlobal,
  currentGridLoad = 0
}) => {
  const isHighLoad = currentGridLoad > 90 && !isGlobal;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* 1. Load Forecast */}
      <Card 
        title={isGlobal ? "全市负荷预测" : "区域负荷预测"} 
        className={`flex-[2] transition-colors duration-500 ${isHighLoad ? 'border-tech-orange shadow-[0_0_15px_rgba(255,69,0,0.3)]' : ''}`}
        titleRight={isHighLoad ? (
          <div className="flex items-center gap-1 text-tech-orange animate-pulse font-bold">
            <AlertTriangle size={12} />
            <span>高负荷预警</span>
          </div>
        ) : null}
      >
        <div className="w-full h-full min-h-[150px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={loadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isHighLoad ? COLORS.orange : COLORS.cyan} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={isHighLoad ? COLORS.orange : COLORS.cyan} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: COLORS.textDim, fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: COLORS.textDim, fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke={isHighLoad ? COLORS.orange : COLORS.cyan} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorActual)" 
                name="实际负荷"
              />
              <Area 
                type="monotone" 
                dataKey="forecast" 
                stroke={COLORS.blue} 
                strokeDasharray="5 5" 
                fill="url(#colorForecast)" 
                name="预测负荷"
              />
              <ReferenceLine x="14:00" stroke={COLORS.orange} label={{ value: '当前', fill: COLORS.orange, fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Visual Alert Overlay */}
          {isHighLoad && (
             <div className="absolute top-2 right-2 bg-tech-orange/10 border border-tech-orange/50 p-2 rounded text-tech-orange text-xs max-w-[150px] backdrop-blur-sm">
                <p className="font-bold flex items-center gap-1"><Zap size={10} /> 电网过载</p>
                <p className="text-[9px]">负荷超过90%，建议进行削峰填谷。</p>
             </div>
          )}
        </div>
      </Card>

      {/* 2. Pricing & Environment */}
      <Card title="动态定价与环境监测" className="flex-[2]">
        <div className="flex justify-between items-center mb-2 px-2">
           <div className="flex items-center gap-2 text-xs text-tech-dim">
              <Thermometer size={14} className="text-tech-orange" />
              <span>24°C</span>
              <Cloud size={14} className="text-tech-blue" />
              <span>多云</span>
           </div>
        </div>
        <div className="w-full h-full min-h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={pricingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: COLORS.textDim, fontSize: 10 }} interval={2} />
              <YAxis yAxisId="left" tick={{ fill: COLORS.textDim, fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: COLORS.textDim, fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="right" dataKey="congestion" barSize={10} fill={COLORS.blue} name="拥堵指数" radius={[2, 2, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="price" stroke={COLORS.orange} strokeWidth={2} dot={false} name="电价 (元)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 3. Cluster Load Analysis (New) */}
      <Card title="群体行为聚类负荷分析" className="flex-[3]">
        <div className="w-full h-full min-h-[160px] flex flex-col">
            <div className="flex justify-end gap-3 mb-2 px-2">
                {/* Custom Legend / Filter Hint */}
                <div className="flex gap-2 text-[9px] text-tech-dim">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#ff4500]"></div> 价格敏感型 (夜间)</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#00ffff]"></div> 信息依赖型 (随机)</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#1e90ff]"></div> 风险感知型 (规律)</span>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clusterLoadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradInfo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.6}/>
                            <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="gradPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.6}/>
                            <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.6}/>
                            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fill: COLORS.textDim, fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fill: COLORS.textDim, fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Stacked Area Chart for Cumulative Load Effect */}
                    <Area 
                        type="monotone" 
                        dataKey={UserType.PriceSensitive} 
                        stackId="1" 
                        stroke={COLORS.orange} 
                        fill="url(#gradPrice)" 
                        name="价格敏感型"
                        animationDuration={1500}
                    />
                    <Area 
                        type="monotone" 
                        dataKey={UserType.RiskAware} 
                        stackId="1" 
                        stroke={COLORS.blue} 
                        fill="url(#gradRisk)" 
                        name="风险感知型"
                        animationDuration={1500}
                    />
                    <Area 
                        type="monotone" 
                        dataKey={UserType.InfoDependent} 
                        stackId="1" 
                        stroke={COLORS.cyan} 
                        fill="url(#gradInfo)" 
                        name="信息依赖型"
                        animationDuration={1500}
                    />
                    <Area 
                        type="monotone" 
                        dataKey={UserType.Unknown} 
                        stackId="1" 
                        stroke={COLORS.gray} 
                        fill={COLORS.gray}
                        fillOpacity={0.2}
                        name="其他"
                    />
                    
                    {/* Current Time Indicator */}
                    <ReferenceLine x="14:00" stroke="white" strokeDasharray="3 3" strokeOpacity={0.5} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};