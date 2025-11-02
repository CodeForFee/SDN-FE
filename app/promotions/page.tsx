'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { promotionService, Promotion, CreatePromotionRequest } from '@/services/promotionService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { dealerService, Dealer } from '@/services/dealerService';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function PromotionsPage() {
  const { user } = useAuthStore();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<CreatePromotionRequest>({
    name: '',
    scope: 'global',
    dealers: [],
    variants: [],
    type: 'cashback',
    value: 0,
    stackable: false,
    validFrom: '',
    validTo: '',
    status: 'active',
  });

  useEffect(() => {
    fetchPromotions();
    if (user?.role === 'EVMStaff' || user?.role === 'Admin') {
      fetchVehicleData();
      fetchDealers();
    }
  }, [user]);

  const fetchPromotions = async () => {
    try {
      const data = await promotionService.getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleData = async () => {
    try {
      const vehiclesData = await vehicleService.getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const fetchDealers = async () => {
    try {
      const dealersData = await dealerService.getDealers();
      setDealers(dealersData);
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    }
  };

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        scope: promotion.scope,
        dealers: Array.isArray(promotion.dealers) && promotion.dealers.length > 0
          ? promotion.dealers.map(d => typeof d === 'object' ? d._id : d)
          : [],
        variants: Array.isArray(promotion.variants) && promotion.variants.length > 0
          ? promotion.variants.map(v => typeof v === 'object' ? v._id : v)
          : [],
        type: promotion.type,
        value: promotion.value,
        stackable: promotion.stackable,
        validFrom: new Date(promotion.validFrom).toISOString().split('T')[0],
        validTo: new Date(promotion.validTo).toISOString().split('T')[0],
        status: promotion.status,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: '',
        scope: 'global',
        dealers: [],
        variants: [],
        type: 'cashback',
        value: 0,
        stackable: false,
        validFrom: '',
        validTo: '',
        status: 'active',
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromotion) {
        await promotionService.updatePromotion(editingPromotion._id, formData);
        toast.success('Promotion updated successfully');
      } else {
        await promotionService.createPromotion(formData);
        toast.success('Promotion created successfully');
      }
      setOpen(false);
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await promotionService.deletePromotion(id);
      toast.success('Promotion deleted successfully');
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete promotion');
    }
  };

  const toggleDealer = (dealerId: string) => {
    const currentDealers = formData.dealers || [];
    if (currentDealers.includes(dealerId)) {
      setFormData({ ...formData, dealers: currentDealers.filter(id => id !== dealerId) });
    } else {
      setFormData({ ...formData, dealers: [...currentDealers, dealerId] });
    }
  };

  const toggleVariant = (variantId: string) => {
    const currentVariants = formData.variants || [];
    if (currentVariants.includes(variantId)) {
      setFormData({ ...formData, variants: currentVariants.filter(id => id !== variantId) });
    } else {
      setFormData({ ...formData, variants: [...currentVariants, variantId] });
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const getScopeBadge = (scope: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      global: 'default',
      byDealer: 'secondary',
      byVariant: 'outline',
    };
    return variants[scope] || 'secondary';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cashback: 'Cashback',
      accessory: 'Accessory',
      finance: 'Finance',
    };
    return labels[type] || type;
  };

  const isEditable = user?.role === 'EVMStaff' || user?.role === 'Admin';

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );
  }

  // Filter promotions for DealerManager - only show applicable to their dealer
  const filteredPromotions = user?.role === 'DealerManager' && user.dealer
    ? promotions.filter(p => 
        p.scope === 'global' || 
        (p.scope === 'byDealer' && Array.isArray(p.dealers) && p.dealers.some(d => 
          (typeof d === 'object' ? d._id : d) === (typeof user.dealer === 'object' ? user.dealer._id : user.dealer)
        ))
      )
    : promotions;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Promotions</h1>
            <p className="text-muted-foreground">
              {user?.role === 'EVMStaff' || user?.role === 'Admin'
                ? 'Manage promotional campaigns'
                : user?.role === 'DealerManager'
                ? 'View promotions available to your dealership'
                : 'View available promotions'}
            </p>
          </div>
          {isEditable && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPromotion ? 'Update promotion details' : 'Create a new promotional campaign'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Promotion Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., Summer Sale 2024"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scope">Scope *</Label>
                      <Select
                        value={formData.scope}
                        onValueChange={(value: 'global' | 'byDealer' | 'byVariant') => {
                          setFormData({ ...formData, scope: value });
                          if (value === 'global') {
                            setFormData({ ...formData, scope: value, dealers: [], variants: [] });
                          }
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global (All Dealers)</SelectItem>
                          <SelectItem value="byDealer">By Dealer</SelectItem>
                          <SelectItem value="byVariant">By Variant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.scope === 'byDealer' && (
                      <div className="space-y-2">
                        <Label>Select Dealers</Label>
                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                          {dealers.map((dealer) => (
                            <div key={dealer._id} className="flex items-center space-x-2 py-2">
                              <Checkbox
                                id={`dealer-${dealer._id}`}
                                checked={formData.dealers?.includes(dealer._id)}
                                onCheckedChange={() => toggleDealer(dealer._id)}
                              />
                              <Label htmlFor={`dealer-${dealer._id}`} className="cursor-pointer">
                                {dealer.name} - {dealer.region || dealer.address}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.scope === 'byVariant' && (
                      <div className="space-y-2">
                        <Label>Select Vehicle Variants</Label>
                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                          {vehicles.map((vehicle) => {
                            const modelName = typeof vehicle.model === 'object' ? vehicle.model?.name : 'Unknown';
                            return (
                              <div key={vehicle._id} className="flex items-center space-x-2 py-2">
                                <Checkbox
                                  id={`variant-${vehicle._id}`}
                                  checked={formData.variants?.includes(vehicle._id)}
                                  onCheckedChange={() => toggleVariant(vehicle._id)}
                                />
                                <Label htmlFor={`variant-${vehicle._id}`} className="cursor-pointer">
                                  {modelName} - {vehicle.trim}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Promotion Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: 'cashback' | 'accessory' | 'finance') =>
                            setFormData({ ...formData, type: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cashback">Cashback</SelectItem>
                            <SelectItem value="accessory">Accessory</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="value">Value *</Label>
                        <Input
                          id="value"
                          type="number"
                          min="0"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                          required
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="validFrom">Valid From *</Label>
                        <Input
                          id="validFrom"
                          type="date"
                          value={formData.validFrom}
                          onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="validTo">Valid To *</Label>
                        <Input
                          id="validTo"
                          type="date"
                          value={formData.validTo}
                          onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="stackable"
                        checked={formData.stackable}
                        onCheckedChange={(checked) => setFormData({ ...formData, stackable: checked === true })}
                      />
                      <Label htmlFor="stackable" className="cursor-pointer">
                        Stackable (can be combined with other promotions)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status || 'active'}
                        onValueChange={(value: 'active' | 'inactive') =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPromotion ? 'Update' : 'Create'} Promotion
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  {isEditable && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((promotion, index) => {
                  const dealersList = Array.isArray(promotion.dealers)
                    ? promotion.dealers.map(d => typeof d === 'object' ? d.name : 'N/A').join(', ')
                    : 'N/A';
                  const variantsList = Array.isArray(promotion.variants)
                    ? promotion.variants.map(v => typeof v === 'object' ? v.trim : 'N/A').join(', ')
                    : 'N/A';

                  return (
                    <motion.tr
                      key={promotion._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium">{promotion.name}</TableCell>
                      <TableCell>
                        <Badge variant={getScopeBadge(promotion.scope)}>
                          {promotion.scope}
                        </Badge>
                        {promotion.scope === 'byDealer' && dealersList !== 'N/A' && (
                          <div className="text-xs text-muted-foreground mt-1">{dealersList}</div>
                        )}
                        {promotion.scope === 'byVariant' && variantsList !== 'N/A' && (
                          <div className="text-xs text-muted-foreground mt-1">{variantsList}</div>
                        )}
                      </TableCell>
                      <TableCell>{getTypeLabel(promotion.type)}</TableCell>
                      <TableCell>
                        {promotion.value.toLocaleString()}
                        {promotion.type === 'cashback' && ' VND'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(promotion.validFrom).toLocaleDateString()} -{' '}
                          {new Date(promotion.validTo).toLocaleDateString()}
                        </div>
                        {promotion.stackable && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Stackable
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(promotion.status)}>
                          {promotion.status}
                        </Badge>
                      </TableCell>
                      {isEditable && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(promotion)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(promotion._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredPromotions.length === 0 && (
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-12 text-center">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No promotions found</h3>
              <p className="text-muted-foreground">
                {isEditable
                  ? 'Create your first promotion to get started'
                  : 'No promotions are currently available'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

