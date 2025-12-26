import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Upload, 
  FileCheck,
  Calendar,
  ChevronRight,
  Filter,
  Plus,
} from "lucide-react";

// Mock evidence pack data
const evidencePacks = [
  {
    id: 1,
    name: "Fire Safety Compliance",
    category: "Safety",
    dueDate: "2024-12-31",
    status: "in_progress",
    progress: 75,
    items: { total: 8, completed: 6 },
    owner: "Ramesh S.",
  },
  {
    id: 2,
    name: "Student Records - Class 5",
    category: "Academic",
    dueDate: "2024-12-15",
    status: "complete",
    progress: 100,
    items: { total: 12, completed: 12 },
    owner: "Priya M.",
  },
  {
    id: 3,
    name: "Staff Verification Documents",
    category: "HR",
    dueDate: "2024-12-20",
    status: "overdue",
    progress: 40,
    items: { total: 10, completed: 4 },
    owner: "Arun K.",
  },
  {
    id: 4,
    name: "Infrastructure Audit Q4",
    category: "Operations",
    dueDate: "2025-01-15",
    status: "not_started",
    progress: 0,
    items: { total: 15, completed: 0 },
    owner: "Sunita P.",
  },
  {
    id: 5,
    name: "Health & Hygiene Certificates",
    category: "Health",
    dueDate: "2024-12-28",
    status: "in_progress",
    progress: 60,
    items: { total: 5, completed: 3 },
    owner: "Dr. Kavitha",
  },
];

const statusConfig = {
  not_started: { label: "Not Started", badge: "secondary" as const, icon: Clock },
  in_progress: { label: "In Progress", badge: "warning" as const, icon: Clock },
  complete: { label: "Complete", badge: "success" as const, icon: CheckCircle2 },
  overdue: { label: "Overdue", badge: "destructive" as const, icon: AlertTriangle },
};

export default function EvidenceVaultPage() {
  const stats = {
    total: evidencePacks.length,
    complete: evidencePacks.filter(p => p.status === "complete").length,
    inProgress: evidencePacks.filter(p => p.status === "in_progress").length,
    overdue: evidencePacks.filter(p => p.status === "overdue").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Evidence Vault</h1>
            <p className="text-muted-foreground">
              Manage compliance documentation and evidence packs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 size-4" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              New Pack
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <FileCheck className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Packs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="size-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.complete}</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="size-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evidence Packs Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evidencePacks.map((pack) => {
            const config = statusConfig[pack.status];
            const StatusIcon = config.icon;
            const isOverdue = pack.status === "overdue";

            return (
              <Card 
                key={pack.id} 
                elevated 
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  isOverdue ? "border-destructive/50" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="mb-2">{pack.category}</Badge>
                      <CardTitle className="text-base">{pack.name}</CardTitle>
                    </div>
                    <Badge variant={config.badge}>
                      <StatusIcon className="mr-1 size-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{pack.progress}%</span>
                    </div>
                    <Progress 
                      value={pack.progress} 
                      className={`h-2 ${isOverdue ? "[&>div]:bg-destructive" : ""}`} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {pack.items.completed} of {pack.items.total} items complete
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>Due {new Date(pack.dueDate).toLocaleDateString("en-IN", { 
                        day: "numeric", 
                        month: "short" 
                      })}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      {pack.status === "complete" ? "View" : "Continue"}
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
