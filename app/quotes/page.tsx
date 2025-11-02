'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
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
import { quoteService, Quote } from '@/services/quoteService';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function QuotesPage() {
  const { user } = useAuthStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const data = await quoteService.getQuotes();
        setQuotes(data);
      } catch (error) {
        console.error('Failed to fetch quotes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  const handleApprove = async () => {
    if (!selectedQuoteId) return;
    try {
      await quoteService.approveQuote(selectedQuoteId, approveNotes || undefined);
      toast.success('Quote approved successfully');
      setApproveDialogOpen(false);
      setSelectedQuoteId(null);
      setApproveNotes('');
      const data = await quoteService.getQuotes();
      setQuotes(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve quote');
    }
  };

  const handleReject = async () => {
    if (!selectedQuoteId || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await quoteService.rejectQuote(selectedQuoteId, rejectReason);
      toast.success('Quote rejected');
      setRejectDialogOpen(false);
      setSelectedQuoteId(null);
      setRejectReason('');
      const data = await quoteService.getQuotes();
      setQuotes(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject quote');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      sent: 'default',
      accepted: 'default',
      rejected: 'destructive',
      converted: 'default',
      draft: 'secondary',
    };
    return variants[status] || 'secondary';
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
            <h1 className="text-3xl font-bold">Quotes</h1>
            <p className="text-muted-foreground">
              {user?.role === 'DealerStaff' 
                ? 'Manage your quotes' 
                : user?.role === 'DealerManager'
                ? 'Review quotes from staff'
                : 'View quotes'}
            </p>
          </div>
          {/* Only DealerStaff can create new quotes */}
          {user?.role === 'DealerStaff' && (
            <Link href="/quotes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Quote
              </Button>
            </Link>
          )}
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote, index) => {
                  const customer = typeof quote.customer === 'object' ? quote.customer : null;
                  return (
                    <motion.tr
                      key={quote._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium">
                        {customer?.fullName || customer?.name || 'N/A'}
                      </TableCell>
                      <TableCell>${((quote.total || quote.totalPrice || 0)).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(quote.status)}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/quotes/${quote._id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          {/* Dealer Manager can approve/reject quotes */}
                          {user?.role === 'DealerManager' && (quote.status === 'draft' || quote.status === 'sent') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuoteId(quote._id);
                                  setApproveDialogOpen(true);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuoteId(quote._id);
                                  setRejectDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {/* Only DealerStaff can convert quote to order (only if accepted) */}
                          {quote.status === 'accepted' && user?.role === 'DealerStaff' && (
                            <Link href={`/orders/new?quote=${quote._id}`}>
                              <Button variant="outline" size="sm">Convert</Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Approve Quote Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Approve Quote</DialogTitle>
              <DialogDescription>
                Approve this quote to allow conversion to order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Add approval notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setApproveDialogOpen(false);
                setApproveNotes('');
                setSelectedQuoteId(null);
              }}>
                Cancel
              </Button>
              <Button type="button" onClick={handleApprove}>
                Approve Quote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Quote Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Reject Quote</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this quote
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
                setSelectedQuoteId(null);
              }}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleReject}>
                Reject Quote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

