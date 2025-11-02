'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { orderService, CreateOrderRequest, OrderItem } from '@/services/orderService';
import { customerService, Customer } from '@/services/customerService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { vehicleColorService, VehicleColor } from '@/services/vehicleColorService';
import { quoteService, Quote } from '@/services/quoteService';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Yup from 'yup';
import { orderItemSchema } from '@/validations/orderSchema';

function CreateOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams?.get('quote');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<number, any>>({});
  const [formData, setFormData] = useState<Partial<CreateOrderRequest>>({
    customer: '',
    items: [],
    paymentMethod: 'cash',
    deposit: 0,
    expectedDelivery: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, vehiclesData, colorsData] = await Promise.all([
          customerService.getCustomers(),
          vehicleService.getVehicles(),
          vehicleColorService.list(),
        ]);
        setCustomers(customersData);
        setVehicles(vehiclesData);
        setColors(colorsData);

        // If quote ID provided, load quote data
        if (quoteId) {
          try {
            const quote = await quoteService.getQuoteById(quoteId);
            if (quote) {
              const customerId = typeof quote.customer === 'object' ? quote.customer._id : quote.customer;
              setFormData({
                customer: customerId,
                paymentMethod: 'cash',
                deposit: 0,
              });
              
              // Convert quote items to order items
              if (quote.items && quote.items.length > 0) {
                const orderItems: OrderItem[] = quote.items.map((item) => ({
                  variant: typeof item.variant === 'object' ? item.variant._id : item.variant,
                  color: item.color ? (typeof item.color === 'object' ? item.color._id : item.color) : undefined,
                  qty: item.qty,
                  unitPrice: item.unitPrice,
                }));
                setItems(orderItems);
              }
            }
          } catch (error) {
            console.error('Failed to load quote:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [quoteId]);

  const addItem = () => {
    setItems([...items, {
      variant: '',
      color: '',
      qty: 1,
      unitPrice: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-fill unitPrice from vehicle msrp
    if (field === 'variant' && value) {
      const vehicle = vehicles.find(v => v._id === value);
      if (vehicle) {
        updatedItems[index].unitPrice = vehicle.msrp || 0;
      }
    }
    
    setItems(updatedItems);
    
    // Validate item on change
    validateItem(index, updatedItems[index]);
  };

  const validateItem = async (index: number, item: OrderItem) => {
    try {
      await orderItemSchema.validate(item, { abortEarly: false });
      // Clear errors for this item if validation passes
      const newErrors = { ...itemErrors };
      delete newErrors[index];
      setItemErrors(newErrors);
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors: any = {};
        err.inner.forEach((error) => {
          if (error.path) {
            errors[error.path] = error.message;
          }
        });
        setItemErrors({ ...itemErrors, [index]: errors });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate all items
    let hasErrors = false;
    const newErrors: Record<number, any> = {};
    
    for (let i = 0; i < items.length; i++) {
      try {
        await orderItemSchema.validate(items[i], { abortEarly: false });
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          hasErrors = true;
          const errors: any = {};
          err.inner.forEach((error) => {
            if (error.path) {
              errors[error.path] = error.message;
            }
          });
          newErrors[i] = errors;
        }
      }
    }

    setItemErrors(newErrors);

    if (hasErrors) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);

    try {
      await orderService.createOrder({
        customer: formData.customer,
        items,
        paymentMethod: formData.paymentMethod || 'cash',
        deposit: formData.deposit || 0,
        expectedDelivery: formData.expectedDelivery,
      } as CreateOrderRequest);
      toast.success('Order created successfully');
      router.push('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl">
        <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
            <CardDescription>Create a new order for a customer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer as string}
                    onValueChange={(value) => setFormData({ ...formData, customer: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
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
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as any })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Items *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => {
                  const vehicle = vehicles.find(v => v._id === item.variant);
                  const vehicleModel = typeof vehicle?.model === 'object' ? vehicle.model : null;
                  const errors = itemErrors[index] || {};
                  
                  return (
                    <Card key={index} className="rounded-2xl">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
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
                              value={item.variant}
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
                                      {modelName} - {v.trim} (${(v.msrp || 0).toLocaleString()})
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {errors.variant && (
                              <p className="text-sm text-red-500">{errors.variant}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Select
                              value={item.color || ''}
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
                            {errors.color && (
                              <p className="text-sm text-red-500">{errors.color}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                              required
                            />
                            {errors.qty && (
                              <p className="text-sm text-red-500">{errors.qty}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Unit Price *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              readOnly
                              disabled
                              className="bg-muted cursor-not-allowed"
                            />
                            {errors.unitPrice && (
                              <p className="text-sm text-red-500">{errors.unitPrice}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit">Deposit</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.deposit || 0}
                    onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                  <Input
                    id="expectedDelivery"
                    type="date"
                    value={formData.expectedDelivery || ''}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                  />
                </div>
              </div>

              <Card className="rounded-2xl bg-muted">
                <CardContent className="p-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || items.length === 0}>
                  {loading ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    }>
      <CreateOrderForm />
    </Suspense>
  );
}

