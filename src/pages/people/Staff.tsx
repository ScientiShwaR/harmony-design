import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal,
  ChevronDown,
  Users,
  Loader2,
  Trash2,
  Pencil,
  Mail,
  Phone,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { executeCommand } from '@/core/commands/commandBus';
import { StaffFormDialog, type StaffFormData } from '@/components/staff/StaffFormDialog';
import { toast } from 'sonner';
import { PermissionGate } from '@/core/rbac/PermissionGate';

interface Staff {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string | null;
  designation: string;
  department: string | null;
  qualification: string | null;
  experience_years: number | null;
  join_date: string;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_group: string | null;
  status: string;
  created_at: string;
}

export default function StaffPage() {
  const { user, roles, permissions, isAdmin } = useAuth();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // Form dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = () => {
    setEditingStaff(null);
    setDialogOpen(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setDialogOpen(true);
  };

  const handleDeleteClick = (staff: Staff) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: StaffFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const result = await executeCommand(
        {
          type: editingStaff ? 'staff.update' : 'staff.create',
          payload: data,
          entityRef: editingStaff ? { type: 'staff', id: editingStaff.id } : undefined,
          reason: editingStaff ? 'Updated staff details' : 'New staff member added',
        },
        {
          userId: user.id,
          userRoles: roles,
          userPermissions: permissions,
          isAdmin,
        }
      );

      if (result.success) {
        toast.success(editingStaff ? 'Staff updated successfully' : 'Staff added successfully');
        setDialogOpen(false);
        fetchStaff();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !staffToDelete) return;

    try {
      const result = await executeCommand(
        {
          type: 'staff.delete',
          payload: { id: staffToDelete.id },
          entityRef: { type: 'staff', id: staffToDelete.id },
          reason: 'Staff record deleted',
        },
        {
          userId: user.id,
          userRoles: roles,
          userPermissions: permissions,
          isAdmin,
        }
      );

      if (result.success) {
        toast.success('Staff member deleted successfully');
        fetchStaff();
      } else {
        toast.error(result.error || 'Failed to delete staff member');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  // Filter staff
  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch = 
      searchQuery === '' ||
      staff.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Get unique departments for filter
  const uniqueDepartments = [...new Set(staffMembers.map(s => s.department).filter(Boolean))].sort();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'on_leave': return 'outline';
      case 'resigned': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
            <p className="text-muted-foreground">
              Manage staff records and information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Export
            </Button>
            <PermissionGate permission="staff.write">
              <Button size="sm" onClick={handleAddStaff}>
                <Plus className="mr-2 size-4" />
                Add Staff
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff by name, employee ID, email..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 size-4" />
                      Department
                      <ChevronDown className="ml-2 size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setDepartmentFilter('all')}>
                      All Departments
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {uniqueDepartments.map((d) => (
                      <DropdownMenuItem key={d} onClick={() => setDepartmentFilter(d!)}>
                        {d}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status
                      <ChevronDown className="ml-2 size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                      Inactive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('on_leave')}>
                      On Leave
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('resigned')}>
                      Resigned
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">All Staff</CardTitle>
                <CardDescription>
                  {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="size-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {staffMembers.length === 0
                    ? 'No staff members added yet. Click "Add Staff" to get started.'
                    : 'No staff members match your search criteria.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                            {staff.first_name[0]}{staff.last_name[0]}
                          </div>
                          <span className="font-medium">
                            {staff.first_name} {staff.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {staff.employee_id}
                      </TableCell>
                      <TableCell>{staff.designation}</TableCell>
                      <TableCell>
                        {staff.department || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1 text-sm">
                            <Mail className="size-3 text-muted-foreground" />
                            {staff.email}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            {staff.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(staff.status)}>
                          {staff.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <PermissionGate permission="staff.write">
                              <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                                <Pencil className="mr-2 size-4" />
                                Edit Details
                              </DropdownMenuItem>
                            </PermissionGate>
                            <DropdownMenuSeparator />
                            <PermissionGate permission="staff.write">
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(staff)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editingStaff}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {staffToDelete?.first_name} {staffToDelete?.last_name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
