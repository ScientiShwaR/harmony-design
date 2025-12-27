import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Search, ClipboardList, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PermissionGate } from '@/core/rbac/PermissionGate';
import { AssessmentFormDialog } from '@/components/assessments/AssessmentFormDialog';
import { GradesDialog } from '@/components/assessments/GradesDialog';

interface Assessment {
  id: string;
  name: string;
  description: string | null;
  class_id: string;
  subject: string;
  assessment_type: string;
  max_marks: number;
  passing_marks: number;
  assessment_date: string | null;
  is_active: boolean;
}

interface ClassData {
  id: string;
  name: string;
  section: string | null;
}

export default function AssessmentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGradesOpen, setIsGradesOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch assessments
  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('is_active', true)
        .order('assessment_date', { ascending: false });
      if (error) throw error;
      return data as Assessment[];
    },
  });

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as ClassData[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string | null;
      class_id: string;
      subject: string;
      assessment_type: string;
      max_marks: number;
      passing_marks: number;
      assessment_date: string | null;
    }) => {
      const { error } = await supabase.from('assessments').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment created successfully');
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create assessment');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Assessment> }) => {
      const { error } = await supabase
        .from('assessments')
        .update({
          ...data,
          assessment_date: data.assessment_date || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment updated successfully');
      setIsDialogOpen(false);
      setEditingAssessment(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update assessment');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assessments')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment deleted successfully');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete assessment');
    },
  });

  const filteredAssessments = assessments?.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassName = (classId: string) => {
    const cls = classes?.find((c) => c.id === classId);
    if (!cls) return 'Unknown';
    return cls.section ? `${cls.name} - ${cls.section}` : cls.name;
  };

  const handleCreate = () => {
    setEditingAssessment(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setIsDialogOpen(true);
  };

  const handleGrades = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsGradesOpen(true);
  };

  const handleSubmit = (data: {
    name: string;
    description?: string;
    class_id: string;
    subject: string;
    assessment_type: string;
    max_marks: number;
    passing_marks: number;
    assessment_date?: Date;
  }) => {
    const payload = {
      name: data.name,
      description: data.description || null,
      class_id: data.class_id,
      subject: data.subject,
      assessment_type: data.assessment_type,
      max_marks: data.max_marks,
      passing_marks: data.passing_marks,
      assessment_date: data.assessment_date
        ? format(data.assessment_date, 'yyyy-MM-dd')
        : null,
    };

    if (editingAssessment) {
      updateMutation.mutate({ id: editingAssessment.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
            <p className="text-muted-foreground">
              Manage exams, tests, and student grades
            </p>
          </div>
          <PermissionGate permission="students.write">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assessment
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exams</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessments?.filter((a) => a.assessment_type === 'exam').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests & Quizzes</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessments?.filter((a) =>
                  ['test', 'quiz'].includes(a.assessment_type)
                ).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assessments..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!filteredAssessments || filteredAssessments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No assessments found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">
                        {assessment.name}
                      </TableCell>
                      <TableCell>{getClassName(assessment.class_id)}</TableCell>
                      <TableCell>{assessment.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {assessment.assessment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assessment.passing_marks}/{assessment.max_marks}
                      </TableCell>
                      <TableCell>
                        {assessment.assessment_date
                          ? format(new Date(assessment.assessment_date), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PermissionGate permission="students.write">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGrades(assessment)}
                            >
                              Grades
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(assessment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(assessment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessment Form Dialog */}
      <AssessmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        initialData={
          editingAssessment
            ? {
                name: editingAssessment.name,
                description: editingAssessment.description || '',
                class_id: editingAssessment.class_id,
                subject: editingAssessment.subject,
                assessment_type: editingAssessment.assessment_type,
                max_marks: editingAssessment.max_marks,
                passing_marks: editingAssessment.passing_marks,
                assessment_date: editingAssessment.assessment_date
                  ? new Date(editingAssessment.assessment_date)
                  : undefined,
              }
            : undefined
        }
        classes={classes || []}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Grades Dialog */}
      <GradesDialog
        open={isGradesOpen}
        onOpenChange={setIsGradesOpen}
        assessment={selectedAssessment}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assessment? This will also
              remove all associated grades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
