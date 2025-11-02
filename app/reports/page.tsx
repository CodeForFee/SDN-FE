'use client';

import { useEffect, useState } from 'react';
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
import { reportService } from '@/services/reportService';
import { dealerService } from '@/services/dealerService';
import { useAuthStore } from '@/stores/authStore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp, FileText, TrendingDown, Activity, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [reportData, setReportData] = useState<any>(null);
  const [debtReportData, setDebtReportData] = useState<any>(null);
  const [inventoryReportData, setInventoryReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debtLoading, setDebtLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'debt' | 'inventory'>('sales');
  const [selectedDealerId, setSelectedDealerId] = useState<string>('');
  const [dealers, setDealers] = useState<any[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        let rawData;
        console.log('[Reports] Fetching report for role:', user?.role);
        
        if (user?.role === 'Admin') {
          // Admin can see sales report (with optional dealer filter)
          rawData = await reportService.getSalesReport(selectedDealerId ? { dealerId: selectedDealerId } : undefined);
          console.log('[Reports] Sales report data (Admin):', rawData);
        } else if (user?.role === 'DealerManager' || user?.role === 'EVMStaff') {
          // Dealer Manager and EVM Staff can see sales report (with optional dealer filter for EVM Staff)
          const params = user?.role === 'EVMStaff' && selectedDealerId ? { dealerId: selectedDealerId } : undefined;
          rawData = await reportService.getSalesReport(params);
          console.log('[Reports] Sales report data (Manager/Staff):', rawData);
        } else {
          // Dealer Staff see personal report
          rawData = await reportService.getPersonalReport();
          console.log('[Reports] Personal report data:', rawData);
        }

        // Transform data to match frontend format
        let data: any = {};

        // Handle response format - backend may return { success: true, data: {...} } or direct data
        const actualData = rawData?.data || rawData;

        // Handle sales report format (from backend)
        if (actualData?.summary) {
          data.totalRevenue = actualData.summary.totalRevenue || 0;
          data.totalOrders = actualData.summary.totalOrders || 0;
          data.totalCustomers = actualData.orders ? new Set(actualData.orders.map((o: any) => o.customer?._id || o.customer)).size : 0;
          data.growth = 0; // Backend doesn't provide this, calculate if needed
          
          // Store dealerStats and staffStats for Admin/EVM Staff
          data.dealerStats = actualData.dealerStats || [];
          data.staffStats = actualData.staffStats || [];

          // Calculate orders by status from orders array
          if (actualData.orders && Array.isArray(actualData.orders)) {
            const statusCount: Record<string, number> = {};
            actualData.orders.forEach((order: any) => {
              const status = order.status || 'unknown';
              statusCount[status] = (statusCount[status] || 0) + 1;
            });
            data.ordersByStatus = statusCount;
          }

          // Calculate monthly sales from orders
          if (actualData.orders && Array.isArray(actualData.orders)) {
            const monthlyData: Record<string, { sales: number; target: number }> = {};
            actualData.orders.forEach((order: any) => {
              const month = new Date(order.createdAt).toISOString().substring(0, 7); // YYYY-MM
              if (!monthlyData[month]) {
                monthlyData[month] = { sales: 0, target: 0 };
              }
              // Calculate order total
              const orderTotal = (order.items || []).reduce((sum: number, item: any) => {
                return sum + ((item.unitPrice || 0) * (item.qty || 0));
              }, 0);
              monthlyData[month].sales += orderTotal;
            });
            data.monthlySales = Object.entries(monthlyData).map(([month, value]) => ({
              month: month.substring(5), // Show MM only
              sales: value.sales,
              target: value.target
            }));
          }

          // Calculate sales trend (by month)
          if (actualData.orders && Array.isArray(actualData.orders)) {
            const trendData: Record<string, number> = {};
            actualData.orders.forEach((order: any) => {
              const month = new Date(order.createdAt).toISOString().substring(0, 7);
              if (!trendData[month]) {
                trendData[month] = 0;
              }
              const orderTotal = (order.items || []).reduce((sum: number, item: any) => {
                return sum + ((item.unitPrice || 0) * (item.qty || 0));
              }, 0);
              trendData[month] += orderTotal;
            });
            data.salesTrend = Object.entries(trendData)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([period, value]) => ({ period: period.substring(5), value }));
          }

          // Calculate top products from orders
          if (actualData.orders && Array.isArray(actualData.orders)) {
            const productStats: Record<string, { name: string; sales: number }> = {};
            actualData.orders.forEach((order: any) => {
              (order.items || []).forEach((item: any) => {
                const variantName = item.variant?.trim || item.variant?.name || 'Unknown';
                const productKey = item.variant?._id || variantName;
                if (!productStats[productKey]) {
                  productStats[productKey] = { name: variantName, sales: 0 };
                }
                productStats[productKey].sales += ((item.unitPrice || 0) * (item.qty || 0));
              });
            });
            data.topProducts = Object.values(productStats)
              .sort((a, b) => b.sales - a.sales)
              .slice(0, 10); // Top 10
          }
        } else if (actualData) {
          // Handle personal report format
          const totalCustomers = actualData.orders ? new Set(actualData.orders.map((o: any) => o.customer?._id || o.customer)).size : 0;
          
          data = {
            totalRevenue: actualData.summary?.totalRevenue || 0,
            totalOrders: actualData.summary?.totalOrders || 0,
            totalCustomers: totalCustomers,
            growth: 0,
            salesTrend: actualData.monthlyTrends ? Object.entries(actualData.monthlyTrends).map(([period, value]: [string, any]) => ({
              period: period.substring(5), // Show MM only
              value: value.revenue || 0
            })) : [],
            ordersByStatus: actualData.summary?.ordersByStatus || {},
            monthlySales: actualData.monthlyTrends ? Object.entries(actualData.monthlyTrends).map(([month, value]: [string, any]) => ({
              month: month.substring(5),
              sales: value.revenue || 0,
              target: 0
            })) : [],
            topProducts: actualData.orders ? (() => {
              // Calculate top products from orders
              const productStats: Record<string, { name: string; sales: number }> = {};
              actualData.orders.forEach((order: any) => {
                (order.items || []).forEach((item: any) => {
                  const variantName = item.variant?.trim || item.variant?.name || 'Unknown';
                  const productKey = item.variant?._id || variantName;
                  if (!productStats[productKey]) {
                    productStats[productKey] = { name: variantName, sales: 0 };
                  }
                  productStats[productKey].sales += ((item.unitPrice || 0) * (item.qty || 0));
                });
              });
              return Object.values(productStats)
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 10);
            })() : []
          };
        } else {
          // Default empty structure
          data = {
            totalRevenue: 0,
            totalOrders: 0,
            totalCustomers: 0,
            growth: 0,
            salesTrend: [],
            ordersByStatus: {},
            monthlySales: [],
            topProducts: []
          };
        }

        console.log('[Reports] Transformed data:', data);
        setReportData(data);
      } catch (error) {
        console.error('[Reports] Failed to fetch report:', error);
        console.error('[Reports] Error details:', error instanceof Error ? error.message : error);
        // Set empty data structure on error
        setReportData({
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          growth: 0,
          salesTrend: [],
          ordersByStatus: {},
          monthlySales: [],
          topProducts: []
        });
      } finally {
        setLoading(false);
      }
    };

    // Fetch dealers for EVM Staff/Admin filter
    const fetchDealers = async () => {
      if (user?.role === 'EVMStaff' || user?.role === 'Admin') {
        try {
          const dealerList = await dealerService.getDealers();
          setDealers(dealerList);
        } catch (error) {
          console.error('Failed to fetch dealers:', error);
        }
      }
    };

    if (user) {
      fetchReport();
      fetchDealers();
    }
  }, [user, selectedDealerId]);

  const fetchDebtReport = async () => {
    try {
      setDebtLoading(true);
      const data = await reportService.getDebtReport();
      setDebtReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch debt report:', error);
      toast.error(error?.response?.data?.message || 'Failed to load debt report');
      setDebtReportData(null);
    } finally {
      setDebtLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      setInventoryLoading(true);
      const data = await reportService.getInventoryReport();
      setInventoryReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch inventory report:', error);
      toast.error(error?.response?.data?.message || 'Failed to load inventory report');
      setInventoryReportData(null);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'debt' && (user?.role === 'Admin' || user?.role === 'EVMStaff' || user?.role === 'DealerManager')) {
      fetchDebtReport();
    } else if (activeTab === 'inventory' && (user?.role === 'Admin' || user?.role === 'EVMStaff' || user?.role === 'DealerManager')) {
      fetchInventoryReport();
    }
  }, [activeTab, user]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const canViewDebtReport = user?.role === 'Admin' || user?.role === 'EVMStaff' || user?.role === 'DealerManager';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {user?.role === 'Admin' ? 'System-wide reports' 
                : user?.role === 'DealerManager' ? 'Dealer reports' 
                : user?.role === 'EVMStaff' ? 'Regional reports'
                : 'Personal sales reports'}
            </p>
          </div>
          {/* Show tabs for roles that have multiple report types */}
          {user?.role === 'DealerStaff' ? (
            // Dealer Staff only sees Personal Report (Sales Report)
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="default"
                size="lg"
                disabled
                className="shadow-md"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Personal Sales Report
              </Button>
            </div>
          ) : canViewDebtReport ? (
            // Other roles see multiple tabs
            <div className="flex gap-3 flex-wrap">
              <Button
                variant={activeTab === 'sales' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveTab('sales')}
                className={activeTab === 'sales' ? 'shadow-md' : ''}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Sales Report
              </Button>
              <Button
                variant={activeTab === 'debt' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveTab('debt')}
                className={activeTab === 'debt' ? 'shadow-md' : ''}
              >
                <FileText className="mr-2 h-4 w-4" />
                Debt Report
              </Button>
              <Button
                variant={activeTab === 'inventory' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveTab('inventory')}
                className={activeTab === 'inventory' ? 'shadow-md' : ''}
              >
                <Package className="mr-2 h-4 w-4" />
                Inventory Report
              </Button>
            </div>
          ) : null}
        </div>

        {activeTab === 'debt' && canViewDebtReport && (
          <DebtReportSection
            data={debtReportData}
            loading={debtLoading}
            onRefresh={fetchDebtReport}
          />
        )}

        {activeTab === 'inventory' && canViewDebtReport && (
          <InventoryReportSection
            data={inventoryReportData}
            loading={inventoryLoading}
            onRefresh={fetchInventoryReport}
            userRole={user?.role}
          />
        )}

        {/* Personal Report for Dealer Staff - always show when reportData exists */}
        {(activeTab === 'sales' || user?.role === 'DealerStaff') && reportData && (
          <>
            {/* Dealer Filter for EVM Staff */}
            {(user?.role === 'EVMStaff' || user?.role === 'Admin') && (
              <Card className="rounded-2xl shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="dealerFilter" className="whitespace-nowrap">Filter by Dealer/Region:</Label>
                    <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                      <SelectTrigger id="dealerFilter" className="w-[300px]">
                        <SelectValue placeholder="All Dealers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Dealers</SelectItem>
                        {dealers.map((dealer) => (
                          <SelectItem key={dealer._id} value={dealer._id}>
                            {dealer.name} {dealer.region ? `(${dealer.region})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Metrics for Admin */}
            {user?.role === 'Admin' && reportData.dealerStats && Array.isArray(reportData.dealerStats) && reportData.dealerStats.length > 0 && (
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Dealer Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dealer Name</TableHead>
                        <TableHead>Total Orders</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Sales Target</TableHead>
                        <TableHead>Target Achievement</TableHead>
                        <TableHead>Conversion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.dealerStats.slice(0, 10).map((dealer: any) => {
                        // Find matching dealer to get salesTarget
                        const dealerInfo = dealers.find((d: any) => d._id === dealer._id || d.name === dealer.name);
                        const salesTarget = dealerInfo?.salesTarget || dealer.salesTarget || 0;
                        
                        const targetAchievement = salesTarget > 0 
                          ? ((dealer.totalRevenue || 0) / salesTarget * 100).toFixed(1)
                          : 'N/A';
                        const conversionRate = dealer.totalOrders > 0 
                          ? ((dealer.deliveredOrders || 0) / dealer.totalOrders * 100).toFixed(1)
                          : '0';
                        
                        return (
                          <TableRow key={dealer._id || dealer.name}>
                            <TableCell className="font-medium">{dealer.name || dealer._id}</TableCell>
                            <TableCell>{dealer.totalOrders || 0}</TableCell>
                            <TableCell>{((dealer.totalRevenue || 0) / 1000000).toFixed(1)}M VNĐ</TableCell>
                            <TableCell>
                              {salesTarget > 0 ? `${(salesTarget / 1000000).toFixed(1)}M VNĐ` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={targetAchievement !== 'N/A' && Number(targetAchievement) >= 100 ? 'default' : 'secondary'}>
                                {targetAchievement !== 'N/A' ? `${targetAchievement}%` : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={Number(conversionRate) >= 50 ? 'default' : 'secondary'}>
                                {conversionRate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-50">Total Revenue</CardTitle>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {((reportData.totalRevenue || 0) / 1000000).toFixed(1)}M
                    </div>
                    <p className="text-xs text-blue-100">VNĐ</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -4 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-50">Total Orders</CardTitle>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {typeof reportData.totalOrders === 'number' ? reportData.totalOrders : (typeof reportData.orderCount === 'number' ? reportData.orderCount : 0)}
                    </div>
                    <p className="text-xs text-green-100">orders</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-50">Customers</CardTitle>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {reportData.totalCustomers || 0}
                    </div>
                    <p className="text-xs text-purple-100">active customers</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-50">Growth</CardTitle>
                    <div className="p-2 bg-white/20 rounded-lg">
                      {reportData.growth >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {reportData.growth || 0}%
                    </div>
                    <p className="text-xs text-orange-100">vs last period</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">Sales Trend</CardTitle>
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={Array.isArray(reportData.salesTrend) ? reportData.salesTrend : (reportData.byVehicle ? Object.entries(reportData.byVehicle).map(([name, value]) => ({ period: name, value })) : [])}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">Orders by Status</CardTitle>
                      <Package className="h-5 w-5 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={
                            reportData.ordersByStatus && typeof reportData.ordersByStatus === 'object'
                              ? Object.entries(reportData.ordersByStatus).map(([name, value]) => ({
                                  name: String(name).charAt(0).toUpperCase() + String(name).slice(1),
                                  value: typeof value === 'number' ? value : 0,
                                }))
                              : []
                          }
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(reportData.ordersByStatus ? Object.entries(reportData.ordersByStatus) : []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">Monthly Sales</CardTitle>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={Array.isArray(reportData.monthlySales) ? reportData.monthlySales : []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="sales" 
                          fill="#3b82f6" 
                          radius={[8, 8, 0, 0]}
                          name="Sales"
                        />
                        <Bar 
                          dataKey="target" 
                          fill="#10b981" 
                          radius={[8, 8, 0, 0]}
                          name="Target"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">Top Products</CardTitle>
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart 
                        data={
                          Array.isArray(reportData.topProducts) 
                            ? reportData.topProducts 
                            : reportData.byVehicle 
                              ? Object.entries(reportData.byVehicle).map(([name, value]) => ({ name, sales: value }))
                              : []
                        } 
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={120} 
                          stroke="#6b7280" 
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any) => `${(value / 1000000).toFixed(1)}M VNĐ`}
                        />
                        <Bar 
                          dataKey="sales" 
                          fill="#f59e0b" 
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

// Inventory Report Component
function InventoryReportSection({ 
  data, 
  loading, 
  onRefresh, 
  userRole 
}: { 
  data: any; 
  loading: boolean; 
  onRefresh: () => void;
  userRole?: string;
}) {
  if (loading) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">Loading inventory report...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load inventory report</p>
            <Button variant="outline" onClick={onRefresh} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data.summary || {};
  const dealerStats = data.dealerStats || {};
  const lowStockItems = data.lowStockItems || [];
  const outOfStockItems = data.outOfStockItems || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-50">Total Items</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{summary.totalItems || 0}</div>
              <p className="text-xs text-blue-100">inventory items</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-50">Total Quantity</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{summary.totalQuantity || 0}</div>
              <p className="text-xs text-green-100">vehicles in stock</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-50">Low Stock</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{summary.lowStockItems || 0}</div>
              <p className="text-xs text-yellow-100">items below 5 units</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-50">Out of Stock</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{summary.outOfStockItems || 0}</div>
              <p className="text-xs text-red-100">items with zero stock</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dealer Stats (EVM Staff & Admin only) */}
      {(userRole === 'EVMStaff' || userRole === 'Admin') && Object.keys(dealerStats).length > 0 && (
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Inventory by Dealer</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(dealerStats).map(([name, stats]: [string, any]) => ({
                name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                quantity: stats.totalQuantity || 0,
                items: stats.totalItems || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Quantity" />
                <Bar dataKey="items" fill="#10b981" radius={[8, 8, 0, 0]} name="Items" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <Card className="rounded-2xl shadow-md border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-700">⚠️ Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Owner Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.slice(0, 10).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.variant || 'N/A'}</TableCell>
                    <TableCell>{item.color || 'N/A'}</TableCell>
                    <TableCell>{item.owner || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={item.ownerType === 'EVM' ? 'default' : 'secondary'}>
                        {item.ownerType || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.quantity === 0 ? 'destructive' : 'secondary'}>
                        {item.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.quantity === 0 ? 'destructive' : 'outline'}>
                        {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Out of Stock Items */}
      {outOfStockItems.length > 0 && (
        <Card className="rounded-2xl shadow-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">🚨 Out of Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Owner Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outOfStockItems.slice(0, 10).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.variant || 'N/A'}</TableCell>
                    <TableCell>{item.color || 'N/A'}</TableCell>
                    <TableCell>{item.owner || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={item.ownerType === 'EVM' ? 'default' : 'secondary'}>
                        {item.ownerType || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Out of Stock</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Debt Report Component
function DebtReportSection({ data, loading, onRefresh }: { data: any; loading: boolean; onRefresh: () => void }) {
  if (loading) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">Loading debt report...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load debt report</p>
            <Button variant="outline" onClick={onRefresh} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data.summary || {};
  const dealers = data.dealers || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((summary.totalDebt || 0) / 1000000).toFixed(1)}M VNĐ
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {summary.totalDealers || 0} dealers
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dealers with Debt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.dealersWithDebt || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {summary.totalDealers || 0} total
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Debt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((summary.averageDebt || 0) / 1000000).toFixed(1)}M VNĐ
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per dealer</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Debt</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dealers.length > 0
                ? `${(dealers[0]?.debt || 0) / 1000000}M VNĐ`
                : '0 VNĐ'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dealers.length > 0 ? dealers[0]?.name || 'N/A' : 'No debt'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debt Table */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dealer Debt Details</CardTitle>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dealers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No dealers found.</p>
              <p className="text-xs mt-2">Make sure you have dealers with allocated orders.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealer Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Sales Target</TableHead>
                  <TableHead>Debt Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealers.map((dealer: any) => (
                  <TableRow key={dealer.id}>
                    <TableCell className="font-medium">{dealer.name || 'N/A'}</TableCell>
                    <TableCell>{dealer.address || 'N/A'}</TableCell>
                    <TableCell>
                      {dealer.salesTarget
                        ? `${(dealer.salesTarget / 1000000).toFixed(1)}M VNĐ`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${dealer.debt > 0 ? 'text-red-600' : dealer.debt < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {(dealer.debt / 1000000).toFixed(1)}M VNĐ
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dealer.debt > 0 ? 'destructive' : dealer.debt < 0 ? 'default' : 'secondary'}>
                        {dealer.debt > 0 ? 'Outstanding' : dealer.debt < 0 ? 'Overpaid' : 'No Debt'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

