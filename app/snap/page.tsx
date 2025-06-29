"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HeroStrip } from '@/components/hero-strip';
import { Navigation } from '@/components/navigation';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SnapPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileCapture = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process receipt');
      }

      if (result.confidence < 0.7) {
        toast.error("Couldn't read that clearly. Try retaking or choose from gallery.");
        return;
      }

      // Store the OCR result and navigate to split page
      sessionStorage.setItem('receiptData', JSON.stringify(result));
      router.push('/split');

    } catch (error) {
      console.error('OCR Error:', error);
      toast.error("Couldn't read that. Retake or choose gallery.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileCapture(file);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <HeroStrip 
        title="Snap Receipt" 
        subtitle="Take a photo or upload an image of your receipt"
      />
      
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-320px)]">
        {isProcessing ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-accent-teal-100 dark:bg-accent-teal-900 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent-teal-500" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Processing receipt...</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Reading items and amounts with AI
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-6">
            {/* Camera Capture */}
            <Button
              onClick={handleCameraCapture}
              className="w-full h-24 bg-accent-teal-500 hover:bg-accent-teal-600 text-white text-lg font-medium transition-all duration-200 ease-out active:scale-95 relative overflow-hidden"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Camera size={24} />
                </div>
                <span>Take Photo</span>
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-950 text-gray-500">or</span>
              </div>
            </div>

            {/* File Upload */}
            <Button
              onClick={handleFileSelect}
              variant="outline"
              className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-accent-teal-500 hover:bg-accent-teal-50 dark:hover:bg-accent-teal-950 text-lg font-medium transition-all duration-200 ease-out active:scale-95"
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload size={24} />
                <span>Choose from Gallery</span>
              </div>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>Supported formats: JPEG, PNG, WebP</p>
              <p>For best results, ensure good lighting and clear text</p>
            </div>
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
}