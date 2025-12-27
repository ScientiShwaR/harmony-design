import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: string;
}

interface GenerateReportCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: ClassData[];
}

const TERMS = [
  { value: 'term1', label: 'Term 1' },
  { value: 'term2', label: 'Term 2' },
  { value: 'term3', label: 'Term 3' },
  { value: 'annual', label: 'Annual' },
];

export function GenerateReportCardDialog({
  open,
  onOpenChange,
  classes,
}: GenerateReportCardDialogProps) {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('term1');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [teacherRemarks, setTeacherRemarks] = useState('');

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Fetch students in selected class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-by-class', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number, class_id')
        .eq('class_id', selectedClassId)
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!selectedClassId && open,
  });

  // Fetch assessments and grades for the class
  const { data: assessmentsData } = useQuery({
    queryKey: ['class-assessments-grades', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return { assessments: [], grades: [] };

      const { data: assessments, error: aError } = await supabase
        .from('assessments')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('is_active', true);
      if (aError) throw aError;

      const assessmentIds = assessments?.map((a) => a.id) || [];
      if (assessmentIds.length === 0) return { assessments: [], grades: [] };

      const { data: grades, error: gError } = await supabase
        .from('student_grades')
        .select('*')
        .in('assessment_id', assessmentIds);
      if (gError) throw gError;

      return { assessments: assessments || [], grades: grades || [] };
    },
    enabled: !!selectedClassId && open,
  });

  // Generate report cards mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId || selectedStudents.length === 0 || !selectedClass) {
        throw new Error('Please select a class and at least one student');
      }

      const { assessments, grades } = assessmentsData || { assessments: [], grades: [] };

      // Calculate grades for each selected student
      const reportCardsToInsert = selectedStudents.map((studentId) => {
        const studentGrades = grades.filter((g) => g.student_id === studentId);

        let totalMax = 0;
        let totalObtained = 0;

        studentGrades.forEach((sg) => {
          const assessment = assessments.find((a) => a.id === sg.assessment_id);
          if (assessment && sg.marks_obtained !== null) {
            totalMax += assessment.max_marks;
            totalObtained += Number(sg.marks_obtained);
          }
        });

        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        const grade = calculateOverallGrade(percentage);

        return {
          student_id: studentId,
          class_id: selectedClassId,
          term: selectedTerm,
          academic_year: selectedClass.academic_year,
          total_marks: totalMax,
          obtained_marks: totalObtained,
          percentage: Math.round(percentage * 100) / 100,
          grade,
          teacher_remarks: teacherRemarks || null,
          status: 'draft',
        };
      });

      const { error } = await supabase
        .from('report_cards')
        .upsert(reportCardsToInsert, {
          onConflict: 'student_id,term,academic_year',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success(`Generated ${selectedStudents.length} report card(s)`);
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate report cards');
    },
  });

  const calculateOverallGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const resetForm = () => {
    setSelectedClassId('');
    setSelectedTerm('term1');
    setSelectedStudents([]);
    setTeacherRemarks('');
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students?.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students?.map((s) => s.id) || []);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Report Cards</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={selectedClassId || '_none'}
                onValueChange={(val) => {
                  setSelectedClassId(val === '_none' ? '' : val);
                  setSelectedStudents([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Select class</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                      {cls.section ? ` - ${cls.section}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term *</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClassId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Students</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedStudents.length === students?.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>

              {studentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !students || students.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No students in this class
                </p>
              ) : (
                <div className="border rounded-md max-h-48 overflow-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <label
                        htmlFor={student.id}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        {student.first_name} {student.last_name}
                        <span className="text-muted-foreground ml-2">
                          ({student.admission_number})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Teacher Remarks (Optional)</Label>
            <Textarea
              placeholder="General remarks for all selected students..."
              value={teacherRemarks}
              onChange={(e) => setTeacherRemarks(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={
              generateMutation.isPending ||
              !selectedClassId ||
              selectedStudents.length === 0
            }
          >
            {generateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate {selectedStudents.length > 0 && `(${selectedStudents.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
