'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { customerService, Customer } from '@/services/customerService';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomersPage() {
  const { user } = useAuthStore();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getCustomers();
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        console.error('[Customers] Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Filter customers by dealer for DealerStaff and DealerManager
  useEffect(() => {
    if (!user || !allCustomers.length) {
      setFilteredCustomers([]);
      return;
    }

    // Admin and EVMStaff can see all customers
    if (user.role === 'Admin' || user.role === 'EVMStaff') {
      console.log('[Customers] Admin/EVMStaff - showing all customers');
      setFilteredCustomers(allCustomers);
      return;
    }

    // DealerStaff and DealerManager only see customers from their dealer
    if (user.role === 'DealerStaff' || user.role === 'DealerManager') {
      const userDealerId = typeof user.dealer === 'object' ? user.dealer._id : user.dealer;
      
      const dealerCustomers = allCustomers.filter((customer: any) => {
        const customerDealerId = typeof customer.ownerDealer === 'object' 
          ? customer.ownerDealer._id 
          : customer.ownerDealer;
        
        return customerDealerId === userDealerId;
      });

      console.log('[Customers] Dealer filtering:', {
        userDealerId,
        totalCustomers: allCustomers.length,
        dealerCustomers: dealerCustomers.length,
      });

      setFilteredCustomers(dealerCustomers);
      return;
    }

    // Default: show all
    setFilteredCustomers(allCustomers);
  }, [user, allCustomers]);

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
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">
              {user?.role === 'DealerStaff' 
                ? 'Manage your customers' 
                : user?.role === 'DealerManager'
                ? 'View dealership customers'
                : 'View customers'}
            </p>
          </div>
          {/* Only DealerStaff can create new customers */}
          {user?.role === 'DealerStaff' && (
            <Link href="/customers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </Link>
          )}
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium">
                      {allCustomers.length === 0 
                        ? 'No customers available' 
                        : 'No customers found for your dealer'}
                    </p>
                    <p className="text-sm mt-2">
                      {user?.role === 'DealerStaff' 
                        ? 'Click "Add Customer" above to create your first customer.' 
                        : user?.role === 'DealerManager'
                        ? 'Your dealer staff can create customers from their account.'
                        : 'Customers will appear here once they are created.'}
                    </p>
                  </div>
                  {user?.role === 'DealerStaff' && (
                    <Link href="/customers/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium">{customer.fullName || 'N/A'}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || 'N/A'}</TableCell>
                      <TableCell>{customer.address || 'N/A'}</TableCell>
                      <TableCell>
                        <Link href={`/customers/${customer._id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

