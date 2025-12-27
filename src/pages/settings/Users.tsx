import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { executeCommand } from '@/core/commands/commandBus';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, Trash2, Loader2 } from 'lucide-react';
import type { AppRole } from '@/core/rbac/permissions';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'clerk', label: 'Clerk' },
  { value: 'principal', label: 'Principal' },
  { value: 'admin', label: 'Administrator' },
];

export default function UsersPage() {
  const { user, roles: currentUserRoles, permissions, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<AppRole>('teacher');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const fetchUsers = async () => {
    setIsLoading(true);
    
    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (!profiles) {
      setIsLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    // Combine data
    const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      roles: (userRoles?.filter(ur => ur.user_id === profile.id).map(ur => ur.role as AppRole)) || [],
    }));

    setUsers(usersWithRoles);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUserId || !user) return;

    const result = await executeCommand(
      {
        type: 'user.role.assign',
        payload: { user_id: selectedUserId, role: selectedRole },
        reason: 'Role assigned via admin UI',
      },
      {
        userId: user.id,
        userRoles: currentUserRoles,
        userPermissions: permissions,
        isAdmin,
      }
    );

    if (result.success) {
      toast({ title: 'Role assigned', description: `${selectedRole} role assigned successfully` });
      fetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }

    setSelectedUserId('');
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    if (!user) return;

    const result = await executeCommand(
      {
        type: 'user.role.remove',
        payload: { user_id: userId, role },
        reason: 'Role removed via admin UI',
      },
      {
        userId: user.id,
        userRoles: currentUserRoles,
        userPermissions: permissions,
        isAdmin,
      }
    );

    if (result.success) {
      toast({ title: 'Role removed', description: `${role} role removed successfully` });
      fetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts and role assignments</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5" />
              Assign Role
            </CardTitle>
            <CardDescription>Assign a role to a user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssignRole} disabled={!selectedUserId}>
                Assign Role
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              User List
            </CardTitle>
            <CardDescription>All users and their assigned roles</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.length > 0 ? (
                            u.roles.map(role => (
                              <Badge 
                                key={role} 
                                variant={role === 'admin' || role === 'principal' ? 'default' : 'secondary'}
                                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveRole(u.id, role)}
                              >
                                {role}
                                <Trash2 className="size-3 ml-1" />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.id === user?.id && (
                          <Badge variant="outline">You</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
