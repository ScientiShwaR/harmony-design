import { Search, Plus, Bell, Languages, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TopbarProps {
  onOpenSpotlight: () => void;
}

export function Topbar({ onOpenSpotlight }: TopbarProps) {
  const isOnline = true; // Would come from a hook in real implementation
  const pendingSync = 0; // Would track offline queue

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Spotlight Search Trigger */}
      <Button
        variant="outline"
        onClick={onOpenSpotlight}
        className="relative h-9 w-full max-w-sm justify-start gap-2 text-sm text-muted-foreground md:w-64 lg:w-80"
      >
        <Search className="size-4" />
        <span className="hidden lg:inline-flex">Search anything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {/* Sync Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative">
              {isOnline ? (
                <Wifi className="size-4 text-success" />
              ) : (
                <WifiOff className="size-4 text-warning" />
              )}
              {pendingSync > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                  {pendingSync}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline 
              ? pendingSync > 0 
                ? `${pendingSync} items syncing...` 
                : "All synced"
              : "Offline mode"
            }
          </TooltipContent>
        </Tooltip>

        {/* Language Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <Languages className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Switch language</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative">
              <Bell className="size-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                3
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Quick Create */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" className="bg-primary hover:bg-primary/90">
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Quick create</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
