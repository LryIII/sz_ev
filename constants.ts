import { LoadDataPoint, PricingDataPoint, Station, FleetStat, Vehicle, GridZone, UserType, ClusterLoadPoint } from './types';

// --- Colors ---
export const COLORS = {
  cyan: '#06b6d4',
  cyanGlow: '#00ffff',
  blue: '#1e90ff',
  orange: '#ff4500',
  red: '#ef4444',
  green: '#22c55e',
  purple: '#8b5cf6',
  gray: '#94a3b8',
  grid: '#1e293b',
  textMain: '#e2e8f0',
  textDim: '#94a3b8',
};

// --- Mock Data Generators ---

export const generateLoadData = (isGlobal: boolean): LoadDataPoint[] => {
  const data: LoadDataPoint[] = [];
  for (let i = 0; i <= 24; i++) {
    const baseLoad = isGlobal ? 500 : 80;
    const randomVar = Math.random() * (isGlobal ? 100 : 20);
    // Peak at 9am and 6pm
    const hourFactor = (Math.sin((i - 6) / 3) + Math.sin((i - 15) / 3)) * (isGlobal ? 150 : 30);
    
    data.push({
      time: `${i}:00`,
      actual: i <= 14 ? baseLoad + hourFactor + randomVar : null, // Assuming current time is ~14:00
      forecast: baseLoad + hourFactor + randomVar,
      lowerBound: baseLoad + hourFactor - (isGlobal ? 50 : 10),
      upperBound: baseLoad + hourFactor + (isGlobal ? 50 : 10),
    });
  }
  return data;
};

// Generate load breakdown by user cluster
export const generateClusterLoadData = (isGlobal: boolean): ClusterLoadPoint[] => {
  const data: ClusterLoadPoint[] = [];
  const scale = isGlobal ? 10 : 2; 

  for (let i = 0; i <= 24; i++) {
    // Price Sensitive: High during night (0-6), Low day, High late night
    const priceLoad = (i < 7 || i > 22 ? 40 : 5) * scale + Math.random() * 5 * scale;
    
    // Risk Aware: Consistent, slight peaks at commute times (8-9, 18-19)
    const riskLoad = (15 + (i > 7 && i < 20 ? 10 : 0)) * scale + Math.random() * 2 * scale;

    // Info Dependent: Follows convenience/activity (Lunch 12, Evening 19)
    const infoLoad = (10 + Math.max(0, Math.sin((i - 12)/2)*20) + Math.max(0, Math.sin((i - 19)/2)*25)) * scale;

    // Unknown: Random noise
    const unknownLoad = 5 * scale + Math.random() * 2 * scale;

    data.push({
      time: `${i}:00`,
      [UserType.InfoDependent]: Math.floor(infoLoad),
      [UserType.RiskAware]: Math.floor(riskLoad),
      [UserType.PriceSensitive]: Math.floor(priceLoad),
      [UserType.Unknown]: Math.floor(unknownLoad),
    });
  }
  return data;
};

export const PRICING_DATA: PricingDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}:00`,
  price: 0.5 + Math.random() * 1.5,
  congestion: 20 + Math.random() * 70,
  temp: 20 + Math.random() * 10
}));

// Keeping simpler station data for compatibility if needed elsewhere, though LeftPanel won't use it
export const STATIONS: Station[] = [
  { id: '1', name: '中央枢纽 A站', score: 98, available: 5, total: 50, status: 'Online', details: { convenience: 90, price: 80, speed: 100, service: 95 } },
  { id: '2', name: '西城购物中心', score: 95, available: 12, total: 30, status: 'Online', details: { convenience: 100, price: 60, speed: 90, service: 85 } },
  { id: '3', name: '科技园B区', score: 88, available: 20, total: 40, status: 'Online', details: { convenience: 70, price: 90, speed: 85, service: 80 } },
];

export const USER_PROFILES_GLOBAL = [
  { subject: '信息依赖型', A: 30, fullMark: 100 },
  { subject: '风险感知型', A: 20, fullMark: 100 },
  { subject: '价格敏感型', A: 40, fullMark: 100 },
  { subject: '习惯/其他', A: 10, fullMark: 100 },
];

export const USER_PROFILES_LOCAL = [
  { subject: '信息依赖型', A: 10, fullMark: 100 },
  { subject: '风险感知型', A: 60, fullMark: 100 }, 
  { subject: '价格敏感型', A: 20, fullMark: 100 },
  { subject: '习惯/其他', A: 10, fullMark: 100 },
];

export const FLEET_BRANDS: FleetStat[] = [
  { name: '比亚迪', count: 450, color: '#00ffff' },
  { name: '特斯拉', count: 320, color: '#ff4500' },
  { name: '蔚来', count: 180, color: '#1e90ff' },
  { name: '小鹏', count: 150, color: '#fbbf24' },
  { name: '宝马', count: 90, color: '#a3a3a3' },
];

export const FLEET_USAGE = [
  { name: '运营车', value: 400 },
  { name: '私家车', value: 300 },
  { name: '专用车', value: 100 },
];

export const generateVehicles = (count: number, gridId?: string): Vehicle[] => {
  const models = ['比亚迪 汉', 'Tesla Model 3', '蔚来 ES6', 'BMW i3'];
  const types: Vehicle['type'][] = ['Operational', 'Private', 'Special'];
  const userTypes: Vehicle['userType'][] = ['Info', 'Risk', 'Price', 'Unknown'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `v-${i}`,
    plate: `A-${Math.floor(Math.random()*10000)}`,
    model: models[Math.floor(Math.random() * models.length)],
    type: types[Math.floor(Math.random() * types.length)],
    soc: Math.floor(Math.random() * 100),
    gridId: gridId || `G-${Math.floor(Math.random() * 25)}`,
    userType: userTypes[Math.floor(Math.random() * userTypes.length)],
  }));
};

export const GRID_ZONES: GridZone[] = Array.from({ length: 25 }, (_, i) => ({
  id: `G-${i}`,
  load: Math.floor(Math.random() * 60) + 20, 
  vehicleCount: Math.floor(Math.random() * 50),
  x: i % 5,
  y: Math.floor(i / 5),
}));