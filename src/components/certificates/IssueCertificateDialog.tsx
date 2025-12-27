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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { format } from 'date-fns';

interface CertificateTemplate {
  id: string;
  name: string;
  template_type: string;
  header_text: string;
  body_template: string;
  footer_text: string | null;
}

interface ClassData {
  id: string;
  name: string;
  section: string | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: string | null;
}

interface IssueCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: CertificateTemplate[];
  classes: ClassData[];
}

export function IssueCertificateDialog({
  open,
  onOpenChange,
  templates,
  classes,
}: IssueCertificateDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [achievementText, setAchievementText] = useState('');

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

  // Issue certificates mutation
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplateId || selectedStudents.length === 0) {
        throw new Error('Please select a template and at least one student');
      }

      const selectedClass = classes.find((c) => c.id === selectedClassId);
      const timestamp = Date.now();

      const certificatesToInsert = selectedStudents.map((studentId, index) => ({
        template_id: selectedTemplateId,
        student_id: studentId,
        class_id: selectedClassId || null,
        certificate_number: `CERT-${format(new Date(), 'yyyyMMdd')}-${timestamp}-${index + 1}`,
        issued_date: format(new Date(), 'yyyy-MM-dd'),
        achievement_text: achievementText || null,
        status: 'issued',
      }));

      const { error } = await supabase
        .from('certificates')
        .insert(certificatesToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success(`Issued ${selectedStudents.length} certificate(s)`);
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to issue certificates');
    },
  });

  const resetForm = () => {
    setSelectedTemplateId('');
    setSelectedClassId('');
    setSelectedStudents([]);
    setAchievementText('');
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

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Issue Certificates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-auto flex-1">
          <div className="space-y-2">
            <Label>Certificate Template *</Label>
            <Select
              value={selectedTemplateId || '_none'}
              onValueChange={(val) => setSelectedTemplateId(val === '_none' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Select template</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium">{selectedTemplate.header_text}</p>
              <p className="text-muted-foreground mt-1">
                {selectedTemplate.body_template}
              </p>
            </div>
          )}

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

          {selectedClassId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Students *</Label>
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
                <div className="border rounded-md max-h-40 overflow-auto">
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
            <Label>Achievement/Reason *</Label>
            <Textarea
              value={achievementText}
              onChange={(e) => setAchievementText(e.target.value)}
              placeholder="e.g., Excellence in Mathematics, Perfect Attendance, Sports Day Winner..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              This will replace {"{{achievement}}"} in the certificate template
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => issueMutation.mutate()}
            disabled={
              issueMutation.isPending ||
              !selectedTemplateId ||
              selectedStudents.length === 0 ||
              !achievementText
            }
          >
            {issueMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Issue {selectedStudents.length > 0 && `(${selectedStudents.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
