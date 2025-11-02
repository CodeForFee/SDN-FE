'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { vehicleRequestService, VehicleRequest, VehicleRequestItem, CreateVehicleRequestRequest } from '@/services/vehicleRequestService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { vehicleColorService, VehicleColor } from '@/services/vehicleColorService';
import { useAuthStore } from '@/stores/authStore';
import { Plus, CheckCircle, XCircle, X, Eye, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function VehicleRequestsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<VehicleRequestItem[]>([]);
  const [formData, setFormData] = useState<CreateVehicleRequestRequest>({
    items: [],
    notes: '',
  });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);

  useEffect(() => {
    // Redirect DealerStaff away from this page
    if (user?.role === 'DealerStaff') {
      router.push('/orders');
      return;
    }
    fetchRequests();
    if (user?.role === 'DealerManager' || user?.role === 'EVMStaff' || user?.role === 'Admin') {
      fetchVehicleData();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const data = await vehicleRequestService.getVehicleRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load vehicle requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleData = async () => {
    try {
      const [vehiclesData, colorsData] = await Promise.all([
        vehicleService.getVehicles(),
        vehicleColorService.list(),
      ]);
      setVehicles(vehiclesData);
      setColors(colorsData);
    } catch (error) {
      console.error('Failed to fetch vehicle data:', error);
    }
  };

  const addItem = () => {
    setItems([...items, {
      variant: '',
      color: '',
      quantity: 1,
      reason: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof VehicleRequestItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    try {
      // Ensure variant and color are strings (IDs), not objects
      const itemsToSend = items.map(item => ({
        variant: typeof item.variant === 'string' ? item.variant : (item.variant as any)?._id || item.variant,
        color: item.color ? (typeof item.color === 'string' ? item.color : (item.color as any)?._id || item.color) : undefined,
        quantity: item.quantity,
        reason: item.reason || undefined,
      }));
      
      await vehicleRequestService.createVehicleRequest({
        items: itemsToSend,
        notes: formData.notes,
      });
      toast.success('Vehicle request created successfully');
      setOpen(false);
      setItems([]);
      setFormData({ items: [], notes: '' });
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create request');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await vehicleRequestService.approveVehicleRequest(id);
      toast.success('Request approved successfully');
      fetchRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve request';
      
      // Show specific error message for insufficient inventory
      if (errorMessage.includes('Insufficient inventory')) {
        toast.error(errorMessage, {
          description: 'Please check inventory and update stock before approving.',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleReject = async () => {
    if (!rejectRequestId || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await vehicleRequestService.rejectVehicleRequest(rejectRequestId, rejectReason);
      toast.success('Request rejected');
      setRejectDialogOpen(false);
      setRejectRequestId(null);
      setRejectReason('');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await vehicleRequestService.cancelVehicleRequest(id);
      toast.success('Request cancelled successfully');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      fulfilled: 'default',
      cancelled: 'secondary',
    };
    return variants[status] || 'secondary';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vehicle Requests</h1>
            <p className="text-muted-foreground">
              {user?.role === 'EVMStaff' || user?.role === 'Admin' 
                ? 'Manage vehicle requests from dealers'
                : 'Request vehicles from EVM'}
            </p>
          </div>
          {(user?.role === 'DealerManager' || user?.role === 'DealerStaff') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setItems([]); setFormData({ items: [], notes: '' }); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Create Vehicle Request</DialogTitle>
                    <DialogDescription>
                      Request vehicles from EVM for your dealership
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>

                      {items.map((item, index) => {
                        const vehicle = vehicles.find(v => v._id === item.variant);
                        const vehicleModel = typeof vehicle?.model === 'object' ? vehicle.model : null;
                        
                        return (
                          <Card key={index} className="rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Item {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Vehicle Variant *</Label>
                                <Select
                                  value={typeof item.variant === 'string' ? item.variant : ''}
                                  onValueChange={(value) => updateItem(index, 'variant', value)}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicles.map((v) => {
                                      const modelName = typeof v.model === 'object' ? v.model?.name : 'Unknown';
                                      return (
                                        <SelectItem key={v._id} value={v._id}>
                                          {modelName} - {v.trim}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Color</Label>
                                <Select
                                  value={typeof item.color === 'string' ? item.color : ''}
                                  onValueChange={(value) => updateItem(index, 'color', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colors.map((color) => (
                                      <SelectItem key={color._id} value={color._id}>
                                        {color.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Quantity *</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Reason</Label>
                                <Input
                                  value={item.reason || ''}
                                  onChange={(e) => updateItem(index, 'reason', e.target.value)}
                                  placeholder="Reason for request"
                                />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={items.length === 0}>
                      Submit Request
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request No.</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request, index) => {
                  const dealer = typeof request.dealer === 'object' ? request.dealer : null;
                  return (
                    <motion.tr
                      key={request._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium">
                        {request.requestNo || `#${request._id.slice(-8)}`}
                      </TableCell>
                      <TableCell>
                        {dealer?.name || 'N/A'}
                        {dealer?.region && (
                          <div className="text-sm text-muted-foreground">{dealer.region}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>{request.items?.length || 0} item(s)</div>
                          {(user?.role === 'EVMStaff' || user?.role === 'Admin' || user?.role === 'DealerManager') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setViewDialogOpen(true);
                              }}
                              className="h-6 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.requestedAt 
                          ? new Date(request.requestedAt).toLocaleDateString()
                          : new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Cancel button - Only for DealerManager, when pending */}
                          {user?.role === 'DealerManager' && request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(request._id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}

                          {/* Approve/Reject buttons - For EVMStaff/Admin, only when pending */}
                          {(user?.role === 'EVMStaff' || user?.role === 'Admin') && request.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(request._id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectRequestId(request._id);
                                  setRejectDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Request Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vehicle Request Details</DialogTitle>
              <DialogDescription>
                {selectedRequest?.requestNo || `Request #${selectedRequest?._id.slice(-8)}`}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 py-4">
                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dealer</Label>
                    <p className="font-medium">
                      {typeof selectedRequest.dealer === 'object' ? selectedRequest.dealer?.name : 'N/A'}
                    </p>
                    {typeof selectedRequest.dealer === 'object' && selectedRequest.dealer?.region && (
                      <p className="text-sm text-muted-foreground">{selectedRequest.dealer.region}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>
                      <Badge variant={getStatusBadge(selectedRequest.status)}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Requested By</Label>
                    <p className="font-medium">
                      {typeof selectedRequest.requestedBy === 'object' 
                        ? selectedRequest.requestedBy?.profile?.name || selectedRequest.requestedBy?.email
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Requested At</Label>
                    <p className="font-medium">
                      {selectedRequest.requestedAt 
                        ? new Date(selectedRequest.requestedAt).toLocaleString()
                        : new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedRequest.reviewedBy && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Reviewed By</Label>
                        <p className="font-medium">
                          {typeof selectedRequest.reviewedBy === 'object'
                            ? selectedRequest.reviewedBy?.profile?.name || selectedRequest.reviewedBy?.email
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Reviewed At</Label>
                        <p className="font-medium">
                          {selectedRequest.reviewedAt 
                            ? new Date(selectedRequest.reviewedAt).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Rejection Reason</Label>
                      <p className="text-red-600 bg-red-50 p-3 rounded-lg mt-1">
                        {selectedRequest.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Requested Items
                  </Label>
                  <div className="space-y-3">
                    {selectedRequest.items?.map((item, index) => {
                      const variant: any = typeof item.variant === 'object' ? item.variant : null;
                      const color: any = typeof item.color === 'object' ? item.color : null;
                      const variantModel: any = variant?.model || null;
                      
                      // Get model name
                      let modelName = 'Unknown Model';
                      if (variantModel) {
                        if (typeof variantModel === 'object' && variantModel.name) {
                          modelName = variantModel.name;
                          if (variantModel.brand) {
                            modelName = `${variantModel.brand} ${modelName}`;
                          }
                        } else if (typeof variantModel === 'string') {
                          modelName = variantModel;
                        }
                      }
                      
                      return (
                        <Card key={index} className="rounded-2xl p-4 border-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Item {index + 1}</Badge>
                                <span className="font-semibold text-lg">
                                  {modelName} - {variant?.trim || 'N/A'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <Label className="text-muted-foreground text-xs">Color</Label>
                                  <p className="font-medium">
                                    {color?.name || 'Any'}
                                    {color?.code && <span className="text-muted-foreground ml-2">({color.code})</span>}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground text-xs">Quantity</Label>
                                  <p className="font-medium text-lg">{item.quantity} units</p>
                                </div>
                                {item.reason && (
                                  <div className="col-span-2">
                                    <Label className="text-muted-foreground text-xs">Reason</Label>
                                    <p className="text-sm mt-1">{item.reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-2 p-3 bg-muted rounded-lg">{selectedRequest.notes}</p>
                  </div>
                )}

                {/* Logs */}
                {selectedRequest.logs && selectedRequest.logs.length > 0 && (
                  <div>
                    <Label className="text-lg font-semibold mb-4">Activity Log</Label>
                    <div className="space-y-2">
                      {selectedRequest.logs.map((log, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">{log.note}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>{new Date(log.at).toLocaleString()}</p>
                            <p>by {log.by}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Request Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Reject Vehicle Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
                setRejectRequestId(null);
              }}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleReject}>
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

