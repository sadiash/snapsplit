"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeroStrip } from '@/components/hero-strip';
import { Navigation } from '@/components/navigation';
import { Archive, Trash2, Loader2 } from 'lucide-react';
import { supabase, Receipt } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('owner', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load history');
      } else {
        setReceipts(data || []);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (receiptId: string) => {
    const confirmed = window.confirm('Delete this split? This cannot be undone.');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receiptId);

      if (error) {
        toast.error('Failed to delete receipt');
      } else {
        setReceipts(prev => prev.filter(r => r.id !== receiptId));
        toast.success('Receipt deleted');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <HeroStrip 
        title="History" 
        subtitle="Your archived receipt splits"
      />
      
      <div className="px-4 py-6">
        {receipts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Archive className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight mb-2">No archives yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Start by snapping a receipt to create your first split
            </p>
            <Button
              onClick={() => router.push('/snap')}
              className="bg-accent-teal-500 hover:bg-accent-teal-600 text-white transition-all duration-200 ease-out active:scale-95"
            >
              Snap Receipt
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt, index) => (
              <Card 
                key={receipt.id} 
                className={`shadow-card cursor-pointer hover:shadow-lg transition-shadow ${
                  index === 0 ? 'border-l-4 border-l-accent-mustard-500' : ''
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold tracking-tight">
                        {receipt.vendor || 'Unknown Vendor'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {receipt.created_at && format(new Date(receipt.created_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-lg font-medium text-accent-teal-600 dark:text-accent-teal-400">
                        PKR {receipt.total?.toFixed(2) || '0.00'}
                      </p>
                      {receipt.json_participants && (
                        <p className="text-xs text-gray-500">
                          {receipt.json_participants.length} participant(s)
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(receipt.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-200 ease-out active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}