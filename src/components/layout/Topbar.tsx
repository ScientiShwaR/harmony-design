import { Search, Plus, Bell, Languages, Wifi, WifiOff, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface TopbarProps {
  onOpenSpotlight: () => void;
}

export function Topbar({ onOpenSpotlight }: TopbarProps) {
  const isOnline = true; // Would come from a hook in real implementation
  const pendingSync = 0; // Would track offline queue
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {profile?.full_name ? getInitials(profile.full_name) : <User className="size-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {roles.map(role => (
                      <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}