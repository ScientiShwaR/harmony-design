import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, Loader2 } from 'lucide-react';
import type { AppRole } from '@/core/rbac/permissions';

interface RoleWithPermissions {
  id: string;
  name: AppRole;
  display_name: string;
  description: string | null;
  permissions: string[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      
      // Fetch all roles
      const { data: rolesData } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (!rolesData) {
        setIsLoading(false);
        return;
      }

      // Fetch all permissions
      const { data: permissionsData } = await supabase
        .from('role_permissions')
        .select('role_id, permission');

      // Combine data
      const rolesWithPerms: RoleWithPermissions[] = rolesData.map(role => ({
        id: role.id,
        name: role.name as AppRole,
        display_name: role.display_name,
        description: role.description,
        permissions: permissionsData?.filter(p => p.role_id === role.id).map(p => p.permission) || [],
      }));

      setRoles(rolesWithPerms);
      setIsLoading(false);
    };

    fetchRoles();
  }, []);

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
      case 'principal':
        return 'default';
      case 'clerk':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground">View and manage role bundles and their permissions</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6">
            {roles.map(role => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <ShieldCheck className="size-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {role.display_name}
                          <Badge variant={getRoleBadgeVariant(role.name)}>{role.name}</Badge>
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{role.permissions.length} permissions</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(permission => (
                      <Badge key={permission} variant="secondary" className="font-mono text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
