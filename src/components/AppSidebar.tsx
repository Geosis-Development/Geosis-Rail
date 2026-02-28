import {
  LayoutDashboard, Activity, AlertTriangle, TrendingUp, Radio
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { getMockData } from "@/data/mockData";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Waveform Monitor", url: "/waveform", icon: Activity },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "Predictive Analytics", url: "/analytics", icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { summary, sensors } = getMockData();

  const onlineSensors = sensors.filter(s => s.online).length;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <Activity className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-wide">
                RAIL MONITOR
              </h1>
              <p className="text-[10px] text-sidebar-foreground uppercase tracking-widest">
                Acoustic Wave System
              </p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-[10px] uppercase tracking-widest">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.url === "/alerts" && summary.criticalAlerts > 0 && (
                        <Badge className="ml-auto bg-status-critical text-status-critical-foreground text-[10px] px-1.5 py-0">
                          {summary.criticalAlerts}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <Radio className={`h-3.5 w-3.5 shrink-0 ${onlineSensors > 0 ? "text-status-healthy" : "text-status-critical"}`} />
          {!collapsed && (
            <span className="text-xs text-sidebar-foreground">
              {onlineSensors}/{sensors.length} sensors online
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
