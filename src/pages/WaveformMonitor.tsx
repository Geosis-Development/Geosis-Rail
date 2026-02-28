import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMockData, generateWaveformData, generateFrequencyData } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";

const { sensors } = getMockData();
const acousticSensors = sensors.filter(s => s.type === "acoustic" || true); // show all for demo

export default function WaveformMonitorPage() {
  const [selectedSensor, setSelectedSensor] = useState(acousticSensors[0]?.id ?? "");
  const [waveform, setWaveform] = useState(() => generateWaveformData());
  const [spectrum, setSpectrum] = useState(() => generateFrequencyData());

  const refresh = useCallback(() => {
    setWaveform(generateWaveformData());
    setSpectrum(generateFrequencyData());
  }, []);

  // Simulate live data
  useEffect(() => {
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const anomalyRegion = waveform.filter(p => p.isAnomaly);
  const anomalyStart = anomalyRegion[0]?.time;
  const anomalyEnd = anomalyRegion[anomalyRegion.length - 1]?.time;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Acoustic Waveform Monitor</h1>
          <p className="text-sm text-muted-foreground">Real-time acoustic signal visualization</p>
        </div>
        <Select value={selectedSensor} onValueChange={(v) => { setSelectedSensor(v); refresh(); }}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {acousticSensors.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name} — {s.location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time-domain waveform */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
            Time-Domain Waveform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waveform}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[-2, 2]} />
                {anomalyStart !== undefined && (
                  <>
                    <ReferenceLine x={anomalyStart} stroke="hsl(var(--status-critical))" strokeDasharray="3 3" />
                    <ReferenceLine x={anomalyEnd} stroke="hsl(var(--status-critical))" strokeDasharray="3 3" />
                  </>
                )}
                <Line
                  type="monotone" dataKey="amplitude"
                  stroke="hsl(var(--chart-1))" strokeWidth={1.5} dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {anomalyStart !== undefined && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-status-critical" />
              <span className="text-status-critical font-semibold">Anomaly detected</span>
              <span className="text-muted-foreground font-mono">t={anomalyStart}–{anomalyEnd}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frequency spectrum */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Frequency Spectrum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spectrum}>
                <XAxis dataKey="frequency" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v: number) => `${v / 1000}k`} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="magnitude" fill="hsl(var(--chart-1))" radius={[1, 1, 0, 0]}
                  isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
