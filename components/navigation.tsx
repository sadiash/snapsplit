"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, History, Settings, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Snap', href: '/snap', icon: Camera },
  { name: 'History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all duration-200 ease-out active:scale-95",
                isActive 
                  ? "text-accent-teal-500" 
                  : "text-gray-600 dark:text-gray-400 hover:text-accent-teal-500"
              )}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}