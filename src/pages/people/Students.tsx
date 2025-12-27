import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal,
  ChevronDown,
  GraduationCap,
  Loader2,
  Trash2,
  Pencil,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { executeCommand } from '@/core/commands/commandBus';
import { StudentFormDialog, type StudentFormData } from '@/components/students/StudentFormDialog';
import { toast } from 'sonner';
import { PermissionGate } from '@/core/rbac/PermissionGate';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id: string | null;
  section: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string | null;
  address: string | null;
  blood_group: string | null;
  medical_notes: string | null;
  status: string;
  admission_date: string;
  created_at: string;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string | null;
}

export default function StudentsPage() {
  const { user, roles, permissions, isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Form dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Fetch classes for display
  const { data: classesMap = {} } = useQuery({
    queryKey: ['classes-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('is_active', true);

      if (error) throw error;
      
      const map: Record<string, ClassInfo> = {};
      data?.forEach((c) => {
        map[c.id] = c;
      });
      return map;
    },
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = () => {
    setEditingStudent(null);
    setDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: StudentFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const result = await executeCommand(
        {
          type: editingStudent ? 'student.update' : 'student.create',
          payload: data,
          entityRef: editingStudent ? { type: 'student', id: editingStudent.id } : undefined,
          reason: editingStudent ? 'Updated student details' : 'New student admission',
        },
        {
          userId: user.id,
          userRoles: roles,
          userPermissions: permissions,
          isAdmin,
        }
      );

      if (result.success) {
        toast.success(editingStudent ? 'Student updated successfully' : 'Student added successfully');
        setDialogOpen(false);
        fetchStudents();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !studentToDelete) return;

    try {
      const result = await executeCommand(
        {
          type: 'student.delete',
          payload: { id: studentToDelete.id },
          entityRef: { type: 'student', id: studentToDelete.id },
          reason: 'Student record deleted',
        },
        {
          userId: user.id,
          userRoles: roles,
          userPermissions: permissions,
          isAdmin,
        }
      );

      if (result.success) {
        toast.success('Student deleted successfully');
        fetchStudents();
      } else {
        toast.error(result.error || 'Failed to delete student');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      searchQuery === '' ||
      student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesClass = classFilter === 'all' || student.class_id === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  // Get unique classes for filter
  const uniqueClasses = [...new Set(students.map(s => s.class_id).filter(Boolean))].sort();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'transferred': return 'outline';
      case 'graduated': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">
              Manage student records and information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Export
            </Button>
            <PermissionGate permission="students.write">
              <Button size="sm" onClick={handleAddStudent}>
                <Plus className="mr-2 size-4" />
                Add Student
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, admission number..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 size-4" />
                      Class
                      <ChevronDown className="ml-2 size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setClassFilter('all')}>
                      All Classes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {uniqueClasses.map((c) => (
                      <DropdownMenuItem key={c} onClick={() => setClassFilter(c!)}>
                        Class {c}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status
                      <ChevronDown className="ml-2 size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                      Inactive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('transferred')}>
                      Transferred
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('graduated')}>
                      Graduated
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">All Students</CardTitle>
                <CardDescription>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
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
                <GraduationCap className="size-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {students.length === 0
                    ? 'No students added yet. Click "Add Student" to get started.'
                    : 'No students match your search criteria.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
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
                        {student.class_id && classesMap[student.class_id] ? (
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="size-4 text-muted-foreground" />
                            <span>{classesMap[student.class_id].name}</span>
                            {classesMap[student.class_id].section && (
                              <Badge variant="secondary" className="text-xs">
                                {classesMap[student.class_id].section}
                              </Badge>
                            )}
                          </div>
                        ) : student.class_id ? (
                          <span className="text-muted-foreground text-sm">{student.class_id}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(student.date_of_birth).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm">{student.guardian_name}</p>
                          <p className="text-xs text-muted-foreground">{student.guardian_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <PermissionGate permission="students.write">
                              <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                <Pencil className="mr-2 size-4" />
                                Edit Details
                              </DropdownMenuItem>
                            </PermissionGate>
                            <DropdownMenuSeparator />
                            <PermissionGate permission="students.write">
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(student)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={editingStudent}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {studentToDelete?.first_name} {studentToDelete?.last_name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
