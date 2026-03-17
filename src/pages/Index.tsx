import { Activity, AlertTriangle, Shield, TrendingDown, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockData } from "@/data/mockData";
import { HealthBadge, SeverityBadge } from "@/components/StatusBadge";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";

const data = getMockData();
const { summary, segments, alerts } = data;

// ── AI Prediction type ────────────────────────────────────────────────────────
interface AIPrediction {
  label: "CRACKED" | "NORMAL";
  confidence: number;
  wear_percent: number;
  alert: boolean;
  source: string;
}

export default function DashboardPage() {
  const recentAlerts = alerts.filter(a => a.status !== "resolved").slice(0, 6);

  // ── AI State ────────────────────────────────────────────────────────────────
  const [aiResult, setAiResult]     = useState<AIPrediction | null>(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState<string | null>(null);

  // ── Fetch AI prediction every 5 seconds ────────────────────────────────────
  const fetchPrediction = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("http://localhost:5000/predict/dummy", {
        method: "POST",
      });
      if (!res.ok) throw new Error("API error");
      const result: AIPrediction = await res.json();
      setAiResult(result);
    } catch (err) {
      setAiError("AI model offline — run api.py");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Stat cards (now includes AI wear %) ────────────────────────────────────
  const statCards = [
    { label: "Monitored Segments", value: summary.totalSegments,          icon: Shield,        color: "text-chart-1" },
    { label: "Active Alerts",      value: summary.activeAlerts,           icon: AlertTriangle, color: "text-status-warning" },
    { label: "Health Score",       value: `${summary.overallHealthScore}%`, icon: Activity,    color: summary.overallHealthScore > 70 ? "text-status-healthy" : "text-status-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time rail network health monitoring</p>
      </div>

      {/* ── AI Prediction Banner ────────────────────────────────────────────── */}
      <Card className={`border-2 ${
        aiResult?.alert
          ? "border-red-500 bg-red-500/10"
          : aiResult?.label === "CRACKED"
          ? "border-orange-400 bg-orange-400/10"
          : "border-green-500 bg-green-500/10"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Brain className={`h-8 w-8 ${
                aiResult?.alert ? "text-red-500" :
                aiResult?.label === "CRACKED" ? "text-orange-400" :
                "text-green-500"
              }`} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  AI Acoustic Monitor — Live
                </p>
                {aiLoading && !aiResult && (
                  <p className="text-sm font-mono animate-pulse">Analysing signal...</p>
                )}
                {aiError && (
                  <p className="text-sm text-orange-400 font-mono">{aiError}</p>
                )}
                {aiResult && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-lg font-bold font-mono ${
                      aiResult.label === "CRACKED" ? "text-red-400" : "text-green-400"
                    }`}>
                      {aiResult.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Confidence: <span className="font-mono font-bold">{aiResult.confidence}%</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Wear: <span className={`font-mono font-bold ${
                        aiResult.wear_percent >= 80 ? "text-red-400" : "text-foreground"
                      }`}>{aiResult.wear_percent}%</span>
                    </span>
                    <span className="text-xs text-muted-foreground">via {aiResult.source}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alert badge */}
            {aiResult?.alert && (
              <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                WEAR CRITICAL — {aiResult.wear_percent}%
              </div>
            )}

            {/* Wear progress bar */}
            {aiResult && (
              <div className="w-full mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Wear Level</span>
                  <span>{aiResult.wear_percent}% {aiResult.wear_percent >= 80 ? "⚠️ Above threshold" : "✓ Normal"}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      aiResult.wear_percent >= 80 ? "bg-red-500" :
                      aiResult.wear_percent >= 60 ? "bg-orange-400" :
                      "bg-green-500"
                    }`}
                    style={{ width: `${aiResult.wear_percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold font-mono mt-1">{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Mini Rail Map */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Rail Segment Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {segments.map(seg => (
                <div key={seg.id} className="p-3 rounded border bg-muted/30 space-y-1.5">
                  <p className="text-xs font-medium truncate">{seg.name}</p>
                  <div className="flex items-center justify-between">
                    <HealthBadge status={seg.status} />
                    <span className="text-sm font-mono font-bold">{seg.healthScore}%</span>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={seg.wearHistory.slice(-6)}>
                        <Area
                          type="monotone"
                          dataKey="qualityScore"
                          stroke="hsl(var(--chart-1))"
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.1}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-warning" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAlerts.length === 0 && (
                <p className="text-sm text-muted-foreground">No active alerts</p>
              )}
              {recentAlerts.map(alert => {
                const seg = segments.find(s => s.id === alert.segmentId);
                return (
                  <div key={alert.id} className="flex items-start gap-2 p-2 rounded border bg-muted/20 text-xs">
                    <SeverityBadge severity={alert.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{seg?.name ?? alert.segmentId}</p>
                      <p className="text-muted-foreground capitalize">{alert.type} — KM {alert.locationKm}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wear Trend Overview */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Wear Trend (12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={segments[0].wearHistory}>
                {segments.slice(0, 4).map((seg, i) => (
                  <Line
                    key={seg.id}
                    data={seg.wearHistory}
                    type="monotone"
                    dataKey="wearMm"
                    stroke={`hsl(var(--chart-${i + 1}))`}
                    strokeWidth={1.5}
                    dot={false}
                    name={seg.name}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
