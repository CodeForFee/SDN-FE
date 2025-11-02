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
import { inventoryService, Inventory } from '@/services/inventoryService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { vehicleColorService, VehicleColor } from '@/services/vehicleColorService';
import { dealerService } from '@/services/dealerService';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<Partial<Inventory>>({
    variant: '',
    color: '',
    owner: '',
    ownerType: 'Dealer',
    quantity: 0,
    location: '',
  });

  useEffect(() => {
    fetchInventory();
    if (user?.role === 'EVMStaff' || user?.role === 'Admin' || user?.role === 'DealerManager') {
      fetchVehicleData();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const data = await inventoryService.getInventory();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleData = async () => {
    try {
      const [vehiclesData, colorsData, dealersData] = await Promise.all([
        vehicleService.getVehicles(),
        vehicleColorService.list(),
        user?.role === 'EVMStaff' || user?.role === 'Admin' ? dealerService.getDealers() : Promise.resolve([]),
      ]);
      setVehicles(vehiclesData);
      setColors(colorsData);
      setDealers(dealersData);
    } catch (error) {
      console.error('Failed to fetch vehicle data:', error);
    }
  };

  const handleOpenDialog = (item?: Inventory) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        variant: typeof item.variant === 'object' ? item.variant._id : item.variant || '',
        color: typeof item.color === 'object' ? item.color._id : item.color || '',
        owner: item.owner && typeof item.owner === 'object' 
          ? item.owner._id 
          : item.owner || '',
        ownerType: item.ownerType || 'Dealer',
        quantity: item.quantity || 0,
        location: item.location || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        variant: '',
        color: '',
        owner: user?.role === 'DealerManager' && user.dealer 
          ? (typeof user.dealer === 'object' && user.dealer !== null 
              ? user.dealer._id 
              : typeof user.dealer === 'string' 
                ? user.dealer 
                : '')
          : '',
        ownerType: user?.role === 'DealerManager' ? 'Dealer' : 'EVM',
        quantity: 0,
        location: '',
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryService.updateInventory(editingItem._id, {
          quantity: formData.quantity || 0,
          location: formData.location || undefined,
        });
        toast.success('Inventory updated successfully');
      } else {
        // For EVM, owner is optional (null)
        const inventoryData: any = {
          variant: formData.variant!,
          color: formData.color || undefined,
          ownerType: formData.ownerType as 'EVM' | 'Dealer',
          quantity: formData.quantity || 0,
          location: formData.location || undefined,
        };

        // Only include owner if ownerType is 'Dealer'
        if (formData.ownerType === 'Dealer' && formData.owner) {
          inventoryData.owner = formData.owner;
        } else if (formData.ownerType === 'EVM') {
          // For EVM, set owner to null or omit it
          inventoryData.owner = null;
        }

        await inventoryService.createInventory(inventoryData);
        toast.success('Inventory created successfully');
      }
      setOpen(false);
      fetchInventory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
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
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              {user?.role === 'DealerManager' 
                ? 'Manage your dealership inventory'
                : 'Manage system inventory'}
            </p>
          </div>
          {(user?.role === 'DealerManager' || user?.role === 'EVMStaff' || user?.role === 'Admin') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Inventory
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Inventory' : 'Create New Inventory'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem ? 'Update inventory information' : 'Add inventory entry'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="variant">Vehicle Variant *</Label>
                      <Select
                        value={formData.variant as string}
                        onValueChange={(value) => setFormData({ ...formData, variant: value })}
                        required
                        disabled={!!editingItem}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((v) => {
                            const modelName = typeof v.model === 'object' ? v.model?.name : 'Unknown';
                            return (
                              <SelectItem key={v._id} value={v._id}>
                                {modelName} - {v.trim}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Select
                        value={formData.color as string || ''}
                        onValueChange={(value) => setFormData({ ...formData, color: value })}
                        disabled={!!editingItem}
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
                    </div>
                    {(user?.role === 'EVMStaff' || user?.role === 'Admin') && !editingItem && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="ownerType">Owner Type *</Label>
                          <Select
                            value={formData.ownerType}
                            onValueChange={(value) => setFormData({ ...formData, ownerType: value as any })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EVM">EVM</SelectItem>
                              <SelectItem value="Dealer">Dealer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.ownerType === 'Dealer' && (
                          <div className="space-y-2">
                            <Label htmlFor="owner">Dealer *</Label>
                            <Select
                              value={formData.owner as string}
                              onValueChange={(value) => setFormData({ ...formData, owner: value })}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select dealer" />
                              </SelectTrigger>
                              <SelectContent>
                                {dealers.map((dealer) => (
                                  <SelectItem key={dealer._id} value={dealer._id}>
                                    {dealer.name} - {dealer.region || 'N/A'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Storage location"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update' : 'Create'}
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Owner Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Location</TableHead>
                  {(user?.role === 'DealerManager' || user?.role === 'EVMStaff' || user?.role === 'Admin') && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item, index) => {
                  const variant = typeof item.variant === 'object' ? item.variant : null;
                  const color = typeof item.color === 'object' ? item.color : null;
                  const owner = typeof item.owner === 'object' ? item.owner : null;
                  const available = (item.quantity || 0) - (item.reserved || 0);
                  
                  return (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium">
                        {variant?.trim || 'N/A'}
                      </TableCell>
                      <TableCell>{color?.name || 'N/A'}</TableCell>
                      <TableCell>{owner?.name || 'EVM'}</TableCell>
                      <TableCell>
                        <Badge variant={item.ownerType === 'EVM' ? 'default' : 'secondary'}>
                          {item.ownerType}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.quantity || 0}</TableCell>
                      <TableCell>{item.reserved || 0}</TableCell>
                      <TableCell>
                        <Badge variant={available > 0 ? 'default' : 'destructive'}>
                          {available}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.location || 'N/A'}</TableCell>
                      {(user?.role === 'DealerManager' || user?.role === 'EVMStaff' || user?.role === 'Admin') && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

