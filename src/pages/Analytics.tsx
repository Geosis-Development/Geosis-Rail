import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMockData } from "@/data/mockData";
import { HealthBadge } from "@/components/StatusBadge";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Tooltip, Legend, ReferenceArea, ReferenceLine,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Brain, BarChart3, Sparkles, Radio, Tag, Cog } from "lucide-react";

const { segments } = getMockData();

// Defect frequency data
const defectFrequency = segments.map(seg => ({
  name: seg.name.split("—")[0].trim().slice(0, 12),
  crack: seg.defects.filter(d => d.type === "crack").length,
  fracture: seg.defects.filter(d => d.type === "fracture").length,
  wear: seg.defects.filter(d => d.type === "wear").length,
}));

const chartConfig = {
  crack: { label: "Crack", color: "hsl(var(--chart-4))" },
  fracture: { label: "Fracture", color: "hsl(var(--chart-3))" },
  wear: { label: "Wear", color: "hsl(var(--chart-1))" },
};

// Generate ML prediction data (3 months ahead via linear regression)
function generatePrediction(wearHistory: { date: string; wearMm: number; qualityScore: number }[]) {
  const n = wearHistory.length;
  if (n < 2) return [];

  // Simple linear regression on wearMm
  const xVals = wearHistory.map((_, i) => i);
  const yVals = wearHistory.map(d => d.wearMm);
  const xMean = xVals.reduce((a, b) => a + b, 0) / n;
  const yMean = yVals.reduce((a, b) => a + b, 0) / n;
  const slope = xVals.reduce((acc, x, i) => acc + (x - xMean) * (yVals[i] - yMean), 0) /
    xVals.reduce((acc, x) => acc + (x - xMean) ** 2, 0);
  const intercept = yMean - slope * xMean;

  // Quality regression
  const qVals = wearHistory.map(d => d.qualityScore);
  const qMean = qVals.reduce((a, b) => a + b, 0) / n;
  const qSlope = xVals.reduce((acc, x, i) => acc + (x - xMean) * (qVals[i] - qMean), 0) /
    xVals.reduce((acc, x) => acc + (x - xMean) ** 2, 0);
  const qIntercept = qMean - qSlope * xMean;

  const predictions = [];
  for (let i = 1; i <= 3; i++) {
    const date = new Date(wearHistory[n - 1].date);
    date.setMonth(date.getMonth() + i);
    predictions.push({
      date: date.toISOString().slice(0, 10),
      wearMm: Math.round((slope * (n - 1 + i) + intercept) * 100) / 100,
      qualityScore: Math.max(0, Math.round((qSlope * (n - 1 + i) + qIntercept) * 10) / 10),
      predicted: true,
    });
  }
  return predictions;
}

// Combine actual + predicted data for each segment
const segmentsWithPrediction = segments.slice(0, 4).map(seg => {
  const predicted = generatePrediction(seg.wearHistory);
  return {
    ...seg,
    fullData: [
      ...seg.wearHistory.map(d => ({ ...d, predicted: false })),
      ...predicted,
    ],
    predicted,
  };
});

// Find the forecast zone boundary date
const forecastStartDate = segments[0]?.wearHistory[segments[0].wearHistory.length - 1]?.date;

const aiFeatures = [
  { icon: Brain, label: "AI Model", desc: "Deep Learning CNN trained on acoustic waveform signatures" },
  { icon: BarChart3, label: "ML Training", desc: "Supervised learning on labeled defect datasets (crack / fracture / wear)" },
  { icon: Sparkles, label: "Prediction", desc: "LSTM time-series model forecasts wear progression up to 90 days ahead" },
  { icon: Radio, label: "Input Features", desc: "Echo arrival time, amplitude delta, frequency dispersion, GPS location" },
  { icon: Tag, label: "Output Classes", desc: "Healthy / Wear Warning / Crack Detected / Fracture Critical" },
  { icon: Cog, label: "Inference", desc: "Edge-processed on sensor node, results synced via encrypted API" },
];

const CustomWearTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const isPredicted = payload[0]?.payload?.predicted;
  return (
    <div className="rounded border bg-card p-2 text-xs shadow-lg" style={{ borderColor: "hsl(225, 15%, 12%)" }}>
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.stroke }}>
          {p.name}: {p.value} mm
          {isPredicted && <span className="text-muted-foreground"> (±0.2mm confidence)</span>}
        </p>
      ))}
      {isPredicted && <p className="text-primary mt-1 font-medium">🔮 ML Predicted</p>}
    </div>
  );
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Predictive Analytics & Wear Trends</h1>
        <p className="text-sm text-muted-foreground">Rail degradation analysis and remaining useful life</p>
      </div>

      {/* AI & Prediction Engine Panel */}
      <Card className="border-primary/20 bg-card/80" style={{ boxShadow: "0 0 20px hsla(195, 100%, 50%, 0.08)" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI & Prediction Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiFeatures.map((feat) => (
              <div key={feat.label} className="flex items-start gap-3 p-3 rounded border border-border/40 bg-muted/30">
                <feat.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold font-mono text-foreground">{feat.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remaining Useful Life Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {segments.slice(0, 4).map(seg => {
          const wh = seg.wearHistory;
          const wearRate = wh.length > 1 ? (wh[wh.length - 1].wearMm - wh[0].wearMm) / wh.length : 0;
          const maxWear = 5;
          const remaining = wearRate > 0 ? Math.round((maxWear - wh[wh.length - 1].wearMm) / wearRate) : 99;
          return (
            <Card key={seg.id} className="border-border/60">
              <CardContent className="p-4 space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">{seg.name.split("—")[0].trim()}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-bold">{Math.max(0, remaining)}</span>
                  <span className="text-xs text-muted-foreground mb-1">months RUL</span>
                </div>
                <HealthBadge status={remaining > 12 ? "healthy" : remaining > 6 ? "warning" : "critical"} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Wear Progression with ML Prediction */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Wear Progression (mm)
            </CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">ML-Powered</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 12%)" />
                <XAxis
                  dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 50%)"
                  tickFormatter={(v: string) => v.slice(5)}
                  allowDuplicatedCategory={false}
                />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 50%)" />
                <Tooltip content={<CustomWearTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {/* Forecast zone shading */}
                {forecastStartDate && (
                  <ReferenceArea x1={forecastStartDate} fill="hsl(195, 100%, 50%)" fillOpacity={0.04}
                    label={{ value: "Forecast Zone", position: "insideTopRight", style: { fontSize: 10, fill: "hsl(195, 100%, 50%)" } }}
                  />
                )}
                {/* Actual data lines */}
                {segmentsWithPrediction.map((seg, i) => (
                  <Line key={seg.id} data={seg.wearHistory} type="monotone" dataKey="wearMm"
                    stroke={`hsl(var(--chart-${i + 1}))`} strokeWidth={2} dot={false}
                    name={seg.name.split("—")[0].trim().slice(0, 10)} />
                ))}
                {/* Predicted lines (dashed) */}
                {segmentsWithPrediction.map((seg, i) => {
                  const lastActual = seg.wearHistory[seg.wearHistory.length - 1];
                  const predData = [{ ...lastActual, predicted: true }, ...seg.predicted];
                  return (
                    <Line key={`${seg.id}-pred`} data={predData} type="monotone" dataKey="wearMm"
                      stroke={`hsl(var(--chart-${i + 1}))`} strokeWidth={2} strokeDasharray="6 3"
                      dot={{ r: 3 }} name={`${seg.name.split("—")[0].trim().slice(0, 8)} (pred)`}
                      legendType="none"
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quality Score Trend */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quality Score Trends
            </CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">ML-Powered</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 12%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 50%)"
                  tickFormatter={(v: string) => v.slice(5)} allowDuplicatedCategory={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 50%)" domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11, background: "hsl(225, 30%, 7%)", border: "1px solid hsl(225, 15%, 12%)" }} />
                <ReferenceLine y={60} stroke="hsl(38, 92%, 50%)" strokeDasharray="4 4" label={{ value: "Threshold", style: { fontSize: 9, fill: "hsl(38, 92%, 50%)" } }} />
                {segments.slice(0, 4).map((seg, i) => (
                  <Line key={seg.id} data={seg.wearHistory} type="monotone" dataKey="qualityScore"
                    stroke={`hsl(var(--chart-${i + 1}))`} strokeWidth={2} dot={false}
                    name={seg.name.split("—")[0].trim().slice(0, 10)} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Defect Frequency Comparison */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Defect Frequency by Segment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-56">
            <BarChart data={defectFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 12%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 50%)" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 50%)" allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="crack" fill="var(--color-crack)" radius={[2, 2, 0, 0]} stackId="a" />
              <Bar dataKey="fracture" fill="var(--color-fracture)" radius={[2, 2, 0, 0]} stackId="a" />
              <Bar dataKey="wear" fill="var(--color-wear)" radius={[2, 2, 0, 0]} stackId="a" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
