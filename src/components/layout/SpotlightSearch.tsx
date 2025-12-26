import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Users,
  GraduationCap,
  ClipboardList,
  FileText,
  Settings,
  UserPlus,
  CalendarCheck,
  FileCheck,
  AlertTriangle,
  Search,
  Clock,
  Star,
} from "lucide-react";

interface SpotlightSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "navigation" | "command" | "record" | "recent";
  action: () => void;
}

export function SpotlightSearch({ open, onOpenChange }: SpotlightSearchProps) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");

  // Mock data - in real app, this would come from search index
  const recentItems: SearchItem[] = [
    {
      id: "recent-1",
      title: "Aarav Sharma",
      subtitle: "Class 5A • Student",
      icon: Users,
      type: "recent",
      action: () => navigate("/people/students/1"),
    },
    {
      id: "recent-2",
      title: "Today's Attendance",
      subtitle: "Class 5A",
      icon: CalendarCheck,
      type: "recent",
      action: () => navigate("/academics/attendance"),
    },
  ];

  const navigationItems: SearchItem[] = [
    {
      id: "nav-home",
      title: "Home",
      subtitle: "Dashboard overview",
      icon: Home,
      type: "navigation",
      action: () => navigate("/"),
    },
    {
      id: "nav-students",
      title: "Students",
      subtitle: "People → Students",
      icon: Users,
      type: "navigation",
      action: () => navigate("/people/students"),
    },
    {
      id: "nav-attendance",
      title: "Attendance",
      subtitle: "Academics → Attendance",
      icon: CalendarCheck,
      type: "navigation",
      action: () => navigate("/academics/attendance"),
    },
    {
      id: "nav-evidence",
      title: "Evidence Vault",
      subtitle: "Compliance → Evidence",
      icon: FileCheck,
      type: "navigation",
      action: () => navigate("/compliance/evidence"),
    },
    {
      id: "nav-exceptions",
      title: "Exceptions",
      subtitle: "Work → Exceptions",
      icon: AlertTriangle,
      type: "navigation",
      action: () => navigate("/work/exceptions"),
    },
  ];

  const commandItems: SearchItem[] = [
    {
      id: "cmd-new-student",
      title: "Add New Student",
      subtitle: "Create a new student record",
      icon: UserPlus,
      type: "command",
      action: () => {
        navigate("/people/students?action=new");
        onOpenChange(false);
      },
    },
    {
      id: "cmd-mark-attendance",
      title: "Mark Attendance",
      subtitle: "Open attendance marking for today",
      icon: CalendarCheck,
      type: "command",
      action: () => {
        navigate("/academics/attendance?action=mark");
        onOpenChange(false);
      },
    },
    {
      id: "cmd-new-certificate",
      title: "Issue Certificate",
      subtitle: "Generate a new certificate",
      icon: FileText,
      type: "command",
      action: () => {
        navigate("/academics/certificates?action=new");
        onOpenChange(false);
      },
    },
  ];

  const handleSelect = (item: SearchItem) => {
    item.action();
    onOpenChange(false);
    setSearch("");
  };

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search students, staff, commands..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6">
            <Search className="size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No results found</p>
            <p className="text-xs text-muted-foreground">Try a different search term</p>
          </div>
        </CommandEmpty>

        {!search && (
          <CommandGroup heading="Recent">
            {recentItems.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(item)}
                className="gap-3"
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <item.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  )}
                </div>
                <Clock className="ml-auto size-3 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {commandItems.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => handleSelect(item)}
              className="gap-3"
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-accent/10">
                <item.icon className="size-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span>{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => handleSelect(item)}
              className="gap-3"
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span>{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
