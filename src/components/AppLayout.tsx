import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { PatrioticBackground } from "./PatrioticBackground";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <PatrioticBackground />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
