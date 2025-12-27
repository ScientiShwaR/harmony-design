import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { executeCommand } from '@/core/commands/commandBus';
import { useToast } from '@/hooks/use-toast';
import { Settings, Edit, Loader2, History } from 'lucide-react';

interface Policy {
  id: string;
  policy_key: string;
  policy_value: unknown;
  description: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
}

export default function PoliciesPage() {
  const { user, roles, permissions, isAdmin } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPolicies = async () => {
    setIsLoading(true);
    
    const { data } = await supabase
      .from('policies')
      .select('*')
      .eq('is_active', true)
      .order('policy_key');

    setPolicies((data || []) as Policy[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setNewValue(JSON.stringify(policy.policy_value, null, 2));
    setReason('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPolicy || !user) return;

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(newValue);
    } catch {
      toast({ variant: 'destructive', title: 'Invalid JSON', description: 'Please enter valid JSON' });
      return;
    }

    const result = await executeCommand(
      {
        type: 'policy.update',
        payload: {
          policy_key: editingPolicy.policy_key,
          policy_value: parsedValue,
          description: editingPolicy.description,
        },
        entityRef: { type: 'policy', id: editingPolicy.policy_key },
        reason: reason || 'Policy updated via admin UI',
      },
      {
        userId: user.id,
        userRoles: roles,
        userPermissions: permissions,
        isAdmin,
      }
    );

    if (result.success) {
      toast({ title: 'Policy updated', description: `${editingPolicy.policy_key} updated to version ${(editingPolicy.version || 0) + 1}` });
      fetchPolicies();
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  };

  const getValueBadge = (value: unknown) => {
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Enabled' : 'Disabled'}</Badge>;
    }
    return <code className="text-sm bg-muted px-2 py-1 rounded">{formatValue(value)}</code>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Policy Configuration</h1>
          <p className="text-muted-foreground">Manage system policies and workflow rules</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Active Policies
            </CardTitle>
            <CardDescription>
              All policy changes create new versions (append-only). Previous versions are preserved for audit.
            </CardDescription>
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
                    <TableHead>Policy</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map(policy => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-mono text-sm">{policy.policy_key}</TableCell>
                      <TableCell>{getValueBadge(policy.policy_value)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">v{policy.version}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                        {policy.description}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
                          <Edit className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Policy</DialogTitle>
              <DialogDescription>
                Update <code className="font-mono">{editingPolicy?.policy_key}</code>. 
                This will create version {(editingPolicy?.version || 0) + 1}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Value (JSON)</Label>
                <Textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="font-mono text-sm min-h-[100px]"
                  placeholder='true, false, number, or JSON object'
                />
              </div>
              <div className="space-y-2">
                <Label>Reason for change</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this change being made?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
