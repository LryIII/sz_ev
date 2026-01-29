
import { LoadDataPoint, PricingDataPoint, FleetStat, Vehicle, GridZone, UserType, ClusterLoadPoint, VehicleCluster, UserProfileData, TransferItem } from './types';

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

// --- Mapping Region Names to Grid IDs ---
export const REGION_TO_GRID: Record<string, string[]> = {
    '南山区': ['G-6', 'G-7', 'G-11', 'G-12'],
    '福田区': ['G-8', 'G-13', 'G-18'],
    '宝安区': ['G-1', 'G-5', 'G-6', 'G-10'],
    '罗湖区': ['G-9', 'G-14', 'G-19'],
    '龙岗区': ['G-15', 'G-16', 'G-21', 'G-22', 'G-23'],
    '全域': ['G-12', 'G-13', 'G-7'],
};

export const generateLoadData = (isGlobal: boolean): LoadDataPoint[] => {
  const data: LoadDataPoint[] = [];
  for (let i = 0; i <= 24; i++) {
    const baseLoad = isGlobal ? 8500 : 420; 
    const randomVar = Math.random() * (isGlobal ? 400 : 50);
    const hourFactor = (Math.sin((i - 6) / 3) + Math.sin((i - 15) / 3)) * (isGlobal ? 1200 : 150);
    const actualLoad = baseLoad + hourFactor + randomVar;
    data.push({
      time: `${i}:00`,
      actual: i <= 14 ? actualLoad : null,
      forecast: actualLoad,
      optimized: actualLoad * 0.82, 
      lowerBound: actualLoad * 0.65, 
      upperBound: actualLoad * 1.35, 
    });
  }
  return data;
};

// --- Behavioral Profiles Config ---
export const USER_PROFILES_GLOBAL = [
  { subject: UserType.PriceSensitive, A: 45000, fullMark: 100000, color: COLORS.cyan },
  { subject: UserType.RangeAnxiety, A: 32000, fullMark: 100000, color: COLORS.orange },
  { subject: UserType.ServiceSensitive, A: 18000, fullMark: 100000, color: COLORS.blue },
  { subject: UserType.TimeSensitive, A: 15500, fullMark: 100000, color: COLORS.purple },
];

export const USER_BEHAVIOR_SCORES: Record<string, UserProfileData[]> = {
  [UserType.PriceSensitive]: [
    { subject: '价格弹性', A: 95, fullMark: 100 },
    { subject: '时间弹性', A: 85, fullMark: 100 },
    { subject: '里程容忍', A: 60, fullMark: 100 },
    { subject: '补能效率需求', A: 30, fullMark: 100 },
    { subject: '地点弹性', A: 75, fullMark: 100 },
  ],
  [UserType.RangeAnxiety]: [
    { subject: '价格弹性', A: 40, fullMark: 100 },
    { subject: '时间弹性', A: 40, fullMark: 100 },
    { subject: '里程容忍', A: 15, fullMark: 100 },
    { subject: '补能效率需求', A: 70, fullMark: 100 },
    { subject: '地点弹性', A: 30, fullMark: 100 },
  ],
  [UserType.ServiceSensitive]: [
    { subject: '价格弹性', A: 20, fullMark: 100 },
    { subject: '时间弹性', A: 60, fullMark: 100 },
    { subject: '里程容忍', A: 50, fullMark: 100 },
    { subject: '补能效率需求', A: 95, fullMark: 100 },
    { subject: '地点弹性', A: 40, fullMark: 100 },
  ],
  [UserType.TimeSensitive]: [
    { subject: '价格弹性', A: 30, fullMark: 100 },
    { subject: '时间弹性', A: 10, fullMark: 100 },
    { subject: '里程容忍', A: 40, fullMark: 100 },
    { subject: '补能效率需求', A: 85, fullMark: 100 },
    { subject: '地点弹性', A: 20, fullMark: 100 },
  ],
};

// Cluster specific behavioral modifiers
export const CLUSTER_BEHAVIOR_MODIFIERS: Record<string, Record<string, number>> = {
    'C-001': { // Taxi: High Range Anxiety, High Price Sensitive
        [UserType.PriceSensitive]: 1.5,
        [UserType.RangeAnxiety]: 1.8,
        [UserType.ServiceSensitive]: 1.2,
        [UserType.TimeSensitive]: 0.5
    },
    'C-002': { // Commuter: High Time Sensitive, Low Price Sensitive
        [UserType.PriceSensitive]: 0.4,
        [UserType.RangeAnxiety]: 0.6,
        [UserType.ServiceSensitive]: 0.8,
        [UserType.TimeSensitive]: 2.0
    },
    'C-003': { // Logistics: High Service Sensitive (Fast charge), High Range Anxiety
        [UserType.PriceSensitive]: 1.2,
        [UserType.RangeAnxiety]: 1.5,
        [UserType.ServiceSensitive]: 1.8,
        [UserType.TimeSensitive]: 1.2
    },
    'C-004': { // Ride-hailing: Balanced
        [UserType.PriceSensitive]: 1.6,
        [UserType.RangeAnxiety]: 1.2,
        [UserType.ServiceSensitive]: 1.0,
        [UserType.TimeSensitive]: 1.0
    },
    'C-005': { // Commercial Mix
        [UserType.PriceSensitive]: 0.8,
        [UserType.RangeAnxiety]: 0.9,
        [UserType.ServiceSensitive]: 1.5,
        [UserType.TimeSensitive]: 1.4
    }
};

export const FLEET_BRANDS: FleetStat[] = [
  { name: '比亚迪', count: 125000, color: '#00ffff' },
  { name: '特斯拉', count: 68000, color: '#ff4500' },
  { name: '蔚来', count: 32000, color: '#1e90ff' },
  { name: '小鹏', count: 28000, color: '#fbbf24' },
  { name: '埃安', count: 18500, color: '#a3a3a3' },
  { name: '宝马', count: 13500, color: '#3b82f6' },
];

export const VEHICLE_CLUSTERS: VehicleCluster[] = [
    { 
      id: 'C-001', name: '全市出租车群 A', region: '全域', count: 42000, avgSoc: 45, type: '运营主导', 
      composition: { operational: 0.92, private: 0.05, logistics: 0.03 },
      regulationCapacity: 125.2 
    },
    { 
      id: 'C-002', name: '南山科技园通勤群', region: '南山区', count: 28500, avgSoc: 72, type: '私家主导', 
      composition: { operational: 0.10, private: 0.85, logistics: 0.05 },
      regulationCapacity: 68.5 
    },
    { 
      id: 'C-003', name: '福田物流配送群', region: '福田区', count: 12000, avgSoc: 30, type: '物流主导', 
      composition: { operational: 0.05, private: 0.05, logistics: 0.90 },
      regulationCapacity: 45.0 
    },
    { 
      id: 'C-004', name: '宝安网约车群 B', region: '宝安区', count: 55000, avgSoc: 55, type: '运营主导', 
      composition: { operational: 0.88, private: 0.08, logistics: 0.04 },
      regulationCapacity: 150.1 
    },
    { 
      id: 'C-005', name: '罗湖商业中心群', region: '罗湖区', count: 18000, avgSoc: 80, type: '混合型', 
      composition: { operational: 0.30, private: 0.60, logistics: 0.10 },
      regulationCapacity: 35.4 
    },
];

const LAT_START = 22.48; 
const LAT_END = 22.62;   
const LON_START = 113.95; 
const LON_END = 114.22;   
const ROWS = 5;
const COLS = 5;
const LAT_STEP = (LAT_END - LAT_START) / ROWS;
const LON_STEP = (LON_END - LON_START) / COLS;

export const GRID_ZONES: GridZone[] = Array.from({ length: 25 }, (_, i) => {
    if ([0, 4, 20, 24, 2].includes(i)) return null;
    return {
        id: `G-${i}`,
        load: Math.floor(Math.random() * 50) + 30, 
        optimizedLoad: 0,
        vehicleCount: Math.floor(Math.random() * 8000) + 2000,
        x: i % 5,
        y: Math.floor(i / 5),
    };
}).filter((z): z is GridZone => z !== null);

// --- Irregular Grid Generation with Jitter ---
const VERTICES: [number, number][][] = [];
// Random seed simulation function to keep shapes consistent across re-renders
const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

for (let r = 0; r <= ROWS; r++) {
    const rowVertices: [number, number][] = [];
    for (let c = 0; c <= COLS; c++) {
        let lat = LAT_END - (r * LAT_STEP);
        let lon = LON_START + (c * LON_STEP);

        // Add "Jitter" to internal vertices to create irregular polygons
        // We avoid jittering the outer boundary to keep the map rectangular-ish overall
        if (r > 0 && r < ROWS && c > 0 && c < COLS) {
            const jitterLat = (pseudoRandom(r * c + 1) - 0.5) * (LAT_STEP * 0.7);
            const jitterLon = (pseudoRandom(r * c + 2) - 0.5) * (LON_STEP * 0.7);
            lat += jitterLat;
            lon += jitterLon;
        }

        rowVertices.push([lat, lon]);
    }
    VERTICES.push(rowVertices);
}

export const GRID_SHAPES: Record<string, [number, number][]> = {};
GRID_ZONES.forEach(zone => {
    const r = zone.y; const c = zone.x;
    // Map grid cell to vertices: Top-Left, Top-Right, Bottom-Right, Bottom-Left
    GRID_SHAPES[zone.id] = [VERTICES[r][c], VERTICES[r][c+1], VERTICES[r+1][c+1], VERTICES[r+1][c]];
});

export const getPolygonCenter = (points: [number, number][]): [number, number] => {
    let lat = 0, lon = 0;
    points.forEach(p => { lat += p[0]; lon += p[1]; });
    return [lat / points.length, lon / points.length];
};

export const getTransferData = (sourceId: string, time: number = 12): TransferItem[] => {
    // Deterministic selection of targets based on ID
    const sourceIndex = parseInt(sourceId.split('-')[1]);
    
    // Select 3 fixed targets for this source to ensure lines don't jump around
    const targets = GRID_ZONES
        .filter(z => z.id !== sourceId)
        .sort((a, b) => {
            // Pseudo-random but deterministic sort based on ID diff
            const idA = parseInt(a.id.split('-')[1]);
            const idB = parseInt(b.id.split('-')[1]);
            const scoreA = (idA * sourceIndex * 13) % 100;
            const scoreB = (idB * sourceIndex * 13) % 100;
            return scoreA - scoreB;
        })
        .slice(0, 3);

    return targets.map(z => {
        const targetIndex = parseInt(z.id.split('-')[1]);
        // Create a smooth wave based on time for the amount
        // Adding phase shift based on IDs so all lines don't pulse in sync
        const phase = (sourceIndex * 3 + targetIndex * 7);
        // Normalize time to 0-1 range for sin wave
        const timeRad = (time / 24) * Math.PI * 4; // 2 cycles per day
        
        // Value oscillates between 10 and 90 smoothly
        const rawSine = Math.sin(timeRad + phase);
        const amount = 50 + (rawSine * 40); 
        
        return {
            target: z.id,
            amount: parseFloat(amount.toFixed(1))
        };
    });
};
