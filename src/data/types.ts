export type HealthStatus = "healthy" | "warning" | "critical";
export type DefectType = "crack" | "fracture" | "wear";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "new" | "acknowledged" | "resolved";

export interface RailSegment {
  id: string;
  name: string;
  startKm: number;
  endKm: number;
  status: HealthStatus;
  healthScore: number; // 0-100
  sensors: string[];
  lastInspection: string;
  defects: Defect[];
  wearHistory: WearDataPoint[];
}

export interface Sensor {
  id: string;
  name: string;
  segmentId: string;
  location: string;
  online: boolean;
  lastReading: string;
  type: "acoustic" | "vibration" | "temperature";
}

export interface Defect {
  id: string;
  segmentId: string;
  type: DefectType;
  severity: AlertSeverity;
  locationKm: number;
  detectedAt: string;
  description: string;
}

export interface Alert {
  id: string;
  segmentId: string;
  sensorId: string;
  type: DefectType;
  severity: AlertSeverity;
  status: AlertStatus;
  locationKm: number;
  timestamp: string;
  description: string;
  recommendedAction: string;
}

export interface WearDataPoint {
  date: string;
  wearMm: number;
  qualityScore: number;
}

export interface WaveformDataPoint {
  time: number;
  amplitude: number;
  isAnomaly?: boolean;
}

export interface FrequencyDataPoint {
  frequency: number;
  magnitude: number;
  isAnomaly?: boolean;
}

export interface DashboardSummary {
  totalSegments: number;
  activeAlerts: number;
  overallHealthScore: number;
  sensorsOnline: number;
  sensorsTotal: number;
  criticalAlerts: number;
}
