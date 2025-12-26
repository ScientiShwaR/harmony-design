import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  TrendingUp,
  ArrowRight,
  BookOpen,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "accent";
}

function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const bgClass = variant === "primary" 
    ? "bg-primary text-primary-foreground" 
    : variant === "accent" 
    ? "bg-accent text-accent-foreground"
    : "bg-card";
  
  const iconBgClass = variant === "default" 
    ? "bg-muted" 
    : variant === "primary"
    ? "bg-primary-foreground/10"
    : "bg-accent-foreground/10";

  return (
    <Card elevated className={bgClass}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${variant !== "default" ? "opacity-90" : "text-muted-foreground"}`}>
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {subtitle && (
                <span className={`text-sm ${variant !== "default" ? "opacity-75" : "text-muted-foreground"}`}>
                  {subtitle}
                </span>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                <TrendingUp className="size-3" />
                <span className="text-xs">
                  {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-xl p-3 ${iconBgClass}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Button
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function QuickAction({ title, description, icon: Icon, href }: QuickActionProps) {
  return (
    <Link to={href}>
      <Card elevated className="group cursor-pointer transition-all hover:border-primary/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{title}</p>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </CardContent>
      </Card>
    </Link>
  );
}

// Exception Item
interface ExceptionItemProps {
  title: string;
  description: string;
  type: "warning" | "error" | "info";
  time: string;
  action: string;
  href: string;
}

function ExceptionItem({ title, description, type, time, action, href }: ExceptionItemProps) {
  const typeConfig = {
    warning: { badge: "warning" as const, icon: Clock },
    error: { badge: "destructive" as const, icon: AlertTriangle },
    info: { badge: "info" as const, icon: FileCheck },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
      <div className={`mt-0.5 rounded-lg p-2 ${
        type === "warning" ? "bg-warning/10" : 
        type === "error" ? "bg-destructive/10" : 
        "bg-info/10"
      }`}>
        <Icon className={`size-4 ${
          type === "warning" ? "text-warning" : 
          type === "error" ? "text-destructive" : 
          "text-info"
        }`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{title}</p>
          <Badge variant={config.badge}>{time}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to={href}>{action}</Link>
      </Button>
    </div>
  );
}

export default function HomePage() {
  // Mock data - would come from data store in real app
  const stats = {
    totalStudents: 423,
    presentToday: 398,
    attendanceRate: 94.1,
    pendingApprovals: 7,
    overdueExceptions: 3,
    complianceScore: 87,
  };

  const recentActivity = [
    { id: 1, action: "Attendance marked", target: "Class 5A", time: "10 min ago", user: "Priya M." },
    { id: 2, action: "Certificate issued", target: "Transfer Certificate #TC-2024-089", time: "25 min ago", user: "Arun K." },
    { id: 3, action: "Evidence uploaded", target: "Fire Safety Drill - Dec 2024", time: "1 hour ago", user: "Ramesh S." },
    { id: 4, action: "Report card generated", target: "Class 4B - Term 2", time: "2 hours ago", user: "Sunita P." },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Good morning, Arun</h1>
          <p className="text-muted-foreground">
            Here's what's happening at Kamal Vidyalaya today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Students Present"
            value={stats.presentToday}
            subtitle={`of ${stats.totalStudents}`}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            icon={CalendarCheck}
            trend={{ value: 2.1, label: "vs last week" }}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={ClipboardList}
          />
          <StatCard
            title="Compliance Score"
            value={`${stats.complianceScore}%`}
            icon={ShieldCheck}
            variant="accent"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction
                title="Mark Attendance"
                description="Record today's attendance"
                icon={CalendarCheck}
                href="/academics/attendance"
              />
              <QuickAction
                title="Add Student"
                description="Register new student"
                icon={Users}
                href="/people/students"
              />
              <QuickAction
                title="Issue Certificate"
                description="Generate certificates"
                icon={GraduationCap}
                href="/academics/certificates"
              />
              <QuickAction
                title="Evidence Vault"
                description="Upload compliance docs"
                icon={FileCheck}
                href="/compliance/evidence"
              />
            </div>
          </div>

          {/* Compliance Readiness */}
          <Card elevated>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compliance Readiness</CardTitle>
              <CardDescription>Evidence pack status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{stats.complianceScore}%</span>
                </div>
                <Progress value={stats.complianceScore} className="h-2" />
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" />
                    <span>Complete</span>
                  </div>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-warning" />
                    <span>In Progress</span>
                  </div>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-destructive" />
                    <span>Overdue</span>
                  </div>
                  <span className="font-medium">{stats.overdueExceptions}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/compliance/evidence">
                  View All Packs
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Exceptions & Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Exceptions */}
          <Card elevated>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Exceptions</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </div>
              <Badge variant="destructive">{stats.overdueExceptions}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <ExceptionItem
                title="Chronic Absenteeism Alert"
                description="3 students absent >20% this month"
                type="error"
                time="Action needed"
                action="Review"
                href="/work/exceptions"
              />
              <ExceptionItem
                title="Fire Drill Evidence Due"
                description="Q4 fire drill documentation pending"
                type="warning"
                time="Due in 3 days"
                action="Upload"
                href="/compliance/evidence"
              />
              <ExceptionItem
                title="Pending Leave Approval"
                description="2 staff leave requests awaiting approval"
                type="info"
                time="2 pending"
                action="Approve"
                href="/work/approvals"
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card elevated>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest actions across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1 size-2 rounded-full bg-primary" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span>
                        {" · "}
                        <span className="text-muted-foreground">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} · {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
