'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { quoteService, Quote } from '@/services/quoteService';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const data = await quoteService.getQuoteById(params.id as string);
        setQuote(data);
      } catch (error) {
        console.error('Failed to fetch quote:', error);
        toast.error('Failed to load quote');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchQuote();
    }
  }, [params.id]);

  const handleApprove = async () => {
    if (!quote) return;
    setApproving(true);
    try {
      await quoteService.approveQuote(quote._id);
      toast.success('Quote approved successfully');
      const data = await quoteService.getQuoteById(quote._id);
      setQuote(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve quote');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    const reason = prompt('Please provide a reason for rejecting this quote:');
    if (!reason || !reason.trim()) return;
    setRejecting(true);
    try {
      await quoteService.rejectQuote(quote._id, reason);
      toast.success('Quote rejected');
      const data = await quoteService.getQuoteById(quote._id);
      setQuote(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject quote');
    } finally {
      setRejecting(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!quote) return;
    setConverting(true);
    try {
      await quoteService.convertQuote(quote._id);
      toast.success('Quote converted to order successfully');
      router.push('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to convert quote');
    } finally {
      setConverting(false);
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

  if (!quote) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Quote not found</p>
        </div>
      </MainLayout>
    );
  }

  const customer = typeof quote.customer === 'object' ? quote.customer : null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <Link href="/quotes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quote Details</h1>
            <p className="text-muted-foreground">
              Quote #{quote._id.slice(-8)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusBadge(quote.status)} className="text-lg px-4 py-2">
              {quote.status}
            </Badge>
            {/* Dealer Manager can approve/reject quotes */}
            {user?.role === 'DealerManager' && (quote.status === 'draft' || quote.status === 'sent') && (
              <>
                <Button onClick={handleApprove} disabled={approving} variant="outline" className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approving ? 'Approving...' : 'Approve'}
                </Button>
                <Button onClick={handleReject} disabled={rejecting} variant="outline" className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  {rejecting ? 'Rejecting...' : 'Reject'}
                </Button>
              </>
            )}
            {/* Only DealerStaff can convert accepted quotes to order */}
            {quote.status === 'accepted' && user?.role === 'DealerStaff' && (
              <Button onClick={handleConvertToOrder} disabled={converting}>
                {converting ? 'Converting...' : 'Convert to Order'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{customer?.fullName || customer?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{customer?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{customer?.email || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{new Date(quote.createdAt).toLocaleString()}</p>
              </div>
              {quote.validUntil && (
                <div>
                  <span className="text-muted-foreground">Valid Until:</span>
                  <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString()}</p>
                </div>
              )}
              {quote.notes && (
                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="font-medium">{quote.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quote.items?.map((item, index) => {
                const variant = typeof item.variant === 'object' ? item.variant : null;
                const color = typeof item.color === 'object' ? item.color : null;
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-2xl">
                    <div>
                      <p className="font-medium">{variant?.trim || 'N/A'}</p>
                      {color && <p className="text-sm text-muted-foreground">Color: {color.name}</p>}
                      <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.unitPrice * item.qty).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">${item.unitPrice.toLocaleString()} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${(quote.subtotal || 0).toLocaleString()}</span>
              </div>
              {quote.discount && quote.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">-${quote.discount.toLocaleString()}</span>
                </div>
              )}
              {quote.promotionTotal && quote.promotionTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Promotion:</span>
                  <span className="font-medium">-${quote.promotionTotal.toLocaleString()}</span>
                </div>
              )}
              {quote.fees && (
                <>
                  {quote.fees.registration && quote.fees.registration > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registration:</span>
                      <span className="font-medium">${quote.fees.registration.toLocaleString()}</span>
                    </div>
                  )}
                  {quote.fees.plate && quote.fees.plate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plate:</span>
                      <span className="font-medium">${quote.fees.plate.toLocaleString()}</span>
                    </div>
                  )}
                  {quote.fees.delivery && quote.fees.delivery > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery:</span>
                      <span className="font-medium">${quote.fees.delivery.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total:</span>
                <span>${(quote.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

