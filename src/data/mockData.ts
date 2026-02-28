import type {
  RailSegment, Sensor, Alert, WearDataPoint, WaveformDataPoint,
  FrequencyDataPoint, DashboardSummary, HealthStatus, DefectType,
  AlertSeverity, AlertStatus
} from "./types";

const segmentNames = [
  "Western Line — Churchgate to Virar",
  "Central Line — CST to Kasara",
  "Central Line — CST to Khopoli",
  "Harbour Line — CST to Panvel",
  "Harbour Line — Andheri to Panvel",
  "Trans-Harbour Line — Thane to Panvel",
  "Monorail — Jacob Circle to Wadala",
  "Metro Line 1 — Versova to Ghatkopar",
];

const segmentDistances = [
  { start: 0, end: 124 },  // Western — Churchgate to Dahanu Rd
  { start: 0, end: 120 },  // Central — CST to Kasara
  { start: 0, end: 114 },  // Central — CST to Khopoli
  { start: 0, end: 68 },   // Harbour — CST to Panvel
  { start: 0, end: 28 },   // Harbour — Andheri branch
  { start: 0, end: 35 },   // Trans-Harbour — Thane to Panvel
  { start: 0, end: 20 },   // Monorail
  { start: 0, end: 12 },   // Metro Line 1
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomStatus(): HealthStatus {
  const r = Math.random();
  if (r < 0.6) return "healthy";
  if (r < 0.85) return "warning";
  return "critical";
}

function randomDefectType(): DefectType {
  const types: DefectType[] = ["crack", "fracture", "wear"];
  return types[Math.floor(Math.random() * types.length)];
}

function randomSeverity(): AlertSeverity {
  const s: AlertSeverity[] = ["low", "medium", "high", "critical"];
  return s[Math.floor(Math.random() * s.length)];
}

function randomAlertStatus(): AlertStatus {
  const s: AlertStatus[] = ["new", "acknowledged", "resolved"];
  return s[Math.floor(Math.random() * s.length)];
}

function generateWearHistory(months: number): WearDataPoint[] {
  const data: WearDataPoint[] = [];
  let wear = randomBetween(0.5, 2);
  let quality = randomBetween(80, 98);
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    wear += randomBetween(0.02, 0.15);
    quality -= randomBetween(0.1, 0.8);
    data.push({
      date: date.toISOString().slice(0, 10),
      wearMm: Math.round(wear * 100) / 100,
      qualityScore: Math.max(0, Math.round(quality * 10) / 10),
    });
  }
  return data;
}

export function generateSegments(): RailSegment[] {
  return segmentNames.map((name, i) => {
    const status = randomStatus();
    const healthScore = status === "healthy" ? randomBetween(75, 100) :
                        status === "warning" ? randomBetween(45, 74) :
                        randomBetween(10, 44);
    const dist = segmentDistances[i];
    const sensorIds = [`S${i * 2 + 1}`, `S${i * 2 + 2}`];
    const defectCount = status === "healthy" ? 0 : status === "warning" ? 1 : Math.floor(randomBetween(1, 4));
    const defects = Array.from({ length: defectCount }, (_, j) => ({
      id: `D${i}-${j}`,
      segmentId: `SEG-${i + 1}`,
      type: randomDefectType(),
      severity: randomSeverity(),
      locationKm: Math.round(randomBetween(dist.start, dist.end) * 10) / 10,
      detectedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      description: `Detected ${randomDefectType()} at monitoring point`,
    }));

    return {
      id: `SEG-${i + 1}`,
      name,
      startKm: dist.start,
      endKm: dist.end,
      status,
      healthScore: Math.round(healthScore),
      sensors: sensorIds,
      lastInspection: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().slice(0, 10),
      defects,
      wearHistory: generateWearHistory(12),
    };
  });
}

export function generateSensors(segments: RailSegment[]): Sensor[] {
  return segments.flatMap((seg, i) =>
    seg.sensors.map((sId, j) => ({
      id: sId,
      name: `Sensor ${sId}`,
      segmentId: seg.id,
      location: `KM ${seg.startKm + j * 2.5}`,
      online: Math.random() > 0.1,
      lastReading: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      type: (["acoustic", "vibration", "temperature"] as const)[j % 3],
    }))
  );
}

export function generateAlerts(segments: RailSegment[]): Alert[] {
  const alerts: Alert[] = [];
  segments.forEach(seg => {
    seg.defects.forEach((d, i) => {
      alerts.push({
        id: `ALT-${seg.id}-${i}`,
        segmentId: seg.id,
        sensorId: seg.sensors[0],
        type: d.type,
        severity: d.severity,
        status: randomAlertStatus(),
        locationKm: d.locationKm,
        timestamp: d.detectedAt,
        description: d.description,
        recommendedAction: d.severity === "critical" ? "Immediate inspection required" :
                          d.severity === "high" ? "Schedule inspection within 24h" :
                          "Monitor and review at next maintenance window",
      });
    });
  });
  // Sort by timestamp descending
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateWaveformData(points = 200, hasAnomaly = true): WaveformDataPoint[] {
  const data: WaveformDataPoint[] = [];
  const anomalyStart = Math.floor(points * 0.6);
  const anomalyEnd = anomalyStart + 20;
  for (let i = 0; i < points; i++) {
    const baseAmplitude = Math.sin(i * 0.15) * 0.4 + Math.sin(i * 0.05) * 0.3;
    const noise = (Math.random() - 0.5) * 0.15;
    const isAnomaly = hasAnomaly && i >= anomalyStart && i <= anomalyEnd;
    const anomalyBoost = isAnomaly ? Math.sin((i - anomalyStart) * 0.3) * 1.5 : 0;
    data.push({
      time: i,
      amplitude: Math.round((baseAmplitude + noise + anomalyBoost) * 1000) / 1000,
      isAnomaly,
    });
  }
  return data;
}

export function generateFrequencyData(points = 100): FrequencyDataPoint[] {
  return Array.from({ length: points }, (_, i) => {
    const freq = i * 50;
    const baseMag = Math.exp(-((freq - 1500) ** 2) / 500000) * 0.8 +
                    Math.exp(-((freq - 3000) ** 2) / 300000) * 0.5;
    const isAnomaly = freq > 3500 && freq < 4000;
    const anomalyMag = isAnomaly ? 0.6 : 0;
    return {
      frequency: freq,
      magnitude: Math.round((baseMag + anomalyMag + Math.random() * 0.05) * 1000) / 1000,
      isAnomaly,
    };
  });
}

export function getDashboardSummary(segments: RailSegment[], sensors: Sensor[], alerts: Alert[]): DashboardSummary {
  return {
    totalSegments: segments.length,
    activeAlerts: alerts.filter(a => a.status !== "resolved").length,
    overallHealthScore: Math.round(segments.reduce((s, seg) => s + seg.healthScore, 0) / segments.length),
    sensorsOnline: sensors.filter(s => s.online).length,
    sensorsTotal: sensors.length,
    criticalAlerts: alerts.filter(a => a.severity === "critical" && a.status !== "resolved").length,
  };
}

// Singleton-ish data store
let _segments: RailSegment[] | null = null;
let _sensors: Sensor[] | null = null;
let _alerts: Alert[] | null = null;

export function getMockData() {
  if (!_segments) {
    _segments = generateSegments();
    _sensors = generateSensors(_segments);
    _alerts = generateAlerts(_segments);
  }
  return {
    segments: _segments,
    sensors: _sensors!,
    alerts: _alerts!,
    summary: getDashboardSummary(_segments, _sensors!, _alerts!),
  };
}
