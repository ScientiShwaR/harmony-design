import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User,
  Calendar,
  ChevronRight,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

// Mock data
const tasks = [
  {
    id: 1,
    title: "Complete Class 5A attendance verification",
    description: "Review and confirm attendance records for December",
    priority: "high",
    dueDate: "2024-12-27",
    assignedBy: "Arun Kumar",
    category: "Attendance",
  },
  {
    id: 2,
    title: "Upload fire drill evidence",
    description: "Add photos and sign-off sheet for Q4 drill",
    priority: "medium",
    dueDate: "2024-12-28",
    assignedBy: "System",
    category: "Compliance",
  },
  {
    id: 3,
    title: "Review new student applications",
    description: "3 pending applications for Class 4",
    priority: "low",
    dueDate: "2024-12-30",
    assignedBy: "Office",
    category: "Admissions",
  },
];

const approvals = [
  {
    id: 1,
    title: "Leave Request - Priya Menon",
    description: "Casual leave for 2 days (Dec 28-29)",
    type: "leave",
    requestedBy: "Priya Menon",
    requestedAt: "2024-12-25",
  },
  {
    id: 2,
    title: "Expense Claim - Lab Equipment",
    description: "₹15,450 for science lab materials",
    type: "expense",
    requestedBy: "Ramesh S.",
    requestedAt: "2024-12-24",
  },
];

const exceptions = [
  {
    id: 1,
    title: "Chronic Absenteeism - Arjun Reddy",
    description: "Student has been absent for >20% of this month",
    severity: "high",
    detectedAt: "2024-12-20",
    action: "Contact parent",
  },
  {
    id: 2,
    title: "Overdue Evidence Pack",
    description: "Staff Verification Documents pack is overdue",
    severity: "medium",
    detectedAt: "2024-12-21",
    action: "Upload documents",
  },
  {
    id: 3,
    title: "Low Stock Alert",
    description: "Chalk and markers below minimum threshold",
    severity: "low",
    detectedAt: "2024-12-23",
    action: "Create PR",
  },
];

const priorityConfig = {
  high: { color: "text-destructive", bg: "bg-destructive/10" },
  medium: { color: "text-warning", bg: "bg-warning/10" },
  low: { color: "text-info", bg: "bg-info/10" },
};

const severityConfig = {
  high: { badge: "destructive" as const, icon: AlertTriangle },
  medium: { badge: "warning" as const, icon: Clock },
  low: { badge: "info" as const, icon: Clock },
};

export default function WorkPage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Work</h1>
          <p className="text-muted-foreground">
            Tasks, approvals, and exceptions requiring your attention
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card elevated className="border-l-4 border-l-primary">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <CheckCircle2 className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card elevated className="border-l-4 border-l-warning">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-warning/10">
                <FileText className="size-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvals.length}</p>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
            </CardContent>
          </Card>
          <Card elevated className="border-l-4 border-l-destructive">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="size-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exceptions.length}</p>
                <p className="text-sm text-muted-foreground">Exceptions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">
              My Tasks
              <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              <Badge variant="secondary" className="ml-2">{approvals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="exceptions">
              Exceptions
              <Badge variant="destructive" className="ml-2">{exceptions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-3">
            {tasks.map((task) => {
              const config = priorityConfig[task.priority as keyof typeof priorityConfig];
              return (
                <Card key={task.id} elevated className="cursor-pointer hover:border-primary/50 transition-all">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`size-2 rounded-full ${config.bg} ${config.color}`} 
                         style={{ boxShadow: `0 0 8px currentColor` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{task.title}</p>
                        <Badge variant="outline">{task.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Due {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {task.assignedBy}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Start
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-3">
            {approvals.map((approval) => (
              <Card key={approval.id} elevated className="cursor-pointer hover:border-primary/50 transition-all">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-medium">
                    {approval.requestedBy.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{approval.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{approval.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requested {new Date(approval.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Reject</Button>
                    <Button size="sm">Approve</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-3">
            {exceptions.map((exception) => {
              const config = severityConfig[exception.severity as keyof typeof severityConfig];
              const Icon = config.icon;
              return (
                <Card 
                  key={exception.id} 
                  elevated 
                  className={`cursor-pointer hover:border-primary/50 transition-all ${
                    exception.severity === "high" ? "border-destructive/50" : ""
                  }`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex size-10 items-center justify-center rounded-xl ${
                      exception.severity === "high" ? "bg-destructive/10" :
                      exception.severity === "medium" ? "bg-warning/10" : "bg-info/10"
                    }`}>
                      <Icon className={`size-5 ${
                        exception.severity === "high" ? "text-destructive" :
                        exception.severity === "medium" ? "text-warning" : "text-info"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{exception.title}</p>
                        <Badge variant={config.badge}>
                          {exception.severity.charAt(0).toUpperCase() + exception.severity.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{exception.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Detected {new Date(exception.detectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <Button size="sm">
                      {exception.action}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
