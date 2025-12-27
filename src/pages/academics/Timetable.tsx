import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGate } from '@/core/rbac/PermissionGate';
import { TimetableSlotFormDialog } from '@/components/timetable/TimetableSlotFormDialog';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface TimetableSlot {
  id: string;
  class_id: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number: string | null;
  teacher_id: string | null;
}

interface ClassData {
  id: string;
  name: string;
  section: string | null;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

export default function TimetablePage() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery({
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

  // Fetch staff
  const { data: staff } = useQuery({
    queryKey: ['staff-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data as Staff[];
    },
  });

  // Fetch timetable slots for selected class
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['timetable-slots', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data as TimetableSlot[];
    },
    enabled: !!selectedClassId,
  });

  // Create slot mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<TimetableSlot, 'id'>) => {
      const { error } = await supabase.from('timetable_slots').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-slots'] });
      toast.success('Timetable slot created successfully');
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create timetable slot');
    },
  });

  // Update slot mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimetableSlot> }) => {
      const { error } = await supabase
        .from('timetable_slots')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-slots'] });
      toast.success('Timetable slot updated successfully');
      setIsDialogOpen(false);
      setEditingSlot(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update timetable slot');
    },
  });

  // Delete slot mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('timetable_slots')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-slots'] });
      toast.success('Timetable slot deleted successfully');
      setDeleteSlotId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete timetable slot');
    },
  });

  const handleCreate = () => {
    setEditingSlot(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: {
    subject: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_number?: string;
    teacher_id?: string;
  }) => {
    if (editingSlot) {
      updateMutation.mutate({
        id: editingSlot.id,
        data: {
          subject: data.subject,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          room_number: data.room_number || null,
          teacher_id: data.teacher_id || null,
        },
      });
    } else {
      createMutation.mutate({
        class_id: selectedClassId,
        subject: data.subject,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        room_number: data.room_number || null,
        teacher_id: data.teacher_id || null,
      });
    }
  };

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId || !staff) return 'Not Assigned';
    const teacher = staff.find((s) => s.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Not Assigned';
  };

  const getDayName = (dayIndex: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayIndex)?.label || '';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    slots: slots?.filter((s) => s.day_of_week === day.value) || [],
  })).filter((day) => day.slots.length > 0);

  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  if (classesLoading) {
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
            <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
            <p className="text-muted-foreground">
              Manage class schedules and time slots
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={selectedClassId || '_none'}
              onValueChange={(val) => setSelectedClassId(val === '_none' ? '' : val)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Select a class</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.section ? ` - ${cls.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClassId && (
              <PermissionGate permission="students.write">
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slot
                </Button>
              </PermissionGate>
            )}
          </div>
        </div>

        {/* Content */}
        {!selectedClassId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Select a class to view and manage its timetable
              </p>
            </CardContent>
          </Card>
        ) : slotsLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : slotsByDay.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No timetable slots found for{' '}
                <strong>
                  {selectedClass?.name}
                  {selectedClass?.section ? ` - ${selectedClass.section}` : ''}
                </strong>
              </p>
              <PermissionGate permission="students.write">
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Slot
                </Button>
              </PermissionGate>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {slotsByDay.map((day) => (
              <Card key={day.value}>
                <CardHeader>
                  <CardTitle className="text-lg">{day.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {day.slots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell className="font-medium">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </TableCell>
                          <TableCell>{slot.subject}</TableCell>
                          <TableCell>{getTeacherName(slot.teacher_id)}</TableCell>
                          <TableCell>{slot.room_number || '-'}</TableCell>
                          <TableCell>
                            <PermissionGate permission="students.write">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(slot)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteSlotId(slot.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </PermissionGate>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <TimetableSlotFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        initialData={
          editingSlot
            ? {
                subject: editingSlot.subject,
                day_of_week: editingSlot.day_of_week,
                start_time: editingSlot.start_time,
                end_time: editingSlot.end_time,
                room_number: editingSlot.room_number || '',
                teacher_id: editingSlot.teacher_id || '',
              }
            : undefined
        }
        staff={staff || []}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSlotId} onOpenChange={() => setDeleteSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timetable Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this timetable slot? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSlotId && deleteMutation.mutate(deleteSlotId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
