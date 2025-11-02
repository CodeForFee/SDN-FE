'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { customerService, Customer } from '@/services/customerService';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Save, X, User, Phone, Mail, MapPin, FileText, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [customerDebt, setCustomerDebt] = useState<any>(null);
  const [loadingDebt, setLoadingDebt] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await customerService.getCustomerById(params.id as string);
        setCustomer(data);
        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          email: data.email || '',
          idNumber: data.idNumber || '',
          address: data.address || '',
          segment: data.segment || 'retail',
          notes: data.notes || '',
        });
        
        // Fetch customer debt
        try {
          setLoadingDebt(true);
          const debtData = await customerService.getCustomerDebt(params.id as string);
          setCustomerDebt(debtData);
        } catch (error: any) {
          // Debt might not be available, that's okay
          if (error.response?.status !== 404) {
            console.error('Failed to fetch customer debt:', error);
          }
        } finally {
          setLoadingDebt(false);
        }
      } catch (error: any) {
        console.error('Failed to fetch customer:', error);
        toast.error(error.response?.data?.message || 'Failed to load customer');
        router.push('/customers');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchCustomer();
    }
  }, [params.id, router]);

  const handleSave = async () => {
    if (!customer) return;
    try {
      const updated = await customerService.updateCustomer(customer._id, formData);
      setCustomer(updated);
      setEditing(false);
      toast.success('Customer updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleCancel = () => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        idNumber: customer.idNumber || '',
        address: customer.address || '',
        segment: customer.segment || 'retail',
        notes: customer.notes || '',
      });
    }
    setEditing(false);
  };

  const canEdit = user?.role === 'DealerStaff' || user?.role === 'DealerManager';

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Customer not found</p>
            <Link href="/customers">
              <Button variant="outline">Back to Customers</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link href="/customers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
          {canEdit && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Customer Details</CardTitle>
              {customer.segment && (
                <Badge variant={customer.segment === 'retail' ? 'default' : 'secondary'}>
                  {customer.segment}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-lg font-medium">{customer.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  ) : (
                    <p>{customer.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {editing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <p>{customer.email || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ID Number
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    />
                  ) : (
                    <p>{customer.idNumber || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  ) : (
                    <p>{customer.address || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Segment</Label>
                  {editing ? (
                    <Select
                      value={formData.segment}
                      onValueChange={(value) => setFormData({ ...formData, segment: value as 'retail' | 'fleet' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="fleet">Fleet</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={customer.segment === 'retail' ? 'default' : 'secondary'}>
                      {customer.segment || 'retail'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </Label>
              {editing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Additional notes about the customer..."
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {customer.notes || 'No notes available'}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Updated: {new Date(customer.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Debt Section */}
        {customerDebt && (
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Customer Debt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDebt ? (
                <p className="text-muted-foreground">Loading debt information...</p>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-xl font-semibold">{customerDebt.summary.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Order Value</p>
                      <p className="text-xl font-semibold">${customerDebt.summary.totalOrderValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-xl font-semibold text-green-600">${customerDebt.summary.totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding Debt</p>
                      <p className={`text-xl font-semibold ${customerDebt.summary.debt > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        ${customerDebt.summary.debt.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Orders with Debt */}
                  {customerDebt.orders.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Orders & Payments</h4>
                      <div className="space-y-2">
                        {customerDebt.orders.map((orderDebt: any) => (
                          <div
                            key={orderDebt.orderId}
                            className={`p-4 border rounded-lg ${
                              orderDebt.debt > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Link href={`/orders/${orderDebt.orderId}`}>
                                  <p className="font-medium hover:underline cursor-pointer">
                                    {orderDebt.orderNo}
                                  </p>
                                </Link>
                                <Badge variant="secondary" className="mt-1">
                                  {orderDebt.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(orderDebt.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="font-semibold">${orderDebt.totalAmount.toLocaleString()}</p>
                                {orderDebt.debt > 0 && (
                                  <>
                                    <p className="text-xs text-orange-600 mt-1">Debt: ${orderDebt.debt.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Paid: ${orderDebt.paidAmount.toLocaleString()}</p>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Payments */}
                            {orderDebt.payments.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Payments:</p>
                                <div className="space-y-1">
                                  {orderDebt.payments.map((payment: any) => (
                                    <div key={payment._id} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">
                                        ${payment.amount.toLocaleString()}
                                        {payment.paidAt && (
                                          <span className="ml-2">
                                            ({new Date(payment.paidAt).toLocaleDateString()})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customerDebt.orders.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No orders with debt found.</p>
                    </div>
                  )}

                  {/* Alert if debt > 0 */}
                  {customerDebt.summary.debt > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        This customer has outstanding debt of ${customerDebt.summary.debt.toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

