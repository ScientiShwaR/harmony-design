import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGate } from "@/core/rbac/PermissionGate";
import { useCommandBus } from "@/core/commands/commandBus";
import { EvidencePackFormDialog } from "@/components/evidence/EvidencePackFormDialog";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileCheck,
  Calendar,
  ChevronRight,
  Filter,
  Plus,
  FileText,
} from "lucide-react";

type EvidencePack = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  due_date: string | null;
  status: string;
  progress: number;
  total_items: number;
  completed_items: number;
  created_at: string;
};

const statusConfig: Record<string, { label: string; badge: "secondary" | "warning" | "success" | "destructive"; icon: React.ElementType }> = {
  draft: { label: "Draft", badge: "secondary", icon: FileText },
  not_started: { label: "Not Started", badge: "secondary", icon: Clock },
  in_progress: { label: "In Progress", badge: "warning", icon: Clock },
  complete: { label: "Complete", badge: "success", icon: CheckCircle2 },
  overdue: { label: "Overdue", badge: "destructive", icon: AlertTriangle },
};

export default function EvidenceVaultPage() {
  const { user, roles, permissions, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { executeCommand } = useCommandBus();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Fetch evidence packs
  const { data: evidencePacks = [], isLoading } = useQuery({
    queryKey: ["evidence-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence_packs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check for overdue packs and update status
      const today = new Date().toISOString().split("T")[0];
      return (data as EvidencePack[]).map((pack) => {
        if (pack.due_date && pack.due_date < today && pack.status !== "complete") {
          return { ...pack, status: "overdue" };
        }
        return pack;
      });
    },
    enabled: !!user,
  });

  // Create evidence pack mutation
  const createPackMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      category: string;
      description?: string;
      due_date?: string;
      total_items: number;
    }) => {
      const result = await executeCommand(
        {
          type: "evidence.create",
          payload: {
            name: data.name,
            category: data.category,
            description: data.description || null,
            due_date: data.due_date || null,
            total_items: data.total_items,
            completed_items: 0,
            progress: 0,
            status: "draft",
            created_by: user?.id,
          },
        },
        { 
          userId: user?.id || '', 
          userRoles: roles as any, 
          userPermissions: permissions as any, 
          isAdmin: isAdmin 
        }
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to create evidence pack");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence-packs"] });
      toast.success("Evidence pack created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const stats = {
    total: evidencePacks.length,
    complete: evidencePacks.filter((p) => p.status === "complete").length,
    inProgress: evidencePacks.filter((p) => p.status === "in_progress").length,
    overdue: evidencePacks.filter((p) => p.status === "overdue").length,
  };

  async function handleCreatePack(data: {
    name: string;
    category: string;
    description?: string;
    due_date?: string;
    total_items: number;
  }) {
    await createPackMutation.mutateAsync(data);
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
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
            <h1 className="text-2xl font-bold tracking-tight">Evidence Vault</h1>
            <p className="text-muted-foreground">
              Manage compliance documentation and evidence packs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 size-4" />
              Filter
            </Button>
            <PermissionGate permission="evidence.write">
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                New Pack
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <FileCheck className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Packs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="size-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.complete}</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="size-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evidence Packs Grid */}
        {evidencePacks.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <FileCheck className="size-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No evidence packs yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create your first evidence pack to start tracking compliance documentation.
                </p>
              </div>
              <PermissionGate permission="evidence.write">
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Create First Pack
                </Button>
              </PermissionGate>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {evidencePacks.map((pack) => {
              const config = statusConfig[pack.status] || statusConfig.draft;
              const StatusIcon = config.icon;
              const isOverdue = pack.status === "overdue";

              return (
                <Card 
                  key={pack.id} 
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    isOverdue ? "border-destructive/50" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="mb-2">{pack.category}</Badge>
                        <CardTitle className="text-base">{pack.name}</CardTitle>
                      </div>
                      <Badge variant={config.badge}>
                        <StatusIcon className="mr-1 size-3" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{pack.progress}%</span>
                      </div>
                      <Progress 
                        value={pack.progress} 
                        className={`h-2 ${isOverdue ? "[&>div]:bg-destructive" : ""}`} 
                      />
                      <p className="text-xs text-muted-foreground">
                        {pack.completed_items} of {pack.total_items} items complete
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        <span>
                          {pack.due_date
                            ? `Due ${new Date(pack.due_date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}`
                            : "No due date"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        {pack.status === "complete" ? "View" : "Continue"}
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Evidence Pack Dialog */}
      <EvidencePackFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreatePack}
        mode="create"
      />
    </AppLayout>
  );
}
