import { Activity, AlertTriangle, Shield, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockData } from "@/data/mockData";
import { HealthBadge, SeverityBadge } from "@/components/StatusBadge";
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from "recharts";

const data = getMockData();
const { summary, segments, alerts } = data;

const statCards = [
  { label: "Monitored Segments", value: summary.totalSegments, icon: Shield, color: "text-chart-1" },
  { label: "Active Alerts", value: summary.activeAlerts, icon: AlertTriangle, color: "text-status-warning" },
  { label: "Health Score", value: `${summary.overallHealthScore}%`, icon: Activity, color: summary.overallHealthScore > 70 ? "text-status-healthy" : "text-status-warning" },
];

export default function DashboardPage() {
  const recentAlerts = alerts.filter(a => a.status !== "resolved").slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time rail network health monitoring</p>
      </div>

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
                  {/* Sparkline */}
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
