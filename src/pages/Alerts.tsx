import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMockData } from "@/data/mockData";
import { SeverityBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { AlertSeverity, AlertStatus } from "@/data/types";

const { alerts, segments } = getMockData();

const statusStyles: Record<AlertStatus, string> = {
  new: "bg-status-critical/15 text-status-critical border-status-critical/30",
  acknowledged: "bg-status-warning/15 text-status-warning border-status-warning/30",
  resolved: "bg-status-healthy/15 text-status-healthy border-status-healthy/30",
};

export default function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const filtered = alerts.filter(a =>
    (filterSeverity === "all" || a.severity === filterSeverity) &&
    (filterStatus === "all" || a.status === filterStatus) &&
    (filterType === "all" || a.type === filterType)
  );

  const detail = alerts.find(a => a.id === selectedAlert);
  const detailSeg = detail ? segments.find(s => s.id === detail.segmentId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Defect Detection & Alerts</h1>
        <p className="text-sm text-muted-foreground">{alerts.length} total alerts — {alerts.filter(a => a.status === "new").length} new</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="crack">Crack</SelectItem>
            <SelectItem value="fracture">Fracture</SelectItem>
            <SelectItem value="wear">Wear</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Alert Table */}
        <Card className="lg:col-span-2 border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Time</TableHead>
                  <TableHead className="text-[11px]">Location</TableHead>
                  <TableHead className="text-[11px]">Type</TableHead>
                  <TableHead className="text-[11px]">Severity</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(alert => {
                  const seg = segments.find(s => s.id === alert.segmentId);
                  return (
                    <TableRow key={alert.id}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedAlert(alert.id)}
                      data-state={selectedAlert === alert.id ? "selected" : undefined}
                    >
                      <TableCell className="font-mono text-[11px]">
                        {new Date(alert.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>{seg?.name ?? alert.segmentId}</TableCell>
                      <TableCell className="capitalize">{alert.type}</TableCell>
                      <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusStyles[alert.status]}`}>
                          {alert.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No alerts match filters</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alert Detail */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alert Detail
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!detail ? (
              <p className="text-sm text-muted-foreground">Select an alert from the table</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={detail.severity} />
                  <Badge variant="outline" className={statusStyles[detail.status]}>{detail.status}</Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p><span className="text-muted-foreground">Segment:</span> {detailSeg?.name}</p>
                  <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{detail.type}</span></p>
                  <p><span className="text-muted-foreground">Location:</span> KM {detail.locationKm}</p>
                  <p><span className="text-muted-foreground">Sensor:</span> {detail.sensorId}</p>
                  <p><span className="text-muted-foreground">Time:</span> {new Date(detail.timestamp).toLocaleString()}</p>
                </div>
                <div className="p-2 rounded border bg-muted/30 text-xs">
                  <p className="font-medium mb-1">Recommended Action</p>
                  <p className="text-muted-foreground">{detail.recommendedAction}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
