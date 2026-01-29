
export interface LoadDataPoint {
  time: string;
  actual: number | null;
  forecast: number | null;
  lowerBound?: number; // Regulation Lower Limit
  upperBound?: number; // Regulation Upper Limit
  optimized?: number; // Optimized Load
}

export interface PricingDataPoint {
  time: string;
  price: number;
  congestion: number; // 0-100
  temp: number;
}

export interface ClusterLoadPoint {
  time: string;
  [UserType.PriceSensitive]: number;
  [UserType.RangeAnxiety]: number;
  [UserType.ServiceSensitive]: number;
  [UserType.TimeSensitive]: number;
}

export interface UserProfileData {
  subject: string;
  A: number; // Intensity/Score for radar or count for pie
  fullMark: number;
  color?: string;
}

export interface FleetStat {
  name: string;
  count: number;
  color: string;
}

// Aggregated Cluster with mixed compositions
export interface VehicleCluster {
  id: string;
  name: string;
  region: string;
  count: number;
  avgSoc: number;
  type: string; // Dominant type label
  composition: {
    operational: number; // percentage 0-1
    private: number;
    logistics: number;
  };
  regulationCapacity: number; // MW
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: 'Operational' | 'Private' | 'Special' | 'Logistics';
  soc: number;
  gridId: string;
  userType: UserType;
}

export interface GridZone {
  id: string;
  load: number; // 0-100 heatmap intensity
  optimizedLoad: number; // For Map B
  vehicleCount: number;
  x: number; // grid coordinate X
  y: number; // grid coordinate Y
}

export enum UserType {
  PriceSensitive = "价格敏感型",
  RangeAnxiety = "里程焦虑型",
  ServiceSensitive = "服务敏感型",
  TimeSensitive = "时间敏感型"
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: number;
  targetId?: string;
}

export interface TransferItem {
    target: string;
    amount: number;
}
