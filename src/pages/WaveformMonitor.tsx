import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMockData, generateWaveformData, generateFrequencyData } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";
import { Brain, AlertTriangle, CheckCircle, Loader } from "lucide-react";

const { sensors } = getMockData();
const acousticSensors = sensors.filter(s => s.type === "acoustic" || true);

// ── AI Prediction type ─────────────────────────────────────────────────────
interface AIPrediction {
  label: "CRACKED" | "NORMAL";
  confidence: number;
  wear_percent: number;
  alert: boolean;
  source: string;
}

export default function WaveformMonitorPage() {
  const [selectedSensor, setSelectedSensor] = useState(acousticSensors[0]?.id ?? "");
  const [waveform, setWaveform]             = useState(() => generateWaveformData());
  const [spectrum, setSpectrum]             = useState(() => generateFrequencyData());

  // ── AI state ───────────────────────────────────────────────────────────────
  const [aiResult, setAiResult]   = useState<AIPrediction | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState<string | null>(null);
  const [history, setHistory]     = useState<AIPrediction[]>([]);

  // ── Fetch AI prediction ────────────────────────────────────────────────────
  const fetchPrediction = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch("http://localhost:5000/predict/dummy", {
        method: "POST",
      });
      if (!res.ok) throw new Error("API error");
      const result: AIPrediction = await res.json();
      setAiResult(result);
      setAiError(null);
      setHistory(prev => [...prev.slice(-9), result]); // keep last 10
    } catch {
      setAiError("AI model offline — run: python api.py");
    } finally {
      setAiLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setWaveform(generateWaveformData());
    setSpectrum(generateFrequencyData());
    fetchPrediction();
  }, [fetchPrediction]);

  // Refresh every 3 seconds
  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh, fetchPrediction]);

  const anomalyRegion = waveform.filter(p => p.isAnomaly);
  const anomalyStart  = anomalyRegion[0]?.time;
  const anomalyEnd    = anomalyRegion[anomalyRegion.length - 1]?.time;

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

      {/* ── AI Result Card ───────────────────────────────────────────────────── */}
      <Card className={`border-2 transition-all duration-500 ${
        aiResult?.alert          ? "border-red-500 bg-red-500/10" :
        aiResult?.label === "CRACKED" ? "border-orange-400 bg-orange-400/10" :
        aiResult              ? "border-green-500 bg-green-500/10" :
                                 "border-border/60"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">

            {/* Icon */}
            <div className="relative">
              <Brain className={`h-10 w-10 ${
                aiResult?.alert          ? "text-red-500" :
                aiResult?.label === "CRACKED" ? "text-orange-400" :
                "text-green-500"
              }`} />
              {aiLoading && (
                <Loader className="h-4 w-4 animate-spin absolute -top-1 -right-1 text-muted-foreground" />
              )}
            </div>

            {/* Result */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                GEOSIS AI — Acoustic Analysis
              </p>

              {aiError && (
                <p className="text-sm text-orange-400 font-mono">{aiError}</p>
              )}

              {aiResult && !aiError && (
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Label */}
                  <div className="flex items-center gap-1.5">
                    {aiResult.label === "CRACKED"
                      ? <AlertTriangle className="h-4 w-4 text-red-400" />
                      : <CheckCircle className="h-4 w-4 text-green-400" />
                    }
                    <span className={`text-xl font-bold font-mono ${
                      aiResult.label === "CRACKED" ? "text-red-400" : "text-green-400"
                    }`}>
                      {aiResult.label}
                    </span>
                  </div>

                  {/* Confidence */}
                  <span className="text-sm text-muted-foreground">
                    Confidence: <span className="font-mono font-bold text-foreground">{aiResult.confidence}%</span>
                  </span>

                  {/* Wear */}
                  <span className="text-sm text-muted-foreground">
                    Wear: <span className={`font-mono font-bold ${
                      aiResult.wear_percent >= 80 ? "text-red-400" :
                      aiResult.wear_percent >= 60 ? "text-orange-400" :
                      "text-foreground"
                    }`}>{aiResult.wear_percent}%</span>
                  </span>

                  {/* Source */}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {aiResult.source}
                  </span>

                  {/* Alert badge */}
                  {aiResult.alert && (
                    <span className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      CRITICAL
                    </span>
                  )}
                </div>
              )}

              {/* Wear bar */}
              {aiResult && (
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden w-full max-w-sm">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      aiResult.wear_percent >= 80 ? "bg-red-500" :
                      aiResult.wear_percent >= 60 ? "bg-orange-400" :
                      "bg-green-500"
                    }`}
                    style={{ width: `${aiResult.wear_percent}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Prediction History ───────────────────────────────────────────────── */}
      {history.length > 1 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Last {history.length} Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div key={i} className={`text-xs px-2 py-1 rounded font-mono border ${
                  h.label === "CRACKED"
                    ? "border-red-500/50 text-red-400 bg-red-500/10"
                    : "border-green-500/50 text-green-400 bg-green-500/10"
                }`}>
                  {h.label} {h.wear_percent}%
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <ReferenceLine x={anomalyEnd}   stroke="hsl(var(--status-critical))" strokeDasharray="3 3" />
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
