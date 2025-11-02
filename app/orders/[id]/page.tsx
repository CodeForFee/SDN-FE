'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { orderService, Order } from '@/services/orderService';
import { deliveryService, Delivery } from '@/services/deliveryService';
import { paymentService, Payment } from '@/services/paymentService';
import { installmentPlanService, InstallmentPlan } from '@/services/installmentPlanService';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Package, Truck, DollarSign, FileText, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status'] | ''>('');
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [allocateNotes, setAllocateNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [rejectByEVMDialogOpen, setRejectByEVMDialogOpen] = useState(false);
  const [rejectByEVMReason, setRejectByEVMReason] = useState('');
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [installmentPlan, setInstallmentPlan] = useState<InstallmentPlan | null>(null);
  const [loadingInstallmentPlan, setLoadingInstallmentPlan] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ address: '', scheduledAt: '', notes: '' });
  const [paymentForm, setPaymentForm] = useState<{ type: 'deposit' | 'balance' | 'finance'; amount: number; method: 'cash' | 'bank' | 'loan'; transactionRef: string; notes: string }>({ 
    type: 'balance', 
    amount: 0, 
    method: 'cash', 
    transactionRef: '', 
    notes: '' 
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderById(params.id as string);
        setOrder(data);
        
        // Fetch delivery, payments, and installment plan
        if (params.id) {
          try {
            const [deliveriesData, paymentsData] = await Promise.all([
              deliveryService.getDeliveryByOrder(params.id as string),
              paymentService.getPaymentsByOrder(params.id as string)
            ]);
            setDelivery(deliveriesData.length > 0 ? deliveriesData[0] : null);
            setPayments(paymentsData);
            
            // Fetch installment plan if payment method is finance
            if (data.paymentMethod === 'finance') {
              try {
                setLoadingInstallmentPlan(true);
                const plan = await installmentPlanService.getInstallmentPlanByOrder(params.id as string);
                setInstallmentPlan(plan);
              } catch (error: any) {
                // Plan might not exist yet, that's okay
                if (error.response?.status !== 404) {
                  console.error('Failed to fetch installment plan:', error);
                }
              } finally {
                setLoadingInstallmentPlan(false);
              }
            }
          } catch (error) {
            console.error('Failed to fetch delivery/payments:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const handleApprove = async () => {
    try {
      await orderService.approveOrder(order!._id);
      toast.success('Order approved successfully');
      const data = await orderService.getOrderById(order!._id);
      setOrder(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a rejection reason:');
    if (!reason) return;
    try {
      await orderService.rejectOrder(order!._id, reason);
      toast.success('Order rejected');
      const data = await orderService.getOrderById(order!._id);
      setOrder(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleAllocate = async () => {
    if (!order) return;
    setAllocating(true);
    try {
      await orderService.allocateOrder(
        order._id,
        allocateNotes || undefined,
        expectedDelivery || undefined
      );
      toast.success('Order allocated successfully. Inventory reserved and transferred to dealer.');
      setAllocateDialogOpen(false);
      setAllocateNotes('');
      setExpectedDelivery('');
      const data = await orderService.getOrderById(order._id);
      setOrder(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to allocate order');
    } finally {
      setAllocating(false);
    }
  };

  const handleRejectByEVM = async () => {
    if (!order || !rejectByEVMReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await orderService.rejectOrderByEVM(order._id, rejectByEVMReason);
      toast.success('Order rejected by EVM Staff');
      setRejectByEVMDialogOpen(false);
      setRejectByEVMReason('');
      const data = await orderService.getOrderById(order._id);
      setOrder(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleCreateDelivery = async () => {
    if (!order) return;
    try {
      const newDelivery = await deliveryService.createDelivery({
        order: order._id,
        address: deliveryForm.address || undefined,
        scheduledAt: deliveryForm.scheduledAt || undefined,
        notes: deliveryForm.notes || undefined,
      });
      toast.success('Delivery created successfully');
      setDelivery(newDelivery);
      setDeliveryDialogOpen(false);
      setDeliveryForm({ address: '', scheduledAt: '', notes: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create delivery');
    }
  };

  const handleUpdateDeliveryStatus = async (status: Delivery['status']) => {
    if (!delivery || !order) return;
    try {
      const updated = await deliveryService.updateDeliveryStatus(delivery._id, status);
      toast.success('Delivery status updated');
      setDelivery(updated);
      
      // Nếu delivered, tự động update order status
      if (status === 'delivered' && order.status !== 'delivered') {
        await orderService.updateOrderStatus(order._id, 'delivered');
        const data = await orderService.getOrderById(order._id);
        setOrder(data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update delivery status');
    }
  };

  const handleCreatePayment = async () => {
    if (!order || !paymentForm.amount) {
      toast.error('Please enter payment amount');
      return;
    }
    try {
      const newPayment = await paymentService.createPayment({
        order: order._id,
        type: paymentForm.type,
        amount: paymentForm.amount,
        method: paymentForm.method,
        transactionRef: paymentForm.transactionRef || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast.success('Payment recorded successfully');
      const paymentsData = await paymentService.getPaymentsByOrder(order._id);
      setPayments(paymentsData);
      setPaymentDialogOpen(false);
      setPaymentForm({ type: 'balance', amount: 0, method: 'cash', transactionRef: '', notes: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create payment');
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === order?.status) return;
    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(order!._id, newStatus as Order['status']);
      toast.success('Order status updated');
      const data = await orderService.getOrderById(order!._id);
      setOrder(data);
      setNewStatus('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
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

  if (!order) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Order not found</p>
        </div>
      </MainLayout>
    );
  }

  const customer = typeof order.customer === 'object' ? order.customer : null;
  const totalAmount = order.items?.reduce((sum, item) => {
    return sum + (typeof item.unitPrice === 'number' ? item.unitPrice : 0) * item.qty;
  }, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">
              Order {order.orderNo || `#${order._id.slice(-8)}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={getStatusBadge(order.status)} className="text-lg px-4 py-2">
              {order.status}
            </Badge>
            {/* Dealer Manager can approve/reject new orders */}
            {user?.role === 'DealerManager' && order.status === 'new' && (
              <div className="flex gap-2">
                <Button onClick={handleApprove} variant="outline" className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button onClick={handleReject} variant="outline" className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
            {/* EVM Staff can allocate confirmed orders */}
            {(user?.role === 'EVMStaff' || user?.role === 'Admin') && order.status === 'confirmed' && (
              <div className="flex gap-2">
                <Button onClick={() => setAllocateDialogOpen(true)} variant="outline" className="text-blue-600">
                  <Package className="mr-2 h-4 w-4" />
                  Allocate
                </Button>
                <Button onClick={() => setRejectByEVMDialogOpen(true)} variant="outline" className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
            {/* Dealer Staff can mark as invoiced after allocation */}
            {user?.role === 'DealerStaff' && order.status === 'allocated' && (
              <Button 
                onClick={async () => {
                  if (!order) return;
                  setUpdatingStatus(true);
                  try {
                    await orderService.updateOrderStatus(order._id, 'invoiced');
                    toast.success('Order marked as invoiced');
                    const data = await orderService.getOrderById(order._id);
                    setOrder(data);
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to update status');
                  } finally {
                    setUpdatingStatus(false);
                  }
                }}
                variant="outline" 
                className="text-purple-600 hover:text-purple-700"
                disabled={updatingStatus}
              >
                <FileText className="mr-2 h-4 w-4" />
                {updatingStatus ? 'Updating...' : 'Mark as Invoiced'}
              </Button>
            )}
            {/* Dealer Staff can mark as delivered after invoiced */}
            {user?.role === 'DealerStaff' && order.status === 'invoiced' && (
              <Button 
                onClick={async () => {
                  if (!order) return;
                  setUpdatingStatus(true);
                  try {
                    // Nếu chưa có delivery record, tự động tạo một delivery mặc định
                    if (!delivery) {
                      try {
                        const newDelivery = await deliveryService.createDelivery({
                          order: order._id,
                          address: 'Address will be updated',
                          notes: 'Auto-created when marking order as delivered'
                        });
                        setDelivery(newDelivery);
                        // Tự động update delivery status = delivered
                        await deliveryService.updateDeliveryStatus(newDelivery._id, 'delivered');
                        toast.success('Delivery record created and marked as delivered');
                      } catch (deliveryError: any) {
                        console.error('Failed to create delivery:', deliveryError);
                        // Vẫn tiếp tục update order status nếu tạo delivery thất bại
                      }
                    } else if (delivery.status !== 'delivered') {
                      // Nếu đã có delivery nhưng chưa delivered, update delivery status
                      await deliveryService.updateDeliveryStatus(delivery._id, 'delivered');
                      const updatedDelivery = await deliveryService.getDeliveryByOrder(order._id);
                      setDelivery(updatedDelivery.length > 0 ? updatedDelivery[0] : null);
                    }
                    
                    // Update order status
                    await orderService.updateOrderStatus(order._id, 'delivered');
                    toast.success('Order marked as delivered');
                    const data = await orderService.getOrderById(order._id);
                    setOrder(data);
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to update status');
                  } finally {
                    setUpdatingStatus(false);
                  }
                }}
                variant="outline" 
                className="text-green-600 hover:text-green-700"
                disabled={updatingStatus}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {updatingStatus ? 'Updating...' : 'Mark as Delivered'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{customer?.fullName || customer?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{customer?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{customer?.email || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-muted-foreground">Payment Method:</span>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>
              {order.deposit && (
                <div>
                  <span className="text-muted-foreground">Deposit:</span>
                  <p className="font-medium">${order.deposit.toLocaleString()}</p>
                </div>
              )}
              {order.expectedDelivery && (
                <div>
                  <span className="text-muted-foreground">Expected Delivery:</span>
                  <p className="font-medium">{new Date(order.expectedDelivery).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item, index) => {
                const variant = typeof item.variant === 'object' ? item.variant : null;
                const color = typeof item.color === 'object' ? item.color : null;
                const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-2xl">
                    <div>
                      <p className="font-medium">{variant?.trim || 'N/A'}</p>
                      {color && <p className="text-sm text-muted-foreground">Color: {color.name}</p>}
                      <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(unitPrice * item.qty).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">${unitPrice.toLocaleString()} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span>${(order.totalAmount || totalAmount).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Tracking Section (Dealer Staff & Manager) */}
        {(user?.role === 'DealerStaff' || user?.role === 'DealerManager') && (order.status === 'allocated' || order.status === 'invoiced' || order.status === 'delivered') && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {delivery ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={delivery.status === 'delivered' ? 'default' : delivery.status === 'in_progress' ? 'default' : 'secondary'}>
                        {delivery.status}
                      </Badge>
                    </div>
                    {delivery.address && (
                      <div>
                        <span className="text-muted-foreground">Address:</span>
                        <p className="font-medium">{delivery.address}</p>
                      </div>
                    )}
                    {delivery.scheduledAt && (
                      <div>
                        <span className="text-muted-foreground">Scheduled:</span>
                        <p className="font-medium">{new Date(delivery.scheduledAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {delivery.status === 'pending' && (
                      <Button onClick={() => handleUpdateDeliveryStatus('in_progress')} variant="outline" size="sm">
                        Start Delivery
                      </Button>
                    )}
                    {delivery.status === 'in_progress' && (
                      <Button onClick={() => handleUpdateDeliveryStatus('delivered')} variant="outline" size="sm" className="text-green-600">
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">No delivery record yet. Create one when ready to deliver.</p>
                  <Button onClick={() => setDeliveryDialogOpen(true)} variant="outline" size="sm">
                    <Truck className="mr-2 h-4 w-4" />
                    Create Delivery
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Section (Dealer Staff) */}
        {user?.role === 'DealerStaff' && (order.status === 'delivered' || payments.length > 0) && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{payment.type} - ${payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.method} - {payment.status}
                        </p>
                        {payment.paidAt && (
                          <p className="text-xs text-muted-foreground">
                            Paid: {new Date(payment.paidAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={payment.status === 'confirmed' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No payment records yet.</p>
              )}
              
              <Button onClick={() => setPaymentDialogOpen(true)} variant="outline" size="sm">
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Installment Plan Section (for finance payment method) */}
        {order.paymentMethod === 'finance' && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Installment Payment Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingInstallmentPlan ? (
                <p className="text-muted-foreground">Loading installment plan...</p>
              ) : installmentPlan ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">${installmentPlan.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Amount</p>
                      <p className="font-semibold text-green-600">${installmentPlan.paidAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-orange-600">${installmentPlan.remainingAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={installmentPlan.status === 'completed' ? 'default' : 'secondary'}>
                        {installmentPlan.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Payment Schedule ({installmentPlan.installmentCount} installments)</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {installmentPlan.payments.map((payment, index) => (
                        <div
                          key={payment._id || index}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            payment.status === 'paid' ? 'bg-green-50 border-green-200' :
                            payment.status === 'overdue' ? 'bg-red-50 border-red-200' :
                            'bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">#{payment.installmentNumber}</span>
                              <Badge 
                                variant={
                                  payment.status === 'paid' ? 'default' :
                                  payment.status === 'overdue' ? 'destructive' : 'secondary'
                                }
                              >
                                {payment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                            {payment.paidAt && (
                              <p className="text-xs text-muted-foreground">
                                Paid: {new Date(payment.paidAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">Installment plan not created yet.</p>
                  <p className="text-sm text-muted-foreground">
                    The plan will be automatically created when the order is approved.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Update Status Section (only for Dealer Staff - they handle delivery status) */}
        {user?.role === 'DealerStaff' && order.status !== 'cancelled' && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Update Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select
                  value={newStatus || order.status}
                  onValueChange={(value) => setNewStatus(value as Order['status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {order.status === 'new' && (
                      <>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </>
                    )}
                    {/* DealerStaff cannot update to allocated - only EVM Staff can allocate */}
                    {/* Removed: order.status === 'confirmed' && allocated option */}
                    {order.status === 'allocated' && (
                      <>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </>
                    )}
                    {order.status === 'invoiced' && (
                      <SelectItem value="delivered">Delivered</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {newStatus && newStatus !== order.status && (
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                  className="w-full"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

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
              }}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleRejectByEVM}>
                Reject Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Delivery Dialog */}
        <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create Delivery</DialogTitle>
              <DialogDescription>
                Create a delivery record for this order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address (Optional)</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryForm.address}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                  placeholder="Enter delivery address..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled Date (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={deliveryForm.scheduledAt}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, scheduledAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryNotes">Notes (Optional)</Label>
                <Textarea
                  id="deliveryNotes"
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  placeholder="Add delivery notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDeliveryDialogOpen(false);
                setDeliveryForm({ address: '', scheduledAt: '', notes: '' });
              }}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateDelivery}>
                Create Delivery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for this order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select
                  value={paymentForm.type}
                  onValueChange={(value: 'deposit' | 'balance' | 'finance') => setPaymentForm({ ...paymentForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentForm.amount || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  placeholder="Enter payment amount"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(value: 'cash' | 'bank' | 'loan') => setPaymentForm({ ...paymentForm, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionRef">Transaction Reference (Optional)</Label>
                <Input
                  id="transactionRef"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  placeholder="Enter transaction reference..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Add payment notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setPaymentDialogOpen(false);
                setPaymentForm({ type: 'balance', amount: 0, method: 'cash', transactionRef: '', notes: '' });
              }}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCreatePayment}>
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

