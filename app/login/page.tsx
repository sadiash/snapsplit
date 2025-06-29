"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(isSignUp ? 'Account created successfully!' : 'Welcome back!');
        router.push('/');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-teal-500 to-accent-mustard-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="2" x2="12" y2="22" stroke="#00B3B8" strokeWidth="2" strokeDasharray="2 2"/>
              <circle cx="6" cy="12" r="3" fill="#FFC857"/>
              <circle cx="18" cy="12" r="3" fill="#00B3B8"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Sign up to start splitting receipts with friends'
              : 'Sign in to your SnapSplit account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-accent-teal-500 hover:bg-accent-teal-600 transition-all duration-200 ease-out active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-accent-teal-500"
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : 'Need an account? Sign up'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}