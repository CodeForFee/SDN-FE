'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
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
import { dealerService, Dealer, CreateDealerRequest } from '@/services/dealerService';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [formData, setFormData] = useState<CreateDealerRequest>({
    name: '',
    address: '',
    region: '',
    contact: {
      phone: '',
      email: '',
    },
    salesTarget: 0,
  });

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const data = await dealerService.getDealers();
      setDealers(data);
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
      toast.error('Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (dealer?: Dealer) => {
    if (dealer) {
      setEditingDealer(dealer);
      setFormData({
        name: dealer.name,
        address: dealer.address,
        region: dealer.region || '',
        contact: dealer.contact || { phone: '', email: '' },
        salesTarget: dealer.salesTarget || 0,
      });
    } else {
      setEditingDealer(null);
      setFormData({
        name: '',
        address: '',
        region: '',
        contact: { phone: '', email: '' },
        salesTarget: 0,
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDealer) {
        await dealerService.updateDealer(editingDealer._id, formData);
        toast.success('Dealer updated successfully');
      } else {
        await dealerService.createDealer(formData);
        toast.success('Dealer created successfully');
      }
      setOpen(false);
      fetchDealers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (dealerId: string) => {
    if (!confirm('Are you sure you want to delete this dealer?')) return;
    try {
      await dealerService.deleteDealer(dealerId);
      toast.success('Dealer deleted successfully');
      fetchDealers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete dealer');
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
            <h1 className="text-3xl font-bold">Dealer Management</h1>
            <p className="text-muted-foreground">Manage dealerships</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Dealer
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingDealer ? 'Edit Dealer' : 'Create New Dealer'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDealer ? 'Update dealer information' : 'Add a new dealer to the system'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Dealer Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.contact?.phone || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact: { ...formData.contact, phone: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.contact?.email || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact: { ...formData.contact, email: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesTarget">Sales Target</Label>
                    <Input
                      id="salesTarget"
                      type="number"
                      value={formData.salesTarget}
                      onChange={(e) =>
                        setFormData({ ...formData, salesTarget: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDealer ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Sales Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealers.map((dealer, index) => (
                  <motion.tr
                    key={dealer._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {dealer.name}
                      </div>
                    </TableCell>
                    <TableCell>{dealer.address}</TableCell>
                    <TableCell>{dealer.region || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{dealer.contact?.phone || 'N/A'}</div>
                        <div className="text-muted-foreground">{dealer.contact?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${dealer.salesTarget?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={dealer.status === 'active' ? 'default' : 'secondary'}>
                        {dealer.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(dealer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(dealer._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

