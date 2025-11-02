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
import { deliveryService, Delivery } from '@/services/deliveryService';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Truck, Eye, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DeliveriesPage() {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const deliveries = await deliveryService.getDeliveries();
        setDeliveries(Array.isArray(deliveries) ? deliveries : []);
      } catch (error) {
        console.error('Failed to fetch deliveries:', error);
        setDeliveries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();
    
    // Refresh deliveries every 5 seconds để cập nhật realtime
    const interval = setInterval(fetchDeliveries, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      delivered: 'default',
      in_progress: 'default',
      pending: 'secondary',
    };
    return variants[status] || 'secondary';
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: Delivery['status']) => {
    try {
      await deliveryService.updateDeliveryStatus(deliveryId, newStatus);
      toast.success(`Delivery status updated to ${newStatus}`);
      // Refresh deliveries
      const response = await deliveryService.getDeliveries();
      if (Array.isArray(response)) {
        setDeliveries(response);
      } else if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as any).data;
        setDeliveries(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update delivery status');
    }
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
            <h1 className="text-3xl font-bold">Delivery Tracking</h1>
            <p className="text-muted-foreground">
              {user?.role === 'DealerStaff' 
                ? 'Track all deliveries and update delivery status'
                : 'View and manage all deliveries'}
            </p>
          </div>
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No deliveries found
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery, index) => {
                    const order = typeof delivery.order === 'object' ? delivery.order : null;
                    const customer = order?.customer && typeof order.customer === 'object' ? order.customer : null;
                    
                    return (
                      <motion.tr
                        key={delivery._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <TableCell className="font-medium">
                          {order?.orderNo || (typeof delivery.order === 'string' ? delivery.order : 'N/A')}
                        </TableCell>
                        <TableCell>
                          {customer?.fullName || customer?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {delivery.address || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {delivery.scheduledAt ? new Date(delivery.scheduledAt).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(delivery.status)}>
                            {delivery.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(delivery.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order?._id && (
                              <Link href={`/orders/${order._id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Order
                                </Button>
                              </Link>
                            )}
                            {/* Dealer Staff can update delivery status */}
                            {user?.role === 'DealerStaff' && delivery.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(delivery._id, 'in_progress')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Start Delivery
                              </Button>
                            )}
                            {user?.role === 'DealerStaff' && delivery.status === 'in_progress' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(delivery._id, 'delivered')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Delivered
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

