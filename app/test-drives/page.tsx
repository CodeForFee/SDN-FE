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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { testDriveService, TestDrive } from '@/services/testDriveService';
import { customerService, Customer } from '@/services/customerService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { useAuthStore } from '@/stores/authStore';
import { Calendar, Plus, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'requested':
      return 'secondary';
    case 'done':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const statusLabel: Record<string, string> = {
  requested: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export default function TestDrivesPage() {
  const { user } = useAuthStore();
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'requested' | 'confirmed' | 'done' | 'cancelled'>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState<TestDrive | null>(null);
  const [formData, setFormData] = useState({
    customer: '',
    variant: '',
    preferredTime: '',
  });

  // helper to provide min value for datetime-local input and to validate preferredTime
  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const minPreferredTime = formatDateTimeLocal(new Date());
  const [feedbackData, setFeedbackData] = useState({
    feedback: '',
    interestRate: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drives, custs, vehs] = await Promise.all([
        testDriveService.getTestDrives(),
        customerService.getCustomers(),
        vehicleService.getVehicles(),
      ]);
      setTestDrives(drives);
      setCustomers(custs);
      setVehicles(vehs);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error(error?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestDrive = async () => {
    try {
      if (!formData.customer || !formData.variant || !formData.preferredTime) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
      }
      // validate preferredTime is not in the past
      const preferred = new Date(formData.preferredTime);
      const now = new Date();
      if (isNaN(preferred.getTime())) {
        toast.error('Thời gian không hợp lệ');
        return;
      }
      if (preferred.getTime() < now.getTime()) {
        toast.error('Thời gian ưu tiên không được ở quá khứ');
        return;
      }
      await testDriveService.createTestDrive(formData);
      toast.success('Đã tạo lịch lái thử thành công');
      setOpenDialog(false);
      setFormData({ customer: '', variant: '', preferredTime: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create test drive');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await testDriveService.approveTestDrive(id);
      toast.success('Đã xác nhận lịch lái thử');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve test drive');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await testDriveService.rejectTestDrive(id);
      toast.success('Đã hủy lịch lái thử');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reject test drive');
    }
  };

  const handleComplete = async () => {
    if (!selectedTestDrive) return;
    try {
      if (!feedbackData.feedback.trim()) {
        toast.error('Vui lòng nhập phản hồi');
        return;
      }
      await testDriveService.completeTestDrive(
        selectedTestDrive._id,
        feedbackData.feedback,
        feedbackData.interestRate || undefined
      );
      toast.success('Đã ghi nhận phản hồi');
      setOpenFeedbackDialog(false);
      setFeedbackData({ feedback: '', interestRate: 0 });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to complete test drive');
    }
  };

  const filteredTestDrives = testDrives.filter((td) => {
    if (filterStatus === 'all') return true;
    return td.status === filterStatus;
  });

  const pendingCount = testDrives.filter((td) => td.status === 'requested').length;

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
            <h1 className="text-3xl font-bold">Test Drives</h1>
            <p className="text-muted-foreground">Quản lý lịch lái thử khách hàng</p>
          </div>
          {user?.role === 'DealerStaff' && (
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo lịch lái thử
            </Button>
          )}
        </div>

        {/* Alert for pending approvals */}
        {pendingCount > 0 && user?.role === 'DealerManager' && (
          <Card className="rounded-2xl shadow-md border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium">
                  Bạn có <strong>{pendingCount}</strong> lịch lái thử chờ duyệt
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
            Tất cả ({testDrives.length})
          </Button>
          <Button
            variant={filterStatus === 'requested' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('requested')}
          >
            Chờ duyệt ({pendingCount})
          </Button>
          <Button
            variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('confirmed')}
          >
            Đã xác nhận ({testDrives.filter((td) => td.status === 'confirmed').length})
          </Button>
          <Button
            variant={filterStatus === 'done' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('done')}
          >
            Hoàn thành ({testDrives.filter((td) => td.status === 'done').length})
          </Button>
        </div>

        {/* Test Drives table */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Danh sách lịch lái thử</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTestDrives.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có lịch lái thử nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Xe</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Phản hồi</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestDrives.map((testDrive) => {
                    const customer = typeof testDrive.customer === 'object' 
                      ? testDrive.customer 
                      : null;
                    const variant = typeof testDrive.variant === 'object' 
                      ? testDrive.variant 
                      : null;
                    
                    return (
                      <TableRow key={testDrive._id}>
                        <TableCell className="font-medium">
                          {customer?.fullName || 'N/A'}
                        </TableCell>
                        <TableCell>{variant?.trim || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(testDrive.preferredTime).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(testDrive.status)}>
                            {statusLabel[testDrive.status] || testDrive.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {testDrive.result?.feedback ? (
                            <span className="text-xs text-muted-foreground">Có</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Chưa có</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user?.role === 'DealerManager' && testDrive.status === 'requested' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => handleApprove(testDrive._id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => handleReject(testDrive._id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Từ chối
                                </Button>
                              </>
                            )}
                            {user?.role === 'DealerStaff' && testDrive.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTestDrive(testDrive);
                                  setOpenFeedbackDialog(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Ghi phản hồi
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

        {/* Create Test Drive Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Tạo lịch lái thử</DialogTitle>
              <DialogDescription>
                Tạo lịch lái thử cho khách hàng
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Khách hàng *</Label>
                <Select
                  value={formData.customer}
                  onValueChange={(value) => setFormData({ ...formData, customer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.fullName} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant">Xe *</Label>
                <Select
                  value={formData.variant}
                  onValueChange={(value) => setFormData({ ...formData, variant: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle._id} value={vehicle._id}>
                        {typeof vehicle.model === 'object' 
                          ? `${vehicle.model?.name || ''} - ${vehicle.trim}` 
                          : vehicle.trim}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Thời gian ưu tiên *</Label>
                <Input
                  id="preferredTime"
                  type="datetime-local"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  min={minPreferredTime}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateTestDrive}>
                Tạo lịch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={openFeedbackDialog} onOpenChange={setOpenFeedbackDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Ghi nhận phản hồi</DialogTitle>
              <DialogDescription>
                Ghi nhận phản hồi và mức độ quan tâm của khách hàng sau khi lái thử
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Phản hồi *</Label>
                <Textarea
                  id="feedback"
                  value={feedbackData.feedback}
                  onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                  placeholder="Nhập phản hồi của khách hàng..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Mức độ quan tâm (1-10)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  min="1"
                  max="10"
                  value={feedbackData.interestRate}
                  onChange={(e) => setFeedbackData({ ...feedbackData, interestRate: Number(e.target.value) })}
                  placeholder="Đánh giá từ 1-10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenFeedbackDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleComplete}>
                Hoàn thành
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

