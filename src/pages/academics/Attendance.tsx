import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Clock,
  Save,
} from "lucide-react";
import { useState } from "react";

// Mock class data
const classData = {
  name: "Class 5A",
  teacher: "Priya Menon",
  totalStudents: 32,
};

// Mock students for attendance
const students = [
  { id: 1, name: "Aarav Sharma", rollNo: "01", status: "present" },
  { id: 2, name: "Ananya Patel", rollNo: "02", status: "present" },
  { id: 3, name: "Arjun Reddy", rollNo: "03", status: "absent" },
  { id: 4, name: "Diya Gupta", rollNo: "04", status: "present" },
  { id: 5, name: "Ishaan Kumar", rollNo: "05", status: "present" },
  { id: 6, name: "Kavya Nair", rollNo: "06", status: "present" },
  { id: 7, name: "Lakshmi Rao", rollNo: "07", status: "present" },
  { id: 8, name: "Manish Verma", rollNo: "08", status: "late" },
  { id: 9, name: "Neha Singh", rollNo: "09", status: "present" },
  { id: 10, name: "Om Prakash", rollNo: "10", status: "present" },
  { id: 11, name: "Priya Sharma", rollNo: "11", status: "absent" },
  { id: 12, name: "Rahul Kumar", rollNo: "12", status: "present" },
];

type AttendanceStatus = "present" | "absent" | "late" | "unmarked";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>(
    students.reduce((acc, s) => ({ ...acc, [s.id]: s.status as AttendanceStatus }), {})
  );
  const [selectedDate] = useState(new Date());

  const stats = {
    present: Object.values(attendance).filter(s => s === "present").length,
    absent: Object.values(attendance).filter(s => s === "absent").length,
    late: Object.values(attendance).filter(s => s === "late").length,
  };

  const toggleStatus = (studentId: number) => {
    const currentStatus = attendance[studentId];
    const nextStatus: AttendanceStatus = 
      currentStatus === "present" ? "absent" :
      currentStatus === "absent" ? "late" :
      "present";
    setAttendance(prev => ({ ...prev, [studentId]: nextStatus }));
  };

  const markAllPresent = () => {
    setAttendance(students.reduce((acc, s) => ({ ...acc, [s.id]: "present" as AttendanceStatus }), {}));
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">
              Mark daily attendance for classes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllPresent}>
              <Check className="mr-2 size-4" />
              Mark All Present
            </Button>
            <Button size="sm">
              <Save className="mr-2 size-4" />
              Save & Submit
            </Button>
          </div>
        </div>

        {/* Date & Class Selector */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon-sm">
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedDate.toLocaleDateString("en-IN", { 
                      weekday: "short",
                      day: "numeric", 
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
                <Button variant="outline" size="icon-sm">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
                <Users className="size-4 text-primary" />
                <span className="font-medium text-primary">{classData.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {classData.teacher} • {classData.totalStudents} students
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-success/5 border-success/20">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-success/10">
                  <Check className="size-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-success/20">P</span>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                  <X className="size-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-destructive/20">A</span>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-warning/10">
                  <Clock className="size-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.late}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-warning/20">L</span>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Grid */}
        <Card elevated>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mark Attendance</CardTitle>
            <CardDescription>Click on a student to toggle their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {students.map((student) => {
                const status = attendance[student.id];
                const statusConfig = {
                  present: { bg: "bg-success/10 border-success/30 hover:bg-success/20", icon: Check, iconColor: "text-success" },
                  absent: { bg: "bg-destructive/10 border-destructive/30 hover:bg-destructive/20", icon: X, iconColor: "text-destructive" },
                  late: { bg: "bg-warning/10 border-warning/30 hover:bg-warning/20", icon: Clock, iconColor: "text-warning" },
                  unmarked: { bg: "bg-muted hover:bg-muted/80", icon: null, iconColor: "" },
                };
                const config = statusConfig[status] || statusConfig.unmarked;
                const Icon = config.icon;

                return (
                  <button
                    key={student.id}
                    onClick={() => toggleStatus(student.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${config.bg}`}
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-background font-medium text-sm">
                      {student.rollNo}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{status}</p>
                    </div>
                    {Icon && <Icon className={`size-5 ${config.iconColor}`} />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
