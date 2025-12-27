import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGate } from "@/core/rbac/PermissionGate";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import {
  GraduationCap,
  Plus,
  Search,
  Users,
  MapPin,
  User,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ClassData = {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
  class_teacher_id: string | null;
  room_number: string | null;
  capacity: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type Staff = {
  id: string;
  first_name: string;
  last_name: string;
};

export default function ClassesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [selectedClass, setSelectedClass] = React.useState<ClassData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [classToDelete, setClassToDelete] = React.useState<ClassData | null>(null);

  // Fetch classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as ClassData[];
    },
    enabled: !!user,
  });

  // Fetch staff for teacher assignment
  const { data: staff = [] } = useQuery({
    queryKey: ["staff-teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .order("first_name");

      if (error) throw error;
      return data as Staff[];
    },
    enabled: !!user,
  });

  // Fetch student counts per class
  const { data: studentCounts = {} } = useQuery({
    queryKey: ["class-student-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("class_id")
        .eq("status", "active");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((s) => {
        if (s.class_id) {
          counts[s.class_id] = (counts[s.class_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: !!user,
  });

  // Create class mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      section?: string;
      academic_year: string;
      class_teacher_id?: string;
      room_number?: string;
      capacity: number;
      description?: string;
    }) => {
      const { error } = await supabase.from("classes").insert([
        {
          name: data.name,
          section: data.section || null,
          academic_year: data.academic_year,
          class_teacher_id: data.class_teacher_id || null,
          room_number: data.room_number || null,
          capacity: data.capacity,
          description: data.description || null,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        section?: string;
        academic_year: string;
        class_teacher_id?: string;
        room_number?: string;
        capacity: number;
        description?: string;
      };
    }) => {
      const { error } = await supabase
        .from("classes")
        .update({
          name: data.name,
          section: data.section || null,
          academic_year: data.academic_year,
          class_teacher_id: data.class_teacher_id || null,
          room_number: data.room_number || null,
          capacity: data.capacity,
          description: data.description || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("classes")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class deleted successfully");
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredClasses = classes.filter((c) => {
    const search = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(search) ||
      c.section?.toLowerCase().includes(search) ||
      c.academic_year.toLowerCase().includes(search)
    );
  });

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return null;
    const teacher = staff.find((s) => s.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : null;
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (classData: ClassData) => {
    setSelectedClass(classData);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = (classData: ClassData) => {
    setClassToDelete(classData);
    setDeleteDialogOpen(true);
  };

  async function handleSubmit(data: {
    name: string;
    section?: string;
    academic_year: string;
    class_teacher_id?: string;
    room_number?: string;
    capacity: number;
    description?: string;
  }) {
    if (dialogMode === "create") {
      await createMutation.mutateAsync(data);
    } else if (selectedClass) {
      await updateMutation.mutateAsync({ id: selectedClass.id, data });
    }
  }

  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground">
              Manage class groups and assign teachers
            </p>
          </div>
          <PermissionGate permission="students.write">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 size-4" />
              Add Class
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Total Classes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
                <Users className="size-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Students Enrolled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
                <User className="size-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {classes.filter((c) => c.class_teacher_id).length}
                </p>
                <p className="text-sm text-muted-foreground">With Teachers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>All Classes</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="size-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No classes found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search"
                    : "Create your first class to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Class Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((classData) => (
                    <TableRow key={classData.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                            <GraduationCap className="size-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {classData.name}
                              {classData.section && (
                                <Badge variant="secondary" className="ml-2">
                                  {classData.section}
                                </Badge>
                              )}
                            </div>
                            {classData.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {classData.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{classData.academic_year}</Badge>
                      </TableCell>
                      <TableCell>
                        {getTeacherName(classData.class_teacher_id) || (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {classData.room_number ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="size-3 text-muted-foreground" />
                            {classData.room_number}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {studentCounts[classData.id] || 0}
                          </span>
                          <span className="text-muted-foreground">
                            / {classData.capacity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PermissionGate permission="students.write">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(classData)}>
                                <Edit className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(classData)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </PermissionGate>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <ClassFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={
          selectedClass
            ? {
                name: selectedClass.name,
                section: selectedClass.section || undefined,
                academic_year: selectedClass.academic_year,
                class_teacher_id: selectedClass.class_teacher_id || undefined,
                room_number: selectedClass.room_number || undefined,
                capacity: selectedClass.capacity,
                description: selectedClass.description || undefined,
              }
            : undefined
        }
        mode={dialogMode}
        staff={staff}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{classToDelete?.name}
              {classToDelete?.section ? ` - ${classToDelete.section}` : ""}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => classToDelete && deleteMutation.mutate(classToDelete.id)}
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
