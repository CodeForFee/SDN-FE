'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { orderService, Order } from '@/services/orderService';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Plus, CheckCircle, XCircle, Package, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [allocateOrderId, setAllocateOrderId] = useState<string | null>(null);
  const [allocateNotes, setAllocateNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [rejectByEVMDialogOpen, setRejectByEVMDialogOpen] = useState(false);
  const [rejectByEVMOrderId, setRejectByEVMOrderId] = useState<string | null>(null);
  const [rejectByEVMReason, setRejectByEVMReason] = useState('');
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleApprove = async (orderId: string) => {
    try {
      await orderService.approveOrder(orderId);
      toast.success('Order approved successfully');
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleReject = async () => {
    if (!rejectOrderId || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await orderService.rejectOrder(rejectOrderId, rejectReason);
      toast.success('Order rejected');
      setRejectDialogOpen(false);
      setRejectOrderId(null);
      setRejectReason('');
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleAllocate = async () => {
    if (!allocateOrderId) return;
    setAllocating(true);
    try {
      await orderService.allocateOrder(
        allocateOrderId,
        allocateNotes || undefined,
        expectedDelivery || undefined
      );
      toast.success('Order allocated successfully. Inventory reserved and transferred to dealer.');
      setAllocateDialogOpen(false);
      setAllocateOrderId(null);
      setAllocateNotes('');
      setExpectedDelivery('');
      const data = await orderService.getOrders();
      setOrders(data);
      // Auto switch to allocated filter if EVM Staff
      if (user?.role === 'EVMStaff') {
        setStatusFilter('allocated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to allocate order');
    } finally {
      setAllocating(false);
    }
  };

  const handleRejectByEVM = async () => {
    if (!rejectByEVMOrderId || !rejectByEVMReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await orderService.rejectOrderByEVM(rejectByEVMOrderId, rejectByEVMReason);
      toast.success('Order rejected by EVM Staff');
      setRejectByEVMDialogOpen(false);
      setRejectByEVMOrderId(null);
      setRejectByEVMReason('');
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject order');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      new: 'secondary',
      confirmed: 'default',
      allocated: 'default',
      invoiced: 'default',
      delivered: 'default',
      cancelled: 'destructive',
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
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">
              {user?.role === 'DealerManager' 
                ? 'Review and approve orders from staff' 
                : user?.role === 'DealerStaff'
                ? 'Manage your orders - track delivery and payments'
                : user?.role === 'EVMStaff'
                ? 'Review and allocate orders from dealers'
                : 'View all orders'}
            </p>
          </div>
          {/* Only DealerStaff can create new orders */}
          {user?.role === 'DealerStaff' && (
            <Link href="/orders/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </Link>
          )}
        </div>

        {/* EVM Staff: Show pending allocations alert */}
        {user?.role === 'EVMStaff' && orders.filter(o => o.status === 'confirmed').length > 0 && (
          <Card className="rounded-2xl shadow-md border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">
                    {orders.filter(o => o.status === 'confirmed').length} order(s) waiting for allocation
                  </p>
                  <p className="text-sm text-blue-700">
                    Please review and allocate vehicles from inventory for confirmed orders.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setStatusFilter('confirmed')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  View Confirmed Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Filter for EVM Staff */}
        {(user?.role === 'EVMStaff' || user?.role === 'Admin') && (
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All Orders
            </Button>
            <Button
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('confirmed')}
              className={statusFilter === 'confirmed' ? 'bg-blue-600' : ''}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Pending Allocation ({orders.filter(o => o.status === 'confirmed').length})
            </Button>
            <Button
              variant={statusFilter === 'allocated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('allocated')}
            >
              Allocated
            </Button>
          </div>
        )}

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders
                  .filter(order => {
                    if (statusFilter === 'all') return true;
                    if (statusFilter === 'confirmed') return order.status === 'confirmed';
                    if (statusFilter === 'allocated') return order.status === 'allocated';
                    return true;
                  })
                  .map((order, index) => {
                  const customer = typeof order.customer === 'object' ? order.customer : null;
                  const isPendingAllocation = order.status === 'confirmed' && (user?.role === 'EVMStaff' || user?.role === 'Admin');
                  return (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={isPendingAllocation ? 'bg-blue-50 hover:bg-blue-100' : ''}
                    >
                      <TableCell className="font-medium">
                        {order.orderNo || order._id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        {customer?.fullName || customer?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        ${(order.totalAmount || (order.items?.reduce((sum, item) => {
                          const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                          return sum + (unitPrice * item.qty);
                        }, 0) || 0)).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/orders/${order._id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          {/* Dealer Manager can approve/reject new orders */}
                          {user?.role === 'DealerManager' && order.status === 'new' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(order._id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectOrderId(order._id);
                                  setRejectDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {/* EVM Staff can allocate confirmed orders */}
                          {(user?.role === 'EVMStaff' || user?.role === 'Admin') && order.status === 'confirmed' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setAllocateOrderId(order._id);
                                  setAllocateDialogOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Allocate Now
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectByEVMOrderId(order._id);
                                  setRejectByEVMDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
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

        {/* Reject Order Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Reject Order</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this order
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
                setRejectOrderId(null);
              }}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleReject}>
                Reject Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Allocate Order Dialog (EVM Staff) */}
        <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Allocate Order</DialogTitle>
              <DialogDescription>
                Check inventory and allocate vehicles for this order. Inventory will be reserved and transferred to dealer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery">Expected Delivery Date (Optional)</Label>
                <Input
                  id="expectedDelivery"
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocateNotes">Notes (Optional)</Label>
                <Textarea
                  id="allocateNotes"
                  value={allocateNotes}
                  onChange={(e) => setAllocateNotes(e.target.value)}
                  placeholder="Add allocation notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAllocateDialogOpen(false);
                setAllocateNotes('');
                setExpectedDelivery('');
                setAllocateOrderId(null);
              }}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAllocate} disabled={allocating}>
                {allocating ? 'Allocating...' : 'Allocate Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Order by EVM Staff Dialog */}
        <Dialog open={rejectByEVMDialogOpen} onOpenChange={setRejectByEVMDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Reject Order</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this order from EVM side
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejectEVMReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectEVMReason"
                  value={rejectByEVMReason}
                  onChange={(e) => setRejectByEVMReason(e.target.value)}
                  placeholder="Enter reason for rejection (e.g., insufficient inventory)..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setRejectByEVMDialogOpen(false);
                setRejectByEVMReason('');
                setRejectByEVMOrderId(null);
              }}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleRejectByEVM}>
                Reject Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

