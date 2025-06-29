"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroStrip } from '@/components/hero-strip';
import { Navigation } from '@/components/navigation';
import { Share2, Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function SharePage() {
  const [splitData, setSplitData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load split data and user profile
    const storedData = sessionStorage.getItem('splitData');
    const storedProfile = localStorage.getItem('userProfile');
    
    if (storedData) {
      setSplitData(JSON.parse(storedData));
    } else {
      router.push('/split');
    }

    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
  }, [router]);

  const generateShareMessage = (participant: any) => {
    if (!userProfile) return '';
    
    const amount = (participant.total_amount ?? 0).toFixed(2);
    return `Hi ${participant.name}! Your share from ${splitData.receipt.vendor || 'the restaurant'} is PKR ${amount}.
Pay: ${userProfile.payment_info}
Thanks!`;
  };

  const handleShare = async (participant: any) => {
    const message = generateShareMessage(participant);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SnapSplit Bill Share',
          text: message,
        });
        toast.success('Message shared successfully!');
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          fallbackShare(message);
        }
      }
    } else {
      fallbackShare(message);
    }
  };

  const fallbackShare = (message: string) => {
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      toast.success('Message copied to clipboard!');
    } else {
      // Fallback for older browsers
      window.prompt('Copy this message:', message);
    }
  };

  const handleShareAll = async () => {
    if (!splitData || !userProfile) return;
    
    const allMessages = splitData.participants
      .map((p: any) => generateShareMessage(p))
      .join('\n\n---\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SnapSplit Bill Shares',
          text: allMessages,
        });
        toast.success('All messages shared successfully!');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          fallbackShare(allMessages);
        }
      }
    } else {
      fallbackShare(allMessages);
    }
  };

  const handleSaveAndArchive = async () => {
    if (!splitData) return;
    
    setIsSaving(true);
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('receipts').insert({
        owner: user.id,
        vendor: splitData.receipt.vendor,
        total: splitData.receipt.total,
        image_url: splitData.receipt.image_url || null,
        json_items: splitData.items,
        json_participants: splitData.participants,
      });

      if (error) {
        toast.error('Failed to save receipt');
      } else {
        toast.success('Receipt saved to history!');
        // Clear session data
        sessionStorage.removeItem('receiptData');
        sessionStorage.removeItem('splitData');
        router.push('/history');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (!splitData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <HeroStrip 
        title="Share Bills" 
        subtitle="Send payment requests to participants"
      />
      
      <div className="px-4 py-6 space-y-6">
        {/* Summary */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-semibold tracking-tight">
              {splitData.receipt.vendor || 'Unknown Vendor'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Total: PKR {splitData.receipt.total?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-500">
              Split between {splitData.participants.length} participant(s)
            </p>
          </CardContent>
        </Card>

        {/* Individual Shares */}
        <div className="space-y-3">
          <h3 className="font-semibold tracking-tight">Individual Shares</h3>
          {splitData.participants.map((participant: any) => (
            <Card key={participant.id} className="shadow-card">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      PKR {(participant.total_amount ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleShare(participant)}
                    size="sm"
                    className="bg-accent-teal-500 hover:bg-accent-teal-600 text-white transition-all duration-200 ease-out active:scale-95"
                  >
                    <Share2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleShareAll}
            className="w-full bg-accent-mustard-500 hover:bg-accent-mustard-600 text-white transition-all duration-200 ease-out active:scale-95"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share All
          </Button>
          
          <Button
            onClick={handleSaveAndArchive}
            disabled={isSaving}
            variant="outline"
            className="w-full border-accent-teal-500 text-accent-teal-500 hover:bg-accent-teal-50 dark:hover:bg-accent-teal-950 transition-all duration-200 ease-out active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Save & Archive
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}