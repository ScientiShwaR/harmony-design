import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const studentSchema = z.object({
  admission_number: z.string().trim().min(1, 'Admission number is required').max(50),
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  class_id: z.string().optional(),
  section: z.string().optional(),
  guardian_name: z.string().trim().min(1, 'Guardian name is required').max(100),
  guardian_phone: z.string().trim().min(10, 'Valid phone number required').max(15),
  guardian_email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  blood_group: z.string().optional(),
  medical_notes: z.string().max(1000).optional(),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated']).default('active'),
  admission_date: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

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
}

interface ClassOption {
  id: string;
  name: string;
  section: string | null;
}

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSubmit: (data: StudentFormData) => Promise<void>;
  isLoading?: boolean;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
  isLoading = false,
}: StudentFormDialogProps) {
  const isEditing = !!student;

  // Fetch classes from database
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ClassOption[];
    },
    enabled: open,
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admission_number: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      class_id: '',
      section: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      address: '',
      blood_group: '',
      medical_notes: '',
      status: 'active',
      admission_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        admission_number: student.admission_number,
        first_name: student.first_name,
        last_name: student.last_name,
        date_of_birth: student.date_of_birth,
        gender: student.gender as 'male' | 'female' | 'other',
        class_id: student.class_id || '',
        section: student.section || '',
        guardian_name: student.guardian_name,
        guardian_phone: student.guardian_phone,
        guardian_email: student.guardian_email || '',
        address: student.address || '',
        blood_group: student.blood_group || '',
        medical_notes: student.medical_notes || '',
        status: student.status as 'active' | 'inactive' | 'transferred' | 'graduated',
        admission_date: student.admission_date,
      });
    } else {
      form.reset({
        admission_number: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'male',
        class_id: '',
        section: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        address: '',
        blood_group: '',
        medical_notes: '',
        status: 'active',
        admission_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [student, form]);

  const handleSubmit = async (data: StudentFormData) => {
    await onSubmit(data);
  };

  // Get unique sections from selected class or all classes
  const selectedClassId = form.watch('class_id');
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const availableSections = selectedClass?.section 
    ? [selectedClass.section] 
    : [...new Set(classes.filter(c => c.section).map(c => c.section!))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="admission_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admission_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Not specified</SelectItem>
                        {BLOOD_GROUPS.map((bg) => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Class Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">No class assigned</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.section ? ` - ${c.section}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section (Legacy)</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">No section</SelectItem>
                        {['A', 'B', 'C', 'D'].map((s) => (
                          <SelectItem key={s} value={s}>
                            Section {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Guardian Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Guardian Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="guardian_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Parent/Guardian name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardian_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 XXXXX XXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="guardian_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Home address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Medical Notes */}
            <FormField
              control={form.control}
              name="medical_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any allergies, conditions, or medical notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
