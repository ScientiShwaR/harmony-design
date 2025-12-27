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
import { Plus, Eye, Trash2, Search, Award, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PermissionGate } from '@/core/rbac/PermissionGate';
import { IssueCertificateDialog } from '@/components/certificates/IssueCertificateDialog';
import { ViewCertificateDialog } from '@/components/certificates/ViewCertificateDialog';

interface CertificateTemplate {
  id: string;
  name: string;
  template_type: string;
  header_text: string;
  body_template: string;
  footer_text: string | null;
}

interface Certificate {
  id: string;
  template_id: string;
  student_id: string;
  class_id: string | null;
  certificate_number: string;
  issued_date: string;
  achievement_text: string | null;
  status: string;
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

export default function CertificatesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as CertificateTemplate[];
    },
  });

  // Fetch certificates
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', selectedTemplateId],
    queryFn: async () => {
      let query = supabase
        .from('certificates')
        .select('*')
        .order('issued_date', { ascending: false });

      if (selectedTemplateId) {
        query = query.eq('template_id', selectedTemplateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Certificate[];
    },
  });

  // Fetch students
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

  // Fetch classes
  const { data: classes } = useQuery({
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificate deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete certificate');
    },
  });

  const getStudentName = (studentId: string) => {
    const student = students?.find((s) => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return '-';
    const cls = classes?.find((c) => c.id === classId);
    if (!cls) return 'Unknown';
    return cls.section ? `${cls.name} - ${cls.section}` : cls.name;
  };

  const getClassAcademicYear = (classId: string | null) => {
    if (!classId) return new Date().getFullYear().toString();
    const cls = classes?.find((c) => c.id === classId);
    return cls?.academic_year || new Date().getFullYear().toString();
  };

  const getTemplateName = (templateId: string) => {
    return templates?.find((t) => t.id === templateId)?.name || 'Unknown';
  };

  const getTemplate = (templateId: string) => {
    return templates?.find((t) => t.id === templateId) || null;
  };

  const filteredCertificates = certificates?.filter((c) => {
    const studentName = getStudentName(c.student_id).toLowerCase();
    const certNumber = c.certificate_number.toLowerCase();
    return (
      studentName.includes(searchTerm.toLowerCase()) ||
      certNumber.includes(searchTerm.toLowerCase())
    );
  });

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
            <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
            <p className="text-muted-foreground">
              Issue and manage student certificates
            </p>
          </div>
          <PermissionGate permission="students.write">
            <Button onClick={() => setIsIssueOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Issue Certificate
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificates?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {certificates?.filter((c) => {
                  const issued = new Date(c.issued_date);
                  const now = new Date();
                  return (
                    issued.getMonth() === now.getMonth() &&
                    issued.getFullYear() === now.getFullYear()
                  );
                }).length || 0}
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
                  placeholder="Search by student or certificate number..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedTemplateId || '_none'}
                onValueChange={(val) => setSelectedTemplateId(val === '_none' ? '' : val)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">All Templates</SelectItem>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!filteredCertificates || filteredCertificates.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No certificates found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-xs">
                        {cert.certificate_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getStudentName(cert.student_id)}
                      </TableCell>
                      <TableCell>{getClassName(cert.class_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTemplateName(cert.template_id)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {cert.achievement_text || '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(cert.issued_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingCertificate(cert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <PermissionGate permission="students.write">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(cert.id)}
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

      {/* Issue Dialog */}
      <IssueCertificateDialog
        open={isIssueOpen}
        onOpenChange={setIsIssueOpen}
        templates={templates || []}
        classes={classes || []}
      />

      {/* View Dialog */}
      <ViewCertificateDialog
        open={!!viewingCertificate}
        onOpenChange={() => setViewingCertificate(null)}
        certificate={viewingCertificate}
        template={viewingCertificate ? getTemplate(viewingCertificate.template_id) : null}
        studentName={viewingCertificate ? getStudentName(viewingCertificate.student_id) : ''}
        className={viewingCertificate ? getClassName(viewingCertificate.class_id) : ''}
        academicYear={viewingCertificate ? getClassAcademicYear(viewingCertificate.class_id) : undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this certificate? This action
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
