import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Eye, Trash2, Search, FileText, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PermissionGate } from '@/core/rbac/PermissionGate';
import { GenerateReportCardDialog } from '@/components/report-cards/GenerateReportCardDialog';
import { ViewReportCardDialog } from '@/components/report-cards/ViewReportCardDialog';

interface ReportCard {
  id: string;
  student_id: string;
  class_id: string;
  term: string;
  academic_year: string;
  total_marks: number | null;
  obtained_marks: number | null;
  percentage: number | null;
  grade: string | null;
  rank: number | null;
  teacher_remarks: string | null;
  principal_remarks: string | null;
  status: string;
  generated_at: string | null;
  published_at: string | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface ClassData {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
}

const TERMS = [
  { value: 'term1', label: 'Term 1' },
  { value: 'term2', label: 'Term 2' },
  { value: 'term3', label: 'Term 3' },
  { value: 'annual', label: 'Annual' },
];

export default function ReportCardsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [viewingReportCard, setViewingReportCard] = useState<ReportCard | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section, academic_year')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as ClassData[];
    },
  });

  // Fetch report cards
  const { data: reportCards, isLoading: reportCardsLoading } = useQuery({
    queryKey: ['report-cards', selectedClassId, selectedTerm],
    queryFn: async () => {
      let query = supabase
        .from('report_cards')
        .select('*')
        .order('generated_at', { ascending: false });

      if (selectedClassId) {
        query = query.eq('class_id', selectedClassId);
      }
      if (selectedTerm) {
        query = query.eq('term', selectedTerm);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReportCard[];
    },
  });

  // Fetch students for display
  const { data: students } = useQuery({
    queryKey: ['students-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('status', 'active');
      if (error) throw error;
      return data as Student[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_cards')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Report card deleted successfully');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete report card');
    },
  });

  const getStudentName = (studentId: string) => {
    const student = students?.find((s) => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
  };

  const getStudentAdmNo = (studentId: string) => {
    const student = students?.find((s) => s.id === studentId);
    return student?.admission_number || '';
  };

  const getClassName = (classId: string) => {
    const cls = classes?.find((c) => c.id === classId);
    if (!cls) return 'Unknown';
    return cls.section ? `${cls.name} - ${cls.section}` : cls.name;
  };

  const getTermLabel = (term: string) => {
    return TERMS.find((t) => t.value === term)?.label || term;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReportCards = reportCards?.filter((rc) => {
    const studentName = getStudentName(rc.student_id).toLowerCase();
    const admNo = getStudentAdmNo(rc.student_id).toLowerCase();
    return (
      studentName.includes(searchTerm.toLowerCase()) ||
      admNo.includes(searchTerm.toLowerCase())
    );
  });

  const isLoading = classesLoading || reportCardsLoading;

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
            <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
            <p className="text-muted-foreground">
              Generate and manage student report cards
            </p>
          </div>
          <PermissionGate permission="students.write">
            <Button onClick={() => setIsGenerateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Report Cards
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Report Cards</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportCards?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportCards?.filter((r) => r.status === 'published').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportCards?.filter((r) => r.status === 'draft').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedClassId || '_none'}
                onValueChange={(val) => setSelectedClassId(val === '_none' ? '' : val)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">All Classes</SelectItem>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                      {cls.section ? ` - ${cls.section}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedTerm || '_none'}
                onValueChange={(val) => setSelectedTerm(val === '_none' ? '' : val)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">All Terms</SelectItem>
                  {TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!filteredReportCards || filteredReportCards.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No report cards found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReportCards.map((reportCard) => (
                    <TableRow key={reportCard.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {getStudentName(reportCard.student_id)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getStudentAdmNo(reportCard.student_id)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getClassName(reportCard.class_id)}</TableCell>
                      <TableCell>{getTermLabel(reportCard.term)}</TableCell>
                      <TableCell>
                        {reportCard.percentage
                          ? `${reportCard.percentage.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {reportCard.grade ? (
                          <Badge variant="outline">{reportCard.grade}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(reportCard.status)}</TableCell>
                      <TableCell>
                        {reportCard.generated_at
                          ? format(new Date(reportCard.generated_at), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingReportCard(reportCard)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <PermissionGate permission="students.write">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(reportCard.id)}
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

      {/* Generate Dialog */}
      <GenerateReportCardDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        classes={classes || []}
      />

      {/* View Dialog */}
      <ViewReportCardDialog
        open={!!viewingReportCard}
        onOpenChange={() => setViewingReportCard(null)}
        reportCard={viewingReportCard}
        studentName={viewingReportCard ? getStudentName(viewingReportCard.student_id) : ''}
        className={viewingReportCard ? getClassName(viewingReportCard.class_id) : ''}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report card? This action
              cannot be undone.
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
