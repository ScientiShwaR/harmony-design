import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface Assessment {
  id: string;
  name: string;
  class_id: string;
  max_marks: number;
  passing_marks: number;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface Grade {
  id?: string;
  student_id: string;
  marks_obtained: number | null;
  grade: string | null;
  remarks: string | null;
}

interface GradesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment | null;
}

export function GradesDialog({
  open,
  onOpenChange,
  assessment,
}: GradesDialogProps) {
  const queryClient = useQueryClient();
  const [grades, setGrades] = useState<Record<string, { marks: string; remarks: string }>>({});

  // Fetch students in the class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-by-class', assessment?.class_id],
    queryFn: async () => {
      if (!assessment?.class_id) return [];
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('class_id', assessment.class_id)
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!assessment?.class_id && open,
  });

  // Fetch existing grades
  const { data: existingGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ['grades', assessment?.id],
    queryFn: async () => {
      if (!assessment?.id) return [];
      const { data, error } = await supabase
        .from('student_grades')
        .select('*')
        .eq('assessment_id', assessment.id);
      if (error) throw error;
      return data as Grade[];
    },
    enabled: !!assessment?.id && open,
  });

  // Initialize grades state when data loads
  useEffect(() => {
    if (students && existingGrades) {
      const gradeMap: Record<string, { marks: string; remarks: string }> = {};
      students.forEach((student) => {
        const existing = existingGrades.find((g) => g.student_id === student.id);
        gradeMap[student.id] = {
          marks: existing?.marks_obtained?.toString() || '',
          remarks: existing?.remarks || '',
        };
      });
      setGrades(gradeMap);
    }
  }, [students, existingGrades]);

  // Save grades mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assessment) return;
      
      const gradesToUpsert = Object.entries(grades)
        .filter(([_, value]) => value.marks !== '')
        .map(([studentId, value]) => ({
          assessment_id: assessment.id,
          student_id: studentId,
          marks_obtained: parseFloat(value.marks),
          grade: calculateGrade(parseFloat(value.marks), assessment.max_marks),
          remarks: value.remarks || null,
        }));

      if (gradesToUpsert.length === 0) return;

      const { error } = await supabase
        .from('student_grades')
        .upsert(gradesToUpsert, { onConflict: 'assessment_id,student_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grades saved successfully');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save grades');
    },
  });

  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleMarksChange = (studentId: string, marks: string) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const isLoading = studentsLoading || gradesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Enter Grades - {assessment?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !students || students.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No students found in this class
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-[100px]">
                      Marks (/{assessment?.max_marks})
                    </TableHead>
                    <TableHead className="w-[80px]">Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentGrade = grades[student.id] || { marks: '', remarks: '' };
                    const marks = parseFloat(studentGrade.marks);
                    const grade = !isNaN(marks)
                      ? calculateGrade(marks, assessment?.max_marks || 100)
                      : '-';
                    const isPassing = !isNaN(marks) && marks >= (assessment?.passing_marks || 40);

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.admission_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={assessment?.max_marks}
                            value={studentGrade.marks}
                            onChange={(e) =>
                              handleMarksChange(student.id, e.target.value)
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {grade !== '-' && (
                            <Badge variant={isPassing ? 'default' : 'destructive'}>
                              {grade}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={studentGrade.remarks}
                            onChange={(e) =>
                              handleRemarksChange(student.id, e.target.value)
                            }
                            placeholder="Optional remarks"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Grades'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
