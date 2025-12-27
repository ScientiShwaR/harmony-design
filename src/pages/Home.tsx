import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  ClipboardList,
  ShieldCheck,
  Loader2,
  Briefcase,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "accent";
  isLoading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default", isLoading }: StatCardProps) {
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
    <Card className={bgClass}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${variant !== "default" ? "opacity-90" : "text-muted-foreground"}`}>
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <>
                  <span className="text-3xl font-bold tracking-tight">{value}</span>
                  {subtitle && (
                    <span className={`text-sm ${variant !== "default" ? "opacity-75" : "text-muted-foreground"}`}>
                      {subtitle}
                    </span>
                  )}
                </>
              )}
            </div>
            {trend && !isLoading && (
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
      <Card className="group cursor-pointer transition-all hover:border-primary/50">
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

// Activity Item
interface ActivityItemProps {
  action: string;
  target: string;
  time: string;
  user: string;
}

function ActivityItem({ action, target, time, user }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 size-2 rounded-full bg-primary" />
      <div className="flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{action}</span>
          {" · "}
          <span className="text-muted-foreground">{target}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {user} · {time}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalStaff: 0,
    activeStaff: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    action: string;
    target: string;
    time: string;
    user: string;
  }>>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      try {
        // Fetch student counts
        const { count: totalStudents } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        const { count: activeStudents } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch staff counts
        const { count: totalStaff } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true });

        const { count: activeStaff } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch today's attendance
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', today);

        const presentToday = attendanceData?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
        const absentToday = attendanceData?.filter(a => a.status === 'absent').length || 0;
        const totalMarked = attendanceData?.length || 0;
        const attendanceRate = totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 0;

        // Fetch recent audit events for activity feed
        const { data: auditEvents } = await supabase
          .from('audit_events')
          .select('id, command_type, entity_type, entity_id, created_at, actor_user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        // Get user profiles for audit events
        const actorIds = [...new Set(auditEvents?.map(e => e.actor_user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', actorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        const activity = auditEvents?.map(event => {
          const actionMap: Record<string, string> = {
            'student.create': 'Added student',
            'student.update': 'Updated student',
            'student.delete': 'Deleted student',
            'staff.create': 'Added staff member',
            'staff.update': 'Updated staff member',
            'staff.delete': 'Deleted staff member',
            'attendance.mark': 'Marked attendance',
            'attendance.edit': 'Edited attendance',
            'policy.update': 'Updated policy',
            'user.role.assign': 'Assigned role',
            'user.role.remove': 'Removed role',
          };

          const timeDiff = Date.now() - new Date(event.created_at).getTime();
          const minutes = Math.floor(timeDiff / 60000);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          let timeAgo = 'Just now';
          if (days > 0) timeAgo = `${days}d ago`;
          else if (hours > 0) timeAgo = `${hours}h ago`;
          else if (minutes > 0) timeAgo = `${minutes}m ago`;

          return {
            id: event.id,
            action: actionMap[event.command_type] || event.command_type,
            target: event.entity_type,
            time: timeAgo,
            user: profileMap.get(event.actor_user_id) || 'System',
          };
        }) || [];

        setStats({
          totalStudents: totalStudents || 0,
          activeStudents: activeStudents || 0,
          totalStaff: totalStaff || 0,
          activeStaff: activeStaff || 0,
          presentToday,
          absentToday,
          attendanceRate,
        });

        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}, {firstName}</h1>
          <p className="text-muted-foreground">
            Here's what's happening today, {format(new Date(), 'EEEE, MMMM d')}.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={stats.activeStudents}
            subtitle={`of ${stats.totalStudents}`}
            icon={GraduationCap}
            variant="primary"
            isLoading={isLoading}
          />
          <StatCard
            title="Today's Attendance"
            value={stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : '—'}
            subtitle={stats.presentToday > 0 ? `${stats.presentToday} present` : undefined}
            icon={CalendarCheck}
            isLoading={isLoading}
          />
          <StatCard
            title="Active Staff"
            value={stats.activeStaff}
            subtitle={`of ${stats.totalStaff}`}
            icon={Briefcase}
            isLoading={isLoading}
          />
          <StatCard
            title="Absent Today"
            value={stats.absentToday}
            icon={AlertTriangle}
            variant={stats.absentToday > 0 ? "accent" : "default"}
            isLoading={isLoading}
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
                title="Manage Staff"
                description="View and manage staff"
                icon={Briefcase}
                href="/people/staff"
              />
              <QuickAction
                title="View Audit Log"
                description="Review system activity"
                icon={FileCheck}
                href="/settings/audit"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's Summary</CardTitle>
              <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Attendance Marked</span>
                  <span className="font-medium">{stats.presentToday + stats.absentToday} students</span>
                </div>
                {stats.attendanceRate > 0 && (
                  <Progress value={stats.attendanceRate} className="h-2" />
                )}
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-600" />
                    <span>Present</span>
                  </div>
                  <span className="font-medium">{stats.presentToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-red-600" />
                    <span>Absent</span>
                  </div>
                  <span className="font-medium">{stats.absentToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-primary" />
                    <span>Active Students</span>
                  </div>
                  <span className="font-medium">{stats.activeStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-primary" />
                    <span>Active Staff</span>
                  </div>
                  <span className="font-medium">{stats.activeStaff}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/academics/attendance">
                  Mark Attendance
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest actions from the audit log</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity to display
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} {...activity} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
