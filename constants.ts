import { LoadDataPoint, PricingDataPoint, FleetStat, Vehicle, GridZone, UserType, ClusterLoadPoint, VehicleCluster, UserProfileData } from './types';

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
    const randomVar = Math.random() * (isGlobal ? 50 : 10);
    // Peak at 9am and 6pm
    const hourFactor = (Math.sin((i - 6) / 3) + Math.sin((i - 15) / 3)) * (isGlobal ? 150 : 30);
    
    const actualLoad = baseLoad + hourFactor + randomVar;
    
    data.push({
      time: `${i}:00`,
      actual: i <= 14 ? actualLoad : null,
      forecast: actualLoad,
      optimized: actualLoad * 0.85, 
      lowerBound: actualLoad * 0.7, // Tighter regulation band
      upperBound: actualLoad * 1.3, 
    });
  }
  return data;
};

// Generate load breakdown by user cluster
export const generateClusterLoadData = (isGlobal: boolean): ClusterLoadPoint[] => {
  const data: ClusterLoadPoint[] = [];
  const scale = isGlobal ? 10 : 2; 

  for (let i = 0; i <= 24; i++) {
    const priceLoad = (i < 7 || i > 22 ? 40 : 5) * scale + Math.random() * 5 * scale;
    const riskLoad = (15 + (i > 7 && i < 20 ? 10 : 0)) * scale + Math.random() * 2 * scale;
    const infoLoad = (10 + Math.max(0, Math.sin((i - 12)/2)*20) + Math.max(0, Math.sin((i - 19)/2)*25)) * scale;
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

// Used for Pie Chart (Distribution)
export const USER_PROFILES_GLOBAL = [
  { subject: '信息依赖型', A: 30, fullMark: 100, color: COLORS.blue },
  { subject: '风险感知型', A: 20, fullMark: 100, color: COLORS.orange },
  { subject: '价格敏感型', A: 40, fullMark: 100, color: COLORS.cyan },
  { subject: '习惯/其他', A: 10, fullMark: 100, color: COLORS.gray },
];

export const USER_PROFILES_LOCAL = [
  { subject: '信息依赖型', A: 10, fullMark: 100, color: COLORS.blue },
  { subject: '风险感知型', A: 60, fullMark: 100, color: COLORS.orange }, 
  { subject: '价格敏感型', A: 20, fullMark: 100, color: COLORS.cyan },
  { subject: '习惯/其他', A: 10, fullMark: 100, color: COLORS.gray },
];

// New Data: Detailed Scores for Radar Chart (Feature Analysis)
export const USER_BEHAVIOR_SCORES: Record<string, UserProfileData[]> = {
  '价格敏感型': [
    { subject: '价格敏感度', A: 95, fullMark: 100 },
    { subject: '时间灵活性', A: 80, fullMark: 100 },
    { subject: '信息依赖度', A: 40, fullMark: 100 },
    { subject: '风险厌恶度', A: 30, fullMark: 100 },
    { subject: '社交影响度', A: 20, fullMark: 100 },
  ],
  '风险感知型': [
    { subject: '价格敏感度', A: 30, fullMark: 100 },
    { subject: '时间灵活性', A: 20, fullMark: 100 },
    { subject: '信息依赖度', A: 85, fullMark: 100 },
    { subject: '风险厌恶度', A: 90, fullMark: 100 },
    { subject: '社交影响度', A: 60, fullMark: 100 },
  ],
  '信息依赖型': [
    { subject: '价格敏感度', A: 50, fullMark: 100 },
    { subject: '时间灵活性', A: 60, fullMark: 100 },
    { subject: '信息依赖度', A: 95, fullMark: 100 },
    { subject: '风险厌恶度', A: 40, fullMark: 100 },
    { subject: '社交影响度', A: 75, fullMark: 100 },
  ],
  '习惯/其他': [
    { subject: '价格敏感度', A: 10, fullMark: 100 },
    { subject: '时间灵活性', A: 10, fullMark: 100 },
    { subject: '信息依赖度', A: 30, fullMark: 100 },
    { subject: '风险厌恶度', A: 50, fullMark: 100 },
    { subject: '社交影响度', A: 40, fullMark: 100 },
  ],
};

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

export const VEHICLE_CLUSTERS: VehicleCluster[] = [
    { id: 'C-001', name: '全市出租车群 A', region: '全域', count: 120, avgSoc: 45, type: 'Operational', regulationCapacity: 15.2 },
    { id: 'C-002', name: '南山科技园通勤群', region: '南山区', count: 85, avgSoc: 72, type: 'Private', regulationCapacity: 8.5 },
    { id: 'C-003', name: '福田物流配送群', region: '福田区', count: 40, avgSoc: 30, type: 'Special', regulationCapacity: 12.0 },
    { id: 'C-004', name: '宝安网约车群 B', region: '宝安区', count: 150, avgSoc: 55, type: 'Operational', regulationCapacity: 20.1 },
    { id: 'C-005', name: '罗湖商业中心群', region: '罗湖区', count: 60, avgSoc: 80, type: 'Private', regulationCapacity: 5.4 },
    { id: 'C-006', name: '龙岗工业区物流群', region: '龙岗区', count: 95, avgSoc: 40, type: 'Special', regulationCapacity: 18.3 },
    { id: 'C-007', name: '全市公务车群', region: '全域', count: 30, avgSoc: 90, type: 'Special', regulationCapacity: 2.1 },
    { id: 'C-008', name: '夜间充电价格敏感群', region: '全域', count: 200, avgSoc: 20, type: 'Private', regulationCapacity: 25.0 },
];

// --- Geo/Polygon Logic (Perturbed Mesh Grid) ---

// SHIFTED COORDINATES TO THE RIGHT (East)
// Original Center approx 114.015
// New Center approx 114.085 (Shifted by ~0.07 deg)
const LAT_START = 22.48; 
const LAT_END = 22.62;   
const LON_START = 113.95; 
const LON_END = 114.22;   

const ROWS = 5;
const COLS = 5;
const LAT_STEP = (LAT_END - LAT_START) / ROWS;
const LON_STEP = (LON_END - LON_START) / COLS;

// Mask out specific corners to make it irregular/not square
const EXCLUDED_INDICES = [0, 4, 20, 24, 2];

export const GRID_ZONES: GridZone[] = Array.from({ length: 25 }, (_, i) => {
    if (EXCLUDED_INDICES.includes(i)) return null;
    return {
        id: `G-${i}`,
        load: Math.floor(Math.random() * 50) + 30, 
        optimizedLoad: 0,
        vehicleCount: Math.floor(Math.random() * 50),
        x: i % 5,
        y: Math.floor(i / 5),
    };
}).filter((z): z is GridZone => z !== null); // Filter out nulls

export const generateVehicles = (count: number, gridId?: string): Vehicle[] => {
  const models = ['比亚迪 汉', 'Tesla Model 3', '蔚来 ES6', 'BMW i3'];
  const types: Vehicle['type'][] = ['Operational', 'Private', 'Special'];
  const userTypes: Vehicle['userType'][] = ['Info', 'Risk', 'Price', 'Unknown'];
  
  // Get available grid IDs for random assignment
  const availableGridIds = GRID_ZONES.map(z => z.id);

  return Array.from({ length: count }, (_, i) => ({
    id: `v-${i}`,
    plate: `A-${Math.floor(Math.random()*10000)}`,
    model: models[Math.floor(Math.random() * models.length)],
    type: types[Math.floor(Math.random() * types.length)],
    soc: Math.floor(Math.random() * 100),
    gridId: gridId || availableGridIds[Math.floor(Math.random() * availableGridIds.length)],
    userType: userTypes[Math.floor(Math.random() * userTypes.length)],
  }));
};

// Deterministic Pseudo-random for mesh generation
const seedRand = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// 1. Generate Vertices Grid (6x6 vertices for 5x5 zones)
const VERTICES: [number, number][][] = [];

for (let r = 0; r <= ROWS; r++) {
    const rowVertices: [number, number][] = [];
    for (let c = 0; c <= COLS; c++) {
        // Base uniform position
        let lat = LAT_END - (r * LAT_STEP);
        let lon = LON_START + (c * LON_STEP);

        // Perturb ALL vertices (including edges) to create winding, organic boundaries
        const variance = 0.35; 
        const rndLat = seedRand(r * 150 + c) - 0.5; 
        const rndLon = seedRand(r * 300 + c) - 0.5;
        
        lat += rndLat * LAT_STEP * variance; 
        lon += rndLon * LON_STEP * variance;

        rowVertices.push([lat, lon]);
    }
    VERTICES.push(rowVertices);
}

// 2. Construct Polygons (Quads) from Vertices
export const GRID_SHAPES: Record<string, [number, number][]> = {};

GRID_ZONES.forEach(zone => {
    const r = zone.y;
    const c = zone.x;

    const p1 = VERTICES[r][c];
    const p2 = VERTICES[r][c+1];
    const p3 = VERTICES[r+1][c+1];
    const p4 = VERTICES[r+1][c];

    GRID_SHAPES[zone.id] = [p1, p2, p3, p4];
});

// Calculate logical center for polylines
export const getPolygonCenter = (points: [number, number][]): [number, number] => {
    let lat = 0, lon = 0;
    points.forEach(p => { lat += p[0]; lon += p[1]; });
    return [lat / points.length, lon / points.length];
};

// --- Single Source of Truth for Transfers ---

export interface TransferItem {
    target: string;
    amount: number;
}

// Define Transfer Relationships (Source -> Targets)
// Modified to ensure G-12 matches the demo scenario perfectly
const TRANSFER_MAP: Record<string, string[]> = {
    'G-12': ['G-11', 'G-13', 'G-07', 'G-09'], 
    'G-7': ['G-06', 'G-08', 'G-01'], 
    'G-17': ['G-16', 'G-18', 'G-22'],
};

// Helper function to get detailed transfer data including non-grid targets (Storage, V2G)
export const getTransferData = (sourceId: string): TransferItem[] => {
    // Demo Scenario for G-12 (Central Grid)
    if (sourceId === 'G-12') {
        return [
            { target: 'G-11', amount: 12.5 },
            { target: 'G-13', amount: 8.2 },
            { target: 'G-07', amount: 5.1 },
            { target: '储能', amount: 3.0 }, // Non-map target
            { target: 'V2G回馈', amount: 1.8 }, // Non-map target
            { target: 'G-09', amount: 0.5 },
        ];
    }

    // Procedural generation for others based on TRANSFER_MAP or neighbors
    let targets = TRANSFER_MAP[sourceId];
    if (!targets) {
        // Find adjacent grids if not explicitly defined
        const neighbors = GRID_ZONES.filter(z => z.id !== sourceId).slice(0, 3).map(z => z.id);
        targets = neighbors;
    }

    return targets.map(targetId => ({
        target: targetId,
        amount: parseFloat((Math.random() * 10).toFixed(1))
    }));
};