"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroStrip } from '@/components/hero-strip';
import { Navigation } from '@/components/navigation';
import { supabase, UserProfile } from '@/lib/supabase';
import { getCurrentUser, signOut } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const [accountName, setAccountName] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Check if error is due to no profile existing (expected for new users)
        if (error.code === 'PGRST116') {
          // No profile found - this is expected for new users, don't show error
          // Leave fields empty for user to fill
        } else {
          // Other errors should be logged
          console.error('Error loading profile:', error);
        }
      } else if (data) {
        setAccountName(data.account_name || '');
        setPaymentInfo(data.payment_info || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountName.trim() || !paymentInfo.trim()) {
      toast.error('Both fields are required.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('user_profile')
        .upsert({
          id: user.id,
          account_name: accountName.trim(),
          payment_info: paymentInfo.trim(),
        });

      if (error) {
        toast.error('Failed to save profile');
      } else {
        toast.success('Profile saved successfully!');
        // Store in localStorage for quick access
        localStorage.setItem('userProfile', JSON.stringify({
          account_name: accountName.trim(),
          payment_info: paymentInfo.trim(),
        }));
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('userProfile');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <HeroStrip 
        title="Account Setup" 
        subtitle="Configure your payment details and preferences"
      />
      
      <div className="px-4 py-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-semibold tracking-tight">Profile Information</CardTitle>
            <CardDescription>
              Set up your account details for seamless bill splitting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Your display name"
                  className="border-gray-300 focus:border-accent-teal-500 focus:ring-accent-teal-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentInfo">Payment Info</Label>
                <Input
                  id="paymentInfo"
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder="e.g., JazzCash: 03XX-XXXXXXX"
                  className="border-gray-300 focus:border-accent-teal-500 focus:ring-accent-teal-500"
                />
                <p className="text-xs text-gray-500">
                  This will be shared with others when splitting bills
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-accent-teal-500 hover:bg-accent-teal-600 transition-all duration-200 ease-out active:scale-95"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950 transition-all duration-200 ease-out active:scale-95"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}