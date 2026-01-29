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
  [UserType.InfoDependent]: number;
  [UserType.RiskAware]: number;
  [UserType.PriceSensitive]: number;
  [UserType.Unknown]: number;
}

export interface UserProfileData {
  subject: string;
  A: number; // Selected Region/Global
  fullMark: number;
}

export interface FleetStat {
  name: string;
  count: number;
  color: string;
}

// Aggregated Cluster instead of individual vehicle
export interface VehicleCluster {
  id: string;
  name: string;
  region: string;
  count: number;
  avgSoc: number;
  type: 'Operational' | 'Private' | 'Special';
  regulationCapacity: number; // MW
}

// Individual vehicle kept for compatibility if needed, but not primarily displayed in list
export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: 'Operational' | 'Private' | 'Special';
  soc: number;
  gridId: string;
  userType: 'Info' | 'Risk' | 'Price' | 'Unknown';
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
  InfoDependent = "Info-Dependent",
  RiskAware = "Risk-Aware",
  PriceSensitive = "Price-Sensitive",
  Unknown = "Unknown"
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: number;
  targetId?: string;
}