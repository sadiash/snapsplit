"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { HeroStrip } from '@/components/hero-strip';
import { Button } from '@/components/ui/button';
import { Camera, Users, Share2, Archive } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroStrip 
        title="SnapSplit" 
        subtitle="Snap a receipt, split it fair, settle in seconds"
      />
      
      <div className="px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Get Started</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose an action to begin splitting your expenses
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/snap">
            <Button 
              className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-accent-teal-500 hover:bg-accent-teal-600 text-white transition-all duration-200 ease-out active:scale-95"
            >
              <Camera size={24} />
              <span className="text-sm font-medium">Snap Receipt</span>
            </Button>
          </Link>
          
          <Link href="/split">
            <Button 
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center space-y-2 border-accent-teal-500 text-accent-teal-500 hover:bg-accent-teal-50 dark:hover:bg-accent-teal-950 transition-all duration-200 ease-out active:scale-95"
            >
              <Users size={24} />
              <span className="text-sm font-medium">Manual Split</span>
            </Button>
          </Link>
          
          <Link href="/history">
            <Button 
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center space-y-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-out active:scale-95"
            >
              <Archive size={24} />
              <span className="text-sm font-medium">History</span>
            </Button>
          </Link>
          
          <Link href="/settings">
            <Button 
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center space-y-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-out active:scale-95"
            >
              <Share2 size={24} />
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}