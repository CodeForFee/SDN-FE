'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { dashboardService } from '@/services/dashboardService';
import { orderService, Order } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { useAuthStore } from '@/stores/authStore';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, Clock, FileText, CheckCircle, ArrowRight, Plus, Eye, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any>({
    pendingPayments: 0,
    pendingOrders: 0,
    pendingAllocations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Dashboard] Fetching data for role:', user?.role);
        
        // Fetch summary and trends
        if (user?.role === 'DealerStaff') {
          const trendsData = await dashboardService.getTrends();
          try {
            const personalStats: any = await dashboardService.getPersonalStats();
            console.log('[Dashboard] Personal stats:', personalStats);
            // Personal stats có structure: { summary: { totalOrders, ... }, ordersByStatus, ... }
            const normalizedSummary = (personalStats as any).summary 
              ? {
                  ...(personalStats as any).summary,
                  ordersByStatus: (personalStats as any).summary.ordersByStatus || personalStats.ordersByStatus || {},
                }
              : personalStats;
            setSummary(normalizedSummary);
          } catch (e) {
            console.error('[Dashboard] Failed to get personal stats:', e);
            setSummary({
              totalOrders: 0,
              totalCustomers: 0,
              ordersByStatus: {},
            });
          }
          setTrends(trendsData);
        } else {
          const [summaryData, trendsData] = await Promise.all([
            dashboardService.getSummary().catch((err) => {
              console.error('[Dashboard] Failed to get summary:', err);
              return { totalOrders: 0, delivered: 0, totalCustomers: 0, ordersByStatus: {} };
            }),
            dashboardService.getTrends(),
          ]);
          console.log('[Dashboard] Summary data:', summaryData);
          console.log('[Dashboard] Trends data:', trendsData);
          
          // Ensure ordersByStatus exists
          if (!summaryData.ordersByStatus) {
            summaryData.ordersByStatus = {};
          }
          
          setSummary(summaryData);
          setTrends(trendsData);
        }

        // Fetch recent orders (latest 5) and calculate all stats if needed
        try {
          const orders = await orderService.getOrders();
          console.log('[Dashboard] Fetched orders:', orders.length);
          console.log('[Dashboard] Sample order:', orders[0]);
          
          const sortedOrders = orders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecentOrders(sortedOrders.slice(0, 5));
          
          // Calculate all stats from orders if summary is missing or incomplete
          setSummary((prev: any) => {
            const currentSummary = prev || {};
            
            // Always recalculate from orders if we have orders data
            // This ensures data is accurate even if API returned 0 or missing values
            const calculatedTotalOrders = orders.length;
            const calculatedDelivered = orders.filter((o: any) => o.status === 'delivered').length;
            
            // Calculate ordersByStatus from orders
            const statusCount: Record<string, number> = {};
            orders.forEach((order: any) => {
              const status = order.status || 'unknown';
              statusCount[status] = (statusCount[status] || 0) + 1;
            });
            
            // Calculate unique customers
            const uniqueCustomers = new Set();
            orders.forEach((order: any) => {
              const customerId = typeof order.customer === 'object' 
                ? order.customer?._id 
                : order.customer;
              if (customerId) {
                uniqueCustomers.add(customerId.toString());
              }
            });
            const calculatedTotalCustomers = uniqueCustomers.size;
            
            // Always use calculated values from orders as they are the source of truth
            // This ensures accurate data even if API has delays or caching issues
            const totalOrders = calculatedTotalOrders > 0 ? calculatedTotalOrders : (currentSummary.totalOrders || 0);
            const delivered = calculatedDelivered;
            const ordersByStatus = Object.keys(statusCount).length > 0 ? statusCount : (currentSummary.ordersByStatus || {});
            const totalCustomers = calculatedTotalCustomers > 0 ? calculatedTotalCustomers : (currentSummary.totalCustomers || 0);
            
            const updatedSummary = {
              ...currentSummary,
              totalOrders,
              delivered,
              ordersByStatus,
              totalCustomers,
            };
            
            console.log('[Dashboard] Calculated stats from orders:', {
              totalOrders: calculatedTotalOrders,
              delivered: calculatedDelivered,
              ordersByStatus: statusCount,
              totalCustomers: calculatedTotalCustomers,
            });
            console.log('[Dashboard] Final summary:', updatedSummary);
            return updatedSummary;
          });
        } catch (error) {
          console.error('[Dashboard] Failed to fetch recent orders:', error);
        }

        // Fetch pending tasks based on role
        try {
          if (user?.role === 'DealerManager') {
            // Pending payments to confirm
            const payments = await paymentService.getPayments();
            const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
            
            // Pending orders to approve
            const orders = await orderService.getOrders();
            const pendingOrders = orders.filter((o: any) => o.status === 'new').length;
            
            setPendingTasks({
              pendingPayments,
              pendingOrders,
            });
          } else if (user?.role === 'EVMStaff') {
            // Pending orders to allocate
            const orders = await orderService.getOrders();
            const pendingAllocations = orders.filter((o: any) => o.status === 'confirmed').length;
            
            setPendingTasks({
              pendingAllocations,
            });
          } else if (user?.role === 'DealerStaff') {
            // Pending deliveries to update
            const orders = await orderService.getOrders();
            const pendingDeliveries = orders.filter((o: any) => 
              o.status === 'invoiced' || o.status === 'allocated'
            ).length;
            
            setPendingTasks({
              pendingDeliveries,
            });
          }
        } catch (error) {
          console.error('Failed to fetch pending tasks:', error);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Helper to safely get value with multiple fallbacks
  const getValue = (key: string) => {
    if (!summary) return 0;
    return summary[key as keyof typeof summary] ?? 
           (summary as any).summary?.[key] ?? 
           0;
  };

  const stats = [
    {
      title: 'Total Orders',
      value: getValue('totalOrders'),
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100/20',
    },
    {
      title: 'Delivered',
      value: getValue('delivered'),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100/20',
    },
    {
      title: 'Customers',
      value: getValue('totalCustomers'),
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100/20',
    },
  ];
  
  // Debug log
  console.log('[Dashboard] Current summary:', summary);
  console.log('[Dashboard] Stats values:', stats.map(s => ({ title: s.title, value: s.value })));

  // Get ordersByStatus with fallback
  const ordersByStatusData = summary?.ordersByStatus ?? summary?.summary?.ordersByStatus ?? {};
  const hasOrdersByStatus = Object.keys(ordersByStatusData).length > 0;

  const totalPendingTasks = Object.values(pendingTasks).reduce((sum: number, val: any) => sum + (val || 0), 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'secondary',
      confirmed: 'default',
      allocated: 'default',
      invoiced: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    };
    return variants[status] || 'outline';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Welcome back, <span className="font-semibold">{user?.profile?.name || user?.email}</span>
            </p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'DealerStaff' && (
              <>
                <Button onClick={() => router.push('/quotes/new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Quote
                </Button>
                <Button onClick={() => router.push('/orders/new')} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </>
            )}
            {user?.role === 'DealerManager' && (
              <Button onClick={() => router.push('/vehicle-requests')} className="gap-2">
                <Plus className="h-4 w-4" />
                Request Vehicles
              </Button>
            )}
          </div>
        </div>

        {/* Pending Tasks Alert */}
        {totalPendingTasks > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-2xl shadow-lg border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        {totalPendingTasks} pending task(s) require your attention
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-orange-800 dark:text-orange-200">
                        {pendingTasks.pendingPayments > 0 && (
                          <Link href="/payments" className="hover:underline">
                            {pendingTasks.pendingPayments} payment(s) to confirm
                          </Link>
                        )}
                        {pendingTasks.pendingOrders > 0 && (
                          <Link href="/orders" className="hover:underline">
                            {pendingTasks.pendingOrders} order(s) to approve
                          </Link>
                        )}
                        {pendingTasks.pendingAllocations > 0 && (
                          <Link href="/orders" className="hover:underline">
                            {pendingTasks.pendingAllocations} order(s) to allocate
                          </Link>
                        )}
                        {pendingTasks.pendingDeliveries > 0 && (
                          <Link href="/deliveries" className="hover:underline">
                            {pendingTasks.pendingDeliveries} delivery(ies) to update
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/orders')}>
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className={`rounded-2xl shadow-lg border-0 bg-gradient-to-br ${stat.gradient} text-white hover:shadow-xl transition-all duration-300`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">{stat.title}</CardTitle>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    {stat.title === 'Total Orders' && (summary?.pendingOrders || summary?.summary?.pendingOrders) && (
                      <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {(summary?.pendingOrders || summary?.summary?.pendingOrders)} pending approval
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="text-xl font-semibold">Recent Orders</CardTitle>
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => {
                      const customerName = typeof order.customer === 'object' 
                        ? order.customer?.fullName || order.customer?.name || 'N/A'
                        : 'N/A';
                      return (
                        <Link key={order._id} href={`/orders/${order._id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{order.orderNo || `#${order._id.slice(-8)}`}</p>
                                <Badge variant={getStatusBadge(order.status)} className="text-xs">
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{customerName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {order.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0} item(s)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Order Trend (30 Days)</CardTitle>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends?.orderTrend || []}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#colorOrders)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions & Orders by Status */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {user?.role === 'DealerStaff' && (
                    <>
                      <Button onClick={() => router.push('/quotes/new')} className="h-20 flex-col gap-2" variant="outline">
                        <FileText className="h-6 w-6" />
                        <span className="text-sm">New Quote</span>
                      </Button>
                      <Button onClick={() => router.push('/orders/new')} className="h-20 flex-col gap-2" variant="outline">
                        <ShoppingCart className="h-6 w-6" />
                        <span className="text-sm">New Order</span>
                      </Button>
                      <Button onClick={() => router.push('/customers/new')} className="h-20 flex-col gap-2" variant="outline">
                        <Users className="h-6 w-6" />
                        <span className="text-sm">New Customer</span>
                      </Button>
                      <Button onClick={() => router.push('/deliveries')} className="h-20 flex-col gap-2" variant="outline">
                        <Package className="h-6 w-6" />
                        <span className="text-sm">Deliveries</span>
                      </Button>
                    </>
                  )}
                  {user?.role === 'DealerManager' && (
                    <>
                      <Button onClick={() => router.push('/vehicle-requests')} className="h-20 flex-col gap-2" variant="outline">
                        <Package className="h-6 w-6" />
                        <span className="text-sm">Request Vehicles</span>
                      </Button>
                      <Button onClick={() => router.push('/payments')} className="h-20 flex-col gap-2" variant="outline">
                        <CheckCircle className="h-6 w-6" />
                        <span className="text-sm">Payments</span>
                      </Button>
                      <Button onClick={() => router.push('/quotes')} className="h-20 flex-col gap-2" variant="outline">
                        <FileText className="h-6 w-6" />
                        <span className="text-sm">Quotes</span>
                      </Button>
                      <Button onClick={() => router.push('/reports')} className="h-20 flex-col gap-2" variant="outline">
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-sm">Reports</span>
                      </Button>
                    </>
                  )}
                  {user?.role === 'EVMStaff' && (
                    <>
                      <Button onClick={() => router.push('/orders')} className="h-20 flex-col gap-2" variant="outline">
                        <ShoppingCart className="h-6 w-6" />
                        <span className="text-sm">Allocate Orders</span>
                      </Button>
                      <Button onClick={() => router.push('/vehicle-requests')} className="h-20 flex-col gap-2" variant="outline">
                        <CheckCircle className="h-6 w-6" />
                        <span className="text-sm">Vehicle Requests</span>
                      </Button>
                      <Button onClick={() => router.push('/inventory')} className="h-20 flex-col gap-2" variant="outline">
                        <Package className="h-6 w-6" />
                        <span className="text-sm">Inventory</span>
                      </Button>
                      <Button onClick={() => router.push('/reports')} className="h-20 flex-col gap-2" variant="outline">
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-sm">Reports</span>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Orders by Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Orders by Status</CardTitle>
                  <Package className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                {!hasOrdersByStatus ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Package className="h-12 w-12 mb-3 opacity-50" />
                    <p>No order status data available</p>
                    <p className="text-xs mt-1">Orders will appear here once created</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(ordersByStatusData).map(([name, value]) => ({ 
                      name: String(name).charAt(0).toUpperCase() + String(name).slice(1), 
                      value: typeof value === 'number' ? value : 0 
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#8b5cf6" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}

