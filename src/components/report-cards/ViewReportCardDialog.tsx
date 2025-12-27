import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { PermissionGate } from '@/core/rbac/PermissionGate';
import { Send } from 'lucide-react';

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
}

interface SubjectGrade {
  subject: string;
  max_marks: number;
  obtained_marks: number | null;
  grade: string | null;
}

interface ViewReportCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportCard: ReportCard | null;
  studentName: string;
  className: string;
}

const TERM_LABELS: Record<string, string> = {
  term1: 'Term 1',
  term2: 'Term 2',
  term3: 'Term 3',
  annual: 'Annual',
};

export function ViewReportCardDialog({
  open,
  onOpenChange,
  reportCard,
  studentName,
  className,
}: ViewReportCardDialogProps) {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState(reportCard?.teacher_remarks || '');

  useEffect(() => {
    setRemarks(reportCard?.teacher_remarks || '');
  }, [reportCard]);

  // Fetch subject-wise grades from assessments
  const { data: subjectGrades, isLoading } = useQuery({
    queryKey: ['subject-grades', reportCard?.student_id, reportCard?.class_id],
    queryFn: async () => {
      if (!reportCard) return [];

      const { data: assessments, error: aError } = await supabase
        .from('assessments')
        .select('id, subject, max_marks')
        .eq('class_id', reportCard.class_id)
        .eq('is_active', true);
      if (aError) throw aError;

      if (!assessments || assessments.length === 0) return [];

      const { data: grades, error: gError } = await supabase
        .from('student_grades')
        .select('assessment_id, marks_obtained, grade')
        .eq('student_id', reportCard.student_id)
        .in(
          'assessment_id',
          assessments.map((a) => a.id)
        );
      if (gError) throw gError;

      // Group by subject
      const subjectMap = new Map<
        string,
        { maxMarks: number; obtained: number; count: number }
      >();

      assessments.forEach((a) => {
        const studentGrade = grades?.find((g) => g.assessment_id === a.id);
        const existing = subjectMap.get(a.subject) || {
          maxMarks: 0,
          obtained: 0,
          count: 0,
        };

        subjectMap.set(a.subject, {
          maxMarks: existing.maxMarks + a.max_marks,
          obtained:
            existing.obtained + (Number(studentGrade?.marks_obtained) || 0),
          count: existing.count + 1,
        });
      });

      const result: SubjectGrade[] = [];
      subjectMap.forEach((value, subject) => {
        const percentage = (value.obtained / value.maxMarks) * 100;
        result.push({
          subject,
          max_marks: value.maxMarks,
          obtained_marks: value.obtained,
          grade: calculateGrade(percentage),
        });
      });

      return result;
    },
    enabled: !!reportCard && open,
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!reportCard) return;
      const { error } = await supabase
        .from('report_cards')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          teacher_remarks: remarks,
        })
        .eq('id', reportCard.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Report card published');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish');
    },
  });

  // Save remarks mutation
  const saveRemarksMutation = useMutation({
    mutationFn: async () => {
      if (!reportCard) return;
      const { error } = await supabase
        .from('report_cards')
        .update({ teacher_remarks: remarks })
        .eq('id', reportCard.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success('Remarks saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save remarks');
    },
  });

  const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  if (!reportCard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Report Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium">{studentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="font-medium">{className}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Term</p>
              <p className="font-medium">
                {TERM_LABELS[reportCard.term] || reportCard.term}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academic Year</p>
              <p className="font-medium">{reportCard.academic_year}</p>
            </div>
          </div>

          <Separator />

          {/* Overall Results */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{reportCard.total_marks || 0}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Obtained</p>
              <p className="text-xl font-bold">{reportCard.obtained_marks || 0}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Percentage</p>
              <p className="text-xl font-bold">
                {reportCard.percentage?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Grade</p>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {reportCard.grade || '-'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Subject Grades */}
          <div>
            <h3 className="font-medium mb-3">Subject-wise Performance</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !subjectGrades || subjectGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subject grades available
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Subject</th>
                      <th className="text-center p-2">Max</th>
                      <th className="text-center p-2">Obtained</th>
                      <th className="text-center p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectGrades.map((sg, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-medium">{sg.subject}</td>
                        <td className="text-center p-2">{sg.max_marks}</td>
                        <td className="text-center p-2">{sg.obtained_marks}</td>
                        <td className="text-center p-2">
                          <Badge variant="outline">{sg.grade}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Separator />

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Teacher Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks for this student..."
              rows={3}
              disabled={reportCard.status === 'published'}
            />
            {reportCard.status === 'draft' && (
              <PermissionGate permission="students.write">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveRemarksMutation.mutate()}
                  disabled={saveRemarksMutation.isPending}
                >
                  Save Remarks
                </Button>
              </PermissionGate>
            )}
          </div>

          {/* Actions */}
          {reportCard.status === 'draft' && (
            <PermissionGate permission="students.write">
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Publish Report Card
                </Button>
              </div>
            </PermissionGate>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
