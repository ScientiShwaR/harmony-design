import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Search, ShoppingCart, Package, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PermissionGate } from '@/core/rbac/PermissionGate';

interface Vendor {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string | null;
  title: string;
  description: string | null;
  total_amount: number;
  status: string;
  order_date: string;
  expected_delivery: string | null;
}

interface POFormData {
  title: string;
  description: string;
  vendor_id: string;
  expected_delivery: string;
  items: { name: string; quantity: number; unit_price: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  pending: 'outline',
  approved: 'default',
  ordered: 'default',
  received: 'default',
  cancelled: 'destructive',
};

export default function ProcurementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<POFormData>({
    title: '',
    description: '',
    vendor_id: '',
    expected_delivery: '',
    items: [{ name: '', quantity: 1, unit_price: 0 }],
  });

  // Fetch purchase orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  // Fetch vendors
  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, contact_person, email, phone')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Vendor[];
    },
  });

  // Create PO mutation
  const createMutation = useMutation({
    mutationFn: async (data: POFormData) => {
      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const poNumber = `PO-${format(new Date(), 'yyyyMMdd')}-${Date.now().toString().slice(-4)}`;

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          po_number: poNumber,
          title: data.title,
          description: data.description || null,
          vendor_id: data.vendor_id || null,
          total_amount: totalAmount,
          expected_delivery: data.expected_delivery || null,
          status: 'draft',
        }])
        .select()
        .single();

      if (poError) throw poError;

      if (data.items.length > 0 && data.items[0].name) {
        const items = data.items.filter(i => i.name).map(item => ({
          po_id: po.id,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase order');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order approved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      vendor_id: '',
      expected_delivery: '',
      items: [{ name: '', quantity: 1, unit_price: 0 }],
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unit_price: 0 }],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return '-';
    return vendors?.find(v => v.id === vendorId)?.name || 'Unknown';
  };

  const filteredOrders = orders?.filter(o =>
    o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.po_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
  const pendingCount = orders?.filter(o => ['draft', 'pending'].includes(o.status)).length || 0;

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
            <h1 className="text-2xl font-bold tracking-tight">Procurement</h1>
            <p className="text-muted-foreground">Manage purchase orders and vendors</p>
          </div>
          <PermissionGate permission="students.write">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase Order
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {!filteredOrders || filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No purchase orders found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.po_number}</TableCell>
                      <TableCell className="font-medium">{order.title}</TableCell>
                      <TableCell>{getVendorName(order.vendor_id)}</TableCell>
                      <TableCell>₹{Number(order.total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[order.status] as any}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(order.order_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {order.status === 'draft' && (
                            <PermissionGate permission="students.write">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => approveMutation.mutate(order.id)}
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </PermissionGate>
                          )}
                          <PermissionGate permission="students.write">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(order.id)}
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

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Office Supplies Q1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select
                  value={formData.vendor_id || '_none'}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, vendor_id: val === '_none' ? '' : val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No Vendor</SelectItem>
                    {vendors?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Order details..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    {formData.items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Total: ₹{formData.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.title}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
