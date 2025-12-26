import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { SpotlightSearch } from "./SpotlightSearch";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [spotlightOpen, setSpotlightOpen] = React.useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar onOpenSpotlight={() => setSpotlightOpen(true)} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
      <SpotlightSearch open={spotlightOpen} onOpenChange={setSpotlightOpen} />
    </SidebarProvider>
  );
}
