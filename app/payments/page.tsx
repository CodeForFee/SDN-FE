'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { paymentService, Payment } from '@/services/paymentService';
import { customerService } from '@/services/customerService';
import { useAuthStore } from '@/stores/authStore';
import { DollarSign, CheckCircle, XCircle, Eye, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const typeLabel: Record<string, string> = {
  deposit: 'Đặt cọc',
  balance: 'Thanh toán còn lại',
  finance: 'Trả góp',
};

const methodLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  bank: 'Chuyển khoản',
  loan: 'Vay',
};

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    // Redirect if not authorized
    if (user?.role !== 'DealerManager' && user?.role !== 'Admin') {
      router.push('/orders');
      return;
    }
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayments();
      setPayments(data);
      
      // Fetch customer names for all payments
      await fetchCustomerNames(data);
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
      toast.error(error?.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerNames = async (payments: Payment[]) => {
    const customerIds = new Set<string>();
    
    // Collect all unique customer IDs
    payments.forEach((payment) => {
      if (typeof payment.order === 'object' && payment.order !== null) {
        const order = payment.order as any;
        if (order.customer && typeof order.customer === 'string') {
          customerIds.add(order.customer);
        }
      }
    });


    // Fetch customer details for each ID
    const names: Record<string, string> = {};

  // helper to validate Mongo ObjectId-like values (24 hex chars)
  const isValidObjectId = (id: any) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

  // Detect invalid IDs early so we can log and debug where they come from
  const allIds = Array.from(customerIds);
  const invalidIds = allIds.filter((id) => !id || id === 'undefined' || id === 'null' || !isValidObjectId(id));
    if (invalidIds.length > 0) {
      console.warn('[fetchCustomerNames] Found invalid customer IDs, skipping API calls for them:', invalidIds);
      // For easier tracing, log the payments that reference invalid ids (if any)
      const offendingPayments = payments.filter((p) => {
        if (typeof p.order === 'object' && p.order !== null) {
          const order = p.order as any;
          return order.customer && invalidIds.includes(String(order.customer));
        }
        return false;
      });
      console.warn('[fetchCustomerNames] Payments referencing invalid customer IDs:', offendingPayments);
    }

    await Promise.all(
      allIds
        // defensive: filter out invalid values like 'undefined' or 'null'
        .filter((id) => id && id !== 'undefined' && id !== 'null')
        .map(async (customerId) => {
          try {
            const customer = await customerService.getCustomerById(customerId);
            console.log(`[fetchCustomerNames] Customer ${customerId}:`, customer);
            names[customerId] = customer.fullName || customer.email || 'Unknown';
          } catch (error) {
            console.error(`[fetchCustomerNames] Failed to fetch customer ${customerId}:`, error);
            // ensure we handle unexpected values safely
            try {
              names[customerId] = customerId ? `Customer #${String(customerId).slice(-8)}` : 'Unknown Customer';
            } catch {
              names[customerId] = 'Unknown Customer';
            }
          }
        })
    );

    setCustomerNames(names);
  };

  const handleConfirmPayment = async (payment: Payment) => {
    try {
      setConfirmingPaymentId(payment._id);
      await paymentService.updatePaymentStatus(payment._id, 'confirmed');
      toast.success('Payment confirmed successfully');
      await fetchPayments();
      setConfirmDialogOpen(false);
      setSelectedPayment(null);
    } catch (error: any) {
      console.error('Failed to confirm payment:', error);
      toast.error(error?.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const handleOpenConfirmDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setConfirmDialogOpen(true);
  };

  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === 'all') return true;
    return payment.status === filterStatus;
  });

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length;

  // Get order info from payment
  const getOrderInfo = (payment: Payment) => {
    if (typeof payment.order === 'object' && payment.order !== null) {
      const order = payment.order as any;
      const orderNo = order.orderNo || `#${order._id?.slice(-8)}`;
      
      // Get customer name from fetched data or ID
      let customer = 'N/A';
      if (order.customer) {
        if (typeof order.customer === 'object') {
          customer = order.customer.fullName || order.customer.name || order.customer.email || 'N/A';
        } else if (typeof order.customer === 'string') {
          // Use fetched customer name from state
          const fetchedName = customerNames[order.customer];
          customer = fetchedName || 'Loading...';
        }
      }
      
      return { orderNo, customer };
    }
    return { orderNo: 'N/A', customer: 'N/A' };
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
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Manage and confirm customer payments</p>
          </div>
          <Button variant="outline" onClick={fetchPayments}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Alert for pending payments */}
        {pendingPaymentsCount > 0 && (
          <Card className="rounded-2xl shadow-md border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium">
                  You have <strong>{pendingPaymentsCount}</strong> pending payment(s) waiting for confirmation
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter buttons */}
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All ({payments.length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({pendingPaymentsCount})
          </Button>
          <Button
            variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('confirmed')}
          >
            Confirmed ({payments.filter((p) => p.status === 'confirmed').length})
          </Button>
          <Button
            variant={filterStatus === 'failed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('failed')}
          >
            Failed ({payments.filter((p) => p.status === 'failed').length})
          </Button>
        </div>

        {/* Payments table */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const orderInfo = getOrderInfo(payment);
                    return (
                      <TableRow key={payment._id}>
                        <TableCell>
                          <Link
                            href={`/orders/${typeof payment.order === 'object' && payment.order !== null ? payment.order._id : payment.order}`}
                            className="text-blue-600 hover:underline"
                          >
                            {orderInfo.orderNo}
                          </Link>
                        </TableCell>
                        <TableCell>{orderInfo.customer}</TableCell>
                        <TableCell>{typeLabel[payment.type] || payment.type}</TableCell>
                        <TableCell className="font-medium">
                          {payment.amount.toLocaleString()} VNĐ
                        </TableCell>
                        <TableCell>{methodLabel[payment.method] || payment.method}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link
                              href={`/orders/${typeof payment.order === 'object' && payment.order !== null ? payment.order._id : payment.order}`}
                            >
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {payment.status === 'pending' &&
                              (user?.role === 'DealerManager' || user?.role === 'Admin') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-600"
                                  onClick={() => handleOpenConfirmDialog(payment)}
                                  disabled={confirmingPaymentId === payment._id}
                                >
                                  {confirmingPaymentId === payment._id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Confirm Payment Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to confirm this payment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-2 py-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{selectedPayment.amount.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{typeLabel[selectedPayment.type] || selectedPayment.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-medium">
                    {methodLabel[selectedPayment.method] || selectedPayment.method}
                  </span>
                </div>
                {selectedPayment.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction Ref:</span>
                    <span className="font-medium">{selectedPayment.transactionRef}</span>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDialogOpen(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedPayment && handleConfirmPayment(selectedPayment)}
                disabled={confirmingPaymentId !== null}
              >
                {confirmingPaymentId ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

