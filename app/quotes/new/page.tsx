'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { quoteService, CreateQuoteRequest, QuoteItem } from '@/services/quoteService';
import { customerService, Customer } from '@/services/customerService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { vehicleColorService, VehicleColor } from '@/services/vehicleColorService';
import { useAuthStore } from '@/stores/authStore';
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
import { quoteItemSchema, feesSchema } from '@/validations/quoteSchema';

function CreateQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams?.get('vehicle');
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<number, any>>({});
  const [formErrors, setFormErrors] = useState<any>({});
  const [formData, setFormData] = useState<Partial<CreateQuoteRequest>>({
    customer: '',
    items: [],
    subtotal: 0,
    discount: 0,
    promotionTotal: 0,
    fees: {
      registration: 0,
      plate: 0,
      delivery: 0,
    },
    total: 0,
    validUntil: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, vehiclesData, colorsData] = await Promise.all([
          customerService.getCustomers(),
          vehicleService.getVehicles(),
          vehicleColorService.list(),
        ]);
        
        
        setAllCustomers(customersData);
        setVehicles(vehiclesData);
        setColors(colorsData);

        // If vehicle ID provided, pre-select it
        if (vehicleId && vehiclesData.length > 0) {
          const vehicle = vehiclesData.find(v => v._id === vehicleId);
          if (vehicle) {
            setItems([{
              variant: vehicleId,
              color: '',
              qty: 1,
              unitPrice: vehicle.msrp || 0,
            }]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, [vehicleId]);

  // Filter customers by dealer for DealerStaff and DealerManager
  useEffect(() => {
    if (!user || !allCustomers.length) {
      setFilteredCustomers([]);
      return;
    }

    // Admin and EVMStaff can see all customers
    if (user.role === 'Admin' || user.role === 'EVMStaff') {
      setFilteredCustomers(allCustomers);
      return;
    }

    // DealerStaff and DealerManager only see customers from their dealer
    if (user.role === 'DealerStaff' || user.role === 'DealerManager') {
      const userDealerId = typeof user.dealer === 'object' ? user.dealer._id : user.dealer;
      
      const dealerCustomers = allCustomers.filter((customer: any) => {
        // If customer doesn't have ownerDealer (old data), show it to all dealers
        if (!customer.ownerDealer) {
          return true;
        }
        
        const customerDealerId = typeof customer.ownerDealer === 'object' 
          ? customer.ownerDealer._id 
          : customer.ownerDealer;
        
        return customerDealerId === userDealerId;
      });

      console.log('[CreateQuote] Dealer filtering:', {
        userDealerId,
        totalCustomers: allCustomers.length,
        dealerCustomers: dealerCustomers.length,
        customersWithoutDealer: allCustomers.filter((c: any) => !c.ownerDealer).length,
      });

      setFilteredCustomers(dealerCustomers);
      return;
    }

    // Default: show all
    setFilteredCustomers(allCustomers);
  }, [user, allCustomers]);

  useEffect(() => {
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const feesTotal = (formData.fees?.registration || 0) + (formData.fees?.plate || 0) + (formData.fees?.delivery || 0);
    const total = subtotal - (formData.discount || 0) - (formData.promotionTotal || 0) + feesTotal;
    
    setFormData((prev) => ({
      ...prev,
      subtotal,
      total,
    }));
  }, [items, formData.discount, formData.promotionTotal, formData.fees?.registration, formData.fees?.plate, formData.fees?.delivery]);

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

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
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

  const validateItem = async (index: number, item: QuoteItem) => {
    try {
      await quoteItemSchema.validate(item, { abortEarly: false });
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

  const validateFees = async () => {
    if (!formData.fees) return true;
    try {
      await feesSchema.validate(formData.fees, { abortEarly: false });
      return true;
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors: any = {};
        err.inner.forEach((error) => {
          if (error.path) {
            errors[`fees.${error.path}`] = error.message;
          }
        });
        setFormErrors(errors);
        return false;
      }
    }
    return true;
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
        await quoteItemSchema.validate(items[i], { abortEarly: false });
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

    // Validate fees
    const feesValid = await validateFees();

    if (hasErrors || !feesValid) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);

    try {
      await quoteService.createQuote({
        customer: formData.customer,
        items,
        subtotal: formData.subtotal || 0,
        discount: formData.discount || 0,
        promotionTotal: formData.promotionTotal || 0,
        fees: formData.fees,
        total: formData.total || 0,
        validUntil: formData.validUntil,
        notes: formData.notes,
      } as CreateQuoteRequest);
      toast.success('Quote created successfully');
      router.push('/quotes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl">
        <Link href="/quotes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Link>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Create New Quote</CardTitle>
            <CardDescription>Create a quote for a customer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={formData.customer as string}
                  onValueChange={(value) => setFormData({ ...formData, customer: value })}
                  required
                  disabled={filteredCustomers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredCustomers.length === 0 ? "No customers available" : "Select customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCustomers.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        {allCustomers.length === 0 ? 'No customers available' : 'No customers for your dealer'}
                      </div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.fullName} - {customer.phone}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {filteredCustomers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {allCustomers.length === 0 
                      ? 'Please create a customer first before creating a quote.' 
                      : 'No customers found for your dealer. Please create customers from the Customers page.'}
                  </p>
                )}
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
                            <Label>Color *</Label>
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

                        {vehicle && (
                          <div className="text-sm text-muted-foreground">
                            <p><strong>Model:</strong> {vehicleModel?.name || 'N/A'}</p>
                            <p><strong>Trim:</strong> {vehicle.trim}</p>
                            {vehicle.range && <p><strong>Range:</strong> {vehicle.range} km</p>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.discount || 0}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotionTotal">Promotion Total</Label>
                  <Input
                    id="promotionTotal"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.promotionTotal || 0}
                    onChange={(e) => setFormData({ ...formData, promotionTotal: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil || ''}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Fees</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration">Registration</Label>
                    <Input
                      id="registration"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.fees?.registration || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        fees: { ...formData.fees, registration: Number(e.target.value) },
                      })}
                    />
                    {formErrors['fees.registration'] && (
                      <p className="text-sm text-red-500">{formErrors['fees.registration']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plate">Plate</Label>
                    <Input
                      id="plate"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.fees?.plate || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        fees: { ...formData.fees, plate: Number(e.target.value) },
                      })}
                    />
                    {formErrors['fees.plate'] && (
                      <p className="text-sm text-red-500">{formErrors['fees.plate']}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery">Delivery</Label>
                    <Input
                      id="delivery"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.fees?.delivery || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        fees: { ...formData.fees, delivery: Number(e.target.value) },
                      })}
                    />
                    {formErrors['fees.delivery'] && (
                      <p className="text-sm text-red-500">{formErrors['fees.delivery']}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Card className="rounded-2xl bg-muted">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${(formData.subtotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${(formData.discount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Promotion:</span>
                      <span>-${(formData.promotionTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fees:</span>
                      <span>
                        ${((formData.fees?.registration || 0) + (formData.fees?.plate || 0) + (formData.fees?.delivery || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>${(formData.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || items.length === 0}>
                  {loading ? 'Creating...' : 'Create Quote'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function CreateQuotePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    }>
      <CreateQuoteForm />
    </Suspense>
  );
}

