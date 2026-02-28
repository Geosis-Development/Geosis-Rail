import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-11 flex items-center border-b bg-card px-2 shrink-0">
            <SidebarTrigger className="text-muted-foreground" />
            <span className="ml-3 text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Acoustic Wave Rail Monitoring System
            </span>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
