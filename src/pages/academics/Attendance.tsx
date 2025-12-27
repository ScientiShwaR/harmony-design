import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  CalendarIcon,
  Loader2,
  Check,
  X,
  Clock,
  FileText,
  Save,
  Users,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { executeCommand } from '@/core/commands/commandBus';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PermissionGate } from '@/core/rbac/PermissionGate';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  section: string | null;
  status: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export default function AttendancePage() {
  const { user, roles, permissions, isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [localAttendance, setLocalAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classFilter, setClassFilter] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, admission_number, first_name, last_name, class_id, section, status')
      .eq('status', 'active')
      .order('class_id')
      .order('first_name');

    if (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      return;
    }
    setStudents(data || []);
  };

  const fetchAttendance = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', dateStr);

    if (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
      return;
    }

    const attendanceMap = new Map<string, AttendanceRecord>();
    const localMap = new Map<string, AttendanceStatus>();
    
    (data || []).forEach((record) => {
      attendanceMap.set(record.student_id, record as AttendanceRecord);
      localMap.set(record.student_id, record.status as AttendanceStatus);
    });
    
    setAttendance(attendanceMap);
    setLocalAttendance(localMap);
    setHasChanges(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchStudents();
      await fetchAttendance(selectedDate);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalAttendance((prev) => {
      const newMap = new Map(prev);
      newMap.set(studentId, status);
      return newMap;
    });
    setHasChanges(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap = new Map<string, AttendanceStatus>();
    filteredStudents.forEach((student) => {
      newMap.set(student.id, status);
    });
    setLocalAttendance(newMap);
    setHasChanges(true);
  };

  const handleSaveAttendance = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const records = Array.from(localAttendance.entries()).map(([student_id, status]) => ({
        student_id,
        status,
      }));

      const result = await executeCommand(
        {
          type: 'attendance.mark',
          payload: {
            date: format(selectedDate, 'yyyy-MM-dd'),
            records,
          },
          reason: `Attendance marked for ${format(selectedDate, 'PPP')}`,
        },
        {
          userId: user.id,
          userRoles: roles,
          userPermissions: permissions,
          isAdmin,
        }
      );

      if (result.success) {
        toast.success(`Attendance saved for ${records.length} students`);
        await fetchAttendance(selectedDate);
      } else {
        toast.error(result.error || 'Failed to save attendance');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    return classFilter === 'all' || student.class_id === classFilter;
  });

  // Get unique classes
  const uniqueClasses = [...new Set(students.map(s => s.class_id).filter(Boolean))].sort();

  // Calculate stats
  const stats = {
    total: filteredStudents.length,
    present: Array.from(localAttendance.values()).filter(s => s === 'present').length,
    absent: Array.from(localAttendance.values()).filter(s => s === 'absent').length,
    late: Array.from(localAttendance.values()).filter(s => s === 'late').length,
    excused: Array.from(localAttendance.values()).filter(s => s === 'excused').length,
    unmarked: filteredStudents.length - localAttendance.size,
  };

  const getStatusIcon = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'present': return <Check className="size-4 text-green-600" />;
      case 'absent': return <X className="size-4 text-red-600" />;
      case 'late': return <Clock className="size-4 text-amber-600" />;
      case 'excused': return <FileText className="size-4 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusBadgeClass = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 border-green-200';
      case 'absent': return 'bg-red-100 text-red-700 border-red-200';
      case 'late': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'excused': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">
              Mark and manage daily attendance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 size-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <PermissionGate permission="attendance.mark">
              <Button 
                onClick={handleSaveAttendance} 
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save Attendance
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
                <Check className="size-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <X className="size-8 text-red-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Late</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                </div>
                <Clock className="size-8 text-amber-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unmarked</p>
                  <p className="text-2xl font-bold">{stats.unmarked}</p>
                </div>
                <div className="size-8 rounded-full border-2 border-dashed border-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map((c) => (
                      <SelectItem key={c} value={c!}>
                        Class {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <PermissionGate permission="attendance.mark">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mark all as:</span>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAll('present')}>
                    <Check className="mr-1 size-3" /> Present
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAll('absent')}>
                    <X className="mr-1 size-3" /> Absent
                  </Button>
                </div>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Student Attendance</CardTitle>
                <CardDescription>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} • {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="size-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No active students found. Add students first to mark attendance.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[200px]">Mark Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const currentStatus = localAttendance.get(student.id);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                            <span className="font-medium">
                              {student.first_name} {student.last_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {student.admission_number}
                        </TableCell>
                        <TableCell>
                          {student.class_id ? (
                            <span>{student.class_id}{student.section && `-${student.section}`}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {currentStatus ? (
                            <Badge 
                              variant="outline" 
                              className={cn('gap-1', getStatusBadgeClass(currentStatus))}
                            >
                              {getStatusIcon(currentStatus)}
                              {currentStatus}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Not marked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <PermissionGate 
                            permission="attendance.mark" 
                            fallback={
                              <span className="text-sm text-muted-foreground">
                                {currentStatus || 'N/A'}
                              </span>
                            }
                          >
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={currentStatus === 'present' ? 'default' : 'outline'}
                                className={cn(
                                  'size-8 p-0',
                                  currentStatus === 'present' && 'bg-green-600 hover:bg-green-700'
                                )}
                                onClick={() => handleStatusChange(student.id, 'present')}
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'absent' ? 'default' : 'outline'}
                                className={cn(
                                  'size-8 p-0',
                                  currentStatus === 'absent' && 'bg-red-600 hover:bg-red-700'
                                )}
                                onClick={() => handleStatusChange(student.id, 'absent')}
                              >
                                <X className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'late' ? 'default' : 'outline'}
                                className={cn(
                                  'size-8 p-0',
                                  currentStatus === 'late' && 'bg-amber-600 hover:bg-amber-700'
                                )}
                                onClick={() => handleStatusChange(student.id, 'late')}
                              >
                                <Clock className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'excused' ? 'default' : 'outline'}
                                className={cn(
                                  'size-8 p-0',
                                  currentStatus === 'excused' && 'bg-blue-600 hover:bg-blue-700'
                                )}
                                onClick={() => handleStatusChange(student.id, 'excused')}
                              >
                                <FileText className="size-4" />
                              </Button>
                            </div>
                          </PermissionGate>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
